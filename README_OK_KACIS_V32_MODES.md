# Ok Kaçış V32 — Altı Yeni Oyun Özelliği

V31 `ok-kacis-v31-player-ranks` dalından, üretim sürümünü değiştirmeyen `ok-kacis-v32-six-modes` test dalında geliştirildi.

**Uygulamanın ana bölüm sistemi korunuyor:** 9×9, 540 bölüm, 12 rütbe, altı zorluk kademe planı, V30 sıra tuzakları, V26 mat ahşap ve V25 tek parça hızlı dokunma katmanı. Orijinal `ok-kacis-v1` kayıt anahtarı ve mevcut alt banner reklam sistemi aynı.

## V32 modları
1. **👑 Patron Bölümleri:** Tamamlanan her 10. bölüm için açılan, son üç bölümün oynandığı üç aşamalı patron mücadelesi. İlk zaferde tek seferlik oyun içi altın; tekrar oynamak serbest. Seviye 540 patronu, son bölümün tamamlanmasıyla açılır.
2. **⚡ 60 Saniye Kaçış:** 60 saniye boyunca ardışık, çözülebilir tahtalardan ok çıkarılır. Toplam skor ve yerel kişisel rekor saklanır.
3. **💎 Özel Ok Koleksiyonu:** Var olan altın/metal/neon/kristal/şeker görünümleri korunur; yeni Buz (2.600 altın), Lav (2.900), Elmas (3.500) görünümleri mağazadan oyun içi altınla satın alınabilir.
4. **🧩 Bölüm Oluşturucu:** 9×9 editör, tek/iki/üç hücreli yönlü oklar, 6 renk, en fazla 14 taş, 3–12 ok, yerleştirme/kaldırma, çözüm doğrulayan DFS, en fazla 8 özel bulmaca kaydı ve oynama.
5. **🏆 Haftalık Meydan Okuma:** UTC Pazartesi başlayan sabit haftalık seed ve aynı bölüm seçimi, süreye bağlı skor, cihazdaki kişisel rekor, ilk zaferde haftalık ödül. **Gerçek oyuncular arası çevrimiçi sıralama henüz YOK**; bunun için güvenilir sunucu, giriş ve hile koruması gereklidir.
6. **🌍 Macera Haritası:** Var olan orman/çöl/buz/günbatımı/neon temalarına uygun 27×20 seviyelik durak haritası. Açılmamış bölümlere atlatmaz; açılan duraktan mevcut seviye sayfasına yönlendirir.

Kayıtlar yalnızca mevcut `save` nesnesinde ek `v32*` alanlarında saklanır. Yeni ekranın kendi şeffaf dokunma yüzeyi vardır; V25 ana tahtaya müdahale edilmemiştir.

## Test kapsamı
`node --test game-development/*.test.js`, `node --check` ana motor/ek modlar, Android debug APK derlemesi, APK arşiv bütünlüğü ve V32 dosyalarının Android assets içine gerçekten kopyalandığı kontrolü.

Uygulama arka planda canlı olmayan çevrimiçi turnuva iddiasında bulunmaz. Test APK'sı, gerçek Android telefonunda görsel ve dokunma deneyimini ayrıca doğrulamak için hazırlanır.
