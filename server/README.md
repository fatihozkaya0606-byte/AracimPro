# Aracım Pro V15 — canlı piyasa değeri

Uygulama, piyasa değerleme API anahtarını APK içine koymaz. `server/cloudflare-worker-market-proxy.js` bir Cloudflare Worker üzerinde çalıştırılır.

## Kurulum

1. OtoApi.com araç değerleme API erişimi/anahtarı edinilir.
2. Cloudflare Worker oluşturulur ve `cloudflare-worker-market-proxy.js` kodu eklenir.
3. Worker secret adı **`OTOAPI_MARKET_KEY`** olacak şekilde OtoApi.com anahtarı kaydedilir.
4. Worker URL'si Aracım Pro → Ayarlar → Piyasa Değeri → **Canlı Değerleme Sunucu Uç Noktası** alanına yazılır.
5. Araç kaydedildiğinde uygulama yıl/marka/model/motor/paket/km bilgilerini Worker'a yollar; Worker sağlayıcıdaki ID'leri kademeli eşleştirip değerlemeyi yapar.

Dönen alanlar: `avg`, `min`, `max`, `quickSell`, `retailSell`, `toughSell`, `count`, `updated`, `source`.

> Not: OtoApi.com ile otoapi.net farklı servislerdir. V14/V15 teknik katalog otoapi.net kullanır; piyasa değerleme Worker'ı OtoApi.com için hazırlanmıştır. Piyasa servisi aboneliği ayrıca gerekir.
