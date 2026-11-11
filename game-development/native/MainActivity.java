package com.okkacis.game;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
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

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

/**
 * DEV PREVIEW: Google sample IDs exclusively, no live ad revenue.
 * Production integration must use the OK Kacis AdMob app and ad-unit IDs,
 * updated privacy/data safety declarations, and any required consent flow.
 * No interstitial or rewarded-interstitial logic is present.
 */
public final class MainActivity extends Activity {
    // Google's official development/test IDs. Never ship these for monetization.
    private static final String TEST_BANNER_ID = "ca-app-pub-3940256099942544/9214589741";
    private static final String TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";
    private static final String TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";

    private WebView game;
    private FrameLayout bannerContainer;
    private AdView banner;
    private RewardedAd rewarded;
    private InterstitialAd interstitial;
    private ConsentInformation consentInformation;
    private boolean adsInitialized = false;
    private boolean bannerLoaded = false;
    private boolean wantsBanner = false;
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
        public void showRewarded() {
            runOnUiThread(() -> showRewardedOnUi());
        }

        @JavascriptInterface
        public void showInterstitial() {
            runOnUiThread(() -> showInterstitialOnUi());
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
        banner.setAdUnitId(TEST_BANNER_ID);
        int dpWidth = (int) (getResources().getDisplayMetrics().widthPixels /
                getResources().getDisplayMetrics().density);
        // Compact anchored adaptive (rather than large banner) to protect 7x7 board.
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
    }

    private void loadRewarded() {
        rewarded = null;
        notifyGame("onReady", "false");
        RewardedAd.load(this, TEST_REWARDED_ID, new AdRequest.Builder().build(),
                new RewardedAdLoadCallback() {
                    @Override public void onAdLoaded(RewardedAd ad) {
                        rewarded = ad;
                        notifyGame("onReady", "true");
                    }
                    @Override public void onAdFailedToLoad(LoadAdError error) {
                        rewarded = null;
                        notifyGame("onReady", "false");
                    }
                });
    }

    private void loadInterstitial() {
        InterstitialAd.load(this, TEST_INTERSTITIAL_ID, new AdRequest.Builder().build(),
            new InterstitialAdLoadCallback() {
                @Override public void onAdLoaded(InterstitialAd ad) { interstitial = ad; }
                @Override public void onAdFailedToLoad(LoadAdError e) { interstitial = null; }
            });
    }

    private void showInterstitialOnUi() {
        if (interstitial == null) {
            notifyGame("onInterstitialFailed");
            return;
        }
        final InterstitialAd ad = interstitial;
        interstitial = null;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override public void onAdShowedFullScreenContent() {
                notifyGame("onInterstitialShown");
            }
            @Override public void onAdDismissedFullScreenContent() {
                notifyGame("onInterstitialClosed");
                loadInterstitial();
            }
            @Override public void onAdFailedToShowFullScreenContent(AdError error) {
                notifyGame("onInterstitialFailed");
                loadInterstitial();
            }
        });
        ad.show(this);
    }

    private void initializeAdsIfAllowed() {
        if (adsInitialized || consentInformation == null || !consentInformation.canRequestAds()) return;
        adsInitialized = true;
        MobileAds.initialize(this, status -> runOnUiThread(() -> {
            if (isFinishing() || isDestroyed()) return;
            loadBanner();
            loadRewarded();
            loadInterstitial();
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

    private void showRewardedOnUi() {
        if (rewarded == null) {
            notifyGame("onFailed");
            return;
        }
        final RewardedAd current = rewarded;
        rewarded = null;
        notifyGame("onReady", "false");
        current.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override public void onAdDismissedFullScreenContent() {
                notifyGame("onClosed");
                loadRewarded();
            }
            @Override public void onAdFailedToShowFullScreenContent(AdError error) {
                notifyGame("onFailed");
                loadRewarded();
            }
        });
        // Only this SDK callback authorizes the +5 heart credit in game.js.
        current.show(this, rewardItem -> notifyGame("onRewardEarned"));
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
                notifyGame("onReady", rewarded == null ? "false" : "true");
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
