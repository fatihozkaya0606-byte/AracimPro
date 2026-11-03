package com.aracimpro.app;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.google.android.libraries.ads.mobile.sdk.common.LoadAdError;
import com.google.android.libraries.ads.mobile.sdk.common.VideoOptions;
import com.google.android.libraries.ads.mobile.sdk.nativead.MediaView;
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAd;
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdView;
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdLoader;
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdRequest;
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdLoaderCallback;

import java.util.function.BooleanSupplier;

/**
 * v237: video-first Native ad for the EXISTING 300x250 middle slot.
 *
 * The Mobile Ads SDK owns playback, AdChoices, clicks and video controls.
 * Only actual video NativeAds are shown here. If a creative is a static
 * image, fails to load or takes too long, the existing 300x250 AdMob
 * banner is requested instead. Never simulate playback or an impression.
 *
 * A single request per eligible placement/session; no forced refresh and
 * no second ad in the same slot. This controller only positions an actual
 * NativeAdView; MainActivity already guards the HTML slot's visibility.
 */
final class MiddleVideoNative237 {
    private static final String GOOGLE_VIDEO_TEST_UNIT =
            "ca-app-pub-3940256099942544/1044960115";
    private static final long LOAD_TIMEOUT_MS = 7000L;

    private final Activity activity;
    private final FrameLayout root;
    private final Handler handler;
    private final BooleanSupplier canRequest;
    private NativeAd ad;
    private NativeAdView view;
    private boolean attempted;
    private boolean decided;
    private boolean destroyed;
    private int generation;
    private Runnable timeout;
    private String lastStatus = "Orta Native video henüz denenmedi";

    MiddleVideoNative237(Activity activity, FrameLayout root, Handler handler,
                         BooleanSupplier canRequest) {
        this.activity = activity;
        this.root = root;
        this.handler = handler;
        this.canRequest = canRequest;
    }

    private int dp(int n) {
        return Math.round(n * activity.getResources().getDisplayMetrics().density);
    }

    boolean isLoaded() { return ad != null && view != null; }
    View getView() { return view; }
    String getLastStatus() { return lastStatus; }

    String getAdapterName() {
        try {
            if (ad == null || ad.getResponseInfo() == null) return "unknown";
            String adapter = ad.getResponseInfo().getAdapterClassName();
            return adapter == null ? "unknown" : adapter;
        } catch (Throwable ignored) {
            return "unknown";
        }
    }

    void request(Runnable videoReady, Runnable useMrecFallback) {
        if (destroyed || attempted || !canRequest.getAsBoolean()) return;
        attempted = true;
        decided = false;
        final int requestGeneration = ++generation;
        final String unit = (BuildConfig.DEBUG || BuildConfig.ADMOB_TEST_MODE)
                ? GOOGLE_VIDEO_TEST_UNIT : BuildConfig.MIDDLE_VIDEO_NATIVE_AD_UNIT_ID;
        if (unit == null || !unit.matches("ca-app-pub-[0-9]+/[0-9]+")) {
            lastStatus = "Orta Native video reklam birimi geçersiz; MREC kullanılıyor";
            fallback(requestGeneration, useMrecFallback);
            return;
        }

        lastStatus = "Orta alana sessiz Native video isteniyor";
        timeout = () -> {
            if (destroyed || generation != requestGeneration || decided) return;
            lastStatus = "Native video yanıtı gecikti; MREC kullanılıyor";
            fallback(requestGeneration, useMrecFallback);
        };
        handler.postDelayed(timeout, LOAD_TIMEOUT_MS);

        try {
            VideoOptions videoOptions = new VideoOptions.Builder()
                    .setStartMuted(true).build();
            NativeAdRequest nativeRequest = new NativeAdRequest.Builder(unit,
                    java.util.Collections.singletonList(NativeAd.NativeAdType.NATIVE))
                    .setVideoOptions(videoOptions).build();
            NativeAdLoader.load(nativeRequest, new NativeAdLoaderCallback() {
                    @Override public void onNativeAdLoaded(NativeAd loadedAd) {
                        activity.runOnUiThread(() -> {
                        if (destroyed || generation != requestGeneration
                                || decided || !canRequest.getAsBoolean()) {
                            loadedAd.destroy();
                            return;
                        }
                        if (loadedAd.getMediaContent() == null
                                || !loadedAd.getMediaContent().getHasVideoContent()) {
                            loadedAd.destroy();
                            lastStatus = "Native kreatif görsel; MREC yedeğine geçildi";
                            fallback(requestGeneration, useMrecFallback);
                            return;
                        }
                        try {
                            NativeAdView adView = createVideoView(loadedAd);
                            FrameLayout.LayoutParams p = new FrameLayout.LayoutParams(
                                    dp(300), dp(250), Gravity.TOP | Gravity.LEFT);
                            adView.setVisibility(View.INVISIBLE);
                            adView.setElevation(dp(12));
                            root.addView(adView, p);
                            ad = loadedAd;
                            view = adView;
                            decided = true;
                            cancelTimeout();
                            lastStatus = "Orta 300x250: Native VIDEO hazır";
                            videoReady.run();
                        } catch (Throwable e) {
                            loadedAd.destroy();
                            lastStatus = "Native video çizim hatası: " + e.getClass().getSimpleName();
                            fallback(requestGeneration, useMrecFallback);
                        }
                        });
                    }
                    @Override public void onAdFailedToLoad(LoadAdError error) {
                            activity.runOnUiThread(() -> {
                                if (destroyed || generation != requestGeneration || decided) return;
                                lastStatus = "Native video doluluk yok ("
                                        + (error == null ? "?" : error.getCode()) + "); MREC";
                                fallback(requestGeneration, useMrecFallback);
                            });
                        }
            });
        } catch (Throwable e) {
            lastStatus = "Native video istek hatası: " + e.getClass().getSimpleName();
            fallback(requestGeneration, useMrecFallback);
        }
    }

