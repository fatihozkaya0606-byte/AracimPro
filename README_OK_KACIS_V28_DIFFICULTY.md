# Ok Kaçış V28 – Trafik Sıkışıklığı ve Sıralama Bulmacaları

**V27 üzerine yalnızca ayrı test dalında geliştirildi. Google Play üretimi değişmedi.**

## Seviye 24–540
- 9×9 alan, 540 bölüm, V26 mat ahşap ve V25 hızlı dokunma sistemi korunur.
- Seviye 24'ten itibaren hedef ok sayısı yükseltilir; boşluklardan daha verimli yararlanılır.
- Üretici 5–6 farklı yerleşim dener; okların birbirine temasına ve karşılıklı yolları kapatmasına daha çok ağırlık verir.
- Taş sayısı kademeli büyür, her 5 seviyede bir küçük zorluk artışı yapılır.
- 🔀 Dar boğazlar: bir okun çıkabilmesi için 3–4 farklı anahtar okun önce çıkarılması gerekir.
- ⚓ Desteği koru (35 ve sonraki belirli meydan okuma seviyeleri): üstünde ⚓ bulunan bir ok, 🧷 ile işaretli ok çıkana kadar tahtada kalmalı. Yanlış sırada çıkarılırsa çıkmaz oluşabilir. Geri Al veya Yeniden ile düzeltilebilir.
- Güçlendiriciler önemli destek oklarını yanlışlıkla silmez; ipucu bu oklar yerine güvenli hamleleri tercih eder.
- İlk 30 seviyede hatalı dokunma hamle eksiltmez; bir uyarı alt panelde görünür. Aynı metnin hem toast hem panelde gösterilmesi kaldırıldı.

## Doğrulama
540 seviye ters yerleştirme çözümü ve tüm mekanik bağlantıları test edilir. Yeni test, 24–540 arasında alan yoğunluğunu, açılabilir hamle sayısını, 3–4 anahtarlı dar boğazları ve destek tuzağı geri dönüşünü kontrol eder.

Not: Zorluk artışı her 5 bölümde **iki katına çıkmaz**; böyle yapmak oyuncuların terk oranını yükseltebilir. Kademeli zorluk dalgaları kullanılır. Görsel ve dokunma davranışı son olarak Android cihazında denenmelidir.
