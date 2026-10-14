package com.fsamplabs.streameridle.services;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;

import com.fsamplabs.streameridle.GameBridge;
import com.fsamplabs.streameridle.R;

import org.json.JSONArray;
import org.json.JSONObject;

/** TEST BUILD stand-in for Play Billing: purchases are simulated after a confirmation. */
public class Billing {
    private final Activity activity;

    public Billing(Activity activity, GameBridge bridge) { this.activity = activity; }

    public void start() { }

    public void destroy() { }

    public void query(JSONArray ids, GameBridge.Reply reply) {
        JSONObject o = GameBridge.ok(true);
        try { o.put("products", new JSONObject()); } catch (Exception ignored) { }
        reply.send(o);
    }

    public void buy(final String productId, final GameBridge.Reply reply) {
        new AlertDialog.Builder(activity)
                .setTitle(R.string.test_buy_title)
                .setMessage(activity.getString(R.string.test_buy_body, productId))
                .setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface d, int w) {
                        JSONObject o = GameBridge.ok(true);
                        try {
                            o.put("productId", productId);
                            o.put("token", "test-" + System.currentTimeMillis());
                        } catch (Exception ignored) { }
                        reply.send(o);
                    }
                })
                .setNegativeButton(R.string.cancel, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface d, int w) {
                        JSONObject o = GameBridge.ok(false);
                        try { o.put("error", "canceled"); } catch (Exception ignored) { }
                        reply.send(o);
                    }
                })
                .show();
    }

    public void restore(GameBridge.Reply reply) {
        JSONObject o = GameBridge.ok(true);
        try { o.put("owned", new JSONArray()); } catch (Exception ignored) { }
        reply.send(o);
    }
}
