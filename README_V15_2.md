# Aracım Pro V15.2 — 5.5.2

Bu sürüm V15.1 üzerine hata düzeltme ve yayın öncesi stabilizasyon sürümüdür.

## Düzeltmeler

- Konum izni verildikten sonra bekleyen işlem otomatik devam eder.
- Yakındaki benzinlik / TÜVTÜRK / şarj / servis / lastikçi / otopark aramalarında güncel konum alınır ve harita mevcut konum çevresinden açılır.
- Telefonun Konum/GPS hizmeti kapalıysa sistem Konum Ayarları ekranını açar; uygulamaya dönünce bekleyen işlem devam eder.
- Canlı GPS hız ekranında durum mesajları ve Konum Ayarlarını Aç düğmesi eklendi.
- Açılışta yaklaşık 4.2 saniyelik Aracım Pro tanıtım ekranı eklendi: “Aracın için ne ararsan, hepsi burada.”
- GitHub test APK'ları artık aynı Play upload anahtarıyla imzalanır. Böylece V15.2'den sonraki test APK güncellemelerinde imza/paket çakışması oluşmaması hedeflenir.
- Eski ikinci otomatik build kapatıldı; push sonrası yalnız `Android Debug Build` otomatik çalışır.
- `MARKET_API_URL` BuildConfig/GitHub secret desteği eklendi. Değerleme Worker URL'si build sırasında otomatik verilebilir.
- Canlı Verileri Yenile düğmesi eklendi: teknik katalog + akaryakıt + bağlıysa piyasa değerini yeniler.

## Piyasa değeri hakkında önemli not

`otoapi.net` teknik araç kataloğudur; Türkiye ikinci el piyasa fiyatı sağlamaz. Gerçek min/ortalama/max ve emsal sayısı için ayrı lisanslı piyasa değerleme servisi gerekir. Uygulama tarafı ve `server/cloudflare-worker-market-proxy.js` hazırdır; sağlayıcı anahtarı Worker tarafında tutulmalıdır.

Önerilen Build secret:

- `MARKET_API_URL`: Cloudflare Worker/değerleme proxy URL'si (opsiyonel)

Worker secret:

- `OTOAPI_MARKET_KEY`: piyasa değerleme sağlayıcısının API anahtarı

## İlk V15.2 kurulumu

Önceki GitHub debug APK'ları her runner'da farklı debug sertifikasıyla imzalanmış olabileceğinden Android “paket çakıştı / uygulama yüklenemedi” diyebilir. Bu nedenle V15.2'ye geçişte **bir kez** eski test sürümünü kaldırmak gerekebilir. Önemli veriler varsa önce Ayarlar → Yedek Al kullanın. V15.2'den sonra GitHub test build'i sabit imza kullanır.
