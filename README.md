# Aracım Pro V8 — 3.0.0

V6 üzerine tam kapsamlı araç sahipliği özellikleri eklendi.

## V8 yenilikleri
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
Ticari API anahtarlarını APK içine sabitlemek yerine üretimde kendi backend/proxy servisinden geçirmek önerilir. V8 içindeki anahtar alanları geliştirme ve entegrasyon testi içindir.
