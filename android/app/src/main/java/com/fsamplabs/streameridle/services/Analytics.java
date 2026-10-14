package com.fsamplabs.streameridle.services;

import android.content.Context;
import android.os.Bundle;

import com.google.firebase.FirebaseApp;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.remoteconfig.FirebaseRemoteConfig;
import com.google.firebase.remoteconfig.FirebaseRemoteConfigSettings;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Firebase Analytics + Remote Config. Everything is a no-op until
 * google-services.json is added to the app module (see SETUP.md).
 */
public final class Analytics {
    private static FirebaseAnalytics fa;
    private static FirebaseRemoteConfig rc;

    private Analytics() {}

    public static void init(Context ctx) {
        try {
            if (FirebaseApp.getApps(ctx).isEmpty()) return;
            fa = FirebaseAnalytics.getInstance(ctx);
            rc = FirebaseRemoteConfig.getInstance();
            rc.setConfigSettingsAsync(new FirebaseRemoteConfigSettings.Builder().setMinimumFetchIntervalInSeconds(3600).build());
            Map<String, Object> defaults = new HashMap<>();
            defaults.put("game_config", "{}");
            rc.setDefaultsAsync(defaults);
            rc.fetchAndActivate();
        } catch (Throwable t) {
            fa = null;
            rc = null;
        }
    }

    public static boolean firebaseReady() {
        return fa != null;
    }

    public static void log(String name, JSONObject params) {
        if (fa == null || name == null) return;
        String n = name.replaceAll("[^A-Za-z0-9_]", "_");
        if (n.length() > 40) n = n.substring(0, 40);
        Bundle b = new Bundle();
        if (params != null) {
            Iterator<String> keys = params.keys();
            while (keys.hasNext()) {
                String k = keys.next();
                Object v = params.opt(k);
                String key = k.replaceAll("[^A-Za-z0-9_]", "_");
                if (key.length() > 40) key = key.substring(0, 40);
                if (v instanceof Number) b.putDouble(key, ((Number) v).doubleValue());
                else if (v != null) {
                    String s = String.valueOf(v);
                    b.putString(key, s.length() > 100 ? s.substring(0, 100) : s);
                }
            }
        }
        fa.logEvent(n, b);
    }

    /** JSON string with live balance overrides ("game_config" in Remote Config). */
    public static String remoteConfig() {
        if (rc == null) return "{}";
        try {
            String s = rc.getString("game_config");
            return s == null || s.isEmpty() ? "{}" : s;
        } catch (Throwable t) {
            return "{}";
        }
    }
}
