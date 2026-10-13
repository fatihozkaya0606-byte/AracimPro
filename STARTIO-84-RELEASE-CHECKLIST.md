# Aracım Pro 7.11.9 (versionCode 84) — Start.io yayın kontrolü

**Durum:** İmzalı yayın adayı; GitHub Actions yalnızca AAB üretir. Play Console'a otomatik yükleme / yayın **YOK**.

## Tamamlananlar
- [x] Start.io portalında Aracım Pro (App ID `209956112`) kayıtlı.
- [x] Start.io app-ads.txt doğrulaması: portal "dosya güncel" sonucunu gösterdi.
- [x] Start.io Android SDK; AdMob SDK ve interstitial kaldırıldı.
- [x] Varsayılan splash ve return ads kapalı.
- [x] Kullanıcı testinde Start.io test bannerı göründü; internet kesilince alan kaldırıldı.
- [x] Release sürümünde `BuildConfig.DEBUG=false` olduğundan test ads etkinleştirilmez.
- [x] Premium satın alma sorgusunun başarılı sonucu gelmeden SDK/banner başlatılmaz; Play Billing erişilemiyorsa reklamsız kalır.
- [x] Uygulamanın var olan Google Play gizlilik politikası Start.io veri toplama/paylaşım açıklamalarıyla güncellendi.
- [x] Start.io otomatik manifest/provider başlatması kapatıldı: SDK yalnız açık kullanıcı kabulü ve Premium kontrolünden sonra başlıyor.
- [x] Reklam verisi kabul/ret ekranı, ayarlardan tercih değiştirme ve `pas` işaretinin gönderilmesi eklendi.
- [x] Reddeden kullanıcı için başlangıçta SDK çalışmaz; gösterilen banner alanı da kaldırılır.

## Yayına ALMADAN önce gereken manuel kontroller
- [ ] Google Play Veri Güvenliği: Start.io + Firebase Auth/Firestore/AI + ML Kit ve tüm diğer SDK'ları kapsayan toplama/paylaşma/veri güvenliği beyanını doğrula.
- [ ] Firebase hesap bilgileri (ad, e-posta, kullanıcı kimliği) ile topluluk yorumlarının son kayıttan sonra önizlemede bulunduğunu kontrol et.
- [ ] `Veriler aktarımda şifrelenir` sorusunda yalnız tüm SDK/endpoint trafiği doğrulanınca `Evet` seç; manifestte HTTP engeli tek başına yeterli kanıt değildir.
- [ ] Google Play > Hedef kitle ve içerik beyanı ile Start.io'nun çocuklara yönelik uygulama kısıtlamasının uyumunu doğrula.
- [ ] Gerçek cihazda açık rıza: Ret -> Start.io hiç başlamıyor mu? Kabul -> `pas` ve banner yüklemesi doğru mu? Tercihi geri çekince reklam duruyor mu? Test et.
- [ ] AB/AEA/Birleşik Krallık ve diğer bölgelerde yasal rıza/CMP gerekliliklerini doğrula; mevcut izin ekranının tek başına tam mevzuat uyumu sağladığını varsayma.
- [ ] Premium aktif kullanıcıda ilk açılışta dahi reklam olmadığını, ücretsiz kullanıcıda canlı bannerın yüklendiğini ve çevrimdışı durumda boş alan olmadığını iç test kanalında doğrula.
- [ ] Gizlilik politikası bağlantısının Play Store'da açıldığını ve Start.io bölümünü gösterdiğini kontrol et: https://fatihozkaya0606-byte.github.io/AracimPro/privacy-policy.html
- [ ] Start.io'da reklam geliri / yayıncı hesabı için ek hesap veya ödeme incelemesi olup olmadığını kontrol et.
- [ ] Yayın adayı 84'ün gerçek paket adının `com.aracimpro.app`, debug'un `com.aracimpro.app.startiopreview` olduğunu doğrula.
- [ ] Nihai AAB için Play Console önizlemesinde izin, veri güvenliği, native symbols/R8, abonelik fiyatı, hata günlüğü ve çökme testlerini gözden geçir.
- [ ] Ancak bunların hepsi tamamlanınca, kullanıcının onayıyla Google Play sürüm 84'ü yayınla.

## Gizlilik kaynakları
- https://support.start.io/hc/en-us/articles/4413793394962-Google-Play-Safety-Section-Data-Disclosure
- https://support.start.io/hc/en-us/articles/360014774799-Integration-via-Maven
- https://support.start.io/hc/en-us/articles/360006466034-Start-io-s-Publisher-Guidelines-for-GDPR

## Teknik not
Start.io SDK'sının kendi izin ekranı otomatik olabilir; yine de AB bölgesindeki `pas` uyumu bağımsız doğrulama gerektirir.
Reklam entegrasyonu ile gelir oluşması veya reklam doldurma oranı garanti edilmez.
