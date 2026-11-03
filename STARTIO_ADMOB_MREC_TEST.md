# Start.io AdMob MREC — isolated integration test (v252)

This is an **experiment branch**, not a production rollout. It is based on
`aracimpro-238-dedicated-middle-video-native` (legacy GMA SDK) because later
v242–v251 branches migrate to Google Next-Gen SDK.

## Scope / no regression

- Adds only the official Start.io Android AdMob mediation dependency
  `io.start:admob-mediation:3.1.1` to `app/build.gradle`.
- Existing AdMob banner, 300×250 MREC, Native video, app-open,
  interstitial and rewarded IDs and request flow are untouched.
- Existing Yandex, Unity, Liftoff and Mintegral dependencies are untouched.
- Start.io remains **disabled** in AdMob until test builds and smoke tests pass.

## Existing user configuration (from AdMob screenshot)

- Mediation group: `Aracim Pro - Unity MREC 300x250`
- Format: `Banner`; Android; all countries.
- MREC ad unit: `ca-app-pub-7205009121067400/3129664519`
- Existing waterfall mapping: `Startio_300x250`, Start.io app ID `209956112`.
- Existing Yandex MREC remains active; do not remove or duplicate it.
- Separate middle **Native video** unit:
  `ca-app-pub-7205009121067400/1726333916`.
  **Do not** attach a banner custom event to that Native ad unit.

## AdMob custom-event mapping to verify (DO NOT activate yet)

- Class: `io.start.mediation.admob.StartIoAdapter`
- Parameter: `{"appId":"209956112"}`
- Keep eCPM manual setting as configured unless a controlled test changes it.
- Confirm this is the banner/MREC slot, not the Native unit.

Official Android guide:
https://github.com/StartApp-SDK/android-admob-mediation

## Compatibility caveat — BLOCKER before production

The Maven Central POM for adapter **3.1.1** specifies
`com.google.android.gms:play-services-ads:[24,25)`, whereas this app's
existing dependency is **25.5.0**. We intentionally exclude the adapter's
transitive Play Services Ads artifact so the app's SDK is not changed.
**That does not establish binary or runtime compatibility.** Check with
Start.io, build and run tests before allowing requests from this adapter.

The Next-Gen Google Mobile Ads experimental branches are not covered by
this change and must be assessed separately.

## Validation checklist before enabling Start.io live

1. CI compile: `./gradlew :app:assembleDebug` (and inspect Gradle
   `debugRuntimeClasspath` for GMA/Start.io SDK conflicts).
2. Install test APK on two real devices; verify successful launch, consent
   prompt, home screen, 300×250 MREC, Native, and persistent bottom banner.
3. Open Ad Inspector and verify the Start.io custom-event adapter is
   detected, initialized and works without crashes/no-class errors.
4. Verify no extra consent popup or unsupported UMP vendor configuration;
   update privacy disclosures / app-ads.txt if needed.
5. Only after smoke tests, enable the disabled Start.io waterfall source in
   the MREC group. Observe actual fill, render and errors on test traffic.
6. Do not change the two Native ad units, or the Yandex/Unity/AdMob
   mediation lines. Rollback by disabling the Start.io line if any issue.

**No APK/AAB is claimed to be built by this file.**
