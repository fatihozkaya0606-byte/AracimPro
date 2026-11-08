# Canlı Skor+ — Android test uygulaması

## Başlangıç

Anahtarsız SportScore kaynağı kullanılır. Canlı maç, gün, arama, favoriler ve sınırlı maç detayları vardır. SportScore, API yanıtlarını 60 saniye önbellekte tutar ve yaklaşık 10.000 istek/IP/gün limiti sunar. Alt bölümde kaynak bağlantısı gösterilir.

BSD API'yi kullanmak için uygulama **Ayarlar** menüsünden `sports.bzzoiro.com` API anahtarı girilir. BSD canlı skoru yaklaşık 30 saniyede bir yenilenir; ücretsiz limit 7.500 istek/gündür. Anahtar uygulamanın içinde varsayılan olarak bulunmaz; test için yalnızca girilen cihazda saklanır. Halka açık sürüme geçmeden önce API anahtarını **kendi backend'ine taşı**. Aynı anahtarı çok sayıda istemciye dağıtmayın.

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

## v0.4 — Maçkolik tarzı liste ve canlı veri düzeltmeleri
- Lig başlıkları maç yokken de gösterilir, ilk 9 lig önceliklidir.
- Kompakt maç satırı: saat/dakika | ev sahibi | skor | deplasman | favori.
- Lig adları ayrı BSD `/api/v2/leagues/` çağrısından alınır ve league_id ile eşleştirilir.
- Canlı maçlar bağımsız BSD `/api/v2/events/live/` uç noktasından çekilir.
- Canlı maçlar ekrandayken 15 saniyede bir sorgu; arka planda otomatik sorgu yok.
- Türkiye saatine göre günün maçları gösterilir, tarihi etkileyen UTC sınırları ele alınır.
- BSD hesabı anahtarı APK ve GitHub'a eklenmemiştir; kullanıcı yalnızca kendi cihazında Ayarlar üzerinden girer.
- Test yapılacak noktalar: gerçek cihazda BSD API yanıtları, lig kapsama ve skor gecikmesi.

## v0.5 — 3D canlı skor ekranı ve geniş istatistikler
- Kompakt lig ve maç satırları korunur; 3D derinlikli tasarım uygulanır.
- BSD kimliği mevcut takımların resmî logo görselleri yüklenir; yoksa baş harf gösterilir.
- Maç detayında İstatistikler, Maç olayları ve Kadro sekmeleri.
- Resmî BSD şemasındaki possession, shots_total, corners, xg gibi alanlar desteklenir.
- Canlı kontrol 15 saniyede bir; API anahtarı kodda veya APK içerisinde yoktur.

## v0.6 — Tema / Forma renkleri / Diziliş
- Açık/koyu tema (üstteki ikon ve Ayarlar), seçilen tema kalıcıdır.
- Maç skor kutularında kırmızı çerçeve yerine nötr renkler, takımların bilinen forma renklerine göre çizgiler ve isim vurguları.
- Maç detayında istatistik, olaylar, ilk 11 + yedekler ve API formasyonuyla saha dizilişi.
- Eksik ilk 11 veya diziliş uydurulmaz; şema varsa oyuncu yerleşimi yaklaşık olarak işaretlenir.
- BSD anahtarı aynı cihazda önceki kurulumdan korunur; genel GitHub koduna veya paylaşılan APK'ya gömülmez.

## v0.9 Arena Edition
- Metalik 3D yükseltilmiş maç listesi, lig başlıkları, canlı skor ve alt menü
- BSD takımlarının mevcut armalarını kullanır; veri ve skor uydurmaz
- Uygulama görünürken daha önce gözlenen maç skorunun değişiminden GOL toast gösterebilir
- Açık/koyu tema ve maç detayları korunur; arka plan push bildirimleri bu sürümde yoktur
- Özel BSD anahtarı public source'a eklenmemiştir
