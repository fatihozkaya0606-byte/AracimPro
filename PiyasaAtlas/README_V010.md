# Piyasa Atlas V0.10 – Varlık ayrıntı ekranı gerçek verilerle yenilendi

- Bir varlığa dokununca eski, uygulama içi birkaç kayıttan yapılan jenerik grafik yerine yeni varlık odaklı sayfa.
- BTC/ETH/SOL ve diğer Binance kripto varlıklarında Binance GET /api/v3/klines API gerçek OHLC mumları; 1m,5m,1h,1d.
- OHLC geçmişi Android bridge üzerinden yüklenir, mum değişimi, gerçek bar aralığı, SMA10/20, hacim grafiği.
- Kriptoda 24 saat en yüksek/düşük/hacim Binance WebSocket 24h ticker h/l/q alanlarından, yoksa uygun son 24s mumlardan hesaplanır. Hacim USDT karşılığıdır.
- Altın, döviz, BIST için bugünkü Trunçgil/Gold API yanıtında geçmiş mum ve gerçek işlem hacmi yok; böylece hacim uydurulmaz. Sadece cihazda gözlenmiş gerçek fiyat örneklerinden (en az 8 zaman dilimi, fiyat farkı olmalı) türetilen OHLC gösterilir ve açıkça etiketlenir. Günlük yüksek/düşük yalnızca gözlenen fiyat aralığıdır.
- Fonlar ve profesyonel mum grafiklerinin ayrı sayfaları korunur.
- Aracım Pro main dalı değiştirilmedi; bağımsız Piyasa Atlas test dalında v0.10.0.
