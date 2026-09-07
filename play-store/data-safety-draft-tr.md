# Google Play Veri Güvenliği — V12 TASLAK

Kesin hukuki beyan değildir; Play Console'a göndermeden önce son uygulama ve bağlı servislerle tekrar kontrol edilmelidir.

## V12 mevcut davranış
- Reklam SDK'sı: Yok
- Analiz SDK'sı: Yok
- Konum izni: Var (yalnız uygulama kullanımdayken canlı GPS hız ve yakındaki araç noktaları için)
- Konum geçmişi: Aracım Pro tarafından kalıcı olarak saklanmaz
- Hesap oluşturma: Yok
- Araç/yakıt/bakım/hasar kayıtları: cihazda yerel saklama
- Yedek/rapor: kullanıcının seçtiği dosya konumuna dışa aktarma
- Biyometri: Android sistem doğrulaması; biyometrik veri uygulamaya verilmez
- NHTSA vPIC model kataloğu: marka + model yılı gönderilebilir
- NHTSA vPIC VIN: kullanıcı isterse VIN üretim yeri doğrulaması için gönderilir
- CarQuery/teknik veri servisi: yıl + marka + model + motor + yakıt + şanzıman gönderilebilir
- Wikimedia Commons: fotoğraf aramasında yıl + marka + model gönderilir
- Harita/nearby: Android harita uygulamasına arama sorgusu ve mevcut konum çevresi aktarılabilir
- Akaryakıt özelliği: seçilen şehir + takip edilen yakıt türü halka açık fiyat/haber kaynağına yönelik sorguda kullanılır
- Opsiyonel piyasa değeri endpoint'i: kullanıcı etkinleştirirse araç varyant bilgileri değerleme sunucusuna gönderilebilir
- Plaka teknik katalog/fotoğraf/akaryakıt sorgularına gönderilmez

## Play Console'da ayrıca doğrula
1. ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION için uygulama içi kullanım amacını doğru beyan et.
2. Konum yalnız ön planda kullanılır; background location izni yoktur.
3. VIN teknik olarak kullanıcı tarafından girilen araç tanımlayıcısıdır; bağlı servis kullanımı gizlilik politikasında açıklanmıştır.
4. Reklam veya Play Billing eklendiğinde bu taslak güncellenmelidir.
