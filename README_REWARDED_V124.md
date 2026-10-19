# V124 – AdMob rewarded Excel report

This branch adds a **voluntary** rewarded video entry on the **Excel Raporu** Premium prompt. The current AdMob banner, MREC, app-open and interstitial units are unchanged.

- Free users can choose **Reklamı İzle · 1 Excel Raporu** after tapping `Raporlar > Excel Raporu`.
- The user earns exactly **one Excel export** only after Google's `onUserEarnedReward` callback. Closing the ad early gives no credit.
- Credits are persisted on device, consumed once by the native bridge and not interchangeable with an overall Premium subscription.
- Premium subscribers do not receive ads and retain full access to Excel exports.
- Debug builds use Google's sample rewarded unit `ca-app-pub-3940256099942544/5224354917`.
- Production uses the newly created AdMob rewarded unit `ca-app-pub-7205009121067400/7362031917`; debug builds still use Google's official sample unit.

## AdMob setup completed

The rewarded ad unit **Aracım Pro Ödüllü Excel Raporu** was created in AdMob with amount **1** and reward type **Excel Rapor Hakkı**. Its unit ID is directly configured in `app/build.gradle`.

The project still needs a **signed build and on-device test** before publishing. GitHub Actions for this branch builds a debug APK and signed Play AAB. Check whether the specific newest commit built successfully rather than relying on earlier runs.

Test sequence: open app > Reports > Excel Raporu > choose rewarded video > finish a Google test video > ensure a single Excel export is granted. If no fill is available, no reward should be issued. If cancelled early, no reward should be issued. Existing banner/MREC/interstitial ad units and subscription paywall must remain functional.

Do not repeatedly view your own live ads; use sample ads for testing.
