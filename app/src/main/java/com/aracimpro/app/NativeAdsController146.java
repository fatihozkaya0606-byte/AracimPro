package com.aracimpro.app;

import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.webkit.WebView;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.nativead.MediaView;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdView;
import java.util.function.BooleanSupplier;

/** A single SDK-managed, in-feed NativeAdView mapped to a dedicated WebView placeholder.
 * Does not reuse an interstitial/banner/MREC ID, request ads for premium users,
 * or add custom click handlers to advertising assets.
 */
final class NativeAdsController146 {
    private static final String GOOGLE_NATIVE_SAMPLE_ID =
            "ca-app-pub-3940256099942544/2247696110";
    private final Activity activity;
    private final FrameLayout root;
    private final WebView web;
    private final BooleanSupplier mayRequest;
    private final BooleanSupplier mayDisplay;
    private final Handler main = new Handler(Looper.getMainLooper());
    private NativeAd ad;
    private NativeAdView view;
    private boolean requested, sdkReady, loading, loaded, slotVisible, disposed;
    private int retryCount;
    private long scrollUntil;

    NativeAdsController146(Activity a, FrameLayout container, WebView webView,
                           BooleanSupplier requestGate, BooleanSupplier displayGate) {
        activity = a;
        root = container;
        web = webView;
        mayRequest = requestGate;
        mayDisplay = displayGate;
    }

    private int dp(float value) {
        return Math.round(value * activity.getResources().getDisplayMetrics().density);
    }

    NativeAdView getView() { return view; }

    void onSdkReady() { sdkReady = true; if (requested) request(); }

    void request() {
        requested = true;
        if (disposed || !sdkReady || loading || loaded || !mayRequest.getAsBoolean()) return;
        final String unit = BuildConfig.DEBUG || BuildConfig.ADMOB_TEST_MODE
                ? GOOGLE_NATIVE_SAMPLE_ID : BuildConfig.NATIVE_AD_UNIT_ID;
        if (unit == null || !unit.matches("ca-app-pub-[0-9]+/[0-9]+")) {
            android.util.Log.i("AracimAdMob", "native_not_configured: Create separate AdMob Native ad unit.");
            return;
        }
        loading = true;
        try {
            new AdLoader.Builder(activity, unit)
                    .forNativeAd(nativeAd -> activity.runOnUiThread(() -> {
                        loading = false;
                        if (disposed || !mayRequest.getAsBoolean()) {
                            nativeAd.destroy();
                            return;
                        }
                        clear();
                        ad = nativeAd;
                        loaded = true;
                        retryCount = 0;
                        createNativeView(nativeAd);
                        notifyWeb(true);
                        android.util.Log.i("AracimAdMob", "native_loaded");
                    }))
                    .withAdListener(new AdListener() {
                        @Override public void onAdFailedToLoad(LoadAdError error) {
                            activity.runOnUiThread(() -> {
                                loading = false;
                                if (disposed || loaded) return;
                                notifyWeb(false);
                                android.util.Log.i("AracimAdMob",
                                    "native_failed: " + String.valueOf(error));
                                // Avoid rapid no-fill loops.
                                long backoff = Math.min(30 * 60 * 1000L,
                                        120000L * (1L << Math.min(retryCount++, 4)));
                                main.postDelayed(() -> {
                                    if (requested && !disposed && !loaded) request();
                                }, backoff);
                            });
                        }
                        @Override public void onAdImpression() {
                            android.util.Log.i("AracimAdMob", "native_impression");
                        }
                    }).build().loadAd(new AdRequest.Builder().build());
        } catch (Throwable ex) {
            loading = false;
            android.util.Log.w("AracimAdMob", "native_error", ex);
        }
    }

    private TextView label(String value, float sp, int color, boolean bold) {
        TextView label = new TextView(activity);
        label.setText(value == null ? "" : value);
        label.setTextColor(color);
        label.setTextSize(sp);
        label.setMaxLines(2);
        label.setEllipsize(TextUtils.TruncateAt.END);
        if (bold) label.setTypeface(Typeface.DEFAULT_BOLD);
        return label;
    }

    private void createNativeView(NativeAd nativeAd) {
        NativeAdView n = new NativeAdView(activity);
        GradientDrawable bg = new GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                new int[]{0xFF102C44, 0xFF071A30});
        bg.setCornerRadius(dp(16));
        bg.setStroke(dp(1), 0xFF355B79);
        n.setBackground(bg);

        LinearLayout column = new LinearLayout(activity);
        column.setOrientation(LinearLayout.VERTICAL);
        column.setPadding(dp(10), dp(7), dp(10), dp(7));
        n.addView(column, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        TextView badge = label("Reklam", 10, 0xFFB6D8F2, true);
        badge.setGravity(Gravity.CENTER_VERTICAL);
        // The top-right corner is reserved for the SDK-owned AdChoices overlay.
        badge.setPadding(dp(3), 0, dp(48), 0);
        column.addView(badge, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(22)));

