package com.aracimpro.app;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.webkit.WebView;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdView;

import java.util.function.BooleanSupplier;

/** One real Google SDK NativeAd in a measured in-feed WebView placeholder.
 *  No fake ad text, no click interception, no impression auto-refresh.
 *  The native Android view is only visible wholly inside its visible HTML slot. */
final class NativeFeedController146 {
    private static final String GOOGLE_NATIVE_TEST_UNIT = "ca-app-pub-3940256099942544/2247696110";
    private static final int WIDTH_DP = 260;
    private static final int HEIGHT_DP = 164;
    private final Activity activity;
    private final FrameLayout root;
    private final WebView web;
    private final Handler handler;
    private final BooleanSupplier canLoad;
    private final BooleanSupplier canShow;

    private NativeAd ad;
    private NativeAdView view;
    private boolean loading;
    private boolean loaded;
    private boolean slotVisible;
    private boolean destroyed;
    private long scrollBlockUntil;
    private int retryCount;
    private final Runnable retry = this::tryLoad;

    NativeFeedController146(Activity activity, FrameLayout root, WebView web,
            Handler handler, BooleanSupplier canLoad, BooleanSupplier canShow) {
        this.activity = activity;
        this.root = root;
        this.web = web;
        this.handler = handler;
        this.canLoad = canLoad;
        this.canShow = canShow;
    }

    private int dp(float value) {
        return Math.round(value * activity.getResources().getDisplayMetrics().density);
    }

    boolean isLoaded() { return loaded && ad != null && view != null; }

