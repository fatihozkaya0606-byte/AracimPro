# Aracım Pro v136 — Pangle + Mintegral / AdMob Mediation

**Durum:** Android SDK adaptörleri hazır. Gerçek reklam sunumu otomatik başlamaz: reklam sağlayıcı hesapları, AdMob bidding mapping ve gizlilik yapılandırmaları ayrıca tamamlanmalıdır.

## Teknik değişiklikler
- Play paket adı: `com.aracimpro.app`
- Sürüm: `7.11.60` (`versionCode 136`)
- Ana reklam SDK'sı: Google Mobile Ads (Legacy) `25.5.0`
- Zaten mevcut: AppLovin `13.6.4.2`, Unity Ads `4.21.0.0`
- **Yeni:** Pangle `com.google.ads.mediation:pangle:8.3.0.4.0`
- **Yeni:** Mintegral `com.google.ads.mediation:mintegral:17.1.81.1`
- `settings.gradle`: Pangle ve Mintegral'in resmî Maven depoları eklendi.
- Mevcut AdMob uygulama kimliği, banner/MREC/interstitial/rewarded üniteleri, Premium reklamsız modu ve ekran yerleşimleri korunmuştur.
- Yeni native reklam alanı eklenmemiştir; native ads için ayrı arayüz/gösterim kodu gerekir.

## Yapılandırma: Pangle
1. https://www.pangleglobal.com/ → Publisher hesabı.
2. Applications → Add App → Android → Aracım Pro: `com.aracimpro.app`.
3. En az Interstitial ve Rewarded (isteğe bağlı Banner, Native) formatlarında **In-App Bidding** placement oluştur.
4. **App ID** ile her placement'ın **Ad Placement ID** bilgisini kaydet.
5. AdMob https://apps.admob.com/ → Mediation → Android için mevcut reklam birimi / uygun mediation grubu → Bidding → Add ad source → **Pangle ROW SDK** (Türkiye için Rest of World) → mapping → App ID + ilgili Ad Placement ID.
6. Bölgesel ihtiyaç varsa US ve KR için ayrı mapping yapılır. Bunlar ROW'un yerini almaz.
7. Pangle için istenen app-ads.txt satırlarını Pangle hesabından al; rastgele satır ekleme.

## Yapılandırma: Mintegral
1. https://dev.mintegral.com/ üzerinden Publisher hesabı aç.
2. **APP Setting** → App Key'i bul; **Add APP** → Android → Aracım Pro → App ID'yi not al.
3. **Placements & Units** → **Add Placement** → **Header Bidding** → reklam türü seç → oluştur.
4. Her yerleşim için **Placement ID** ve **AD Unit ID** al. `App Key` + `App ID` + `Placement ID` + `Ad Unit ID` birlikte gerekecek.
5. AdMob Mediation → uygun reklam biçiminde mevcut ad unit'ini seç → **Bidding → Add ad source → Mintegral → Add mapping** → dört bilgiyi doldur.
6. Google UMP'de **Mobvista/Mintegral**'i ilgili partner listelerine ekle.
7. Mintegral'ın verdiği app-ads.txt satırlarını kendi yayıncı web sitendeki app-ads.txt'e ekle.

## Reklam yerleşimleri
| Ekran / aksiyon | Biçim | Yapılacak |
|---|---|---|
| Ana ekran alt kısmı | Banner | Mevcut AdMob ID, mediation mapping |
| Ana ekran ortası | 300×250 MREC | Mevcut ID; Mintegral desteğini test et |
| Doğal, kullanıcı başlattığı sayfa geçişi | Interstitial | Mevcut ID, mediation mapping |
| İsteğe bağlı Excel/rapor ödülü | Rewarded | Mevcut ID, mediation mapping |
| Araç kartı gibi alanlar | Native | **Henüz yok**; ayrıca NativeAdView/NativeAd kodu gerektirir |

## Yayın öncesi kontrol
- UMP TCF/Additional Consent ve bölgesel ABD gizlilik tercihlerinin uyumlulaştırılan her reklam ağına aktarıldığını kontrol et.
- Kullanıcı Premium iken **hiçbir** reklam isteği göndermediğini, sürüş/navigasyon sırasında tam ekran reklam olmadığını doğrula.
- Google Ad Inspector → **single ad source testing** ile Pangle ROW ve Mintegral ayrı ayrı test et.
- Testlerde yalnız test reklamı kullan; canlı reklama kendin tıklama.
- Google Play **Data safety**, üçüncü taraf veri paylaşımı ve gizlilik politikası yayın sürümüyle tutarlı olmalı.
- Mevcut GitHub Pages gizlilik politikasının varsayılan main dalında yayımlanıp yayımlanmadığını kontrol et. Bu dalda değiştirilen gizlilik politikası otomatik olarak yayına alınmış sayılmaz.
- Adaptör eklenmesi ya da derlemenin başarılı olması gerçek reklam gösterimi veya daha yüksek eCPM garantisi değildir.
- app-ads.txt, Google Play geliştirici web sitesi alan adının kökünde sunulmalıdır; şu dosyanın gerçek ortamda erişilebilirliğini doğrula: `https://fatihozkaya0606-byte.github.io/app-ads.txt` (adres var kabul edilmemelidir).

## Resmî rehberler
- Google Pangle (Legacy): https://developers.google.com/admob/android/mediation/pangle
- Google Mintegral (Legacy): https://developers.google.com/admob/android/mediation/mintegral
