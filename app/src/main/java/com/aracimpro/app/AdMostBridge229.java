package com.aracimpro.app;

import android.app.Activity;
import android.util.Log;

import com.google.android.ump.ConsentInformation;

import admost.sdk.base.AdMost;
import admost.sdk.base.AdMostConfiguration;
import admost.sdk.listener.AdMostInitListener;

/**
 * AdMost Lite side-by-side integration.
 *
 * Current AdMob -> Yandex / Unity mediation continues unchanged.  Never submit
 * parallel AdMost requests into those same banner/MREC views.  When real zones
 * are mapped and privacy vendors are configured, a future controlled rollout
 * can route one placement at a time using the separate AdMost APIs.
 */
final class AdMostBridge229 {
    private static final String TAG = "AracimAdMost";
    private static boolean started = false;
    private static volatile boolean initialized = false;
    private static volatile String state = "SDK hazır; canlı bölge eşlemesi bekleniyor";

    private AdMostBridge229() {}

    static boolean hasAtLeastOneZone() {
        return !BuildConfig.ADMOST_BANNER_ZONE_ID.isEmpty()
                || !BuildConfig.ADMOST_MREC_ZONE_ID.isEmpty()
                || !BuildConfig.ADMOST_INTERSTITIAL_ZONE_ID.isEmpty()
                || !BuildConfig.ADMOST_REWARDED_ZONE_ID.isEmpty();
    }

    static boolean isInitialized() { return initialized; }
    static String getState() { return state; }

    // UMP consent and Premium status may change after SDK initialization.
    // Keep AdMost's own request gate synchronized without loading any zones.
    static synchronized void updateConsent(ConsentInformation consent, boolean premiumActive) {
        if (!initialized) return;
        boolean allowed = !premiumActive && consent != null && consent.canRequestAds();
        try {
            AdMost.getInstance().setCanRequestAds(allowed);
            Log.i(TAG, "Consent request gate updated: " + allowed);
        } catch (Throwable t) {
            Log.w(TAG, "Could not update SDK consent", t);
        }
    }

    static synchronized void initializeIfAllowed(
            Activity activity, ConsentInformation consent, boolean premiumActive) {
        if (started) {
            updateConsent(consent, premiumActive);
            return;
        }
        if (activity == null || activity.isFinishing() || premiumActive) return;
        if (consent == null || !consent.canRequestAds()) {
            state = "UMP reklam izni bekleniyor";
            return;
        }
        // Debug: initialize the SDK but DO NOT request or show paid ads.
        // Production: disabled unless live rollout and zones are explicitly set.
        if (!BuildConfig.DEBUG && (!BuildConfig.ADMOST_ENABLE_LIVE || !hasAtLeastOneZone())) {
            state = "SDK kurulu; mevcut AdMob yayını korunuyor";
            return;
        }
        if (BuildConfig.ADMOST_APP_ID.isEmpty()) {
            state = "AdMost uygulama kimliği eksik";
            return;
        }
        started = true;
        state = "AdMost SDK başlatılıyor";
        try {
            AdMostConfiguration.Builder config =
                    new AdMostConfiguration.Builder(activity, BuildConfig.ADMOST_APP_ID);
            config.setUseHttps();
            config.canRequestAds(consent.canRequestAds());
            config.showUIWarningsForDebuggableBuild(BuildConfig.DEBUG);
            AdMost.getInstance().init(config.build(), new AdMostInitListener() {
                @Override public void onInitCompleted() {
                    initialized = true;
                    updateConsent(consent, premiumActive);
                    state = "AdMost SDK hazır (reklam bölgesi yönlendirmesi kapalı)";
                    Log.i(TAG, state);
                }
                @Override public void onInitFailed(int errorCode) {
                    initialized = false;
                    state = "SDK başlatma hatası: " + errorCode;
                    Log.w(TAG, state);
                }
            });
        } catch (Throwable t) {
            started = false;
            state = "SDK hata: " + t.getClass().getSimpleName();
            Log.w(TAG, state, t);
        }
    }
}