    void tryLoad() {
        if (destroyed || loading || isLoaded() || !canLoad.getAsBoolean()) return;
        String unit = (BuildConfig.DEBUG || BuildConfig.ADMOB_TEST_MODE)
                ? GOOGLE_NATIVE_TEST_UNIT : BuildConfig.NATIVE_AD_UNIT_ID;
        if (unit == null || !unit.matches("ca-app-pub-[0-9]+/[0-9]+")) {
            android.util.Log.w("AracimAdMob",
                    "native_unit_missing: Set NATIVE_AD_UNIT_ID in GitHub Actions secrets; " +
                    "only debug builds use the official Google test Native unit");
            return;
        }
        loading = true;
        try {
            new AdLoader.Builder(activity, unit)
                .forNativeAd(newAd -> activity.runOnUiThread(() -> {
                    loading = false;
                    if (destroyed || !canLoad.getAsBoolean()) {
                        newAd.destroy();
                        return;
                    }
                    try {
                        if (ad != null) ad.destroy();
                        if (view != null) root.removeView(view);
                        ad = newAd;
                        view = buildView(newAd);
                        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                            dp(WIDTH_DP), dp(HEIGHT_DP), Gravity.LEFT | Gravity.TOP);
                        root.addView(view, params);
                        loaded = true;
                        retryCount = 0;
                        slotVisible = false;
                        view.setVisibility(View.INVISIBLE);
                        notifyJs(true);
                        android.util.Log.i("AracimAdMob", "native146_loaded: NativeAd received");
                    } catch (Throwable error) {
                        android.util.Log.e("AracimAdMob", "native146_render_error", error);
                        newAd.destroy();
                        ad = null;
                        if (view != null) { root.removeView(view); view = null; }
                        loaded = false;
                        notifyJs(false);
                        scheduleRetry();
                    }
                }))
                .withAdListener(new AdListener() {
                    @Override public void onAdFailedToLoad(LoadAdError error) {
                        activity.runOnUiThread(() -> {
                            loading = false;
                            if (destroyed) return;
                            android.util.Log.w("AracimAdMob",
                                    "native146_load_failed: " + (error == null ? "unknown" : error.toString()));
                            notifyJs(false);
                            scheduleRetry();
                        });
                    }
                    @Override public void onAdImpression() {
                        android.util.Log.i("AracimAdMob", "native146_impression: real SDK impression");
                    }
                }).build().loadAd(new AdRequest.Builder().build());
        } catch (Throwable error) {
            loading = false;
            android.util.Log.e("AracimAdMob", "native146_loader_error", error);
            scheduleRetry();
        }
    }

    private void scheduleRetry() {
        if (destroyed) return;
        long delay = Math.min(240000L, 30000L * (1L << Math.min(retryCount++, 3)));
        handler.removeCallbacks(retry);
        handler.postDelayed(retry, delay);
    }

    private TextView text(String value, int size, int color, boolean bold) {
        TextView t = new TextView(activity);
        t.setText(value == null ? "" : value);
        t.setTextSize(size);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER_VERTICAL);
        t.setIncludeFontPadding(false);
        if (bold) t.setTypeface(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD);
        return t;
    }

    private GradientDrawable rounded(int color, int radiusDp, int strokeColor) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radiusDp));
        if (strokeColor != 0) d.setStroke(dp(1), strokeColor);
        return d;
    }

    private NativeAdView buildView(NativeAd nativeAd) {
        NativeAdView nv = new NativeAdView(activity);
        nv.setBackground(rounded(0xFF092A45, 14, 0xFF23577A));
        nv.setClipToPadding(false);

        LinearLayout content = new LinearLayout(activity);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(10), dp(7), dp(9), dp(8));
        nv.addView(content, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout header = new LinearLayout(activity);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        // Reserve the right corner for SDK-controlled AdChoices.
        header.setPadding(0, 0, dp(42), 0);
        TextView attribution = text("Reklam", 10, Color.WHITE, true);
        attribution.setMinHeight(dp(19));
        attribution.setMinWidth(dp(42));
        attribution.setPadding(dp(6), dp(2), dp(6), dp(2));
        attribution.setBackground(rounded(0xFF246D9B, 4, 0));
        header.addView(attribution);

        TextView advertiser = text(nativeAd.getAdvertiser(), 10, 0xFFAACEE2, false);
        LinearLayout.LayoutParams advParams = new LinearLayout.LayoutParams(0, dp(20), 1);
        advParams.leftMargin = dp(6);
        header.addView(advertiser, advParams);
        advertiser.setVisibility(nativeAd.getAdvertiser() == null ? View.GONE : View.VISIBLE);
        content.addView(header, new LinearLayout.LayoutParams(-1, dp(22)));

        LinearLayout row = new LinearLayout(activity);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams rowLp = new LinearLayout.LayoutParams(-1, dp(78));
        rowLp.topMargin = dp(6);
        content.addView(row, rowLp);

        ImageView icon = new ImageView(activity);
        icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams iconLp = new LinearLayout.LayoutParams(dp(48), dp(48));
        iconLp.rightMargin = dp(9);
        row.addView(icon, iconLp);
        if (nativeAd.getIcon() != null && nativeAd.getIcon().getDrawable() != null) {
            icon.setImageDrawable(nativeAd.getIcon().getDrawable());
        } else {
            icon.setVisibility(View.GONE);
        }

        LinearLayout copy = new LinearLayout(activity);
        copy.setOrientation(LinearLayout.VERTICAL);
        row.addView(copy, new LinearLayout.LayoutParams(0, -2, 1));

        TextView headline = text(nativeAd.getHeadline(), 13, Color.WHITE, true);
        headline.setMaxLines(2);
        headline.setEllipsize(android.text.TextUtils.TruncateAt.END);
        copy.addView(headline, new LinearLayout.LayoutParams(-1, -2));

        TextView body = text(nativeAd.getBody(), 10, 0xFFBCD1E0, false);
        body.setMaxLines(2);
        body.setEllipsize(android.text.TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams bodyLp = new LinearLayout.LayoutParams(-1, -2);
        bodyLp.topMargin = dp(4);
        copy.addView(body, bodyLp);
        body.setVisibility(nativeAd.getBody() == null ? View.GONE : View.VISIBLE);

        TextView cta = text(nativeAd.getCallToAction(), 12, Color.WHITE, true);
        cta.setGravity(Gravity.CENTER);
        cta.setBackground(rounded(0xFF177EBD, 9, 0));
        cta.setMinHeight(dp(34));
        LinearLayout.LayoutParams ctaLp = new LinearLayout.LayoutParams(-1, dp(34));
        ctaLp.topMargin = dp(5);
        content.addView(cta, ctaLp);
        cta.setVisibility(nativeAd.getCallToAction() == null ? View.GONE : View.VISIBLE);

        nv.setHeadlineView(headline);
        nv.setBodyView(body);
        nv.setIconView(icon);
        nv.setAdvertiserView(advertiser);
        nv.setCallToActionView(cta);
        // The SDK inserts its AdChoices control in the reserved top-right corner.
        // Asset clicks/impressions are exclusively handled by Google Mobile Ads.
        nv.setNativeAd(nativeAd);
        return nv;
    }

    void notifyJs(boolean available) {
        if (destroyed || web == null) return;
        web.evaluateJavascript("window.apNativeAvailability146 && window.apNativeAvailability146(" +
                (available ? "true" : "false") + ")", null);
    }

    void hideForScroll() {
        slotVisible = false;
        scrollBlockUntil = SystemClock.elapsedRealtime() + 620L;
        updateVisibility();
    }

    void hide() {
        slotVisible = false;
        updateVisibility();
    }

    void syncSlot(double left, double top, double width, double height,
            double viewportWidth, boolean requestedVisible) {
        slotVisible = false;
        if (view == null || web == null || destroyed || !isLoaded()) {
            updateVisibility();
            return;
        }
        if (!requestedVisible || !Double.isFinite(left) || !Double.isFinite(top)
                || !Double.isFinite(width) || !Double.isFinite(height)
                || !Double.isFinite(viewportWidth) || viewportWidth < 290
                || width < WIDTH_DP || height < HEIGHT_DP
                || left < 0 || top < 125 || left + width > viewportWidth + 2
                || SystemClock.elapsedRealtime() < scrollBlockUntil) {
            updateVisibility();
            return;
        }
        double scale = web.getWidth() / viewportWidth;
        if (!(scale > 0 && scale < 10)) { updateVisibility(); return; }
        int[] rootOnScreen = new int[2];
        int[] webOnScreen = new int[2];
        root.getLocationOnScreen(rootOnScreen);
        web.getLocationOnScreen(webOnScreen);
        int webLeft = webOnScreen[0] - rootOnScreen[0];
        int webTop = webOnScreen[1] - rootOnScreen[1];
        int nativeLeft = webLeft + (int)Math.round((left + (width - WIDTH_DP) / 2.0) * scale);
        int nativeTop = webTop + (int)Math.round((top + (height - HEIGHT_DP) / 2.0) * scale);
        int slotLeft = webLeft + (int)Math.round(left * scale);
        int slotTop = webTop + (int)Math.round(top * scale);
        int slotRight = webLeft + (int)Math.round((left + width) * scale);
        int slotBottom = webTop + (int)Math.round((top + height) * scale);
        int w = dp(WIDTH_DP), h = dp(HEIGHT_DP), margin = dp(3);
        boolean fits = nativeLeft >= slotLeft - margin
                && nativeTop >= slotTop - margin
                && nativeLeft + w <= slotRight + margin
                && nativeTop + h <= slotBottom + margin
                && nativeLeft >= webLeft && nativeLeft + w <= webLeft + web.getWidth()
                && nativeTop >= webTop + dp(90)
                && nativeTop + h <= webTop + web.getHeight() - dp(86);
        if (!fits) { updateVisibility(); return; }
        FrameLayout.LayoutParams params = (FrameLayout.LayoutParams)view.getLayoutParams();
        if (params == null) { updateVisibility(); return; }
        if (params.leftMargin != nativeLeft || params.topMargin != nativeTop) {
            params.leftMargin = nativeLeft;
            params.topMargin = nativeTop;
            view.setLayoutParams(params);
        }
        slotVisible = true;
        updateVisibility();
    }

    void updateVisibility() {
        if (view == null) return;
        boolean display = slotVisible && isLoaded() && !destroyed
                && canShow.getAsBoolean()
                && SystemClock.elapsedRealtime() >= scrollBlockUntil
                && !activity.isFinishing() && !activity.isDestroyed();
        view.setVisibility(display ? View.VISIBLE : View.INVISIBLE);
    }

    void removeAd() {
        handler.removeCallbacks(retry);
        loading = false;
        loaded = false;
        slotVisible = false;
        notifyJs(false);
        if (view != null) {
            try { root.removeView(view); } catch (Throwable ignored) {}
            view = null;
        }
        if (ad != null) {
            try { ad.destroy(); } catch (Throwable ignored) {}
            ad = null;
        }
        retryCount = 0;
    }

    void destroy() {
        if (destroyed) return;
        removeAd();
        destroyed = true;
    }
}
