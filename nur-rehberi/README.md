# Nur Rehberi 0.6 - Ezan Dinle (Test APK)
Eski Nur Rehberi HTML prototipi (Kur'an, meal, hafız, namaz vakitleri, kıble, tesbih, hatim) temel alınarak v0.6 Android uygulaması oluşturuldu.

## Yeni özellik
- Ezanlar sayfası ve alt menü bağlantısı
- İki tarihî Mekke ezanı (2012, 2013)
- İki güzel ezan kaydı
- Tek dokunuşla oynat/duraklat, mini kontrol paneli
- Ezan MP3 dosyaları APK içine gömülür: **internet olmadan** ezan dinlenir.
- Kayıt kaynakları, eser sahipleri ve Creative Commons lisansları uygulamada gösterilir.
- Müezzin kimliği kesin doğrulanmayan kayıtlar bir kişiye yanlış atfedilmez.
- Android WebViewAssetLoader, yerel APK sayfasını güvenli bir HTTPS origin'den açar.

## Derleme
GitHub Actions workflow 'Nur Rehberi Ezan Test APK' indirdiği kayıtları lisanslarıyla eşleştirerek MP3 formatına dönüştürür.
Dosya app/build/outputs/apk/debug/app-debug.apk olarak üretilir.

## Önemli
Mekke ezanları tarihî kayıttır; canlı yayın değildir. Google Play için son kullanıcı cihazı testi ve üçüncü taraf Kur'an API içerik kullanım şartlarının ayrıca değerlendirilmesi gerekir.
Ezan otomatik bildirimleri ve ekran kilitliyken garantili arka plan çalma bu sürümde yoktur.
