# Ok Kaçış V22 – Hızlı Oklar / Ahşap Son Rötuşlar

Bu sürüm V21 ahşap 3D görünümünü temel alır. 540 seviye ve 9×9 mantığı aynı kalır.

- **Gecikme düzeltmesi:** Önceki tıklama işleyicisi her hamlede 275 ms bekleyip 81 yuvanın tamamını tekrar oluşturuyordu. Artık başarılı hamle anında mantıksal olarak uygulanır, sadece ilgili ok animasyonla kaldırılır ve sayaç/kilit ikonları yerinde güncellenir.
- **Görsel:** Ok işaretlerine koyu kontur, açık beyaz yüz; hücrelere daha gerçekçi meşe damarı, gömülü oyuk; bloklara yumuşak oturma gölgesi.
- **Animasyon:** 150–160 ms kısa çıkış ve küçük dokunma tepkisi; sonraki oka basmak için animasyonun bitmesini bekleme yok.
- **Uyumluluk:** V21 test kimliği `.wood3d` korunur; test kurulumu V21'in üzerine güncellenebilir. Ana Play paketine dokunulmaz.
- **Reklam:** Sadece alt test banner (AdMob/Unity mediation), gerçek reklam birimi kullanılmaz.

Test: `node --test game-development/*.test.js` ve Android Debug APK doğrulaması.
