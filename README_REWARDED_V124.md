# V124 – AdMob rewarded Excel report

This branch adds a **voluntary** rewarded video entry on the **Excel Raporu** Premium prompt. The current AdMob banner, MREC, app-open and interstitial units are unchanged.

- Free users can choose **Reklamı İzle · 1 Excel Raporu** after tapping `Raporlar > Excel Raporu`.
- The user earns exactly **one Excel export** only after Google's `onUserEarnedReward` callback. Closing the ad early gives no credit.
- Credits are persisted on device, consumed once by the native bridge and not interchangeable with an overall Premium subscription.
- Premium subscribers do not receive ads and retain full access to Excel exports.
- Debug builds use Google's sample rewarded unit `ca-app-pub-3940256099942544/5224354917`.
- Production deliberately disables the rewarded entry until a **new AdMob rewarded ad unit ID** is supplied.

## Turn on live ads

1. AdMob > Apps > Aracım Pro > Ad units > Add ad unit > **Rewarded**.
2. Name it **Aracım Pro Ödüllü Excel Raporu** and create it.
3. Supply its separate ID (format `ca-app-pub-1234567890/0987654321`) as the `REWARDED_AD_UNIT_ID` secret in the GitHub repository, or send the unit ID for integration.
4. Build a signed Play AAB from this branch after the live ID is configured.
5. Test with test ads before using real traffic. Do not click/complete production ads merely to increase impressions.

Important: no account creation, monetary reward, forced autoplay, automatic repeat, or Premium bypass is introduced.
