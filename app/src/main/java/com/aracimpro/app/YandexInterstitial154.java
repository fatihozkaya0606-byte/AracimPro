package com.aracimpro.app;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.yandex.mobile.ads.common.AdError;
import com.yandex.mobile.ads.common.AdRequestError;
import com.yandex.mobile.ads.common.ImpressionData;
import com.yandex.mobile.ads.common.YandexAds;
import com.yandex.mobile.ads.interstitial.InterstitialAd;
import com.yandex.mobile.ads.interstitial.InterstitialAdEventListener;
import com.yandex.mobile.ads.interstitial.InterstitialAdLoadListener;
import com.yandex.mobile.ads.interstitial.InterstitialAdLoader;
import com.yandex.mobile.ads.common.AdRequest;

/**
 * v154: independent, consent-gated Yandex interstitial fallback.
 * No Yandex mediation, no duplicate full-screen ads, no timer-forced impressions.
 * Google AdMob remains the primary source. Production uses user-owned unit.
 */
final class YandexInterstitial154 {
    private static final String TAG = "AracimYandex";
    private static final String LIVE_UNIT = "R-M-20318979-1";
    private static final String DEMO_UNIT = "demo-interstitial-yandex";
    private final Activity activity;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private InterstitialAdLoader loader;
    private InterstitialAd readyAd;
    private boolean initializing;
    private boolean initialized;
    private boolean loading;
    private boolean showing;
    private boolean destroyed;
    private long lastErrorAt;
    private int failures;
    private volatile boolean ready;

    YandexInterstitial154(Activity activity) {
        this.activity = activity;
    }

    boolean isReady() { return ready; }

    void start() {
        if (destroyed || initializing || initialized) return;
        initializing = true;
        try {
            // AndroidManifest explicitly disables automatic SDK initialization.
            // Caller must have completed the advertising consent / Premium gate.
            YandexAds.initialize(activity, () -> handler.post(() -> {
                initializing = false;
                if (destroyed) return;
                initialized = true;
                Log.i(TAG, "Yandex SDK ready");
                preload();
            }));
        } catch (Throwable t) {
            initializing = false;
            Log.w(TAG, "Yandex SDK initialization failed: " + t.getMessage());
        }
    }

    void preload() {
        if (!initialized || destroyed || loading || showing || readyAd != null) return;
        long now = SystemClock.elapsedRealtime();
        // Do not hammer Yandex if account approval or available inventory is missing.
        if (failures >= 3) return;
        if (lastErrorAt > 0L && now - lastErrorAt < 120000L) return;
        try {
            if (loader == null) loader = new InterstitialAdLoader(activity);
            loading = true;
            AdRequest req = new AdRequest.Builder(BuildConfig.DEBUG ? DEMO_UNIT : LIVE_UNIT).build();
            loader.loadAd(req, new InterstitialAdLoadListener() {
                @Override public void onAdLoaded(@NonNull InterstitialAd ad) {
                    loading = false;
                    if (destroyed) {
                        ad.setAdEventListener(null);
                        return;
                    }
                    readyAd = ad;
                    ready = true;
                    failures = 0;
                    Log.i(TAG, "Yandex interstitial loaded");
                }
                @Override public void onAdFailedToLoad(@NonNull AdRequestError error) {
                    loading = false;
                    ready = false;
                    lastErrorAt = SystemClock.elapsedRealtime();
                    failures++;
                    Log.w(TAG, "Yandex ad unavailable: " + error);
                }
            });
        } catch (Throwable t) {
            loading = false;
            ready = false;
            failures++;
            lastErrorAt = now;
            Log.w(TAG, "Yandex request failed: " + t);
        }
    }

    /** Must be called on UI thread; returns true only for an already loaded ad. */
    boolean show(Runnable finished) {
        if (destroyed || showing || !ready || readyAd == null) return false;
        InterstitialAd ad = readyAd;
        readyAd = null;
        ready = false;
        showing = true;
        final boolean[] completed = {false};
        Runnable complete = () -> {
            if (completed[0]) return;
            completed[0] = true;
            showing = false;
            try { ad.setAdEventListener(null); } catch (Throwable ignored) {}
            if (!destroyed) {
                handler.postDelayed(this::preload, 1300L);
                finished.run();
            }
        };
        ad.setAdEventListener(new InterstitialAdEventListener() {
            @Override public void onAdShown() { Log.i(TAG, "Yandex interstitial shown"); }
            @Override public void onAdFailedToShow(@NonNull AdError error) {
                Log.w(TAG, "Yandex interstitial display failed: " + error);
                complete.run();
            }
            @Override public void onAdDismissed() { complete.run(); }
            @Override public void onAdClicked() {}
            @Override public void onAdImpression(@Nullable ImpressionData data) {}
        });
        try { ad.show(activity); return true; }
        catch (Throwable t) {
            Log.w(TAG, "Yandex show exception: " + t);
            complete.run();
            return false;
        }
    }

    void destroy() {
        destroyed = true;
        handler.removeCallbacksAndMessages(null);
        ready = false;
        if (readyAd != null) {
            try { readyAd.setAdEventListener(null); } catch (Throwable ignored) {}
            readyAd = null;
        }
        loader = null;
    }
}
