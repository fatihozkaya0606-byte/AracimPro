# Ok Kaçış V31 – Oyuncu Rütbeleri

V30 oyun motoruna dokunmadan ayrı bir **kariyer ve rütbe görünümü** eklendi.

Rütbeler 12 adet: Çaylak (1–10), Çırak (11–25), Amatör (26–50), Kalfa (51–80), Becerikli (81–120), Uzman (121–170), Profesyonel (171–230), Usta (231–300), Büyük Usta (301–380), Efsane (381–460), Şampiyon (461–520), Okların Efendisi (521–540).

**Nasıl çalışır?** Rütbe, mevcut `save.highest` ile elde edilen ilerlemeden türetilir. Yeni bir kayıt sistemi, zorunlu giriş, puan veya internet gerekmez. Eski ilerleme korunur. Yeniden oynanan önceki bölüm rütbe atlattırmaz. Son bölüm tamamlandığında en üst rütbe ilerlemesi %100 olur.

**Görünüm:** Ana ekranda rütbe, bölüm seçiminde açılır rütbe listesi ve ilerleme çubuğu, seviyenin üzerinde küçük rütbe etiketi, bölüm tamamlama ekranında rütbe atlama kutlaması. Mat ahşap UI'ya uygun ve gereksiz dikey alan tüketmeyen yeni stiller.

**Değiştirilmeyenler:** 540 seviyenin 6 zorluk kademesi, 9×9 çözüm motoru ve V30 sıra tuzakları, V25 tam tahta hızlı dokunmatik sistemi, 20 can, reklam sistemi, mevcut kayıt dosyası.

**Test:** Rütbe aralıkları ve sınırları, tüm 540 seviye ve mevcut oyun regresyon testleri, debug APK doğrulama.
