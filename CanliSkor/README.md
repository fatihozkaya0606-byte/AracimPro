# Canlı Skor+ — Android test uygulaması

## Başlangıç

Anahtarsız SportScore kaynağı kullanılır. Canlı maç, gün, arama, favoriler ve sınırlı maç detayları vardır. SportScore, API yanıtlarını 60 saniye önbellekte tutar ve yaklaşık 10.000 istek/IP/gün limiti sunar. Alt bölümde kaynak bağlantısı gösterilir.

BSD API'yi kullanmak için uygulama **Ayarlar** menüsünden `sports.bzzoiro.com` API anahtarı girilir. BSD canlı skoru uygulama açıkken Canlı sekmesinde 15 saniyede bir kontrol edilir; ücretsiz limit 7.500 istek/gündür. Anahtar uygulamanın içinde varsayılan olarak bulunmaz; test için yalnızca girilen cihazda saklanır. Halka açık sürüme geçmeden önce API anahtarını **kendi backend'ine taşı**. Aynı anahtarı çok sayıda istemciye dağıtmayın.

Bu bir **test prototipidir**, emülatör veya gerçek cihazda API yanıtları ve Google Play ilkeleri ayrıca test edilmelidir. Gol bildirimleri/arka plan servisleri eklenmemiştir. Sahte skor verisi bulunmaz. Kapsam veri sağlayıcısına bağlıdır.

## Derleme

Java 17, Android SDK API 35, Gradle 8.10.2 ile:

```bash
gradle assembleDebug
```

Çıktı: `app/build/outputs/apk/debug/app-debug.apk`.

## Lisans ve kaynaklar

- [BSD dokümanları](https://sports.bzzoiro.com/docs/football/)
- [BSD lisansı](https://sports.bzzoiro.com/docs/api-license/)
- [SportScore geliştirici şartları](https://sportscore.com/developers/terms/)

Takım logoları kullanılmıyor; üçüncü taraf fikri haklarını kontrol edin. Canlı sonuç verileri her zaman gecikmeli olabilir.

## v0.3 — 15 saniyelik yenileme
- Canlı sekmesi ve bugünkü canlı maçlar 15 saniyede bir kontrol edilir.
- Canlı maç yoksa 60 saniyede bir kontrol edilir, arka planda istek yapılmaz.
- BSD API anahtarı GitHub'a veya uygulama paketine gömülmez.
