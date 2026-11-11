# Ok Kaçış V23 • V21 Görünümüne Dönüş / Güvenli Hız Düzeltmesi

V22'de hızlı dokunma için yapılan köklü değişiklikler geri alındı.

- V21'in **orijinal ahşap tahta ve 3D ok çizimi** korunur; V22'deki değişmiş ok boyutları, hücre paleti ve konturlar yoktur.
- 275 ms bekleme **135 ms** oldu; çıkış animasyonu 125 ms ile eşleşiyor.
- Önceki güvenilir hamle sırası geri geldi: ok çıktıktan sonra sayaç ve engel durumu birlikte yenilenir. Hız uğruna görünür ok ile iç mantık farklılaşmaz.
- 9×9 / 540 bölüm, kayıtlar, güçler, test banner ve ana Google Play uygulaması korunur.
- Ayrı kurulabilir test paketine `.wood3d` suffix'i uygulanır; V21 veya V22 test kurulumunun üzerine güncellenebilir.

Kontrol: `node --test game-development/*.test.js` ve Android Debug APK üretimi.
