# The web game talks to native code through this interface.
-keepclassmembers class com.fsamplabs.streameridle.GameBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Credential Manager (Google sign-in for cloud save), per Android docs
-if class androidx.credentials.CredentialManager
-keep class androidx.credentials.playservices.** { *; }
