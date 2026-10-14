#!/usr/bin/env bash
# Builds a TEST apk without Gradle/Google Maven, using only aapt2 + javac + dx + apksigner.
# Ads/billing/Firebase are replaced by the stand-ins in tools/android-stubs.
# The real Play Store build is the Gradle project in android/ (see SETUP.md).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$PWD
APP=android/app/src/main
OUT=build/offline
SDKJAR=tools/sdk/android-36.jar
# The aapt2 shipped by Ubuntu cannot parse the API 36 resource table; API 33 has every attribute we use.
RESJAR=tools/sdk/android-33-res.jar
KEYSTORE=${KEYSTORE:-$ROOT/../.keys/upload-keystore.jks}
VERSION_CODE=${VERSION_CODE:-1}
VERSION_NAME=${VERSION_NAME:-1.0.0}

mkdir -p tools/sdk
[ -f "$SDKJAR" ] || curl -sSL -o "$SDKJAR" https://raw.githubusercontent.com/Sable/android-platforms/master/android-36/android.jar
[ -f "$RESJAR" ] || curl -sSL -o "$RESJAR" https://raw.githubusercontent.com/Sable/android-platforms/master/android-33/android.jar

rm -rf "$OUT" && mkdir -p "$OUT"/{gen,classes,res}
node tools/build.mjs

echo "== aapt2 compile"
aapt2 compile --dir "$APP/res" -o "$OUT/res/res.zip"
echo "== aapt2 link"
sed 's|<manifest xmlns:android="http://schemas.android.com/apk/res/android">|<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.fsamplabs.streameridle">|' "$APP/AndroidManifest.xml" > "$OUT/AndroidManifest.xml"
aapt2 link -o "$OUT/base.apk" -I "$RESJAR" --manifest "$OUT/AndroidManifest.xml" \
  --java "$OUT/gen" --min-sdk-version 24 --target-sdk-version 36 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
  -A "$APP/assets" --auto-add-overlay "$OUT/res/res.zip"

echo "== javac"
find "$APP/java" -name '*.java' -not -path '*/services/*' > "$OUT/sources.txt"
find tools/android-stubs -name '*.java' >> "$OUT/sources.txt"
find "$OUT/gen" -name '*.java' >> "$OUT/sources.txt"
javac -nowarn -Xlint:-options -source 8 -target 8 -encoding UTF-8 -bootclasspath "$SDKJAR" -d "$OUT/classes" @"$OUT/sources.txt"

echo "== dx"
dalvik-exchange --dex --min-sdk-version=24 --output="$OUT/classes.dex" "$OUT/classes"

echo "== package"
cp "$OUT/base.apk" "$OUT/unsigned.apk"
(cd "$OUT" && zip -q -j unsigned.apk classes.dex)
zipalign -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

echo "== sign"
if [ -f "$KEYSTORE" ]; then
  apksigner sign --ks "$KEYSTORE" --ks-pass env:KS_PASS --ks-key-alias upload --key-pass env:KS_PASS --out "$OUT/app-test.apk" "$OUT/aligned.apk"
else
  echo "keystore not found ($KEYSTORE): signing with a throwaway debug key"
  [ -f "$OUT/../debug.jks" ] || keytool -genkeypair -keystore "$OUT/../debug.jks" -storepass android -keypass android -alias debug -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Debug" >/dev/null 2>&1
  apksigner sign --ks "$OUT/../debug.jks" --ks-pass pass:android --out "$OUT/app-test.apk" "$OUT/aligned.apk"
fi
apksigner verify --print-certs "$OUT/app-test.apk" | head -3
ls -la "$OUT/app-test.apk"
