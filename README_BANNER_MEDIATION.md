# Ok Kaçış V20: One bottom banner on every screen

**TEST-only branch; published Google Play V18 remains unchanged.**

## V33 mixed-audience test integration (2026-11-22)

Play Console currently declares **6–8, 9–12, 13–15, 16–17, 18+** (5 and under is not selected).
The new test branch `ok-kacis-v33-family-triple-banner-test` keeps the V32.2 gameplay and 540-level saves while adding a *neutral birth-date selector* before the first ad request. The user can skip it; unknown age is treated as child-directed. The date is saved only locally, and may be changed in Settings (restart the app to apply new ad routing).

There is exactly **one** anchored Android native banner shared by every game screen. There are now **two separate AdMob banner unit slots**:

- **Child/unknown unit:** AdMob and certified Unity Ads only, G-rated, no personalized targeting, no Yandex mapping. Treat under-18 users conservatively as child-directed.
- **Adult-only unit:** AdMob + Unity bidding + Yandex custom-event mediation (`com.admob.mobileads.YandexBanner`). This unit must be selected only after a neutral age screen determines age 18+ and consent permits ad requests.

V33 includes the Google Mobile Ads, Unity mediation and Yandex custom-event adapter SDK dependencies, but **the test APK still uses Google's sample AdMob IDs for both slots**. Consequently Yandex cannot serve a live ad from that APK; this prevents live-ad testing violations and prevents accidental non-certified ad requests for children. The two slots MUST receive different app-specific AdMob banner IDs with separate mediation groups before a production build; configure Yandex ONLY in the adult group. Configure the Unity Game ID, bidding placement and partnership in AdMob/Unity dashboards, and add the Yandex banner ID (`R-M-...`) to the adult-only AdMob custom event JSON as `{"adUnitId":"R-M-..."}`. Disable duplicate banner refresh in ad network dashboards.

No live monetization is claimed until the 3 dashboards are configured, privacy disclosures and app-ads.txt checked, an SDK/ad-inspector test confirms that the adult unit can return Yandex while the child unit never does, and the current Play Families review requirements are met. **Do not upload this side-by-side debug APK as a Play production update.**

- Only one anchored adaptive banner at the bottom of the app, outside the WebView board; zero interstitial, rewarded, and opening ads.
- **AdMob**: Google sample app and banner IDs for test preview only. Replace these with IDs registered for Ok Kaçış in live version, not those of Aracım Pro.
- **Unity Ads**: version 4.21.0.0 AdMob mediation adapter (Unity SDK 4.21.0) included in this test package. It will only return Unity ads after the Unity Game ID/Placement, AdMob banner mediation group, bidding partnership, ad mapping, age handling and ad source privacy settings are configured in the dashboards. Use test mode and ad inspector for validation.
- **Yandex Ads**: intentionally disabled. The current Google Play Families self-certified ads SDK list includes AdMob and Unity Ads, but not Yandex. Children and users of unknown age must not be shown ads from non-certified networks. Adult-only traffic needs a policy-compliant neutral age screen before enabling Yandex custom-event adapter. Yandex AdMob custom event uses `com.admob.mobileads.YandexBanner` and per-app Yandex ad unit IDs.
- Child-directed, under-age of consent and G-rated content flags applied to all ad requests in this preview. We must still verify live ad creatives and the privacy/data-safety disclosures before release.
- This preview does not monetize. A Google Play update needs real AdMob app/banner unit IDs, real Unity IDs, valid account access, app-ads.txt, privacy consent and data-safety disclosures, production signing, review, and ad policy verification.

Sources: https://developers.google.com/admob/android/mediation/unity , https://ads.yandex.com/helpcenter/en/dev/android/admob-third , https://support.google.com/googleplay/android-developer/answer/12955712 , https://support.google.com/googleplay/android-developer/answer/9893335
