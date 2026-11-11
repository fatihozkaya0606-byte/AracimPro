# Ok Kaçış V25 Google Play signed AAB
**Kaynak:** `ok-kacis-v25-touch-surface` (9×9, 540 levels, transparent touch capture).
**Paket:** `com.okkacis.game` — Google Play production identifier, no debug suffix.
**Sürüm:** 4.4.0 (versionCode 26). 
**İmza:** Previous Google Play upload key secrets reused; GitHub Actions fails if missing.
**Reklam:** V25 debug sample banner IDs are not allowed in the Play release. If `OKKACIS_ADMOB_APP_ID` and `OKKACIS_ADMOB_BANNER_ID` GitHub repository secrets are both valid, enables the live bottom banner with Unity mediation library. Otherwise disables SDK startup and live ads until configured; the release still builds correctly.
**Kontroller:** 540 levels tests, Android 36, signed AAB, Play icon.
