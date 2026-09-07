# Aracım Pro V15 — 5.5.0

V15, V14 teknik katalog yapısını korur ve mağaza öncesi temel kullanım hatalarını temizler.

## V15 değişiklikleri

- Yeni araç ekleme ekranı artık önceki aracın marka/model/motor/paket seçimlerini taşımıyor.
- Yıl veya marka değişince model, motor, yakıt, paket ve eski araç fotoğrafı seçimi sıfırlanıyor.
- Model değişince motor/yakıt/paket yeniden o modele göre kuruluyor.
- Firebase Authentication tabanlı kullanıcı hesabı eklendi.
- E-posta/şifre ile kayıt ve giriş eklendi; Firebase oturumu cihazda hatırlar.
- Yeni kayıt sonrası e-posta doğrulama isteği gönderiliyor.
- Firestore tabanlı ortak kullanıcı yorumları eklendi.
- Yorumlarda 1–5 yıldız, kullanılan km, gerçek tüketim, artılar, eksiler ve kronik/teknik sorun alanları var.
- Yorum şikayet sistemi eklendi.
- Ana ekrana ve Akıllı Araç Merkezi'ne Kullanıcı Yorumları / Kullanıcı Hesabı girişleri eklendi.
- Piyasa değeri için OtoApi.com değerleme servisine bağlanabilen güvenli Cloudflare Worker örneği eklendi.
- VersionCode: 16
- VersionName: 5.5.0

## Firebase kullanıcı/yorum sistemini açma

V15, Firebase bilgileri olmadan da derlenir ve diğer özellikler çalışır. Ortak hesap/yorum sistemi için:

1. Firebase Console'da bir proje oluştur.
2. Android uygulamasını paket adı `com.aracimpro.app` ile ekle.
3. Authentication → Sign-in method bölümünde **Email/Password** sağlayıcısını aç.
4. Firestore Database oluştur.
5. `firebase/firestore.rules` içindeki kuralları Firestore Rules bölümüne yayınla.
6. GitHub repo → Settings → Secrets and variables → Actions altında şu repository secret'ları ekle:
   - `FIREBASE_API_KEY`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_APP_ID`
7. Yeni `Android Debug Build` çalıştır. Workflow bu değerleri BuildConfig'e aktarır.

Firebase `apiKey`, project ID ve app ID'yi sohbet içinde paylaşmaya gerek yok; GitHub Secret olarak eklemek yeterlidir.

## Piyasa değeri

Teknik araç verisi için kullanılan **otoapi.net** ile piyasa değerleme sağlayıcısı **OtoApi.com** farklı servislerdir.

Gerçek piyasa değerini açmak için `server/README.md` dosyasındaki Cloudflare Worker kurulumu uygulanır. Değerleme API anahtarı APK içine yazılmaz; Worker secret olarak tutulur.

V15, sağlayıcıdan gelen:
- minimum piyasa fiyatı,
- ortalama fiyat,
- maksimum fiyat,
- hızlı satış/perakende/zor satış fiyatları,
- emsal ilan sayısı
alanlarını normalize edecek şekilde hazırlanmıştır.

## Google Play notu

Kullanıcı hesabı ve kullanıcı tarafından oluşturulan içerik (yorumlar) açıldıktan sonra Play Console veri güvenliği ve gizlilik metni buna göre güncellenmelidir. Üretime geçmeden önce hesap silme/yorum silme akışı ve moderasyon paneli ayrıca tamamlanmalıdır.
