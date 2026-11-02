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
import com.google.android.gms.ads.nativead.MediaView;

import java.util.function.BooleanSupplier;

/** One real Google SDK NativeAd in a measured in-feed WebView placeholder.
 *  Native ads are refreshed after at least 60 seconds of actual on-screen time;
 *  backgrounded/hidden screens never trigger refresh requests.
 *  No fake ad text or click interception. The Android view stays inside
 *  its measured HTML slot. */
final class NativeFeedController146 {
    // Use the official Google Native Video demo only on debug; live builds use the existing Native ID.
    private static final String GOOGLE_NATIVE_TEST_UNIT = "ca-app-pub-3940256099942544/1044960115";
    private static final long REFRESH_AFTER_VISIBLE_MS = 60_000L;
    private static final int WIDTH_DP = 300;
    private static final int HEIGHT_DP = 170; // v236 compact real Native video above the separate 300x250 MREC
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
    private String lastError = "Henüz Native reklam isteği yapılmadı";
    private final Runnable retry = this::tryLoad;
    private final Runnable refresh = this::refreshIfDue;
    private long visibleSinceMs;
    private long accumulatedVisibleMs;
    private long lastLoadRequestMs;
    private boolean refreshScheduled;
    private int adLoadGeneration;
    private int refreshRequests;
    private boolean lastCreativeHadVideo;

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
    boolean isVisible() { return isLoaded() && view.getVisibility() == View.VISIBLE; }
    String getLastError() { return lastError; }

    int getRefreshRequestCount() { return refreshRequests; }
    boolean lastCreativeHadVideo() { return lastCreativeHadVideo; }

    /** Initial load. An already loaded native ad is refreshed only by the timer below. */
    void tryLoad() { loadAd(false); }

