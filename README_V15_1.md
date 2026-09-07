# Aracım Pro V15.1 — 5.5.1

V15.1, V15 derleme hatasını ve APK workflow tutarsızlığını düzeltir.

## Düzeltmeler
- Firebase Android SDK bağımlılıkları için AndroidX etkinleştirildi (`android.useAndroidX=true`).
- VersionCode: 17
- VersionName: 5.5.1
- Android Build ve Android Debug Build artık aynı OTOAPI/Firebase yapılandırmasını derlemeye aktarır.
- Böylece normal APK indirilse bile OtoAPI anahtarının eksik kalması engellenir.
- `actions/setup-java` v5'e güncellendi.

V15'teki kullanıcı hesabı, ortak yorumlar ve yeni araç seçim sıfırlama düzeltmeleri korunur.
