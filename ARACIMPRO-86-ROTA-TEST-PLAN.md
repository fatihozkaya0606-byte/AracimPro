# Aracım Pro 7.11.11 (versionCode 86) — Ana sayfa Rota

**Durum:** Dahili test adayı; Google Play üretime otomatik gönderim YOK.

## Özellik
- Ana sayfanın üst kısmında `🧭 Rota` arama kutusu bulunur.
- Kullanıcı varış noktasını yazıp `Rota çiz` seçtiğinde Google Haritalar yol tarifini açar.
- Başlangıç noktası harita sağlayıcısı tarafından mevcut konumdan belirlenir; konum kapalıysa harita uygulaması sorabilir.
- Ücretli harita API anahtarı, sunucu, ek Android konum izni veya cihaz içi adres kaydı gerektirmez.
- Uygulama içinde gerçek zamanlı harita/turn-by-turn motoru henüz yoktur; yol tarifi, sesli yönlendirme ve trafik bilgileri harita sağlayıcısına aittir.
- Kullanıcının mevcut araç/bakım verileri ve Start.io sisteminde bu dalda değişiklik yapılmadı.

## Telefonla test edilmesi gerekenler
- [ ] Uygulama ayarlarında `7.11.11` yazıyor mu?
- [ ] Araç kaydı olan ve olmayan kullanıcı ana sayfada `Rota` alanını görüyor mu?
- [ ] `Ankara Kızılay` yazıp `Rota çiz` dendiğinde Google Haritalar doğru hedefle açılıyor mu?
- [ ] Konum servisi kapalıyken uygulama çökmeden Maps açılıyor mu?
- [ ] Ekranda yazma/kaydırma, koyu/açık tema ve eski araç kayıtları etkilenmedi mi?
- [ ] Start.io rıza ve Premium durumu önceki sürümdeki gibi çalışıyor mu?

## Yayın notu
Bu sürüm bağımsız navigasyon motoru değildir. Google Haritalar uygulaması/servisi kullanılır.
Google Play Veri Güvenliği ve gizlilik politikası mevcut sürüm 85'teki tüm SDK'ları kapsayacak şekilde doğrulanmadan üretime yayınlanmamalıdır.
