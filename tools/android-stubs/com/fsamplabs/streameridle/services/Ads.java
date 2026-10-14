package com.fsamplabs.streameridle.services;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;

import com.fsamplabs.streameridle.GameBridge;
import com.fsamplabs.streameridle.R;

import org.json.JSONObject;

/** TEST BUILD stand-in for AdMob: a dialog instead of a real ad. */
public class Ads {
    private final Activity activity;

    public Ads(Activity activity, GameBridge bridge) { this.activity = activity; }

    public void start() { }

    public boolean rewardedReady() { return true; }

    public void showRewarded(String placement, final GameBridge.Reply reply) {
        new AlertDialog.Builder(activity)
                .setTitle(R.string.test_ad_title)
                .setMessage(activity.getString(R.string.test_ad_body) + "\n\n[" + placement + "]")
                .setCancelable(false)
                .setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface d, int w) {
                        JSONObject o = GameBridge.ok(true);
                        try { o.put("rewarded", true); } catch (Exception ignored) { }
                        reply.send(o);
                    }
                })
                .setNegativeButton(R.string.cancel, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface d, int w) {
                        JSONObject o = GameBridge.ok(true);
                        try { o.put("rewarded", false); } catch (Exception ignored) { }
                        reply.send(o);
                    }
                })
                .show();
    }

    public void showInterstitial(String placement) { }

    public boolean privacyOptionsRequired() { return false; }

    public void showPrivacyOptions() { }
}