    private void loadAd(boolean refreshing) {
        if (destroyed || loading || !canLoad.getAsBoolean()) return;
        if (refreshing) {
            if (!isVisible() || !canShow.getAsBoolean()
                    || getVisibleDurationMs() < REFRESH_AFTER_VISIBLE_MS
                    || SystemClock.elapsedRealtime() - lastLoadRequestMs < REFRESH_AFTER_VISIBLE_MS) {
                scheduleRefresh();
                return;
            }
        } else if (isLoaded()) return;

        String unit = (BuildConfig.DEBUG || BuildConfig.ADMOB_TEST_MODE)
                ? GOOGLE_NATIVE_TEST_UNIT : BuildConfig.NATIVE_AD_UNIT_ID;
        if (unit == null || !unit.matches("ca-app-pub-[0-9]+/[0-9]+")) {
            lastError = "Native reklam birimi tanımsız/geçersiz";
            android.util.Log.w("AracimAdMob",
                    "native_unit_missing: Set NATIVE_AD_UNIT_ID in GitHub Actions secrets; " +
                    "only debug builds use the official Google test Native unit");
            return;
        }
        loading = true;
        lastLoadRequestMs = SystemClock.elapsedRealtime();
        final int requestGeneration = adLoadGeneration;
        if (refreshing) refreshRequests++;
        lastError = refreshing ? "Native reklam 60 saniyede yenileniyor" : "Native reklam isteği gönderildi";
        try {
            new AdLoader.Builder(activity, unit)
                .forNativeAd(newAd -> activity.runOnUiThread(() -> {
                    if (destroyed || requestGeneration != adLoadGeneration) {
                        newAd.destroy();
                        return;
                    }
                    loading = false;
                    if (!canLoad.getAsBoolean()) {
                        newAd.destroy();
                        return;
                    }
                    NativeAdView replacement = null;
                    try {
                        // Prepare replacement before destroying the displayed ad.
                        replacement = buildView(newAd);
                        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                                dp(WIDTH_DP), dp(HEIGHT_DP), Gravity.LEFT | Gravity.TOP);
                        if (view != null) {
                            FrameLayout.LayoutParams previousParams =
                                    (FrameLayout.LayoutParams) view.getLayoutParams();
                            if (previousParams != null) {
                                params.leftMargin = previousParams.leftMargin;
                                params.topMargin = previousParams.topMargin;
                            }
                        }
                        replacement.setVisibility(View.INVISIBLE);
                        root.addView(replacement, params);

                        NativeAd previousAd = ad;
                        NativeAdView previousView = view;
                        ad = newAd;
                        view = replacement;
                        loaded = true;
                        lastCreativeHadVideo = newAd.getMediaContent() != null
                                && newAd.getMediaContent().hasVideoContent();
                        lastError = lastCreativeHadVideo ? "Native VIDEO yüklendi" : "Native görsel yüklendi";
                        android.util.Log.i("AracimAdMob", "native232_media=" +
                                (lastCreativeHadVideo ? "VIDEO" : "IMAGE") + " / test=" + BuildConfig.DEBUG);
                        retryCount = 0;

                        // The newly rendered creative receives its own full visible 60s.
                        visibleSinceMs = 0L;
                        accumulatedVisibleMs = 0L;
                        cancelRefresh();
                        if (previousView != null) {
                            try { root.removeView(previousView); }
                            catch (Throwable ignored) {}
                        }
                        if (previousAd != null) {
                            try { previousAd.destroy(); }
                            catch (Throwable ignored) {}
                        }
                        notifyJs(true);
                        updateVisibility();
                        android.util.Log.i("AracimAdMob", refreshing
                                ? "native202_refreshed: replacement loaded"
                                : "native146_loaded: NativeAd received");
                    } catch (Throwable error) {
                        lastError = "Native reklam çizim hatası: " +
                                error.getClass().getSimpleName();
                        android.util.Log.e("AracimAdMob", "native202_render_error", error);
                        if (replacement != null) {
                            try { root.removeView(replacement); }
                            catch (Throwable ignored) {}
                        }
                        newAd.destroy();
                        if (isLoaded()) {
                            // Keep the earlier ad if a refresh could not be rendered.
                            scheduleRefresh();
                        } else {
                            ad = null;
                            view = null;
                            loaded = false;
                            notifyJs(false);
                            scheduleRetry();
                        }
                    }
                }))
                .withAdListener(new AdListener() {
                    @Override public void onAdFailedToLoad(LoadAdError error) {
                        activity.runOnUiThread(() -> {
                            if (destroyed || requestGeneration != adLoadGeneration) return;
                            loading = false;
                            lastError = error == null
                                ? "Native reklam yüklenemedi: bilinmeyen hata"
                                : "Native reklam yüklenemedi, kod " + error.getCode()
                                + ": " + error.getMessage();
                            android.util.Log.w("AracimAdMob",
                                    "native202_load_failed: " +
                                    (error == null ? "unknown" : error.toString()));
                            if (isLoaded()) {
                                // A failed replacement must not blank the existing ad.
                                scheduleRefresh();
                            } else {
                                notifyJs(false);
                                scheduleRetry();
                            }
                        });
                    }
                    @Override public void onAdImpression() {
                        android.util.Log.i("AracimAdMob", "native146_impression: real SDK impression");
                    }
                }).build().loadAd(new AdRequest.Builder().build());
        } catch (Throwable error) {
            loading = false;
            lastError = "Native AdLoader hatası: " + error.getClass().getSimpleName();
            android.util.Log.e("AracimAdMob", "native202_loader_error", error);
            if (isLoaded()) scheduleRefresh();
            else scheduleRetry();
        }
    }

    /** Count *visible* time, not time in background, behind a different page or off-screen. */
    private long getVisibleDurationMs() {
        long time = accumulatedVisibleMs;
        if (visibleSinceMs > 0L)
            time += SystemClock.elapsedRealtime() - visibleSinceMs;
        return time;
    }

    private void cancelRefresh() {
        handler.removeCallbacks(refresh);
        refreshScheduled = false;
    }

    private void scheduleRefresh() {
        if (destroyed || loading || !isVisible() || !canShow.getAsBoolean()
                || refreshScheduled) return;
        long visibleRemaining = REFRESH_AFTER_VISIBLE_MS - getVisibleDurationMs();
        long requestRemaining = REFRESH_AFTER_VISIBLE_MS
                - (SystemClock.elapsedRealtime() - lastLoadRequestMs);
        long delay = Math.max(1000L, Math.max(visibleRemaining, requestRemaining));
        refreshScheduled = true;
        handler.postDelayed(refresh, delay);
    }

    private void refreshIfDue() {
        refreshScheduled = false;
        if (destroyed || loading || !isVisible() || !canShow.getAsBoolean()
                || !canLoad.getAsBoolean()) return;
        if (getVisibleDurationMs() >= REFRESH_AFTER_VISIBLE_MS
                && SystemClock.elapsedRealtime() - lastLoadRequestMs >= REFRESH_AFTER_VISIBLE_MS) {
            loadAd(true);
        } else {
            scheduleRefresh();
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


    /** Compact Native ad (300x170dp), with a genuine 122x122dp MediaView.
     *  Video and image creatives are selected by Google. The old 300x250
     *  banner is a separate ad position below it, not a replacement. */
    private NativeAdView buildView(NativeAd nativeAd) {
        NativeAdView adView = new NativeAdView(activity);
        adView.setBackground(rounded(0xFF092A45, 12, 0xFF23577A));
        LinearLayout content = new LinearLayout(activity);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(7), dp(5), dp(7), dp(5));
        adView.addView(content, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout head = new LinearLayout(activity);
        head.setOrientation(LinearLayout.HORIZONTAL);
        head.setGravity(Gravity.CENTER_VERTICAL);
        head.setPadding(0, 0, dp(44), 0); // AdChoices clear area
        TextView attribution = text("Reklam", 10, Color.WHITE, true);
        attribution.setPadding(dp(5), 0, dp(5), 0);
        attribution.setBackground(rounded(0xFF246D9B, 4, 0));
        head.addView(attribution, new LinearLayout.LayoutParams(-2, dp(20)));
        TextView advertiser = text(nativeAd.getAdvertiser(), 10, 0xFFAACEE2, false);
        LinearLayout.LayoutParams advertiserLp = new LinearLayout.LayoutParams(0, dp(20), 1);
        advertiserLp.leftMargin = dp(7);
        head.addView(advertiser, advertiserLp);
        advertiser.setVisibility(nativeAd.getAdvertiser() == null ? View.GONE : View.VISIBLE);
        content.addView(head, new LinearLayout.LayoutParams(-1, dp(20)));

        LinearLayout row = new LinearLayout(activity);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams rowLp = new LinearLayout.LayoutParams(-1, dp(126));
        rowLp.topMargin = dp(3);
        content.addView(row, rowLp);

        // >=120dp in BOTH dimensions: native video creatives are eligible.
        MediaView media = new MediaView(activity);
        media.setImageScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams mediaLp = new LinearLayout.LayoutParams(dp(122), dp(122));
        mediaLp.rightMargin = dp(7);
        row.addView(media, mediaLp);
        adView.setMediaView(media);
        if (nativeAd.getMediaContent() != null) {
            media.setMediaContent(nativeAd.getMediaContent());
        }

        LinearLayout right = new LinearLayout(activity);
        right.setOrientation(LinearLayout.VERTICAL);
        right.setGravity(Gravity.CENTER_VERTICAL);
        row.addView(right, new LinearLayout.LayoutParams(0, -1, 1));

        LinearLayout identity = new LinearLayout(activity);
        identity.setOrientation(LinearLayout.HORIZONTAL);
        identity.setGravity(Gravity.CENTER_VERTICAL);
        right.addView(identity, new LinearLayout.LayoutParams(-1, -2));
        ImageView icon = new ImageView(activity);
        icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams iconLp = new LinearLayout.LayoutParams(dp(26), dp(26));
        iconLp.rightMargin = dp(4);
        identity.addView(icon, iconLp);
        if (nativeAd.getIcon() != null && nativeAd.getIcon().getDrawable() != null)
            icon.setImageDrawable(nativeAd.getIcon().getDrawable());
        else icon.setVisibility(View.GONE);

        TextView headline = text(nativeAd.getHeadline(), 12, Color.WHITE, true);
        headline.setMaxLines(2);
        headline.setEllipsize(android.text.TextUtils.TruncateAt.END);
        identity.addView(headline, new LinearLayout.LayoutParams(0, -2, 1));
        TextView description = text(nativeAd.getBody(), 10, 0xFFBCD1E0, false);
        description.setMaxLines(2);
        description.setEllipsize(android.text.TextUtils.TruncateAt.END);
        right.addView(description, new LinearLayout.LayoutParams(-1, -2));
        description.setVisibility(nativeAd.getBody() == null ? View.GONE : View.VISIBLE);

        TextView store = text(nativeAd.getStore(), 9, 0xFFB5DBEC, false);
        store.setMaxLines(1);
        store.setEllipsize(android.text.TextUtils.TruncateAt.END);
        right.addView(store, new LinearLayout.LayoutParams(-1, -2));
        store.setVisibility(nativeAd.getStore() == null ? View.GONE : View.VISIBLE);

        TextView cta = text(nativeAd.getCallToAction(), 11, Color.WHITE, true);
        cta.setGravity(Gravity.CENTER);
        cta.setBackground(rounded(0xFF177EBD, 7, 0));
        LinearLayout.LayoutParams ctaLp = new LinearLayout.LayoutParams(-1, dp(31));
        ctaLp.topMargin = dp(3);
        right.addView(cta, ctaLp);
        cta.setVisibility(nativeAd.getCallToAction() == null ? View.GONE : View.VISIBLE);

        adView.setHeadlineView(headline);
        adView.setBodyView(description);
        adView.setIconView(icon);
        adView.setAdvertiserView(advertiser);
        adView.setStoreView(store);
        adView.setCallToActionView(cta);
        adView.setNativeAd(nativeAd);
        return adView;
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
                // HTML has already checked the actual header/nav positions.
                // Do not reject a safe visible ad with a second oversized guard.
                && nativeTop >= webTop + dp(24)
                && nativeTop + h <= webTop + web.getHeight() - dp(12);
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
        if (view == null) {
            pauseRefreshClock();
            return;
        }
        boolean display = slotVisible && isLoaded() && !destroyed
                && canShow.getAsBoolean()
                && SystemClock.elapsedRealtime() >= scrollBlockUntil
                && !activity.isFinishing() && !activity.isDestroyed();
        view.setVisibility(display ? View.VISIBLE : View.INVISIBLE);
        if (display) {
            if (visibleSinceMs == 0L) visibleSinceMs = SystemClock.elapsedRealtime();
            scheduleRefresh();
        } else {
            pauseRefreshClock();
        }
    }

    private void pauseRefreshClock() {
        if (visibleSinceMs > 0L) {
            accumulatedVisibleMs += SystemClock.elapsedRealtime() - visibleSinceMs;
            visibleSinceMs = 0L;
        }
        cancelRefresh();
    }

    void removeAd() {
        handler.removeCallbacks(retry);
        pauseRefreshClock();
        accumulatedVisibleMs = 0L;
        lastLoadRequestMs = 0L;
        adLoadGeneration++;
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
