# Google Play Veri Güvenliği — V10 TASLAK

Kesin hukuki beyan değildir; Play Console'a göndermeden önce son uygulama ve bağlı servislerle tekrar kontrol edilmelidir.

## V10 mevcut davranış
- Reklam SDK'sı: Yok
- Analiz SDK'sı: Yok
- Konum izni: Yok
- Hesap oluşturma: Yok
- Araç/yakıt/bakım/hasar kayıtları: cihazda yerel saklama
- Yedek/rapor: kullanıcının seçtiği dosya konumuna dışa aktarma
- Biyometri: Android sistem doğrulaması; biyometrik veri uygulamaya verilmez
- Bildirimler: cihaz içi bakım hatırlatmaları + kullanıcı açarsa akaryakıt fiyat/haber kontrolü
- NHTSA vPIC: marka + model yılı gönderilebilir
- Wikimedia Commons: fotoğraf aramasında yıl + marka + model gönderilir
- Akaryakıt özelliği: seçilen şehir + takip edilen yakıt türü halka açık fiyat/haber kaynağına yönelik sorguda kullanılır
- Opsiyonel canlı piyasa endpoint'i: kullanıcı etkinleştirirse araç yılı, marka, model, motor, paket, km, yakıt ve şanzıman yapılandırılmış değerleme sunucusuna gönderilebilir
- Plaka; NHTSA, Wikimedia veya akaryakıt sorgularına gönderilmez

## Play Console'da ayrıca doğrula
1. Seçimli araç bilgilerinin Google'ın “kullanıcı verisi” sınıflarındaki güncel karşılığını kontrol et.
2. Ağ aktarımları HTTPS kullanır.
3. Hesap sistemi yoktur; uygulamadaki “Tüm Verileri Sil” yerel kayıtları siler.
4. Canlı değerleme endpoint'i etkinleştirilirse sağlayıcının gizlilik/işleme şartları beyana eklenmelidir.
5. Reklam veya Play Billing eklendiğinde bu taslak güncellenmelidir.
