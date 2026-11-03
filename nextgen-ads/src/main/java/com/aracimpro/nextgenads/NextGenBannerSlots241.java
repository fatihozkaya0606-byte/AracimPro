package com.aracimpro.nextgenads;

import android.app.Activity;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.google.android.libraries.ads.mobile.sdk.banner.AdSize;
import com.google.android.libraries.ads.mobile.sdk.banner.AdView;
import com.google.android.libraries.ads.mobile.sdk.banner.BannerAd;
import com.google.android.libraries.ads.mobile.sdk.banner.BannerAdRequest;
import com.google.android.libraries.ads.mobile.sdk.common.AdLoadCallback;
import com.google.android.libraries.ads.mobile.sdk.common.LoadAdError;

/**
 * v241 isolated Next-Gen migration candidate. NOT wired to production.
 *
 * Can create either the bottom adaptive banner or the middle 300x250 MREC.
 * Requests are supplied with externally chosen test IDs and only after
 * the app has initialized the SDK and obtained UMP permission.
 * Never issue overlapping requests for the same placement.
 */
public final class NextGenBannerSlots241 {
    public interface Callback {
        void onLoaded(boolean mediumRectangle, int actualHeightPx);
        void onFailed(boolean mediumRectangle, String description);
    }

    private final Activity activity;
    private final FrameLayout host;
    private final boolean mediumRectangle;
    private AdView adView;
    private int generation;
    private boolean loaded;

    public NextGenBannerSlots241(Activity activity, FrameLayout host,
                                  boolean mediumRectangle) {
        this.activity = activity;
        this.host = host;
        this.mediumRectangle = mediumRectangle;
    }

    public boolean isLoaded() {
        return loaded && adView != null;
    }

    public AdView getAdView() {
        return adView;
    }

    public void request(String adUnitId, int measuredAvailableWidthDp,
                        Callback callback) {
        // A valid, measured slot is essential; never reserve an ad outside
        // the available screen width or make a request before consent.
        if (activity.isFinishing() || activity.isDestroyed()) return;
        if (adUnitId == null || adUnitId.isEmpty()
                || measuredAvailableWidthDp < (mediumRectangle ? 300 : 320)) {
            callback.onFailed(mediumRectangle, "Invalid ad unit or insufficient visible width");
            return;
        }
        clear();
        final int requestGeneration = generation;
        final AdSize adSize = mediumRectangle
                ? AdSize.MEDIUM_RECTANGLE
                : AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(
                        activity, measuredAvailableWidthDp);
        final AdView current = new AdView(activity);
        adView = current;
        loaded = false;
        int densityHeight = adSize.getHeightInPixels(activity);
        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(
                mediumRectangle ? px(300) : ViewGroup.LayoutParams.WRAP_CONTENT,
                mediumRectangle ? px(250) : ViewGroup.LayoutParams.WRAP_CONTENT,
                mediumRectangle ? Gravity.TOP | Gravity.CENTER_HORIZONTAL
                                : Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
        host.addView(current, layoutParams);
        current.setVisibility(View.INVISIBLE);

        try {
            final BannerAdRequest request =
                    new BannerAdRequest.Builder(adUnitId, adSize).build();
            current.loadAd(request, new AdLoadCallback<BannerAd>() {
                @Override public void onAdLoaded(BannerAd ad) {
                    if (requestGeneration != generation || current != adView) return;
                    loaded = true;
                    current.setVisibility(View.VISIBLE);
                    callback.onLoaded(mediumRectangle, ad.getAdSize().getHeightInPixels(activity));
                }
                @Override public void onAdFailedToLoad(LoadAdError error) {
                    if (requestGeneration != generation || current != adView) return;
                    // On initial load error, do not keep a blank 300x250 card.
                    if (!loaded) current.setVisibility(View.INVISIBLE);
                    callback.onFailed(mediumRectangle,
                            error == null ? "No fill" : error.toString());
                }
            });
        } catch (RuntimeException exception) {
            current.setVisibility(View.INVISIBLE);
            callback.onFailed(mediumRectangle, exception.toString());
        }
    }

    private int px(int dp) {
        return Math.round(dp * activity.getResources().getDisplayMetrics().density);
    }

    /** Remove a placement on premium/consent change or Activity destruction. */
    public void clear() {
        generation++;
        loaded = false;
        AdView current = adView;
        adView = null;
        if (current != null) {
            if (current.getParent() instanceof ViewGroup) {
                ((ViewGroup) current.getParent()).removeView(current);
            }
            current.destroy();
        }
    }
}
