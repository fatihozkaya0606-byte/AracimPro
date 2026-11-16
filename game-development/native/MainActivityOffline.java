package com.okkacis.game;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Ads-free release host. No Google Mobile Ads / Unity / UMP dependencies are
 * bundled when production AdMob credentials are not configured.
 * In particular, MobileAdsInitProvider must not run without an AdMob app ID.
 * The same local WebView game and save storage are kept intact.
 */
public final class MainActivity extends Activity {
    private static final String TAG = "OkKacis";
    private static int rendererRecoveries = 0;
    private LinearLayout root;
    private WebView game;
    private boolean pageLoaded;

    // The existing HTML uses this bridge to control banner visibility. It is a
    // safe no-op in the ads-free release; gameplay continues without networking.
    private final class AdsBridge {
        @JavascriptInterface public void setBannerVisible(boolean visible) {}
        @JavascriptInterface public void showPrivacyOptions() {}
    }

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().getDecorView().setBackgroundColor(Color.rgb(29, 97, 153));
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getDecorView().getWindowInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.systemBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(30, 107, 177));
        setContentView(root);
        openGame();
    }

    private void openGame() {
        if (isFinishing() || isDestroyed()) return;
        root.removeAllViews();
        pageLoaded = false;
        try {
            WebView next = new WebView(this);
            game = next;
            next.setBackgroundColor(Color.rgb(30, 107, 177));
            WebSettings settings = next.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(false);
            settings.setAllowFileAccessFromFileURLs(false);
            settings.setAllowUniversalAccessFromFileURLs(false);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            next.setOverScrollMode(View.OVER_SCROLL_NEVER);
            next.addJavascriptInterface(new AdsBridge(), "AndroidAds");
            next.setWebChromeClient(new WebChromeClient() {
                @Override public boolean onConsoleMessage(ConsoleMessage message) {
                    if (message.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
                        Log.e(TAG, "Game JS: " + message.message());
                    }
                    return true;
                }
            });
            next.setWebViewClient(new WebViewClient() {
                @Override public void onPageFinished(WebView view, String url) {
                    if (view == game) pageLoaded = true;
                }
                @Override public void onReceivedError(
                        WebView view, WebResourceRequest request, WebResourceError error) {
                    if (request.isForMainFrame()) {
                        Log.e(TAG, "Offline game page load failed: " + error.getDescription());
                        showRecovery();
                    }
                }
                @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                    Log.e(TAG, "WebView renderer exited; recovery " + (rendererRecoveries + 1));
                    pageLoaded = false;
                    if (view.getParent() instanceof ViewGroup) {
                        ((ViewGroup) view.getParent()).removeView(view);
                    }
                    view.destroy();
                    if (game == view) game = null;
                    if (++rendererRecoveries <= 2) {
                        root.post(() -> openGame());
                    } else {
                        root.post(() -> showRecovery());
                    }
                    return true;
                }
            });
            root.addView(next, new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));
            next.loadUrl("file:///android_asset/index.html");
        } catch (RuntimeException failure) {
            Log.e(TAG, "WebView start failed; displaying retry action", failure);
            if (game != null) {
                try { game.destroy(); } catch (RuntimeException ignored) {}
                game = null;
            }
            showRecovery();
        }
    }

    private void showRecovery() {
        if (isFinishing() || isDestroyed()) return;
        if (game != null) {
            WebView old = game;
            game = null;
            if (old.getParent() instanceof ViewGroup) {
                ((ViewGroup) old.getParent()).removeView(old);
            }
            try { old.destroy(); } catch (RuntimeException ignored) {}
        }
        root.removeAllViews();
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);
        TextView message = new TextView(this);
        message.setText("Oyun geçici olarak durdu. Kayitlarin korunuyor.");
        message.setTextColor(Color.WHITE);
        panel.addView(message);
        Button retry = new Button(this);
        retry.setText("Oyunu tekrar ac");
        retry.setOnClickListener(v -> {
            rendererRecoveries = 0;
            openGame();
        });
        panel.addView(retry);
        root.addView(panel, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));
    }

    @Override public void onBackPressed() {
        if (game != null && pageLoaded) {
            try { game.evaluateJavascript("window.gameBack&&window.gameBack()", null); }
            catch (RuntimeException failure) {
                Log.w(TAG, "Back navigation failed during renderer recovery", failure);
            }
        } else {
            super.onBackPressed();
        }
    }

    @Override protected void onPause() {
        if (game != null) game.onPause();
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        if (game != null) game.onResume();
    }

    @Override protected void onDestroy() {
        if (game != null) {
            WebView old = game;
            game = null;
            try { old.destroy(); } catch (RuntimeException ignored) {}
        }
        super.onDestroy();
    }
}
