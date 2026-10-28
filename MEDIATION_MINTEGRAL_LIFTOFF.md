# Aracım Pro v7.11.68 (versionCode 144) — AdMob Mediation

## Uygulamadaki durum

- Ana SDK: Google Mobile Ads (AdMob) 25.5.0.
- Mevcut Unity Ads adapter: `com.google.ads.mediation:unity:4.21.0.0` — korunur.
- Yeni Mintegral adapter: `com.google.ads.mediation:mintegral:17.1.81.1`.
- Yeni Liftoff Monetize (eski adıyla Vungle) adapter: `com.google.ads.mediation:vungle:7.7.9.0`.
- Mintegral SDK Maven deposu `settings.gradle` içinde bulunur.
- Mevcut gerçek AdMob reklam birim kimlikleri değişmedi. Ek bir tam ekran reklam yaratılmaz.
- **Bu, teknik SDK entegrasyonudur. Hesap onayı ve AdMob mapping yapılmadan yeni ağlardan reklam gelmez.** Başka hesapların yetkileri veya panelleri GitHub üzerinden otomatik yapılandırılamaz.

## Mevcut AdMob birimleri (gerçek sürüm)

| Biçim | AdMob birimi | Reklam ağı eşleştirmesi |
| --- | --- | --- |
| App Open (açılış) | `ca-app-pub-7205009121067400/2505091369` | Mintegral + Liftoff (desteklenir) |
| Alt banner | `ca-app-pub-7205009121067400/9497290996` | Unity + Mintegral + Liftoff |
| Orta MREC 300x250 | `ca-app-pub-7205009121067400/3129664519` | Unity + Mintegral + Liftoff; uygun boyuta sahip placement gerekir |
| Geçiş (interstitial) | `ca-app-pub-7205009121067400/2790024214` | Unity + Mintegral + Liftoff |
| Ödüllü | `ca-app-pub-7205009121067400/7362031917` | Unity + Mintegral + Liftoff |

## Yayına almadan önce AdMob ve reklam ağı hesabında tamamlanacak işlemler

1. Mintegral/Mintegral Publisher ve Liftoff Monetize publisher hesapları ve Aracım Pro Android uygulaması için onay al. Uygulamayı paket adı `com.aracimpro.app` ile tanımla.
2. Her reklam biçimi için uygun, birbirinden ayrı placement/reklam alanlarını oluştur. Mintegral'de **App Key, App ID, Placement ID, Ad Unit ID**; Liftoff'ta **Application ID, Placement Reference ID** bilgilerini sakla. Bu değerleri GitHub kaynak koduna gömmek gerekmiyor: AdMob tarafında mapping olarak kullanılacaklar.
3. AdMob → Mediation/Aracılık → mevcut ilgili reklam grubu → **Bidding / Teklif verme → Reklam kaynağı ekle** → Mintegral veya Liftoff Monetize → partner şartlarını kabul et → **Mapping** bilgilerini gir → reklam birimini gruba bağla. Geçiş ile App Open gruplarını birbirine karıştırma.
4. Uygunsa Google AdMob'un GDPR/Avrupa yönetmelikleri ve ABD eyaletleri reklam iş ortakları listelerine **Mobvista/Mintegral** ve **Liftoff** ekle. UMP onayı, Google Play Premium kontrolü ve kullanıcı reddi koddan atlanmaz. Liftoff ve Mintegral'in bölgesel gizlilik/opt-out gereksinimlerini ayrıca doğrula.
5. Gerekli network **app-ads.txt** satırlarını resmi Mintegral ve Liftoff panelinden temin edip uygulamanın Play'de ilişkilendirilmiş geliştirici alan adının `/app-ads.txt` adresinde yayınla. Bilinmeyen satırları tahmin ederek ekleme.
6. AdMob **Ad Inspector** ile üretime çıkmadan önce, gerçek test cihazında **Single ad source testing** kullanarak Mintegral ve Liftoff için ayrı ayrı test yap. Google sample-ad APK yalnız Google örnek kimliklerini kullanır; gerçek Mintegral/Liftoff gelirini veya bidding'i doğrulamaz. Gerçek reklamlara kendin tıklama.
7. Google Play Data safety/veri güvenliği, gizlilik politikası (bu dalda `privacy-policy.html` güncellendi), reklam CMP iş ortakları ve varsa yeni SDK veri açıklamalarını gerçek entegrasyona göre güncelle. Güncellenen gizlilik politikası ayrıca kamuya açık web sitesine dağıtılmalıdır.

**İlk yayında öneri:** Yeni ağlar onaylanıp hazır olana kadar mevcut AdMob + Unity reklamlarını koru. Gerekirse aracılık gruplarında A/B testi yapıp gerçek doluluk ve net eCPM raporuyla karşılaştır; daha yüksek gelir veya her açılışta App Open gösterimi garanti edilmez.

## Resmi entegrasyon kaynakları

- https://developers.google.com/admob/android/mediation/mintegral
- https://developers.google.com/admob/android/mediation/liftoff-monetize
