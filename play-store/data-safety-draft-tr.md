# Google Play Veri Güvenliği — V15 TASLAK

Kesin hukuki beyan değildir; Play Console'a göndermeden önce son uygulama ve bağlı servislerle tekrar kontrol edilmelidir.

## V15 mevcut davranış
- Reklam SDK'sı: Yok
- Analiz SDK'sı: Yok
- Konum izni: Var (yalnız uygulama kullanımdayken canlı GPS hız ve yakındaki araç noktaları için)
- Konum geçmişi: Aracım Pro tarafından kalıcı olarak saklanmaz
- Kullanıcı hesabı: Firebase Authentication üzerinden e-posta/şifre ile opsiyonel hesap oluşturma ve giriş
- Kullanıcı yorumları: Firebase Firestore üzerinde model bazlı kullanıcı içeriği; görünen ad, yorum, yıldız, kullanılan km, gerçek tüketim, artı/eksi ve teknik sorun bilgileri
- Yorum şikayeti: Firestore'a yorum kimliği, şikayet nedeni ve oturum açmış kullanıcı kimliği gönderilir
- Araç/yakıt/bakım/hasar kayıtları: varsayılan olarak cihazda yerel saklama
- Yedek/rapor: kullanıcının seçtiği dosya konumuna dışa aktarma
- Biyometri: Android sistem doğrulaması; biyometrik veri uygulamaya verilmez
- OtoAPI (otoapi.net): teknik katalog için yıl + marka + model + motor + yakıt + şanzıman gönderilebilir
- NHTSA vPIC VIN: kullanıcı isterse VIN üretim yeri doğrulaması için gönderilir
- Wikimedia Commons: fotoğraf aramasında yıl + marka + model gönderilir
- Harita/nearby: Android harita uygulamasına arama sorgusu ve mevcut konum çevresi aktarılabilir
- Akaryakıt özelliği: seçilen şehir + takip edilen yakıt türü halka açık fiyat/haber kaynağına yönelik sorguda kullanılır
- Opsiyonel piyasa değeri endpoint'i: kullanıcı etkinleştirirse yıl/marka/model/motor/paket/km/yakıt/şanzıman değerleme sunucusuna gönderilebilir
- Plaka teknik katalog/fotoğraf/akaryakıt sorgularına gönderilmez

## Play Console'da ayrıca doğrula
1. ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION için uygulama içi kullanım amacını doğru beyan et.
2. Konum yalnız ön planda kullanılır; background location izni yoktur.
3. Kullanıcı hesabı açılıyorsa e-posta adresi ve kullanıcı kimliği veri güvenliği formunda doğru sınıflandırılmalıdır.
4. Kullanıcı tarafından oluşturulan içerik ve şikayet/moderasyon akışı gizlilik politikasında açıklanmalıdır.
5. Google Play üretim sürümünden önce hesap silme talebi akışı eklenmelidir.
6. Reklam veya Play Billing eklendiğinde bu taslak güncellenmelidir.
