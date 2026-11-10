# Aracım Pro — Google Play Veri Güvenliği beyanı (10 Kasım 2026, çalışma taslağı)

> **Önemli:** Bu belge doğrudan Play Console'a aktarılmış bir beyan değildir. **Üretimde yüklü AAB/APK**, reklam ağlarının fiili SDK yapılandırması, Firebase ve ağ trafiği ile karşılaştırılarak son onay verilmelidir. Destekleyici kontroller bitmeden Play Console'da "Tüm veriler şifreleniyor" sonucunu kesin olarak işaretlemeyin.

## İncelenen Android kaynak sürümü

- İnceleme temeli: `aracimpro-255-gma-main-thread-hotfix` (Android `versionCode 255`, `versionName 7.12.7`). Bu sürümün Google Play'de yayınlandığı **doğrulanmadı**.
- `AndroidManifest.xml`: `android:usesCleartextTraffic="false"`, `android:networkSecurityConfig="@xml/network_security_config"`.
- `res/xml/network_security_config.xml`: `cleartextTrafficPermitted="false"`, yalnız sistem sertifikalarına güven.
- `MainActivity.java`: WebView karma HTTP içerik yüklemeyi `MIXED_CONTENT_NEVER_ALLOW` ile engelliyor; yerel dosyalar `WebViewAssetLoader` üzerinden HTTPS benzeri güvenli origin ile açılıyor.
- Android uygulaması, pek çok birinci taraf API sorgusunda `https://` kullanıyor. SOAP XML içindeki `http://` namespace adresleri gerçek bir ağ hedefi **değil**.
- Uygulama veya SDK'lar tarafından kullanıcı verisinin aktarıldığı **bütün** isteklerin TLS kullandığını doğrulamak için çalışma zamanı trafiği ve son üretim derlemesi ayrıca test edilmeli. SDK'ların kendi ağ yığınları ayrıca değerlendirilmeli.

## Mevcut veri akışları ve kontrol edilecek Play veri türleri

Aşağıdaki türler değerlendirilmelidir. Bir veri türünün **toplanması**, **paylaşılması**, **zorunlu/isteğe bağlı** olması, **işleme amacı** ve **geçici işlenmesi** Play Console yardımındaki tanımlara göre ayrı ayrı belirlenmelidir.

| Veri türü / Play sınıflaması | Mevcut işlev | Kontrol |
| --- | --- | --- |
| Kişisel bilgiler: e-posta, ad, kullanıcı kimliği | İsteğe bağlı Firebase Authentication hesabı ve topluluk profili | Firebase yapılandırması, yorumların kişiyle ilişkisi, silme işlemi |
| Kullanıcı tarafından oluşturulan içerik / uygulama etkinliği | Yorumlar, yıldız puanı, şikâyetler, destek/AI soruları | Firestore ve Firebase AI Logic'e giden alanlar, saklama ve amaç |
| Konum: yaklaşık ve hassas | GPS hız, yakındaki noktalar, harita sorguları | Konumun cihaz dışına çıkıp çıkmadığı, alıcı üçüncü taraf uygulamalar |
| Cihaz veya diğer kimlikler | Reklam kimliği, Firebase/SDK tanımlayıcıları | Tüm aktif reklam SDK'larının beyanları ve kullanıcı izinleri |
| Uygulama etkinliği ve reklam etkileşimleri | Reklam gösterimi, etkileşim, performans ve sahtekârlık önleme | AdMob, Yandex, Unity, Mintegral, Liftoff/Vungle, AdMost (fiili etkinlik kontrolü) |
| Uygulama bilgileri ve performansı | SDK'ların olası teşhis veya çökme verileri | Her SDK için Data Safety / Play SDK Index beyanı |
| Satın alma geçmişi | Google Play Billing / Premium abonelik doğrulaması | Uygulamanın fiilen işlediği satın alma tokenı ve işlem verileri |
| Diğer isteğe bağlı bilgiler | VIN çözümleme, araç özellikleri, marka/model/km, piyasa değerleme | Üçüncü taraf API'lere gönderilen alanlar, kimlikle ilişkisi |
| Yerel kayıtlar ve fiş görselleri | Yakıt, bakım, belge, gider, fiş OCR, yerel şifreli yedek | Buluta yüklenmiyorsa kullanıcı cihazındaki işlemler veri toplama olarak **otomatik** işaretlenmez |

