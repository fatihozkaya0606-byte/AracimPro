# V10 kontrol notları

## Test edilmesi gereken ana akışlar
1. Araç ekle: yıl → marka → model → yakıt → motor → paket → kaydet.
2. Model fotoğrafı otomatik geliyor mu; yanlış kasa ise başka fotoğraf seçilebiliyor mu.
3. Araç Rehberi: lastik, yağ, antifriz, bakım ve kronik kontrol bölümleri.
4. Piyasa Değeri: manuel referansla alt/ortalama/üst hesap ve geçmiş kaydı.
5. Akaryakıt Gündemi: şehir seç → Yenile → fiyat/haber; bildirim izni ve arka plan uyarısı.
6. Yakıt, servis, bakım, lastik, akü, kaza, belge ve rapor kayıtları.
7. Yedek al → uygulama verisini değiştir → yedekten geri yükle.
8. PDF/CSV/Excel çıktısı.

## Bilerek otomatikleştirilmeyen noktalar
- Dünyadaki bütün araçların bütün Türkiye paketlerini ücretsiz tek kaynakla eksiksiz almak mümkün değildir. Bilinen modeller yerel katalogda; diğer modeller NHTSA model listesi + güvenli genel seçeneklerle çalışır.
- Canlı ikinci el piyasa değeri için lisanslı Türkiye değerleme/ilan API'si gerekir. V10 bu API'yi backend endpoint üzerinden bağlamaya hazırdır.
- Teknik sıvı/parça verisi kesin değilse uygulama tahmin uydurmaz; VIN/kılavuz doğrulaması ister.
