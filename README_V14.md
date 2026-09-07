# Aracım Pro V14 — OtoAPI

Sürüm 5.4.0 / versionCode 15.

GitHub: Settings → Secrets and variables → Actions → New repository secret.

**Name:** `OTOAPI_KEY`

**Value:** OtoAPI panelindeki anahtar.

Anahtarı sohbete veya koda yazma. Debug APK derlemesi anahtar yoksa bilerek durur.

V14 teknik veriyi OtoAPI marka → model → yıl → varyant → detay akışından alır. Beygir, tork, 0-100, hız, tüketim, ağırlık, bagaj, depo, ölçüler, yağ/soğutma kapasitesi, motor kodu vb. sağlayıcıda bulunan alanlar otomatik doldurulur.

**Test güvenliği:** GitHub Secret repository'de görünmez, fakat test APK'sına build-time eklenen anahtar teorik olarak APK'dan çıkarılabilir. Play Store AAB öncesi bunu sunucu/proxy arkasına taşıyacağız.
