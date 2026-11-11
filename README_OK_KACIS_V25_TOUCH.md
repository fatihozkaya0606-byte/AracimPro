# Ok Kaçış V25 — Tam Tahta Dokunma Yüzeyi
Bu test sürümü V23/V24 ahşap 3D ok tasarımını ve 540 bölümün oyun kurallarını korur.

## Dokunma iyileştirmeleri
- Tahtanın üzerinde tamamen şeffaf ve tek parça bir dokunma yüzeyi. SVG okların küçük dokunma hedeflerine bağımlılık kaldırıldı.
- Koordinatlardan en yakın ok bulunur; küçük (~36 px) tek kareli okların parmak hedefi toleransı artırıldı.
- Geçerli hamle anında işlenir; animasyon devam ederken sonraki ok alınabilir.
- Aynı dokunmanın sentetik click ile ikinci kez işlenmesi ve boş kare cezası önlenir.
- Özel güç taşları da aynı yüzeyden tıklanır.
- Görsel 3D görünüm, ok boyutları, can/hamle/süre, alt test banner ve veri kayıt anahtarı korunur.

## Doğrulama
540 bölüm testleri, yeni touch-surface otomatik testleri ve Android APK derlemesi.
Gerçek cihaz doğrulaması gerekir; derleme başarısı ölçülmüş Android giriş gecikmesi anlamına gelmez.
