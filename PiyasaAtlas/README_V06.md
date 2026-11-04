# Piyasa Atlas v0.6 – Hızlı Türkiye piyasaları ve varlık ikonları

- USD/TRY, EUR/TRY, gram altın, çeyrek/yarım/tam altın, BIST 100 ve 36 varlık için ayırt edici semboller. Altın külçesi ve sikke, BIST çizgi grafiği, döviz sembolleri.
- Ücretsiz Trunçgil Finans kaynak kontrolü yalnızca uygulama görünürken ~8 saniye. Fiyatın gerçekten 8 saniyede değişeceği iddia edilmez.
- Gold API uluslararası metal fiyatlarını yaklaşık 30 saniyede bir günceller.
- Opsiyonel Hasfiyat WebSocket: Aktif API anahtarı/aboneliği olan kullanıcı, Ayarlar ekranına key girerek gerçek fiyat değişikliği akışını açabilir.
- Key repository veya HTML'e sabit yazılmadı, Android app-private preferences'a kaydedilir; canlı WebSocket TLS ile bağlanır.
- WebSocket erişimi olmadığında ücretsiz kaynakla devam edilir. Gelen WebSocket fiyatları 35 saniyelik pencerede eski REST yanıtlarıyla ezilmez.
- Kaynak kontrol saati ile fiyatın kaynak güncelleme zamanı ayrı tutulur; BIST yeniden dağıtımı için lisans gereklidir.
- Dolar/altın için ücretsiz 5–10 saniyede güncellenme garantisi veren doğrulanmış lisanssız kaynak bulunamadı. Hasfiyat ücretli abonelikli, 5 günlük deneme seçeneği vardır.
- Sürüm 0.6.0 / versionCode 6. Aracım Pro main branch'ine dokunulmaz.