**Reklam SDK'sı yok** şeklindeki eski beyan geçersizdir. İncelenen Gradle dosyasında Google reklam SDK'sı, AdMost, Yandex, Unity Ads ve Mintegral/Liftoff aracılık adaptörleri bulunuyor. Bir SDK'nın projede bulunması onun her kullanıcıda etkin biçimde veri aktardığını ispat etmez; canlı entegrasyon, SDK politikaları ve son AAB incelenmelidir.

## Şifreleme sorusu

- Android uygulamasının ağ yapılandırması şifresiz HTTP'yi reddediyor.
- Play Console'da **"Aktarım sırasında şifreleniyor: Evet"** cevabı ancak **uygulamanın topladığı/paylaştığı tüm ilgili kullanıcı verileri** aktarım sırasında uygun TLS/HTTPS ile korunuyorsa verilir.
- SDK, WebView, kullanıcı tarafından yapılandırılan değerleme uç noktaları, yönlendirmeler ve tüm üçüncü taraf hizmetler ayrıca kontrol edilmelidir.
- Sorun yalnızca Google Play'deki eski **form cevabı** ise kod güncellemesi gerekmeyebilir; doğru form cevabı güncellenip incelenmeye gönderilir.

## Veri silme / hesap silme sorusu

- Uygulamada Firebase hesapla oturum açıldığında **Kullanıcı Hesabı → Hesabımı Sil / Silme Talebi** bağlantısı kodda mevcut.
- Mevcut kaynakta `delete-account.html` ve `docs/delete-account.html` talep sayfaları var. Hedef URL: `https://fatihozkaya0606-byte.github.io/AracimPro/delete-account.html`.
- Sayfanın canlıda **HTTP 200 ile açıldığı** ve posta talep kanalının işler olduğu ayrıca doğrulanmalı.
- E-posta talebi geldiğinde geliştirici yalnız Firebase Auth hesabını değil, hesapla ilişkili Firestore yorumları, şikâyet ve kimlik kayıtlarını da silmeli; kullanıcıya tamamlandığını bildirmeli.
- Cihazda yalnız yerel tutulan araç kayıtları uygulamadan veya Android uygulama verisinden silinebiliyor olmalı.
- Bu süreç gerçekten işliyorsa Play Console'da silme talebi / hesap silme beyanları **Evet** olarak işaretlenebilir. Yalnız silme sayfasının bulunması yeterli değildir.

## Play Console'daki işlem

1. Play Console → Aracım Pro → **Politika ve programlar → Uygulama içeriği → Veri Güvenliği → Yönet**.
2. Kullanıcı verisi toplama/paylaşma beyanını son üretim AAB'si ve fiilen kullanılan reklam ağlarına göre düzelt.
3. Şifreleme ve veri silme sorularını yukarıdaki koşullar doğrulanınca doğru şekilde cevapla.
4. İlgili bütün veri türlerinde toplama, paylaşma, amaç, zorunluluk ve geçici işleme seçimlerini tek tek doğrula.
5. Hesap oluşturulabildiği için Play Console'un istediği harici hesap silme URL'sini belirt.
6. Gizlilik politikasını hem mağazadaki hem uygulamadaki sürümde eşitle.
7. Formu **Gönder**; Google Play mağaza sayfası yansımasını inceleme sonrası yeniden kontrol et.

Kaynaklar:
- https://support.google.com/googleplay/android-developer/answer/10787469
- https://support.google.com/googleplay/android-developer/answer/13327111
- https://support.google.com/googleplay/android-developer/answer/10144311
