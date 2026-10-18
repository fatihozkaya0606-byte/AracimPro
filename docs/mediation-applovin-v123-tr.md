# Aracım Pro V123 — AdMob + AppLovin Mediation

**Durum:** Android SDK entegrasyonu hazır. AppLovin'den gerçek reklam teklifleri alınması için AdMob ve AppLovin hesaplarının panelden bağlanması gerekir; sadece SDK eklemek gelir getirmez.

## Korunanlar
- Mevcut AdMob 320x50 banner, 300x250 MREC, geçiş reklamı, App Open alanları ve reklam birimi kimlikleri değişmedi.
- Premium, Google Play abonelik doğrulaması ve UMP reklam izinleri korundu. Yeni ikinci reklam overlay'i yok.
- AppLovin bidding geçiş reklamı destekler, bidding banner desteklemez. Waterfall banner sadece 320x50 veya 728x90, 300x250 MREC desteklenmez.
- V123: versionCode 123, 7.11.47 ve com.aracimpro.app.

## Hesap kurulumu (yayıncının yapması gerekir)
1. https://dash.applovin.com hesabını aç; com.aracimpro.app uygulamasını ekle ve hesap doğrulamasını tamamla.
2. AppLovin > Account > Keys bölümünden SDK Key'i al. Bunu GitHub'da herkese açık koda ekleme; AdMob mapping bölümüne gir.
3. https://admob.google.com > Arabuluculuk / Mediation bölümüne gir, Android + Geçiş Reklamı için mediation grubu oluştur veya mevcut grubu düzenle.
4. Mevcut Aracım Pro geçiş reklam birimini gruba bağla. Teklif Verme / Bidding > Reklam Kaynağı Ekle > AppLovin, ortaklık şartlarını kabul et ve SDK Key ile eşleştirme yap.
5. AdMob Gizlilik ve Mesajlaşma > AB düzenlemeleri / ABD eyaletleri reklam iş ortağı listesine AppLovin Corp.'u ekle ve UMP izin sinyalini doğrula.
6. AppLovin'in resmi app-ads.txt satırını kendi yayıncı web alanındaki app-ads.txt içine ekle. Satır bilgisi doğrulanmadan uydurma satıcı girdisi kullanma.
7. Test cihazında AdMob Ad Inspector -> Tek reklam kaynağı testi -> AppLovin (Bidding) ile kontrol et. Canlı reklama bilinçli tıklayarak test yapma.
8. Mediation raporunda birkaç günlük gösterim, doldurma, eBGBM ve gelir verilerini izle. Gelir artışı garanti değildir.

## Teknoloji
- Mevcut Google Mobile Ads SDK 25.5.0 (Legacy) kullanılıyor.
- AppLovin mediation adapter: com.google.ads.mediation:applovin:13.6.4.2.
- UMP 4.0.0 ve Play Premium kontrolü aynı kaldı.
- AdMob tanılama çıktısına bannerSource, mrecSource ve interstitialSource eklendi.
- AppLovin hesabı ve kaynak eşlemesi yapılmadan ağı çalışıyor olarak nitelendirme.

Kaynak: https://developers.google.com/admob/android/mediation/applovin
