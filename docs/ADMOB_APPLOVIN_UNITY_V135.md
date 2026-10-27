# Aracım Pro — AdMob Mediation: AppLovin + Unity Ads (v135)

## Uygulamadaki durum
- Paket: `com.aracimpro.app`
- Google Mobile Ads (Legacy): `com.google.android.gms:play-services-ads:25.5.0`
- AppLovin adapter: `com.google.ads.mediation:applovin:13.6.4.2` (önceden zaten vardı).
- Unity Ads SDK: `com.unity3d.ads:unity-ads:4.21.0` (yeni).
- Unity Ads adapter: `com.google.ads.mediation:unity:4.21.0.0` (yeni).
- AdMob uygulama kimliği ve reklam birimi kimlikleri aynı kalır.
- Banner, 300x250 MREC, geçiş ve ödüllü reklam için uygulamaya **ayrı AppLovin/Unity görüntüleme kodu eklenmez**; mevcut AdMob API'leri Mediation üzerinden kullanılır.
- Yeni uygulama sürümü: `7.11.59`, `versionCode=135`.

## Hesap panelinde yapılması şart (koddan yapılamaz)
1. [AppLovin Dashboard](https://dash.applovin.com/) hesabında bu Android uygulamasını ekle. `Account > Keys` bölümünde SDK Key (bidding) ve gerekiyorsa Report Key (waterfall optimizasyonu) değerlerini bul. Gerçek anahtarları GitHub kaynak koduna veya herkese açık dosyalara kopyalama.
2. [Unity Ads Monetization](https://cloud.unity.com/) hesabında proje/uygulama oluştur; `Google AdMob`'u mediation partner seç. Bidding placement oluştur; Game ID ve format başına Placement ID'leri not al.
3. [AdMob Mediation](https://apps.admob.com/) içinde Aracım Pro'nun **mevcut** Android reklam birimlerini uygun arabuluculuk gruplarına ekle. Geçiş (Interstitial), Ödüllü (Rewarded) ve Banner için **ayrı format grupları** kur. Ana sayfadaki 300x250 MREC'in ağ/format desteğini Ad Inspector ile ayrı doğrula; AppLovin 300x250'yi desteklemiyor.
4. Bidding > Add ad source üzerinden **AppLovin**'i seçip SDK Key ile mapping oluştur.
5. Bidding > Add ad source üzerinden **Unity Ads**'i seçip ilgili Game ID + Placement ID ile her format için mapping oluştur.
6. Alt banner için **AppLovin bidding desteklemiyor**; AppLovin waterfall yalnız 320x50 veya 728x90 banner destekliyor. Uygun 320x50 banner için istenirse waterfall + AppLovin zone ID kullan. Unity bidding banner destekler. MREC 300x250 ve App Open formatlarına destek varmış gibi varsayma; kaynağa göre ayrı doğrula.
7. AppLovin Corp. ve Unity Ads'i AdMob gizlilik/partner listelerine ekle; Avrupa GDPR/TCF/UMP ve ABD eyaletleri seçimlerini incele. Uygulama mevcut Google UMP akışını kullanır; reklam ağlarına aktarımın Ad Inspector/test ile kontrol edilmesi gerekir.
8. Yayındaki gizlilik politikası dosyasını güncelle. Bu dalda privacy-policy.html değiştirilmiştir; GitHub Pages yayını varsayılan `main` dalından yapılıyorsa ayrıca yayımlanması gerekir.
9. Kullandığın sitedeki `app-ads.txt` içine AppLovin ve Unity'nin **kendi panellerinin verdiği** gerekli satırları ekle. Satırları tahmin etme. AdMob'daki app-ads.txt denetimini kontrol et.

## Doğrulama
- Önce test cihazını AdMob'a ve sağlayıcı panellerine ekle; yayın öncesi reklam test modunu kapat.
- AdMob Ad Inspector > Single ad source test ile AppLovin (Bidding/Waterfall), Unity Ads (Bidding) kaynaklarını ayrı ayrı dene.
- Her formatın ekranda *tek reklam* göstermesini, Premium abonelikte gizlenmesini, UMP iznine uygun olmasını, banner/MREC boyutunun taşmamasını ve uygulamanın açılıp kapanmasını doğrula.
- Ekran açılışında otomatik tam ekran geçiş reklamı eklenmedi. Var olan reklam sıklığı/sahne davranışı değiştirilmedi.
- **Önemli:** SDK'ları derlemek gelir üretimini aktive etmez. Reklamlar panelde mapping + onay + app-ads.txt + test sonrası çalışabilir; doluluk veya eCPM artışı garanti değildir.

## Resmî entegrasyon rehberleri
- https://developers.google.com/admob/android/mediation/applovin
- https://developers.google.com/admob/android/mediation/unity
