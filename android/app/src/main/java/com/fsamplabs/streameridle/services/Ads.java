package com.fsamplabs.streameridle.services;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;

import com.fsamplabs.streameridle.GameBridge;
import com.fsamplabs.streameridle.R;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import org.json.JSONObject;

import java.util.concurrent.atomic.AtomicBoolean;

/** AdMob rewarded + interstitial, gated by Google's consent (UMP) flow. */
public class Ads {
    private final Activity activity;
    private final GameBridge bridge;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final AtomicBoolean initialized = new AtomicBoolean(false);
    private ConsentInformation consent;
    private RewardedAd rewarded;
    private InterstitialAd interstitial;
    private boolean loadingRewarded, loadingInterstitial;
    private int rewardedRetry, interstitialRetry;

    public Ads(Activity activity, GameBridge bridge) {
        this.activity = activity;
        this.bridge = bridge;
    }

    public void start() {
        consent = UserMessagingPlatform.getConsentInformation(activity);
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
        consent.requestConsentInfoUpdate(activity, params,
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity, formError -> {
                    if (consent.canRequestAds()) initAds();
                }),
                requestError -> {
                    if (consent.canRequestAds()) initAds();
                });
        if (consent.canRequestAds()) initAds();
    }

    private void initAds() {
        if (initialized.getAndSet(true)) return;
        new Thread(() -> MobileAds.initialize(activity, status -> main.post(() -> {
            loadRewarded();
            loadInterstitial();
        }))).start();
    }

    private void loadRewarded() {
        if (rewarded != null || loadingRewarded || !initialized.get()) return;
        loadingRewarded = true;
        RewardedAd.load(activity, activity.getString(R.string.admob_rewarded_id), new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(RewardedAd ad) {
                rewarded = ad;
                loadingRewarded = false;
                rewardedRetry = 0;
            }

            @Override
            public void onAdFailedToLoad(LoadAdError error) {
                loadingRewarded = false;
                rewardedRetry = Math.min(rewardedRetry + 1, 6);
                main.postDelayed(Ads.this::loadRewarded, (long) (Math.pow(2, rewardedRetry) * 1000));
            }
        });
    }

    private void loadInterstitial() {
        if (interstitial != null || loadingInterstitial || !initialized.get()) return;
        loadingInterstitial = true;
        InterstitialAd.load(activity, activity.getString(R.string.admob_interstitial_id), new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
            @Override
            public void onAdLoaded(InterstitialAd ad) {
                interstitial = ad;
                loadingInterstitial = false;
                interstitialRetry = 0;
            }

            @Override
            public void onAdFailedToLoad(LoadAdError error) {
                loadingInterstitial = false;
                interstitialRetry = Math.min(interstitialRetry + 1, 6);
                main.postDelayed(Ads.this::loadInterstitial, (long) (Math.pow(2, interstitialRetry) * 1000));
            }
        });
    }

    public boolean rewardedReady() {
        return rewarded != null;
    }

    public void showRewarded(String placement, GameBridge.Reply reply) {
        if (rewarded == null) {
            reply.send(GameBridge.ok(false));
            loadRewarded();
            return;
        }
        final boolean[] earned = {false};
        RewardedAd ad = rewarded;
        rewarded = null;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                JSONObject o = GameBridge.ok(true);
                try { o.put("rewarded", earned[0]); } catch (Exception ignored) { }
                reply.send(o);
                loadRewarded();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(AdError adError) {
                reply.send(GameBridge.ok(false));
                loadRewarded();
            }
        });
        ad.show(activity, rewardItem -> earned[0] = true);
    }

    public void showInterstitial(String placement) {
        if (interstitial == null) {
            loadInterstitial();
            return;
        }
        InterstitialAd ad = interstitial;
        interstitial = null;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                loadInterstitial();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(AdError adError) {
                loadInterstitial();
            }
        });
        ad.show(activity);
    }

    public boolean privacyOptionsRequired() {
        return consent != null && consent.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
    }

    public void showPrivacyOptions() {
        UserMessagingPlatform.showPrivacyOptionsForm(activity, formError -> { });
    }
}
