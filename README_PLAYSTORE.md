# Aracım Pro — Google Play Edition 4.0.0

Bu paket V8 kaynak kodunun Google Play'e hazırlanmış sürümüdür.

## Değişiklikler
- targetSdk / compileSdk 36
- versionCode 8, versionName 4.0.0
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
