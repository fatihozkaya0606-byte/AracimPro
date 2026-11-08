# Dünya Penceresi — Android test projesi v0.1

Bu proje Aracım Pro'nun ana dalına dokunmadan ayrı bir dalda geliştirilmiştir.

## Özellikler
- Android üzerinde çalışan gerçek APK uygulaması (WebView tabanlı yerel kabuk).
- Koyu temalı Keşfet / Kaynaklar / Favoriler / Bilgi ekranları.
- USGS'nin V1, V2, V3 resmi kaynaklarına güvenli harici tarayıcı yönlendirmesi.
- Çalışması ve çift platform izni doğrulanmayan kaynaklar canlı/aktif diye gösterilmez.
- İleride doğrulanmış HLS/OBS akışlarının eklenmesine uygun katalog.

## Kısıtlar
Bu test sürümünde görüntüler doğrudan uygulamanın içinde oynatılmaz; kaynak sayfası açılır.
Kamera akışlarının güncel çalışması test edilmiş değildir. YouTube yeniden yayını için yayın kaynağı
ve izin ayrıca doğrulanmalıdır. Uygulama şu anda reklam/AdMob içermemektedir.

## Derleme
GitHub Actions `Dunya Penceresi APK` iş akışından `dunya-penceresi-test-apk` artifact indirin.
Dosya: `app-debug.apk`.
