package com.aracimpro.app;

/** Run without an Android device or live ad requests: tools/test-bottom-banner.sh. */
public final class BottomBannerPolicyTest {
    private static int checks;
    private static void check(boolean condition, String message) {
        checks++;
        if (!condition) throw new AssertionError(message);
    }

    public static void main(String[] args) {
        BottomBannerPolicy state = new BottomBannerPolicy();
        check(state.canRequest(0), "First load must be allowed");
        state.requestStarted(0);
        check(!state.canRequest(1), "Resume/layout must not duplicate an outstanding request");
        check(!state.initialLoadTimedOut(119_999), "Slow mediation must get its full timeout");
        check(state.initialLoadTimedOut(120_000), "An unanswered first load must be recoverable");
        long retry = state.requestFailed(120_000);
        state.viewRemoved();
        check(!state.isLoading() && !state.isLoaded(), "Timed-out view must release the loading lock");
        check(!state.canRequest(120_001), "Recreating a view must preserve backoff");
        check(state.canRequest(120_000 + retry), "A replacement must load when backoff expires");
        state.requestStarted(150_000);
        state.adLoaded();
        check(state.isLoaded() && !state.canRequest(999_999), "Loaded ads must use SDK auto-refresh");
        check(!state.initialLoadTimedOut(999_999), "Success must cancel first-load timeout");

        retry = state.requestFailed(200_000); // SDK auto-refresh failure
        check(state.isLoaded(), "Refresh failure must retain the previous creative");
        check(retry == 0L, "SDK auto-refresh must not schedule an extra manual request");
        check(!state.isRetryPending(), "No retry may remain after a successful load");
        check(!state.canRequest(999_999), "Resume/layout must not reload an already shown banner");
        check(!state.initialLoadTimedOut(999_999), "Timeout must not destroy a retained creative");
        check(state.failureCount() == 0, "SDK-only refresh must not increase app retry failures");

        state.viewRemoved(); // e.g. split-screen width changes
        check(state.canRequest(1_000_000), "A resized view must be able to load a matching ad");
        state.reset(); // consent withdrawn, Premium, destruction
        check(!state.isLoaded() && !state.isLoading() && !state.isRetryPending(), "Reset removes all ad state");
        long now = 0;
        for (int i = 0; i < 30; i++) {
            state.requestStarted(now);
            retry = state.requestFailed(now);
            check(retry >= 30_000 && retry <= 600_000, "No-fill must use bounded, non-aggressive backoff");
            check(!state.canRequest(now + retry - 1), "Retry must never start early");
            now += retry;
        }
        check(retry == 600_000, "Repeated no-fill settles at ten minutes");

        check(BottomBannerPolicy.availableWidthDp(0, 0, 0, 3f) == 0, "Wait for actual layout, not display width");
        check(BottomBannerPolicy.availableWidthDp(1080, 0, 0, 3f) == 360, "360dp phone");
        check(BottomBannerPolicy.availableWidthDp(720, 0, 0, 2f) == 360, "Different physical resolution, same logical width");
        check(BottomBannerPolicy.availableWidthDp(1080, 72, 72, 3f) == 312, "Cutout safe areas must be subtracted");
        check(BottomBannerPolicy.availableWidthDp(540, 0, 0, 3f) == 180, "Split-screen uses the app window");
        check(BottomBannerPolicy.availableWidthDp(1080, 0, 0, 2.625f) == 411, "Fractional density rounds down");
        check(BottomBannerPolicy.availableWidthDp(720, 0, 0, 0f) == 0, "Invalid density cannot produce an ad width");
        check(BottomBannerPolicy.availableWidthDp(100, 80, 80, 1f) == 0, "Insets can leave no usable width");
        for (int creative : new int[]{100, 150, 180, 270}) {
            int gap = 18;
            int reserved = BottomBannerPolicy.reservedHeightPx(creative, gap);
            check(reserved - (creative + gap) == gap, "WebView must clear both gaps around every banner height");
        }
        System.out.println("PASS: " + checks + " bottom-banner recovery and sizing checks");
    }
}
