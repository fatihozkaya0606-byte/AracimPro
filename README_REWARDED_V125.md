# V125: optional rewarded video on Aracımı Ekle

The AdMob rewarded unit remains `ca-app-pub-7205009121067400/7362031917` in **release**; debug APK shows Google's **test ad**. Existing banner, MREC, app-open, and interstitial units are retained.

### User experience

1. Tap **Aracımı Ekle**. A clearly voluntary offer appears inside the *new vehicle* form: `Reklam İzle · 1 Excel Raporu`. The user can ignore it and add the vehicle for free.
2. If the user opts in and completes a rewarded ad, Android records one one-use Excel export credit. The form stays open with existing fields intact and a confirmation toast appears.
3. The user saves their car normally, then uses the credit in **Raporlar → Excel Raporu**. Premium members see no rewarded button and retain their subscription features.
4. If ad isn't available, display an explanatory message without delaying or blocking vehicle entry. Closing the ad early earns no reward.
5. A 3-minute cooldown prevents an automatic full-screen interstitial from stacking immediately after rewarded video, including after saving a car.

The old rewarded video button inside the Excel Premium prompt was removed, so the rewarded **placement** is now Aracımı Ekle; redeeming the earned credit still happens through the Excel report action. All changes are on the isolated V125 branch, not live Google Play.
