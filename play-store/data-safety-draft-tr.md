# Google Play Veri Güvenliği — TASLAK

Bu belge Play Console'a kopyala-yapıştır yapılacak kesin hukuki beyan değildir; yayına göndermeden önce uygulamanın son koduyla karşılaştırılmalıdır.

## Mevcut 3.1.0 Play sürümü
- Reklam SDK'sı: Yok
- Analiz SDK'sı: Yok
- Konum izni: Yok
- Hesap oluşturma: Yok
- Araç/yakıt/bakım kayıtları: Cihazda yerel saklama
- Yedek/rapor: Kullanıcının seçtiği dosya konumuna dışa aktarma
- Biyometri: Android sistem doğrulaması; biyometrik veri uygulamaya verilmez
- Bildirimler: Cihazda yerel hatırlatma
- Ağ kullanımı: Kullanıcı gerçek araç fotoğrafı aradığında yıl + marka + model sorgusu Wikimedia Commons'a gönderilir ve seçilen görsel indirilir.

## Play Console'da özellikle doğrulanacak alanlar
1. “Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu?” sorusunda Wikimedia Commons'a giden kullanıcı tarafından girilmiş araç sorgusunun veri sınıflandırmasını Play Console'un güncel tanımlarına göre doğrulayın.
2. Verinin şifreli aktarımı: HTTPS kullanılır.
3. Hesap silme: Hesap sistemi yoktur; uygulama içindeki “Tüm Verileri Sil” cihazdaki yerel kayıtları siler.
4. Gizlilik politikası URL'si, uygulama içindeki açıklamalarla uyumlu olmalıdır.
