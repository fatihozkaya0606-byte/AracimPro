# ironSource Ads → AdMob mediation / Aracım Pro

Base: `aracimpro-228-banner-persistence-cross-device` (`versionCode 228`, `versionName 7.11.95`).

## Implemented on this branch
- Add Google's ironSource Ads Android mediation adapter `com.google.ads.mediation:ironsource:9.7.0.0` to `app/build.gradle`.
- Add the official ironSource Android SDK Maven repository to `settings.gradle`.
- Add ironSource and OMID preservation rules for minified (R8) release builds.
- Do **not** modify `MainActivity.java`, the ad view layout, or the AdMob unit IDs.
- Keep Google Mobile Ads SDK 25.5.0, Yandex, Unity Ads, Mintegral and Liftoff adapters unchanged.
- Do **not** initialize ironSource as a separate/direct ad loader. Let AdMob mediation control all served ads.
- Leave the Play version at 228 until a release is approved. Increment `versionCode` for the *actual* Play update.

## Publisher dashboard work still required
1. Register/sign in to [ironSource Ads](https://platform.ironsrc.com/) with a business email; verify the account and complete any pending publisher approval requests. ironSource documentation says that after ad-unit activation it can send **two information-request emails**; reply to both if received.
2. Under **Ads > Apps**, add the published Android app `com.aracimpro.app` and save the **App Key**.
3. Under **Ads > Setup > Instances**, create appropriately priced **Bidding** or **Waterfall** instances for Banner, Interstitial and (if desired) Rewarded. Record their **Instance ID** values. Waterfall reporting optimization requires ironSource's corresponding API credentials; keep **Secret Key** and **Refresh Token** private, never commit them to GitHub.
4. In [AdMob](https://admob.google.com/), add **ironSource Ads** as a bidding/waterfall ad source and map each instance to the existing **Android banner**, **300×250 MREC banner** and **interstitial** mediation groups/ad units. MREC is a banner format; verify the network's instance supports the requested 300×250 size. For MREC, waterfall is explicitly supported in Google's adapter changelog.
5. Continue using the existing separate AdMob App Open unit for startup: ironSource Ads's Google mediation adapter does **not** list App Open among its supported formats.
6. Add ironSource to the privacy/consent advertising partner configuration as applicable. The app already uses Google UMP; do not bypass consent. Check all jurisdictions where ads will be shown.
7. Update the **existing** externally hosted `app-ads.txt` based on ironSource's authorized seller instructions and the account-specific **Publisher ID**. Do **not** use sample IDs or overwrite the existing AdMob/Yandex/Unity seller lines.
8. Activate ironSource test mode and verify the ironSource bidding/waterfall adapter and all four original placements via **Ad Inspector** and on a real Android device. Turn off network test mode before public launch.
9. Run debug APK and release AAB/R8 builds and smoke-test banner persistence, MREC visibility, launch, interstitial frequency, consent and fallback. Only then increment the Play version.

## Technical notes
- For Banner/Interstitial/Rewarded mediated requests, Google's adapter requires an **Activity** as load context; `MainActivity` already owns the ad loaders.
- No Publisher/Instance/API key is to be embedded into Java code for AdMob's standard network adapter: mappings are managed in the AdMob console. The GitHub branch alone does **not** prove a live ironSource fill or publisher approval.
- If Ad Inspector reports errors: `101` is usually invalid/missing AdMob network settings; `102` missing Activity; `105` unsupported banner size. Inspect the adapter-specific response diagnostics before making ad layout changes.

Sources:
- https://developers.google.com/admob/android/mediation/ironsource
- https://docs.unity.com/en-us/grow/is-ads/monetization/getting-started/create-an-account-ironsource-ads
- https://docs.unity.com/en-us/grow/programmatic/ironsource-exchange/app-ads-txt
