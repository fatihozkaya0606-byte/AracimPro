# Piyasa Atlas v0.7 – Rahatsız etmeyen piyasa ekranı ve hesaplama merkezi

- Türkiye döviz/altın/BIST API erişim hataları nedeniyle tekrar tekrar çıkan mavi bildirim/toast kaldırıldı. Hata loglanır; mevcut son fiyat korunur; kaynak izin verirse sessiz geri dönüş yapılır.
- Ana sayfada büyük tanıtım kartındaki ilerleme şeridi, bağlantı durum çipleri ve teknik bağlantı mesajları kaldırıldı. Kart 168px ve dört sahne otomatik döner.
- Ana sayfa altında Çevirici, Kâr/Zarar, Yüzde Hesapla hızlı erişim butonları eklendi. Alt menüde ayrı Hesapla sekmesi eklendi.
- Alış/satış fiyatlarına göre TL dönüştürme ve TL bütçeyle alınabilecek miktar; TL birim maliyeti, miktar ve kesinti yüzdesi üzerinden kâr/zarar; eski-yeni değerden yüzde değişim.
- Veri kaynağı kapandığında uygulama tekrar eden pop-up göstermiyor. Yalnızca referans ve kaynak saati gösteriliyor; 8 saniyelik ön plan kontrolü, başarısızlıkta geri bekleme ve kripto WebSocket korunuyor.
- Günlük referans fiyatların güncel canlı Trunçgil/Hasfiyat fiyatlarını ezmesi engellendi.
- Kaynak anlık fiyat garantisi vermez. BIST yeniden dağıtımında lisanslı veri sağlayıcısı gerekir.
- Sürüm 0.7.0 / versionCode 7. Aracım Pro main branch'i değiştirilmez.
