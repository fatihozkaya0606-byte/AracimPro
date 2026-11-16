package com.okkacis.game;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
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
import android.widget.Button;
import android.widget.TextView;

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

/**
 * DEV PREVIEW: Google sample IDs exclusively, no live ad revenue.
 * Production integration must use the OK Kacis AdMob app and ad-unit IDs,
 * updated privacy/data safety declarations, and any required consent flow.
 * Only bottom banner advertising; Unity bidding is mapped in AdMob when enabled.
 * Yandex is not enabled for child/unknown-age users.
 */
public final class MainActivity extends Activity {
    private static final String TAG = "OkKacis";
    private static int rendererRecoveries = 0;
    // Google's official development/test IDs. Never ship these for monetization.
    private static final String TEST_BANNER_ID = "ca-app-pub-3940256099942544/9214589741";

    private WebView game;
    private FrameLayout bannerContainer;
    private AdView banner;
    private ConsentInformation consentInformation;
    private boolean adsInitialized = false;
    private boolean bannerLoaded = false;
    private boolean wantsBanner = true;
    private boolean pageLoaded = false;

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
                if (isFinishing() || isDestroyed()) return;
                try {
                    if (consentInformation != null &&
                            consentInformation.getPrivacyOptionsRequirementStatus()
                              == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED) {
                        UserMessagingPlatform.showPrivacyOptionsForm(MainActivity.this, error -> {});
                    }
                } catch (RuntimeException error) {
                    Log.w(TAG, "Privacy options unavailable; the game stays playable", error);
                }
            });
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
        if (bannerContainer == null || banner != null || isFinishing() || isDestroyed()) return;
        try {
            banner = new AdView(this);
            banner.setAdUnitId(TEST_BANNER_ID);
            int dpWidth = (int) (getResources().getDisplayMetrics().widthPixels /
                    getResources().getDisplayMetrics().density);
            // Keep ads separate from the game board; ad failure must not stop play.
            banner.setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(this, Math.max(320, dpWidth)));
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT,
                    Gravity.CENTER);
            bannerContainer.addView(banner, params);
            banner.setAdListener(new AdListener() {
                @Override public void onAdLoaded() {
                    bannerLoaded = true;
                    refreshBannerVisibility();
                }
                @Override public void onAdFailedToLoad(LoadAdError error) {
                    bannerLoaded = false;
                    refreshBannerVisibility();
                }
            });
            banner.loadAd(new AdRequest.Builder().build());
        } catch (RuntimeException error) {
            Log.w(TAG, "Banner failed; continuing the offline game", error);
            bannerLoaded = false;
            if (banner != null) { banner.destroy(); banner = null; }
            bannerContainer.removeAllViews();
            refreshBannerVisibility();
        }
    }

    private void initializeAdsIfAllowed() {
        if (adsInitialized || consentInformation == null || isFinishing() || isDestroyed()) return;
        try {
            if (!consentInformation.canRequestAds()) return;
            adsInitialized = true;
            MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
                .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
                .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
                .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
                .build());
            MobileAds.initialize(this, status -> runOnUiThread(() -> {
                if (!isFinishing() && !isDestroyed()) loadBanner();
            }));
        } catch (RuntimeException error) {
            Log.w(TAG, "Ad SDK unavailable; continuing the offline game", error);
        }
    }

    private void requestConsentAndInitialize() {
        try {
            consentInformation = UserMessagingPlatform.getConsentInformation(this);
            ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
            consentInformation.requestConsentInfoUpdate(
                this, params,
                () -> runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    try {
                        UserMessagingPlatform.loadAndShowConsentFormIfRequired(
                            MainActivity.this, formError -> initializeAdsIfAllowed());
                    } catch (RuntimeException error) {
                        Log.w(TAG, "Consent form unavailable", error);
                    }
                    initializeAdsIfAllowed();
                }),
                requestError -> runOnUiThread(this::initializeAdsIfAllowed)
            );
        } catch (RuntimeException error) {
            Log.w(TAG, "Consent SDK unavailable; continuing the offline game", error);
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
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                // An Android WebView renderer can be killed on low-memory devices.
                // The default WebViewClient crashes the entire app in this case.
                Log.w(TAG, "Game renderer exited; restarting the offline view");
                pageLoaded = false;
                if (view.getParent() instanceof android.view.ViewGroup) {
                    ((android.view.ViewGroup) view.getParent()).removeView(view);
                }
                view.destroy();
                if (game == view) game = null;
                if (++rendererRecoveries <= 2) {
                    recreate();
                } else {
                    LinearLayout retry = new LinearLayout(MainActivity.this);
                    retry.setOrientation(LinearLayout.VERTICAL);
                    retry.setGravity(Gravity.CENTER);
                    TextView message = new TextView(MainActivity.this);
                    message.setText("Oyun geçici olarak durdu. Kayıtların korunuyor.");
                    message.setTextColor(Color.WHITE);
                    retry.addView(message);
                    Button button = new Button(MainActivity.this);
                    button.setText("Oyunu tekrar aç");
                    button.setOnClickListener(v -> { rendererRecoveries = 0; recreate(); });
                    retry.addView(button);
                    ((LinearLayout) bannerContainer.getParent()).addView(retry, 0,
                            new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));
                }
                return true;
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
        requestConsentAndInitialize();
    }

    @Override public void onBackPressed() {
        if (game != null) {
            try { game.evaluateJavascript("window.gameBack && window.gameBack()", null); }
            catch (RuntimeException error) { Log.w(TAG, "Back navigation ignored during renderer recovery", error); }
        }
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
