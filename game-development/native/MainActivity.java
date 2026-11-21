package com.okkacis.game;

import android.app.Activity;
import android.app.DatePickerDialog;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.AdView;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import java.util.Calendar;

/**
 * DEV PREVIEW: Google sample IDs exclusively, no live ad revenue.
 * Production integration must use the OK Kacis AdMob app and ad-unit IDs,
 * updated privacy/data safety declarations, and any required consent flow.
 * Only bottom banner advertising; Unity bidding is mapped in AdMob when enabled.
 * Yandex must be mapped ONLY to the separate adult AdMob banner unit.
 * The child/unknown-age unit must never have non-Families-certified sources.
 */
public final class MainActivity extends Activity {
    // Google's official development/test IDs. Never ship these for monetization.
    private static final String CHILD_BANNER_ID = "ca-app-pub-3940256099942544/9214589741";
    // In this debug build both IDs are Google's sample. Production MUST map
    // this separate ID to the adult-only Yandex mediation group.
    private static final String ADULT_BANNER_ID = "ca-app-pub-3940256099942544/9214589741";
    private static final String AUDIENCE_PREFERENCES = "ok_kacis_age_screen";

    private WebView game;
    private FrameLayout bannerContainer;
    private AdView banner;
    private ConsentInformation consentInformation;
    private boolean adsInitialized = false;
    private boolean bannerLoaded = false;
    private boolean wantsBanner = true;
    private boolean pageLoaded = false;
    private boolean ageResolved = false;
    private boolean isAdult = false;

    private final class AdsBridge {
        @JavascriptInterface
        public void setBannerVisible(boolean visible) {
            runOnUiThread(() -> {
                wantsBanner = visible;
                refreshBannerVisibility();
            });
        }

        @JavascriptInterface
        public void showPrivacyOptions() {
            runOnUiThread(() -> {
                if (consentInformation != null &&
                        consentInformation.getPrivacyOptionsRequirementStatus()
                          == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED) {
                    UserMessagingPlatform.showPrivacyOptionsForm(MainActivity.this, error -> {});
                }
            });
        }


        @JavascriptInterface
        public void showAgeSettings() {
            runOnUiThread(() -> showNeutralAgeScreen());
        }
    }

    private void notifyGame(String method, String argument) {
        runOnUiThread(() -> {
            if (game == null || !pageLoaded) return;
            String script = "window.OkKacisAdCallbacks&&window.OkKacisAdCallbacks." +
                    method + "(" + argument + ")";
            game.evaluateJavascript(script, null);
        });
    }

    private void notifyGame(String method) { notifyGame(method, ""); }

    private void refreshBannerVisibility() {
        if (bannerContainer != null) {
            bannerContainer.setVisibility(bannerLoaded && wantsBanner ? View.VISIBLE : View.GONE);
        }
    }

