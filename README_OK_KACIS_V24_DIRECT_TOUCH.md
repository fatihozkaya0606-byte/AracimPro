# Ok Kaçış V24 — Doğrudan Dokunma

- V23 meşe/ceviz görünümünü, ok boyutlarını, 540 bölümü ve 9×9 motorunu korur.
- Dokunma artık `pointerdown` ile doğrudan çalışır; klavye/erişilebilirlik için `click` alternatifi korunur.
- Geçerli oku bekletmeden işler; aynı dokunmayı ikinci kez saymaz.
- Her hamlede 81 hücre ve tüm oklar yeniden çizilmez. Sadece seçilen ok animasyonla kaybolur ve sayaç/kilit durumları güncellenir.
- Kilit, taş, hamle, can, zaman ve özel güç kuralları değişmez.
- Daha maliyetli parçacık efekti sadece 5'li komboda tetiklenir.
- Alt banner örnek reklam kullanır; test APK mevcut üretim uygulamasından ayrıdır.

**Doğrulama:** Mevcut 540 bölüm birim testleri + `direct-touch.test.js` iki ardışık dokunmayı simüle eder. Gerçek Android WebView kullanıcı testi ayrıca gereklidir.
