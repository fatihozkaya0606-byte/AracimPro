# Piyasa Atlas v0.8 – Fiyat sürekliliği ve grafik doğruluğu

- Gram altın, USD/TRY ve BIST 100 son doğrulanmış kaynak fiyatları cihaz yerel hafızasına saklanır. Yeniden açılışta son kayıt olarak gösterilir; yeni fiyat sanılmaz.
- API yalnızca USD veya kısmi veri sağladığında tüm yanıt reddedilmez.
- Günlük Frankfurter yedek kurundan sonra Gold API ons verisi varsa hesaplanan gram altın 'TAHMİNİ SPOT' etiketiyle gösterilir. Kaynaktan gelen gerçek fiyat bu hesapla ezilmez.
- Geçici fiyat kaybı ve kota hatalarında mevcut geçerli fiyat korunur; ekran uyarı yağmuruna tutulmaz.
- Eski hatalı grafik geçmişi yalnızca piyasa grafikleri için bir defa sıfırlanır; portföy ve alarm verileri silinmez. Gerçek en az 3 veri noktası ve 45 saniye gözlem olmadan metal / döviz grafiği çizilmez; kriptoda en az 4 nokta ve 3 saniye gerekir.
- Fiyat grafiği saatleri artık kaynağın geçmiş yayın zamanı yerine cihazın gerçek gözlem zamanıdır. Kaynak zamanı meta verisinde ayrı gösterilir.
- Yüzde değerleri Türkçe virgüllü alanlardan doğru ayrıştırılır; kaynaktan yüzde gelmiyorsa sıfır uydurulmaz.
- API veya lisans bağlantısı olmayan BIST 30, S&P 500, Nasdaq 100, Brent ve WTI kartları ana piyasa listesinden kaldırıldı; Borsa ekranında bilgi notu bulunur.
- 8 saniyelik kontrol hedefi korunur ancak API her sorguda yeni veri sağlamayabilir. Veri lisans şartları yayın öncesi doğrulanmalıdır.
- Bu test sürümü reklam içermez. Aracım Pro ana dalı değiştirilmedi.