    private void loadBanner() {
        if (bannerContainer == null) return;
        banner = new AdView(this);
        // Crucial: children and unknown-age users CANNOT request the adult
        // ad unit, because that unit may contain the Yandex custom event.
        banner.setAdUnitId(isAdult ? ADULT_BANNER_ID : CHILD_BANNER_ID);
        int dpWidth = (int) (getResources().getDisplayMetrics().widthPixels /
                getResources().getDisplayMetrics().density);
        // Anchored adaptive banner remains outside the 9x9 WebView board.
        banner.setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(this, Math.max(320, dpWidth)));
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER);
        bannerContainer.addView(banner, params);
        banner.setAdListener(new AdListener() {
            @Override public void onAdLoaded() {
                bannerLoaded = true;
                if (banner.getResponseInfo() != null) {
                    Log.d("OkKacisAds", "Mediation adapter: " +
                            banner.getResponseInfo().getMediationAdapterClassName());
                }
                refreshBannerVisibility();
            }
            @Override public void onAdFailedToLoad(LoadAdError error) {
                bannerLoaded = false;
                Log.w("OkKacisAds", "Banner load failed: " + error.getCode());
                refreshBannerVisibility();
            }
        });
        banner.loadAd(new AdRequest.Builder().build());
    }

    private void initializeAdsIfAllowed() {
        if (!ageResolved || adsInitialized || consentInformation == null || !consentInformation.canRequestAds()) return;
        adsInitialized = true;
        MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
            .setTagForChildDirectedTreatment(isAdult
                    ? RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE
                    : RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
            .setTagForUnderAgeOfConsent(isAdult
                    ? RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE
                    : RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
            .build());
        MobileAds.initialize(this, status -> runOnUiThread(() -> {
            if (isFinishing() || isDestroyed()) return;
            loadBanner();
        }));
    }

    private void requestConsentAndInitialize() {
        consentInformation = UserMessagingPlatform.getConsentInformation(this);
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
        consentInformation.requestConsentInfoUpdate(
            this, params,
            () -> {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(
                    MainActivity.this, formError -> initializeAdsIfAllowed());
                initializeAdsIfAllowed();
            },
            requestError -> initializeAdsIfAllowed()
        );
    }

    private void applyAgeSelection(int birthYear, int birthMonth, int birthDay) {
        Calendar today = Calendar.getInstance();
        Calendar eighteenthBirthday = Calendar.getInstance();
        eighteenthBirthday.clear();
        eighteenthBirthday.set(birthYear + 18, birthMonth, birthDay);
        isAdult = !eighteenthBirthday.after(today);
        ageResolved = true;
        // Date remains on-device. Never send it to any advertising network.
        getSharedPreferences(AUDIENCE_PREFERENCES, MODE_PRIVATE).edit()
                .putInt("year", birthYear).putInt("month", birthMonth)
                .putInt("day", birthDay).putBoolean("skipped", false).apply();
        if (banner != null) {
            banner.destroy();
            banner = null;
            bannerLoaded = false;
            bannerContainer.removeAllViews();
            refreshBannerVisibility();
        }
        // When changed in Settings, initialize a fresh SDK session next launch;
        // never switch from a child request to an adult network mid-session.
        if (!adsInitialized) requestConsentAndInitialize();
    }

    private void showNeutralAgeScreen() {
        Calendar now = Calendar.getInstance();
        DatePickerDialog dialog = new DatePickerDialog(this,
                (picker, year, month, day) -> applyAgeSelection(year, month, day),
                now.get(Calendar.YEAR), now.get(Calendar.MONTH), now.get(Calendar.DAY_OF_MONTH));
        dialog.setTitle("Doğum tarihi");
        dialog.setMessage("Reklamların yaşa uygun olması için doğum tarihinizi seçebilirsiniz.");
        dialog.getDatePicker().setMaxDate(System.currentTimeMillis());
        dialog.setButton(DatePickerDialog.BUTTON_NEUTRAL, "Atla", (d, which) -> {
            // Unknown age is always treated as child-directed.
            ageResolved = true;
            isAdult = false;
            getSharedPreferences(AUDIENCE_PREFERENCES, MODE_PRIVATE).edit()
                    .putBoolean("skipped", true).apply();
            if (!adsInitialized) requestConsentAndInitialize();
        });
        dialog.setCancelable(false);
        dialog.show();
    }

    private void checkAgeBeforeAds() {
        SharedPreferences prefs = getSharedPreferences(AUDIENCE_PREFERENCES, MODE_PRIVATE);
        int year = prefs.getInt("year", 0);
        int month = prefs.getInt("month", -1);
        int day = prefs.getInt("day", 0);
        int currentYear = Calendar.getInstance().get(Calendar.YEAR);
        if (prefs.getBoolean("skipped", false)) {
            ageResolved = true;
            isAdult = false;
            requestConsentAndInitialize();
            return;
        }
        if (year >= 1900 && year <= currentYear && month >= 0 && month <= 11
                && day >= 1 && day <= 31) {
            applyAgeSelection(year, month, day);
        } else {
            showNeutralAgeScreen();
        }
    }

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().getDecorView().setBackgroundColor(Color.rgb(29, 97, 153));
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controls = getWindow().getDecorView().getWindowInsetsController();
            if (controls != null) controls.hide(WindowInsets.Type.systemBars());
            if (controls != null) controls.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(30, 107, 177));
        game = new WebView(this);
        game.setBackgroundColor(Color.rgb(30, 107, 177));
        WebSettings s = game.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        game.setOverScrollMode(View.OVER_SCROLL_NEVER);
        game.addJavascriptInterface(new AdsBridge(), "AndroidAds");
        game.setWebChromeClient(new WebChromeClient());
        game.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                pageLoaded = true;
                // Only an anchored banner at bottom of parent; no full-screen ads.
            }
        });
        root.addView(game, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));
        bannerContainer = new FrameLayout(this);
        bannerContainer.setVisibility(View.GONE); // no empty ad band on no fill
        root.addView(bannerContainer, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        setContentView(root);
        game.loadUrl("file:///android_asset/index.html");

        // Consent is refreshed on each launch and checked before starting ad requests.
        // All IDs in this isolated preview branch are Google test IDs.
        checkAgeBeforeAds();
    }

    @Override public void onBackPressed() {
        if (game != null) game.evaluateJavascript("window.gameBack && window.gameBack()", null);
        else super.onBackPressed();
    }
    @Override protected void onPause() {
        if (banner != null) banner.pause();
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (banner != null) banner.resume();
    }
    @Override protected void onDestroy() {
        if (banner != null) { banner.destroy(); banner = null; }
        if (game != null) { game.destroy(); game = null; }
        super.onDestroy();
    }
}