    private void fallback(int requestGeneration, Runnable useMrecFallback) {
        if (destroyed || generation != requestGeneration || decided) return;
        decided = true;
        cancelTimeout();
        if (canRequest.getAsBoolean()) useMrecFallback.run();
    }

    private NativeAdView createVideoView(NativeAd loadedAd) {
        NativeAdView nativeView = new NativeAdView(activity);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0xFF082840);
        bg.setCornerRadius(dp(9));
        nativeView.setBackground(bg);

        LinearLayout body = new LinearLayout(activity);
        body.setOrientation(LinearLayout.VERTICAL);
        body.setPadding(dp(5), dp(4), dp(5), dp(4));
        nativeView.addView(body, new FrameLayout.LayoutParams(-1, -1));

        // Leave room on the right for the SDK-provided AdChoices overlay.
        TextView label = new TextView(activity);
        label.setText("Reklam  ·  Video");
        label.setTextColor(Color.WHITE);
        label.setTextSize(10);
        label.setPadding(dp(5), 0, 0, 0);
        label.setGravity(Gravity.CENTER_VERTICAL);
        body.addView(label, new LinearLayout.LayoutParams(-1, dp(19)));

        MediaView media = new MediaView(activity);
        // 290x162dp: large enough for the SDK's real native video content.
        body.addView(media, new LinearLayout.LayoutParams(-1, dp(162)));

        LinearLayout footer = new LinearLayout(activity);
        footer.setGravity(Gravity.CENTER_VERTICAL);
        footer.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams footerLp = new LinearLayout.LayoutParams(-1, dp(55));
        footerLp.topMargin = dp(2);
        body.addView(footer, footerLp);

        TextView headline = new TextView(activity);
        headline.setText(loadedAd.getHeadline() == null ? "" : loadedAd.getHeadline());
        headline.setTextSize(12);
        headline.setTextColor(Color.WHITE);
        headline.setTypeface(null, android.graphics.Typeface.BOLD);
        headline.setMaxLines(2);
        headline.setEllipsize(android.text.TextUtils.TruncateAt.END);
        footer.addView(headline, new LinearLayout.LayoutParams(0, -2, 1));
        nativeView.setHeadlineView(headline);

        if (loadedAd.getCallToAction() != null) {
            TextView cta = new TextView(activity);
            cta.setText(loadedAd.getCallToAction());
            cta.setTextSize(10);
            cta.setTextColor(Color.WHITE);
            cta.setGravity(Gravity.CENTER);
            cta.setPadding(dp(6), 0, dp(6), 0);
            GradientDrawable ctaBg = new GradientDrawable();
            ctaBg.setColor(0xFF1982BD);
            ctaBg.setCornerRadius(dp(6));
            cta.setBackground(ctaBg);
            LinearLayout.LayoutParams ctaLp = new LinearLayout.LayoutParams(
                    -2, dp(31));
            ctaLp.leftMargin = dp(5);
            footer.addView(cta, ctaLp);
            nativeView.setCallToActionView(cta);
        }

        nativeView.registerNativeAd(loadedAd, media);
        return nativeView;
    }

    private void cancelTimeout() {
        if (timeout != null) handler.removeCallbacks(timeout);
        timeout = null;
    }

    /** Called on Premium entitlement change; allows a later legitimate reload. */
    void clear() {
        generation++;
        cancelTimeout();
        if (view != null) {
            try { root.removeView(view); } catch (Throwable ignored) {}
        }
        if (ad != null) {
            try { ad.destroy(); } catch (Throwable ignored) {}
        }
        view = null;
        ad = null;
        attempted = false;
        decided = false;
        lastStatus = "Orta Native video temizlendi";
    }

    void destroy() {
        clear();
        destroyed = true;
    }
}
