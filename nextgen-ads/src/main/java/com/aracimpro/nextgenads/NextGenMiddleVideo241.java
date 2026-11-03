package com.aracimpro.nextgenads;

import android.app.Activity;
import android.graphics.Color;
import android.os.Handler;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.google.android.libraries.ads.mobile.sdk.common.LoadAdError;
import com.google.android.libraries.ads.mobile.sdk.common.VideoOptions;
import com.google.android.libraries.ads.mobile.sdk.nativead.MediaView;
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAd;
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdLoader;
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdLoaderCallback;
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdRequest;
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdView;

import java.util.List;

/**
 * Next-Gen SDK migration candidate for the existing 300x250 video-first slot.
 * Only a TRUE video creative can occupy it. Otherwise the caller retains its
 * standard MREC fallback. This is test-module code, not a production switch.
 */
public final class NextGenMiddleVideo241 {
    public interface Callback {
        void onRealVideoReady(NativeAdView view);
        void useMrecFallback(String reason);
    }

    private final Activity activity;
    private final FrameLayout host;
    private final Handler handler;
    private NativeAd activeAd;
    private NativeAdView activeView;
    private Runnable timeout;
    private int generation;
    private boolean decided;
    private boolean pending;

    public NextGenMiddleVideo241(Activity activity, FrameLayout host, Handler mainHandler) {
        this.activity = activity;
        this.host = host;
        this.handler = mainHandler;
    }

    private int px(int dp) {
        return Math.round(dp * activity.getResources().getDisplayMetrics().density);
    }

    public NativeAdView getView() { return activeView; }

    public void request(String unitId, Callback callback) {
        if (pending || activeAd != null || activity.isFinishing() || activity.isDestroyed()) return;
        final int requestGeneration = ++generation;
        decided = false;
        pending = true;
        if (unitId == null || unitId.isEmpty()) {
            fallback(requestGeneration, callback, "Missing Native video unit");
            return;
        }
        timeout = () -> fallback(requestGeneration, callback, "Video response timed out; use MREC");
        handler.postDelayed(timeout, 7000L);
        try {
            VideoOptions options = new VideoOptions.Builder().setStartMuted(true).build();
            NativeAdRequest request = new NativeAdRequest.Builder(
                    unitId, List.of(NativeAd.NativeAdType.NATIVE))
                    .setVideoOptions(options)
                    .build();
            NativeAdLoader.load(request, new NativeAdLoaderCallback() {
                @Override public void onNativeAdLoaded(NativeAd loadedAd) {
                    activity.runOnUiThread(() -> {
                        if (generation != requestGeneration || decided ||
                                activity.isFinishing() || activity.isDestroyed()) {
                            loadedAd.destroy();
                            return;
                        }
                        if (loadedAd.getMediaContent() == null ||
                                !loadedAd.getMediaContent().getHasVideoContent()) {
                            loadedAd.destroy();
                            fallback(requestGeneration, callback, "Static creative, use MREC");
                            return;
                        }
                        try {
                            NativeAdView nativeView = render(loadedAd);
                            activeView = nativeView;
                            activeAd = loadedAd;
                            decided = true;
                            pending = false;
                            cancelTimeout();
                            nativeView.setVisibility(View.INVISIBLE);
                            host.addView(nativeView, new FrameLayout.LayoutParams(
                                    px(300), px(250), Gravity.TOP | Gravity.CENTER_HORIZONTAL));
                            callback.onRealVideoReady(nativeView);
                        } catch (RuntimeException e) {
                            loadedAd.destroy();
                            fallback(requestGeneration, callback, "Native video view failed: " + e);
                        }
                    });
                }
                @Override public void onAdFailedToLoad(LoadAdError error) {
                    activity.runOnUiThread(() ->
                            fallback(requestGeneration, callback,
                                    error == null ? "No fill" : error.toString()));
                }
            });
        } catch (RuntimeException e) {
            fallback(requestGeneration, callback, "Video request failed: " + e);
        }
    }

    private NativeAdView render(NativeAd ad) {
        NativeAdView root = new NativeAdView(activity);
        root.setBackgroundColor(0xFF082840);
        LinearLayout column = new LinearLayout(activity);
        column.setOrientation(LinearLayout.VERTICAL);
        column.setPadding(px(5), px(5), px(5), px(5));
        root.addView(column, new FrameLayout.LayoutParams(-1, -1));

        TextView adDisclosure = new TextView(activity);
        adDisclosure.setText("Reklam · Video");
        adDisclosure.setTextSize(10);
        adDisclosure.setTextColor(Color.WHITE);
        column.addView(adDisclosure, new LinearLayout.LayoutParams(-1, px(22)));

        MediaView media = new MediaView(activity);
        column.addView(media, new LinearLayout.LayoutParams(-1, px(165)));

        LinearLayout footer = new LinearLayout(activity);
        footer.setGravity(Gravity.CENTER_VERTICAL);
        column.addView(footer, new LinearLayout.LayoutParams(-1, px(52)));
        TextView headline = new TextView(activity);
        headline.setText(ad.getHeadline() == null ? "" : ad.getHeadline());
        headline.setTextSize(12);
        headline.setTextColor(Color.WHITE);
        headline.setMaxLines(2);
        footer.addView(headline, new LinearLayout.LayoutParams(0, -2, 1));
        root.setHeadlineView(headline);

        String callToAction = ad.getCallToAction();
        if (callToAction != null && !callToAction.isEmpty()) {
            TextView cta = new TextView(activity);
            cta.setText(callToAction);
            cta.setTextColor(Color.WHITE);
            cta.setTextSize(10);
            cta.setPadding(px(4), px(4), px(4), px(4));
            footer.addView(cta, new LinearLayout.LayoutParams(-2, -2));
            root.setCallToActionView(cta);
        }
        // New API: register the ad and MediaView together, never setMediaContent manually.
        root.registerNativeAd(ad, media);
        return root;
    }

    private void fallback(int requestGeneration, Callback callback, String why) {
        if (generation != requestGeneration || decided) return;
        decided = true;
        pending = false;
        cancelTimeout();
        callback.useMrecFallback(why);
    }

    private void cancelTimeout() {
        if (timeout != null) handler.removeCallbacks(timeout);
        timeout = null;
    }

    public void clear() {
        ++generation;
        decided = true;
        pending = false;
        cancelTimeout();
        if (activeView != null) {
            if (activeView.getParent() instanceof ViewGroup)
                ((ViewGroup) activeView.getParent()).removeView(activeView);
            activeView = null;
        }
        if (activeAd != null) {
            activeAd.destroy();
            activeAd = null;
        }
    }
}
