# V100 – stabil arayüze dönüş

Bu sürüm V97 Neon Dashboard kod tabanını temel alır. V98 çevrimiçi kullanıcı kartı ve V99 üst menü yeniden düzenlemesi bu dala taşınmadı. Üst köşede yalnız eski `languageModal()` işlevini çağıran TR düğmesi bulunur.

- Otomatik canlı akaryakıt fiyatı yenileme ve zam bildirimleri kapalıdır.
- Canlı veri yenileme kartı ve fiyat servisi çağrıları kullanıcı arayüzünde devre dışıdır.
- Yakıt ekleme / tüketim / tahmini menzil / bakım kayıtları durur.
- Mevcut AdMob ve Premium kodu değiştirilmedi.
- Uygulama kimliği `com.aracimpro.app`, sürüm kodu 100, sürüm adı 7.11.25'tir.
- `app_presence` anonim Firestore altyapısı ve `online-presence-98.js` yeni sürüme taşınmamıştır.
- Sadece imzalı AAB olarak derlenir. Google Play'e otomatik yüklenmez.
- Kullanıcı verilerini korumak için APK uygulamayı kaldırıp yeniden kurmayın; Play üzerinden güncelleyin.
