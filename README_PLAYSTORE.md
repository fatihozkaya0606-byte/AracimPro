# Aracım Pro — Google Play Edition 4.1.0

Bu paket V9 kaynak kodunun Google Play'e hazırlanmış sürümüdür.

## Değişiklikler
- targetSdk / compileSdk 36
- versionCode 8, versionName 4.1.0
- Debug ve release paketleri ayrıldı
- Release AAB için güvenli signing config eklendi
- GitHub Actions'ta imzalı AAB üretim workflow'u eklendi
- Upload key / keystore dosyalarının repoya yanlışlıkla gitmesini engelleyen .gitignore eklendi
- Play Store Türkçe mağaza metni, Veri Güvenliği taslağı ve yayın kontrol listesi eklendi
- GitHub Pages üzerinden yayınlanabilecek gizlilik politikası eklendi

## Güvenlik
Upload key'i asla public GitHub reposuna koymayın. `keystore.properties`, `*.jks` ve `*.keystore` gitignore kapsamındadır.

## İlk yayın önerisi
İlk Play sürümünü reklam ve analiz SDK'sı olmadan yayımlamak inceleme ve Veri Güvenliği beyanını basitleştirir. Reklam + Pro satın alma modeli sonraki sürümde Google Play Billing ve reklam SDK'sı veri beyanlarıyla eklenebilir.

## Termux + GitHub Actions
1. AracimPro_UploadKey_PRIVATE.zip dosyasını Download'a çıkarın.
2. Proje klasöründe `bash scripts/set-github-play-secrets.sh` çalıştırın.
3. GitHub Actions > Google Play Release AAB > Run workflow çalıştırın.
4. Oluşan `AracimPro-Play-AAB` artifact içindeki AAB'yi Play Console'a yükleyin.


## V9 katalog düzeltmeleri
- Marka, model, motor, paket ve diğer seçim listeleri Türkçe A-Z sıralı.
- Passat ve Elantra dahil yaygın Türkiye modellerinde model/yıl bazlı motor ve paket seçenekleri.
- Elantra 2011-2015 için Tune, Mode, Mode Plus, Style, Style Design Pack, Prime/Prime Plus ve Elite seçenekleri.
- Passat için 1.4 TSI, 1.5 TSI, 1.6 TDI, 2.0 TDI gibi motorlar ve dönemine göre Comfortline/Highline/Trendline/Business/Impression/Elegance/R-Line seçenekleri.
- Model seçilince açık lisanslı gerçek araç fotoğrafı otomatik aranır; sonuç yoksa galeri seçimi kullanılabilir.
