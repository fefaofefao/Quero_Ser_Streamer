package com.fsamplabs.streameridle;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

/** Local reminders (autograph passes, offline vault full, daily gift). No server needed. */
final class NotificationScheduler {
    private static final String PREFS = "notifs";
    private static final int MAX_ID = 8;

    private NotificationScheduler() {}

    static void schedule(Context ctx, String json) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("list", json).apply();
        apply(ctx, json);
    }

    static void reschedule(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        apply(ctx, p.getString("list", "[]"));
    }

    private static void apply(Context ctx, String json) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        for (int id = 1; id <= MAX_ID; id++) am.cancel(pending(ctx, id, null, null));
        try {
            JSONArray arr = new JSONArray(json);
            long now = System.currentTimeMillis();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                int id = o.optInt("id", i + 1);
                long at = o.optLong("at", 0);
                if (id < 1 || id > MAX_ID || at <= now + 60_000) continue;
                PendingIntent pi = pending(ctx, id, o.optString("title"), o.optString("body"));
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (Exception ignored) {
        }
    }

    private static PendingIntent pending(Context ctx, int id, String title, String body) {
        Intent it = new Intent(ctx, NotificationReceiver.class);
        it.putExtra("id", id);
        if (title != null) it.putExtra("title", title);
        if (body != null) it.putExtra("body", body);
        return PendingIntent.getBroadcast(ctx, id, it, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
