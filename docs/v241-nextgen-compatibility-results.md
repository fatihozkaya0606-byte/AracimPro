# Aracım Pro: Google Play üç öneri — v241 uyumluluk çalışması

Tarih: 3 Kasım 2026

## Güvenlik kuralı
Bu çalışma **yalnızca test dalında** yapılır. Üretimde kullanılan AdMob, Yandex, Unity Ads,
Mintegral, Liftoff ve AdMost bağımlılıkları ile çalışan reklam yerleşimleri değiştirilmez.
Buradan Google Play AAB/APK paketi üretilmeyecek veya yayınlanmayacak.

## Doğrulanmış durum
1. Android 15/16 ekran kesimi / edge-to-edge: v240 dalındaki `LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS`
   Activity ve tema düzeltmeleri GitHub release derlemesinden geçti. Gerçek Android 15/16 cihazlarda
   alt banner, ekran alt boşluğu, klavye ve çentik testi yapılmadan tamamlandı sayılmayacak.
2. Eski `SHORT_EDGES` API uyarısı: v239 DEX ve R8 mapping üzerinden
   `com.google.android.gms.ads.internal.overlay.zzm$$ExternalSyntheticApiModelOutline0.s`
   olarak tanımlandı. GMA Legacy 25.5.0 güncel son Legacy sürümdür; Android temasını
   değiştirmek üçüncü taraf SDK'nın kendi kodunu kaldırmaz.
3. R8: v240 CI başarıyla tamamlandı, R8 9.4.14 denendi. R8 analyzer sonuçları
   uygulama içi optimizasyon potansiyelini gösterir; Play Console yüzdelerinin
   değişeceğinin garantisi değildir.

## Next-Gen 1.6.0 ilk derleme deneyi
- Dal: `aracimpro-241-gma-nextgen-compatibility-test`
- GitHub Actions: https://github.com/fatihozkaya0606-byte/AracimPro/actions/runs/41589999662
- Yapılan işlem: sadece CI geçici checkout'ında GMA Legacy 25.5.0 yerine
  `com.google.android.libraries.ads.mobile.sdk:ads-mobile-sdk:1.6.0` kullanıldı;
  eski `play-services-ads` ve `play-services-ads-lite` transitive modülleri
  dışlandı. Diğer reklam ağları silinmedi.
- Sonuç: **Java derleme başarısız; geçiş tamamlanmadı.**
  Derleyici `AdRequest`, `AdView`, `AdListener`, `LoadAdError`,
  `AppOpenAd`, `InterstitialAd`, `RewardedAd`, `NativeAdView`, `AdLoader`
  gibi eski uygulama API sınıflarını bulamıyor.
  `MainActivity.java`, `NativeFeedController146.java`, `MiddleVideoNative237.java`
  etkileniyor. Tek satırlık bağımlılık değiştirme çözüm değildir.
- Hata dökümü sadece rapor/derleme logudur. APK, AAB, Play yüklemesi
  ve canlı reklam isteği oluşturulmadı.

## Güvenli geçiş sırası
1. Ana uygulama SDK başlatma kodunu yeni `InitializationConfig` ile taşı,
   önce UMP iznini ve reklam yüklemeden önce başlatma sırasını koru.
2. Mevcut *alt banner* ve *300x250 MREC* reklamlarını yeni `BannerAdRequest`
   / `AdLoadCallback` ile ayrı ayrı yeniden yaz. Görüntü güvenli alanını bozma.
3. Üst Native ve orta video tercihli Native için `NativeAdLoader`,
   `NativeAdRequest` ve yeni Native görüntüleme API'lerini ayrı ayrı taşı.
   Video çıkmazsa mevcut MREC fallback davranışını sürdür.
4. App Open, geçiş ve ödüllü reklamları yeni tam ekran callback/yükleme
   API'lerine taşı; reklamların yüklendiğini sanarak boş sayfa gösterme.
5. AdMob aracılı Yandex, Unity, Mintegral, Liftoff ve AdMost adaptör
   başlangıcını ve gerçek *test reklamı* gösterimlerini kontrol et;
   özelleştirilmiş Yandex custom-event sınıflarını koru.
6. Android 15 ve 16 cihazlarda yerleşim testleri, R8 mapping, imza,
   Play Console iç test analizi ve üç uyarı kontrolü geçmeden yayınlama.

Kaynaklar:
- https://developers.google.com/admob/android/next-gen/migration
- https://developers.google.com/admob/android/next-gen/banner
- https://developers.google.com/admob/android/next-gen/native
- https://developers.google.com/admob/android/next-gen/app-open

**Bu dosya kesin çözüm veya yayın onayı değildir.**
