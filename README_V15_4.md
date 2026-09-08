# Aracım Pro V15.4 — 5.5.4 Live Data

Bu sürüm V15.3'teki kesin OtoAPI `carId` varyant sistemini korur ve canlı veri katmanını güçlendirir.

## Değişiklikler

- Akaryakıt verisi için üç katmanlı yapı:
  1. `LIVE_DATA_API_URL` ayarlıysa güvenli JSON gateway (`/fuel`)
  2. Gateway yoksa/eksikse EPDK il bazlı akaryakıt XML/SOAP servisi denenir
  3. Eksik alanlarda Petrol Ofisi şehir sayfası yalnız yedek kaynak olarak denenir
- Akaryakıt kartı kaynak, canlı/yedek durumu, son güncelleme ve veri uyarısını gösterir.
- Arka plan yakıt bildirimi de aynı V15.4 canlı veri zincirini kullanır.
- `LIVE_DATA_API_URL` GitHub Actions secret'ı debug ve release build'lere aktarılır.
- `MARKET_API_URL` ayrı verilebilir. Verilmezse `LIVE_DATA_API_URL + /market` otomatik kullanılır.
- Piyasa değeri gerçek lisanslı servis bağlanmadan uydurulmaz; min/ortalama/max için market sağlayıcı tokenı ve endpoint'i gerekir.
- Sürüm: `versionCode 20`, `versionName 5.5.4`.

## GitHub secrets

Zorunlu teknik katalog:
- `OTOAPI_KEY`

Opsiyonel topluluk:
- `FIREBASE_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_APP_ID`

Canlı veri / piyasa:
- `LIVE_DATA_API_URL` — Cloudflare Worker ana URL'si, örn. `https://aracimpro-live.<hesap>.workers.dev`
- `MARKET_API_URL` — ayrı market Worker kullanıyorsanız tam endpoint. Boşsa LIVE_DATA_API_URL üzerindeki `/market` kullanılır.

> API anahtarlarını APK içine doğrudan koymayın. Özellikle üretim Play sürümünde sağlayıcı tokenlarını Worker secret olarak saklayın.

## Cloudflare Worker

`server/cloudflare-worker-live-data-gateway.js` tek Worker'da `/fuel` ve `/market` rotalarını hazırlar.

Akaryakıt sağlayıcı örnekleri:
- `FUEL_PROVIDER=apibir` + `FUEL_API_KEY`
- `FUEL_PROVIDER=ucuzyakitbul` + `FUEL_API_KEY`

Piyasa:
- `MARKET_ENDPOINT`
- `MARKET_API_KEY` (gerekiyorsa)
- `MARKET_AUTH_HEADER` (ör. `Authorization` veya `X-Api-Key`)
- `MARKET_AUTH_PREFIX` (ör. `Bearer`)

Piyasa sağlayıcısının resmi istek/yanıt şeması farklıysa Worker'daki `marketProviderRequest()` / `normalizeMarket()` bölümü sağlayıcı dokümanına göre uyarlanmalıdır.

## Test

V15.4 Test APK'da:
1. Ayarlar → Akaryakıt Gündemi → Yenile.
2. Kaynak satırında `CANLI` veya `YEDEK` ve kaynak adı görünmeli.
3. Bir araç aç → Canlı Verileri Yenile.
4. Piyasa servisi bağlıysa min/ortalama/max güncellenir; bağlı değilse açık hata gösterilir ve sahte fiyat oluşturulmaz.
