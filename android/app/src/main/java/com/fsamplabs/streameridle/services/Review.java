package com.fsamplabs.streameridle.services;

import android.app.Activity;

import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

/** Google Play in-app review card (Google decides if/when it actually shows). */
public final class Review {
    private Review() {}

    public static void request(Activity activity) {
        try {
            ReviewManager manager = ReviewManagerFactory.create(activity);
            manager.requestReviewFlow().addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    ReviewInfo info = task.getResult();
                    manager.launchReviewFlow(activity, info);
                }
            });
        } catch (Throwable ignored) {
        }
    }
}