        MediaView media = new MediaView(activity);
        LinearLayout.LayoutParams mediaParams =
                new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f);
        mediaParams.bottomMargin = dp(7);
        column.addView(media, mediaParams);
        n.setMediaView(media);
        if (nativeAd.getMediaContent() == null) media.setVisibility(View.INVISIBLE);

        LinearLayout bottom = new LinearLayout(activity);
        bottom.setOrientation(LinearLayout.HORIZONTAL);
        bottom.setGravity(Gravity.CENTER_VERTICAL);
        column.addView(bottom, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(58)));

        ImageView icon = new ImageView(activity);
        icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams iconParams =
                new LinearLayout.LayoutParams(dp(42), dp(42));
        iconParams.rightMargin = dp(8);
        bottom.addView(icon, iconParams);
        n.setIconView(icon);
        if (nativeAd.getIcon() == null) icon.setVisibility(View.GONE);
        else icon.setImageDrawable(nativeAd.getIcon().getDrawable());

        LinearLayout text = new LinearLayout(activity);
        text.setOrientation(LinearLayout.VERTICAL);
        text.setGravity(Gravity.CENTER_VERTICAL);
        bottom.addView(text, new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.MATCH_PARENT, 1f));

        TextView headline = label(nativeAd.getHeadline(), 13, 0xFFF1FAFF, true);
        text.addView(headline);
        n.setHeadlineView(headline);
        TextView description = label(nativeAd.getBody(), 10, 0xFFADCAE2, false);
        text.addView(description);
        n.setBodyView(description);
        if (nativeAd.getBody() == null) description.setVisibility(View.GONE);

        Button action = new Button(activity);
        action.setText(nativeAd.getCallToAction() == null ? "" : nativeAd.getCallToAction());
        action.setTextSize(10f);
        action.setAllCaps(false);
        action.setTextColor(Color.WHITE);
        action.setBackgroundTintList(ColorStateList.valueOf(0xFF166EE4));
        action.setMinWidth(0);
        action.setMinimumWidth(0);
        action.setPadding(dp(3), 0, dp(3), 0);
        bottom.addView(action, new LinearLayout.LayoutParams(dp(91), dp(45)));
        n.setCallToActionView(action);
        if (nativeAd.getCallToAction() == null) action.setVisibility(View.GONE);

        n.setNativeAd(nativeAd);
        n.setVisibility(View.INVISIBLE);
        view = n;
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                dp(300), dp(242), Gravity.TOP | Gravity.LEFT);
        root.addView(n, params);
        updateVisibility();
    }

    private void notifyWeb(boolean ready) {
        if (disposed || activity.isDestroyed()) return;
        main.post(() -> {
            if (disposed || activity.isDestroyed()) return;
            web.evaluateJavascript("window.apNativeAvailability146 && window.apNativeAvailability146(" +
                    (ready ? "true" : "false") + ")", null);
        });
    }

    void notifyOnPageLoad() { if (loaded) notifyWeb(true); }

    void hideForScroll() {
        scrollUntil = SystemClock.elapsedRealtime() + 580L;
        slotVisible = false;
        updateVisibility();
        // After scrolling finishes, let JS remeasure the actual placeholder.
        web.removeCallbacks(afterScroll);
        web.postDelayed(afterScroll, 660L);
    }

    private final Runnable afterScroll = () -> {
        if (!disposed && !activity.isDestroyed()) web.evaluateJavascript(
                "window.apNativeQueueSync146 && window.apNativeQueueSync146()", null);
    };

    void updateVisibility() {
        if (view == null) return;
        boolean show = !disposed && loaded && slotVisible
                && SystemClock.elapsedRealtime() >= scrollUntil
                && mayDisplay.getAsBoolean() && !activity.isFinishing()
                && !activity.isDestroyed();
        view.setVisibility(show ? View.VISIBLE : View.INVISIBLE);
    }

    void updateSlot(double left, double top, double width, double height,
                    double viewportWidth, boolean visible) {
        slotVisible = false;
        if (disposed || !visible || !loaded || view == null ||
                !Double.isFinite(left) || !Double.isFinite(top) ||
                !Double.isFinite(width) || !Double.isFinite(height) ||
                !Double.isFinite(viewportWidth) || viewportWidth < 290 ||
                width < 255 || height < 230 || web.getWidth() <= 0) {
            updateVisibility();
            return;
        }
        double scale = web.getWidth() / viewportWidth;
        if (!Double.isFinite(scale) || scale <= 0 || scale > 10) {
            updateVisibility();
            return;
        }
        int[] r = new int[2], w = new int[2];
        root.getLocationOnScreen(r);
        web.getLocationOnScreen(w);
        int wx = w[0] - r[0], wy = w[1] - r[1];
        int x = wx + (int)Math.round(left * scale);
        int y = wy + (int)Math.round(top * scale);
        int widthPx = (int)Math.round(width * scale);
        int heightPx = (int)Math.round(height * scale);
        boolean inSafeArea = left >= 0 && left + width <= viewportWidth + 1
                && x >= wx && x + widthPx <= wx + web.getWidth()
                && y >= wy + dp(90)
                && y + heightPx <= wy + web.getHeight() - dp(84)
                && heightPx >= dp(220)
                && SystemClock.elapsedRealtime() >= scrollUntil;
        if (!inSafeArea) {
            updateVisibility();
            return;
        }
        FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) view.getLayoutParams();
        if (lp == null) return;
        if (lp.leftMargin != x || lp.topMargin != y ||
                lp.width != widthPx || lp.height != heightPx) {
            lp.leftMargin = x;
            lp.topMargin = y;
            lp.width = widthPx;
            lp.height = heightPx;
            view.setLayoutParams(lp);
        }
        slotVisible = true;
        updateVisibility();
    }

    void clear() {
        slotVisible = false;
        loaded = false;
        if (view != null) {
            try { root.removeView(view); } catch (Throwable ignored) {}
            view = null;
        }
        if (ad != null) {
            try { ad.destroy(); } catch (Throwable ignored) {}
            ad = null;
        }
        notifyWeb(false);
    }

    void close() {
        disposed = true;
        web.removeCallbacks(afterScroll);
        main.removeCallbacksAndMessages(null);
        clear();
    }
}
