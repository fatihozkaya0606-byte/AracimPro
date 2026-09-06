# Aracım Pro V7 — 3.0.0

V6'nın çalışan çekirdeği üzerine eklenen kapsamlı araç yönetim sürümü.

## V7 yenilikleri
- Yıl + marka + model + paket ile gerçek araç fotoğrafı arama (Wikimedia Commons)
- Fotoğraf adayları arasından seçim, lisans/kaynak bilgisi ve çevrimdışı önbellek
- Fotoğraf seçmeden kaydedilen araçta otomatik görsel arama denemesi
- Otomobil, SUV, hafif ticari, pickup, motosiklet, karavan desteği
- Gelişmiş araç profili: paket, kasa, renk, motor hacmi, beygir, tork, çekiş, 0-100, ağırlık, bagaj
- Garajdaki iki aracı teknik özelliklerle yan yana karşılaştırma
- Gerçek gider / km hesabı
- Aylık yakıt bütçesi ve yol maliyeti hesaplayıcı
- Şehir içi / uzun yol / karma yakıt kayıtları
- Araç değer geçmişi ve alış fiyatına göre değer değişimi
- Akü geçmişi, garanti ve maliyet takibi
- Kaza / hasar geçmişi
- Mevcut bakım, muayene, sigorta, kasko, MTV bildirimleri
- Lastik, servis, yolculuk, belge kasası, PDF/XLS/CSV rapor
- PIN, biyometri, karanlık tema, widget, yerel/bulut yedekleme
- Emoji ağırlıklı ana navigasyon yerine profesyonel SVG ikon sistemi

## Araç fotoğrafları hakkında
V7, lisans bilgisi olan Wikimedia Commons görsellerini arar. Bu yöntem geniş kapsama sahiptir fakat her yıl/paket için %100 birebir stüdyo fotoğrafı garantisi vermez. Kullanıcı her zaman galeriden kendi araç fotoğrafını seçebilir. Ticari üretici stüdyo görsellerinin eksiksiz kataloğu için ileride lisanslı bir otomotiv görsel sağlayıcısı bağlanabilir.

## Teknik
- minSdk 24 / targetSdk 36 / compileSdk 36
- Java 17
- WebView + native Android bridge
- INTERNET izni yalnızca araç görseli araması ve indirme için
- GitHub Actions: debug APK + release AAB (imzasız)
