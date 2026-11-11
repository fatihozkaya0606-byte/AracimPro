# Ok Kaçış V20: One bottom banner on every screen

**TEST-only branch; published Google Play V18 remains unchanged.**

- Only one anchored adaptive banner at the bottom of the app, outside the WebView board; zero interstitial, rewarded, and opening ads.
- **AdMob**: Google sample app and banner IDs for test preview only. Replace these with IDs registered for Ok Kaçış in live version, not those of Aracım Pro.
- **Unity Ads**: version 4.21.0.0 AdMob mediation adapter (Unity SDK 4.21.0) included in this test package. It will only return Unity ads after the Unity Game ID/Placement, AdMob banner mediation group, bidding partnership, ad mapping, age handling and ad source privacy settings are configured in the dashboards. Use test mode and ad inspector for validation.
- **Yandex Ads**: intentionally disabled. The current Google Play Families self-certified ads SDK list includes AdMob and Unity Ads, but not Yandex. Children and users of unknown age must not be shown ads from non-certified networks. Adult-only traffic needs a policy-compliant neutral age screen before enabling Yandex custom-event adapter. Yandex AdMob custom event uses `com.admob.mobileads.YandexBanner` and per-app Yandex ad unit IDs.
- Child-directed, under-age of consent and G-rated content flags applied to all ad requests in this preview. We must still verify live ad creatives and the privacy/data-safety disclosures before release.
- This preview does not monetize. A Google Play update needs real AdMob app/banner unit IDs, real Unity IDs, valid account access, app-ads.txt, privacy consent and data-safety disclosures, production signing, review, and ad policy verification.

Sources: https://developers.google.com/admob/android/mediation/unity , https://ads.yandex.com/helpcenter/en/dev/android/admob-third , https://support.google.com/googleplay/android-developer/answer/12955712 , https://support.google.com/googleplay/android-developer/answer/9893335
