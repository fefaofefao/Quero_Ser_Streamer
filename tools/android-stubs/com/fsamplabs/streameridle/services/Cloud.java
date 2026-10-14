package com.fsamplabs.streameridle.services;

import android.app.Activity;

import com.fsamplabs.streameridle.GameBridge;

import org.json.JSONObject;

/** TEST BUILD: cloud save disabled (needs Firebase). */
public class Cloud {
    public Cloud(Activity activity) { }

    public JSONObject status() {
        JSONObject o = new JSONObject();
        try { o.put("available", false); } catch (Exception ignored) { }
        return o;
    }

    public void signIn(GameBridge.Reply r) { r.send(GameBridge.ok(false)); }

    public void save(String json, GameBridge.Reply r) { r.send(GameBridge.ok(false)); }

    public void load(GameBridge.Reply r) { r.send(GameBridge.ok(false)); }
}
