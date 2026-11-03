# Google Play üç öneri — v240 tanı ve yayın koşulları (3 Kasım 2026)

**Durum: Tanı/düzeltme dalı. ÜRETİME AAB/APK verilmedi.**

## 1. Android 15/16 uçtan uca ekran
- MainActivity, Android API 30+ için `LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS` ayarlar.
- `res/values-v30/styles.xml` aynı ilkeyi Activity temasında uygular.
- Mevcut `WindowCompat.setDecorFitsSystemWindows(false)`, status bar, navigation bar, display cutout ve IME WindowInsets hesaplaması, alt banner güvenli alanı korunur.
- GitHub derlemesi başarılıdır; farklı ekran kesimlerine sahip Android 15/16 cihazlarda çalışma zamanı/görsel testleri ve yeni Play uyarısı kontrolü hâlâ gereklidir.

## 2. Kullanımdan kaldırılan SHORT_EDGES
- v239 release AAB DEX içindeki `layoutInDisplayCutoutMode` alanına yazan sınıflar analiz edildi.
- `const/4 ..., #1` ile `SHORT_EDGES` yazan yöntem, R8 mapping ile `com.google.android.gms.ads.internal.overlay.zzm$$ExternalSyntheticApiModelOutline0.s` sınıfına geri çözümlenmiştir (Google Mobile Ads Legacy 25.5.0).
- Sadece uygulama teması/dekorasyonunu `ALWAYS` yapmak üçüncü taraf SDK'nın statik bytecode çağrısını kaldırmaz.
- SDK'nın kendisine tehlikeli bytecode patch/hile veya canlı reklam ağlarını silme uygulanmadı.
- GMA Next-Gen 1.6.0'a tam, çok-formatlı geçiş potansiyel çözümdür; AdMob-Yandex custom event, Unity, AdMost, Mintegral ve Liftoff için derleme + gerçek adaptör testleri zorunludur.
- Bu nedenle Google Play önerisinin kalktığı henüz doğrulanmamıştır.

## 3. R8 optimizasyonu
- v239 Google Play: %31 optimizasyon, %31 kod karartma, %48 küçültme (Play'in en az %25 eşiğinin üzerinde).
- v240 analizinde R8 9.4.14 geçici olarak denendi; derleme başarılı ve Yandex'in dört custom-event adaptör sınıfının orijinal adları korunmuş.
- Resmî R8 Configuration Analyzer (daha yeni sürüm) canlı kod için yaklaşık %49,8 optimizasyon, %49,8 karartma, %62,4 küçültme kapasitesi hesapladı; bunlar Play Console skorlarıyla doğrudan birebir karşılaştırılamaz.
- `settings.gradle` artık R8 9.4.14'ü sabitler; diğer reklam SDK'ları kaldırılmadı.
- Düşük skora etki eden kütüphane keep kuralları: Yandex mobileads `yads.**`, Mintegral `com.mbridge.**`, Unity Ads, AppMetrica, AdMost, Vungle. Kütüphane refleksiyon davranışları doğrulanmadan geniş keep kuralları silinmeyecek.

## Yayın kapısı
1. Yeni derleme + R8 mapping ve imza testinin başarıyla bitmesi.
2. Android 15 ve 16 üzerinde üst/alt çubuklar, çentik, ekran dönüşü ve 300×250, Native Video, banner konumları test edilmesi.
3. Gerçek AdMob/Yandex/Unity gösterim ve yükleme adaptörlerinin çalışması.
4. Google Play iç testinde yeni AAB için 3 önerinin yeniden kontrol edilmesi. Play Console statik analiz sonucu gelmeden önerilerin kalktığı iddia edilemez.

Bu dosya ilerleme kaydıdır; yeni paket yayınlama izni değildir.
