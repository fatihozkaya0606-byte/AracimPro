# Canlı piyasa değeri sunucusu

Aracım Pro, değerleme sağlayıcısının API anahtarını APK içine gömmemek için bir sunucu/proxy URL'si bekler.

`cloudflare-worker-market-proxy.js` örneği:
1. Bir Cloudflare Worker oluşturun.
2. Kodu yapıştırın.
3. Worker secret olarak `ADM_API_KEY` tanımlayın.
4. Worker URL'sini Aracım Pro > Ayarlar > Piyasa Değeri alanına yazın.

Bu örnek yalnızca entegrasyon şablonudur; veri sağlayıcısı aboneliği/anahtarı ayrıca edinilmelidir.
