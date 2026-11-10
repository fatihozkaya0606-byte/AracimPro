# Aracım Pro — Google Play Veri Güvenliği inceleme taslağı

**Kapsam:** Aracım Pro `7.12.7` (versionCode 255), `aracimpro-255-gma-main-thread-hotfix` dalından güvenlik düzeltmesi.
**Durum:** Ön inceleme. Google Play Console'a **kontrol etmeden doğrudan kopyalanacak kesin bir beyan değildir**. Mağazada yayındaki AAB'nin sürümü farklıysa önce o AAB incelenmelidir.
**Son inceleme:** 10 Kasım 2026.

## 1. Aktarım sırasında şifreleme (Google Play sorusu)

- AndroidManifest.xml içinde `android:usesCleartextTraffic="false"` ve `android:networkSecurityConfig="@xml/network_security_config"` var.
- Ağ güvenliği yapılandırmasında `<base-config cleartextTrafficPermitted="false">` var; sistem sertifikaları kullanılıyor.
- WebView karma içeriği engelliyor; uygulama varlıkları AndroidX WebViewAssetLoader üzerinden sunuluyor.
- `FuelDataClient` içindeki doğrudan HTTP istemcisi, kullanıcı tarafından belirtilen piyasa/akaryakıt uç noktalarını **yalnız HTTPS** olarak kabul edecek şekilde güçlendirildi.
- **Henüz doğrulanmadı:** Çıktı AAB'nin birleştirilmiş manifesti, bütün reklam ve aracılık SDK'ları, nihai SDK veri trafiği ve herhangi bir istisnai bağlantı yolu.
- **Karar:** Her türlü cihaz dışı kullanıcı verisinin TLS/HTTPS ile aktarıldığı (SDK'lar dahil) doğrulanırsa Play Console'daki **"Veriler aktarım sırasında şifreleniyor" = Evet** seçilebilir. Doğrulanmadan yalnızca uyarıyı gizlemek için Evet seçilmez.

## 2. Muhtemel veri kategorileri: gerçek kullanımı doğrula

| Play kategori adayı | Kaynak / amaç | Başlıca kontrol |
| --- | --- | --- |
| **Yaklaşık ve kesin konum** | Kullanıcı konuma izin verirse anlık hız, yakındaki noktalar ve harita yönlendirmesi | Cihaz dışına gönderim olup olmadığı; açılan harita uygulamasına aktarım; arka plan izni yok |
| **Kişisel bilgiler: e-posta, görünen ad, kullanıcı kimliği** | İsteğe bağlı Firebase Authentication profili | Kayıt/giriş akışı ve Firebase işleme |
| **Kullanıcı tarafından oluşturulan içerik** | Firestore yorumlar, puanlar ve şikâyetler | Kaydedilen alanlar, moderasyon ve silme |
| **Uygulama etkinliği ve tanılama** | Reklam SDK'larının reklam gösterimi, tıklama, hata ve performans verileri | Google Mobile Ads ve her aracılık ortağının veri güvenliği beyanları |
| **Cihaz veya diğer tanımlayıcılar** | Reklam kimliği, cihaz/veri ağı tanımlayıcıları | `AD_ID` izni, rıza, reklam ortakları |
| **Kullanıcı mesajları / uygulama içeriği** | Aracım AI kullanıldığında soru, görüşme bağlamı ve araçla ilgili gönderilen bilgiler | Firebase AI Logic / Gemini aktarımları; kullanıcı mesajında kişisel bilgi bulunabilir |
| **Satın alma / abonelik bilgileri** | Google Play Billing doğrulaması | Uygulamanın hangi satın alma bilgisini sunucuya aktarabildiği |
| **Araç bilgileri, VIN, marka/model/km** | NHTSA, OtoAPI, piyasa değeri API'leri | Kullanıcı tarafından başlatılan sorgu parametrelerinin kapsamı |

**Not:** Bir izin istemek tek başına Google Play açısından her zaman "toplama" demek değildir. Uygulama dışına aktarma, üçüncü taraf uygulamaya gönderme, SDK aracılığıyla işleme ve ilgili istisnaları ayrıca değerlendir.

## 3. Reklam SDK'ları — eski V15 taslağı artık geçerli değil

Bu sürümde Google Next-Gen Ads SDK, aracılık SDK/adapterleri ve AdMost deneme bağımlılıkları bulunuyor. **"Reklam SDK'sı yok" veya "Reklam içermiyor" cevabı yanlıştır.**
Aktif/etkin olmayan SDK ayrımını `app/build.gradle`, manifest birleşimi, çalışma zamanı rızası ve üretim reklam konfigürasyonuyla doğrula. Özellikle Google AdMob, Unity Ads, Yandex, Mintegral, Liftoff/Vungle ve AdMost'un paketlenip paketlenmediğini ve veri toplama koşullarını incele. Test veya kapalı reklam yönlendirmesi SDK'nın hiç veri işlemediğini otomatik olarak kanıtlamaz.
Her SDK'nın güncel Play Data Safety rehberi ve Google Play SDK Index bilgilerini karşılaştır. Farklı ağların fiilen etkin olması durumunda veri paylaşımı ve rıza ayrıntılarını güncelle.

## 4. Veri silme / hesap silme

- Kullanıcı Firebase hesabı oluşturabilir; dolayısıyla hesap silme yükümlülüğü ayrıca incelenmelidir.
- Web talep yolu: https://fatihozkaya0606-byte.github.io/AracimPro/delete-account.html
- Sayfa, hesabın bağlı olduğu e-postadan silme talebi gönderilmesini ve doğrulamadan sonra 30 gün içinde işlem yapılmasını açıklıyor.
- **Manuel kontrol:** E-posta taleplerinin gerçekten işlendiği; Firebase Auth kullanıcı kaydı, Firestore verileri ve varsa diğer kullanıcı verilerinin silindiği doğrulanmalı. Sadece web sayfası bulunması silmenin çalıştığını göstermez.
- **Manuel kontrol:** Uygulama içindeki hesap silme seçeneğinin gerçekten mevcut olduğu ve erişilebilir olduğu test edilmeli. Yoksa işlev tamamlanmalı; politika metni yanlış yönlendirmemeli.
- Sadece cihazda saklanan veriler için "Uygulama verilerini sil" yolu ile sunucu verilerinin silinmesi birbirine karıştırılmamalı.

## 5. Play Console adımları

1. **Politika ve programlar → Uygulama içeriği → Veri Güvenliği → Yönet** menüsünü aç.
2. **"Uygulamanız veri topluyor veya paylaşıyor mu?"** sorusunu hem uygulama hem SDK'lar için doğrula. İlgili kategorilerde amaç, zorunlu/isteğe bağlı olma ve paylaşım bilgilerini gerçeğe göre doldur.
3. **"Veriler aktarım sırasında şifreleniyor mu?"** sorusuna ancak yukarıdaki teknik ve SDK kontrolleri olumlu ise **Evet** de.
4. Hesap ve veri silme yöntemiyle ilgili bölümü doğrulanmış iş akışına göre doldur. Web adresini gerekiyorsa ekle.
5. Gizlilik politikası bağlantısını ve mağaza beyanlarını son sürümle eşleştir, gönder. Güncellemenin mağazada görünmesi inceleme/yayına alınmaya bağlıdır.

## 6. Yayından önce doğrulama

- [ ] Gerçekten yayımlanan versionCode / paket `com.aracimpro.app` ile bu kaynak sürümü eşleşiyor.
- [ ] Release AAB birleştirilmiş manifest: `usesCleartextTraffic=false`; network security config cleartext kapalı.
- [ ] HTTPS olmayan test uç noktası reddediliyor, HTTPS bağlantısı çalışıyor.
- [ ] Trafik testi: hesap giriş/kayıt, yorum/şikâyet, AI, canlı fiyat, haritalar ve reklam SDK'larının cihaz dışı veri aktarımı.
- [ ] Firebase, Google Mobile Ads ve tüm aracılık SDK'larının veri toplama/paylaşma dokümanları incelendi.
- [ ] Hesap silme isteği uçtan uca işliyor; ilişkili veri ve saklama istisnaları belirli.
- [ ] Gizlilik politikası ile Play Console Veri Güvenliği beyanı tutarlı.
- [ ] Veri Güvenliği güncellemesi gönderilip mağazada göründüğü doğrulandı.

Kaynaklar:
- https://support.google.com/googleplay/android-developer/answer/10787469
- https://support.google.com/googleplay/android-developer/answer/13323374
- https://developer.android.com/privacy-and-security/security-config
