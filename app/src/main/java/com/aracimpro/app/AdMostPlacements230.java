package com.aracimpro.app;

import android.app.Activity;
import android.util.Log;
import android.view.View;

import admost.sdk.AdMostView;
import admost.sdk.listener.AdMostViewListener;

/**
 * Opt-in AdMost mediation loader for exactly two placements: bottom banner and
 * in-feed 300x250 medium rectangle.  Does not request app-open, interstitial,
 * rewarded, native, or any second ad for the same slot.
 *
 * The caller owns layout positioning, premium/UMP gating, and fallback to its
 * existing AdMob mediation implementation.  The experiment is OFF by default.
 */
final class AdMostPlacements230 {
    interface Callbacks {
        void onLoaded(boolean isBanner, View view, String network);
        void onFailed(boolean isBanner, int errorCode);
    }

    private final Activity activity;
    private final Callbacks callbacks;
    private AdMostView banner;
    private AdMostView mrec;

    AdMostPlacements230(Activity activity, Callbacks callbacks) {
        this.activity = activity;
        this.callbacks = callbacks;
    }

    void loadBanner() {
        if (banner != null) return;
        banner = create(BuildConfig.ADMOST_BANNER_ZONE_ID, true);
    }

    void loadMrec() {
        if (mrec != null) return;
        mrec = create(BuildConfig.ADMOST_MREC_ZONE_ID, false);
    }

    private AdMostView create(String zone, boolean isBanner) {
        try {
            AdMostView ad = new AdMostView(activity, zone, new AdMostViewListener() {
                @Override public void onReady(String network, int ecpm, View adView) {
                    activity.runOnUiThread(() -> callbacks.onLoaded(isBanner, adView, network));
                }

                @Override public void onFail(int errorCode) {
                    activity.runOnUiThread(() -> callbacks.onFailed(isBanner, errorCode));
                }

                @Override public void onClick(String network) {
                    Log.i("AracimAdMost", (isBanner ? "Banner" : "MREC") + " clicked");
                }
            }, null);
            ad.load();
            return ad;
        } catch (Throwable error) {
            Log.e("AracimAdMost", "AdMost load failed", error);
            activity.runOnUiThread(() -> callbacks.onFailed(isBanner, -1));
            return null;
        }
    }

    void stopBanner() {
        if (banner == null) return;
        try { banner.destroy(); } catch (Throwable ignored) {}
        banner = null;
    }

    void stopMrec() {
        if (mrec == null) return;
        try { mrec.destroy(); } catch (Throwable ignored) {}
        mrec = null;
    }

    void destroy() {
        stopBanner();
        stopMrec();
    }
}
