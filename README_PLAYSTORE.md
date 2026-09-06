# Aracım Pro — Google Play Edition 5.0.0

## Teknik
- targetSdk / compileSdk 36
- versionCode 11, versionName 5.0.0
- Debug ve release paketleri ayrıdır
- GitHub Actions debug APK ve imzalı release AAB üretir
- Upload key / keystore repoya dahil edilmez

## İlk yayın önerisi
İlk Play sürümünde reklam ve gerçek Google Play Billing SDK'sı yoktur. Böylece ilk inceleme ve Veri Güvenliği beyanı daha basit kalır. Hesap doğrulaması ve test süreci bittikten sonra reklam + Premium ödeme ayrı bir sürümde eklenebilir.

## Ağ özellikleri
- NHTSA vPIC: marka + model yılı ile model kataloğunu genişletir.
- Wikimedia Commons: kullanıcı araç fotoğrafı aradığında yıl + marka + model sorgulanır.
- Akaryakıt gündemi: şehir bazlı halka açık fiyat kaynağı ve güncel zam/indirim haber akışı kullanır.
- Canlı piyasa değeri: yalnız kullanıcı kendi backend endpoint'ini yapılandırırsa kullanılır; gizli API anahtarı APK içinde tutulmaz.

## Release AAB
GitHub Secrets'a upload key bilgileri tanımlandıktan sonra `.github/workflows/play-release.yml` çalıştırılır. Çıktı artifact adı `AracimPro-Play-AAB` olur.
