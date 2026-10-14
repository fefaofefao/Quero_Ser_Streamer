# The web game talks to native code through this interface.
-keepclassmembers class com.fsamplabs.streameridle.GameBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*
