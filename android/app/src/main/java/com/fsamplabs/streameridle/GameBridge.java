package com.fsamplabs.streameridle;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.fsamplabs.streameridle.services.Ads;
import com.fsamplabs.streameridle.services.Analytics;
import com.fsamplabs.streameridle.services.Billing;
import com.fsamplabs.streameridle.services.Cloud;
import com.fsamplabs.streameridle.services.Review;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Everything the web game can ask the phone to do. Methods annotated with
 * {@link JavascriptInterface} run on a WebView background thread; anything
 * touching UI or SDKs hops to the main thread first.
 */
public class GameBridge {
    public interface Reply {
        void send(JSONObject result);
    }

    private final MainActivity activity;
    private final WebView web;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final SaveStore store;
    private final List<String> queued = new ArrayList<>();
    private volatile boolean jsReady = false;

    private Ads ads;
    private Billing billing;
    private Cloud cloud;

    GameBridge(MainActivity activity, WebView web) {
        this.activity = activity;
        this.web = web;
        this.store = new SaveStore(activity);
    }

    void startServices() {
        ads = new Ads(activity, this);
        billing = new Billing(activity, this);
        cloud = new Cloud(activity);
        ads.start();
        billing.start();
    }

    void destroy() {
        if (billing != null) billing.destroy();
    }

    // ---------------------------------------------------------------- to JS
    public void emit(final String name, JSONObject data) {
        final String js = "window.__nativeEvent&&window.__nativeEvent(" + JSONObject.quote(name) + "," + (data == null ? "null" : JSONObject.quote(data.toString())) + ")";
        main.post(new Runnable() { @Override public void run() {
            if (!jsReady && !"back".equals(name) && !"pause".equals(name) && !"resume".equals(name)) { queued.add(js); return; }
            eval(js);
        } });
    }

    public Reply reply(final String cbId) {
        return new Reply() {
            @Override
            public void send(JSONObject result) {
                final String js = "window.__nativeCb&&window.__nativeCb(" + JSONObject.quote(cbId) + "," + JSONObject.quote(result.toString()) + ")";
                main.post(new Runnable() { @Override public void run() { eval(js); } });
            }
        };
    }

    private void eval(String js) {
        if (activity.isFinishing()) return;
        try { web.evaluateJavascript(js, null); } catch (Exception ignored) { }
    }

    public static JSONObject ok(boolean ok) {
        JSONObject o = new JSONObject();
        try { o.put("ok", ok); } catch (Exception ignored) { }
        return o;
    }

    // ---------------------------------------------------------------- from JS
    @JavascriptInterface
    public void ready() {
        main.post(new Runnable() { @Override public void run() {
            jsReady = true;
            for (String js : queued) eval(js);
            queued.clear();
        } });
    }

    @JavascriptInterface
    public String loadSave() { return store.load(); }

    @JavascriptInterface
    public void writeSave(String json) { store.write(json); }

    @JavascriptInterface
    public void showRewarded(String placement, String cb) {
        Analytics.log("ad_request", one("placement", placement));
        main.post(new Runnable() { @Override public void run() { ads.showRewarded(placement, reply(cb)); } });
    }

    @JavascriptInterface
    public void showInterstitial(String placement) {
        main.post(new Runnable() { @Override public void run() { ads.showInterstitial(placement); } });
    }

    @JavascriptInterface
    public boolean isRewardedReady() { return ads != null && ads.rewardedReady(); }

    @JavascriptInterface
    public void queryProducts(String idsJson, String cb) {
        main.post(new Runnable() { @Override public void run() {
            try { billing.query(new JSONArray(idsJson), reply(cb)); } catch (Exception e) { reply(cb).send(ok(false)); }
        } });
    }

    @JavascriptInterface
    public void buy(String productId, String cb) {
        main.post(new Runnable() { @Override public void run() { billing.buy(productId, reply(cb)); } });
    }

    @JavascriptInterface
    public void restorePurchases(String cb) {
        main.post(new Runnable() { @Override public void run() { billing.restore(reply(cb)); } });
    }

    @JavascriptInterface
    public void consumeAck(String token) { /* handled natively */ }

    @JavascriptInterface
    public void vibrate(int ms) {
        Vibrator v = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
        if (v == null || !v.hasVibrator()) return;
        ms = Math.max(5, Math.min(400, ms));
        if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
        else v.vibrate(ms);
    }

    @JavascriptInterface
    public void logEvent(String name, String paramsJson) {
        try { Analytics.log(name, new JSONObject(paramsJson == null ? "{}" : paramsJson)); } catch (Exception ignored) { }
    }

    @JavascriptInterface
    public void scheduleNotifications(String json) { NotificationScheduler.schedule(activity, json); }

    @JavascriptInterface
    public void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 && activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            main.post(new Runnable() { @Override public void run() { activity.requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 42); } });
        }
    }

    @JavascriptInterface
    public boolean notificationsAllowed() {
        NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm == null || Build.VERSION.SDK_INT < 24 || nm.areNotificationsEnabled();
    }

    @JavascriptInterface
    public String cloudStatus() { return cloud.status().toString(); }

    @JavascriptInterface
    public void cloudSignIn(String cb) { main.post(new Runnable() { @Override public void run() { cloud.signIn(reply(cb)); } }); }

    @JavascriptInterface
    public void cloudSave(String json, String cb) { main.post(new Runnable() { @Override public void run() { cloud.save(json, reply(cb)); } }); }

    @JavascriptInterface
    public void cloudLoad(String cb) { main.post(new Runnable() { @Override public void run() { cloud.load(reply(cb)); } }); }

    @JavascriptInterface
    public String getRemoteConfig() { return Analytics.remoteConfig(); }

    @JavascriptInterface
    public void openUrl(String url) {
        if (url == null || !(url.startsWith("https://") || url.startsWith("mailto:"))) return;
        main.post(new Runnable() { @Override public void run() { activity.openExternal(url); } });
    }

    @JavascriptInterface
    public void rateApp() {
        String pkg = activity.getPackageName();
        main.post(new Runnable() { @Override public void run() {
            try {
                activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg)));
            } catch (Exception e) {
                activity.openExternal("https://play.google.com/store/apps/details?id=" + pkg);
            }
        } });
    }

    @JavascriptInterface
    public void requestReview() { main.post(new Runnable() { @Override public void run() { Review.request(activity); } }); }

    @JavascriptInterface
    public boolean isPrivacyOptionsRequired() { return ads != null && ads.privacyOptionsRequired(); }

    @JavascriptInterface
    public void showPrivacyOptions() { main.post(new Runnable() { @Override public void run() { ads.showPrivacyOptions(); } }); }

    @JavascriptInterface
    public String getAppVersion() {
        try {
            PackageInfo pi = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
            return pi.versionName;
        } catch (Exception e) {
            return "1.0";
        }
    }

    @JavascriptInterface
    public void exitApp() { main.post(new Runnable() { @Override public void run() { activity.finish(); } }); }

    @JavascriptInterface
    public void setImmersive(boolean on) { /* reserved */ }

    private static JSONObject one(String k, String v) {
        JSONObject o = new JSONObject();
        try { o.put(k, v); } catch (Exception ignored) { }
        return o;
    }
}
