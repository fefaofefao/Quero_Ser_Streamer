package com.fsamplabs.streameridle.services;

import android.content.Context;

import org.json.JSONObject;

/** TEST BUILD: analytics disabled (needs Firebase). */
public final class Analytics {
    private Analytics() { }

    public static void init(Context ctx) { }

    public static boolean firebaseReady() { return false; }

    public static void log(String name, JSONObject params) { }

    public static String remoteConfig() { return "{}"; }
}
