# Aracım Pro V9 — 3.0.0

V6 üzerine tam kapsamlı araç sahipliği özellikleri eklendi.

## V9 yenilikleri
- Otomatik gerçek/orijinal araç görseli için IMAGIN.studio entegrasyonu (müşteri anahtarı kullanıcı tarafından girilir)
- Yıl → marka → model CarAPI katalog sihirbazı ve CarAPI teknik özellik aktarımı
- Gelişmiş araç profili: paket, kasa, hp, Nm, cc, çekiş, ağırlık, bagaj, 0-100, ortalama tüketim
- Araç karşılaştırma
- Yol/yakıt maliyeti hesaplayıcı
- Araç değer geçmişi ve alışa göre fark
- Akü takip sistemi
- Kaza/hasar kayıtları + fotoğraf
- KM başına toplam sahiplik maliyeti
- Akıllı durum/uyarı kartları
- Var olan yakıt, bakım, muayene/sigorta/MTV, lastik, servis, belge kasası, PDF/Excel/CSV, acil durum, widget, PIN/biyometri ve yedekleme özellikleri korunur
- Emoji ağırlıklı alt menü yerine SVG navigasyon ikonları

## Gerçek araç fotoğrafları hakkında
IMAGIN.studio CDN modeli kullanılır. Uygulama içinde Ayarlar → Araç Veri Servisleri kısmına müşteri anahtarı girildiğinde araç marka/model/yıl bilgisine göre görsel istenir. Görsel servisi ücret/lisans ve model kapsaması sağlayıcıya bağlıdır. Anahtar yoksa kullanıcı kendi araç fotoğrafını seçebilir.

## CarAPI hakkında
Katalog ve teknik veriler CarAPI üzerinden alınabilir. Ücretsiz demo veri seti sınırlı yılları kapsayabilir; tam katalog için token/abonelik gerekebilir. CarAPI ağırlıklı olarak ABD pazar verisidir; Türkiye'ye özgü bazı paket/versiyonlar elle girilebilir.

## Google Play üretim notu
Ticari API anahtarlarını APK içine sabitlemek yerine üretimde kendi backend/proxy servisinden geçirmek önerilir. V9 içindeki anahtar alanları geliştirme ve entegrasyon testi içindir.


## V9 katalog düzeltmeleri
- Marka, model, motor, paket ve diğer seçim listeleri Türkçe A-Z sıralı.
- Passat ve Elantra dahil yaygın Türkiye modellerinde model/yıl bazlı motor ve paket seçenekleri.
- Elantra 2011-2015 için Tune, Mode, Mode Plus, Style, Style Design Pack, Prime/Prime Plus ve Elite seçenekleri.
- Passat için 1.4 TSI, 1.5 TSI, 1.6 TDI, 2.0 TDI gibi motorlar ve dönemine göre Comfortline/Highline/Trendline/Business/Impression/Elegance/R-Line seçenekleri.
- Model seçilince açık lisanslı gerçek araç fotoğrafı otomatik aranır; sonuç yoksa galeri seçimi kullanılabilir.
