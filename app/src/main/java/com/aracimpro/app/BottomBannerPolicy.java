package com.aracimpro.app;

/** Main-thread banner recovery policy; independent of Android and the ad SDK. */
final class BottomBannerPolicy {
    static final long LOAD_TIMEOUT_MS = 120_000L;
    private static final long[] RETRY_DELAYS_MS = {30_000L, 45_000L, 120_000L, 300_000L, 600_000L};
    private volatile boolean loaded;
    private volatile boolean loading;
    private volatile boolean retryPending;
    private volatile long startedAt = -1L;
    private volatile long nextTryAt;
    private volatile int failures;

    boolean isLoaded() { return loaded; }
    boolean isLoading() { return loading; }
    boolean isRetryPending() { return retryPending; }
    int failureCount() { return failures; }
    long retryRemainingMs(long now) { return Math.max(0L, nextTryAt - now); }
    long loadAgeMs(long now) { return loading ? Math.max(0L, now - startedAt) : 0L; }

    boolean canRequest(long now) {
        return !loading && (!loaded || retryPending) && retryRemainingMs(now) == 0L;
    }

    void requestStarted(long now) {
        loading = true;
        retryPending = false;
        startedAt = now;
    }

    void adLoaded() {
        loaded = true;
        loading = false;
        retryPending = false;
        startedAt = -1L;
        nextTryAt = 0L;
        failures = 0;
    }

    long requestFailed(long now) {
        loading = false;
        retryPending = true;
        startedAt = -1L;
        long delay = Math.max(loaded ? 60_000L : 30_000L,
                RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length - 1)]);
        failures = Math.min(failures + 1, RETRY_DELAYS_MS.length);
        nextTryAt = now + delay;
        return delay;
    }

    // Only retire an unanswered FIRST load. A refresh must never destroy a
    // previously loaded creative; its rendering/refresh stays with the SDK.
    boolean initialLoadTimedOut(long now) {
        return loading && !loaded && loadAgeMs(now) >= LOAD_TIMEOUT_MS;
    }

    void viewRemoved() {
        loaded = false;
        loading = false;
        retryPending = true;
        startedAt = -1L;
        // Keep backoff across a failed/timed-out view replacement.
    }

    void reset() {
        viewRemoved();
        retryPending = false;
        nextTryAt = 0L;
        failures = 0;
    }

    static int availableWidthDp(int measuredWidthPx, int leftPx, int rightPx, float density) {
        if (measuredWidthPx <= 0 || density <= 0f || !Float.isFinite(density)) return 0;
        int safeWidth = Math.max(0, measuredWidthPx - Math.max(0, leftPx) - Math.max(0, rightPx));
        return (int) Math.floor(safeWidth / (double) density);
    }

    static int reservedHeightPx(int creativeHeightPx, int verticalGapPx) {
        return Math.max(0, creativeHeightPx) + 2 * Math.max(0, verticalGapPx);
    }
}
