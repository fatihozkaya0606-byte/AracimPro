# Aracım Pro canlı aktif kullanıcı sayacı (v98)

Bu özellik yalnızca `v98 / 7.11.23` ve sonrası uygulamada çalışır.

## Gereken Firebase ayarları

1. Android derlemesi için `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` environment/secrets tanımlanmış olmalı.
2. Firebase Console > Authentication > Sign-in method > **Anonymous** etkinleştirilmeli.
3. Mevcut Firebase Firestore güvenlik kuralları gözden geçirildikten sonra `firebase/firestore.rules` içindeki `app_presence` bloğu yayınlanmalı. Dosyayı birleştirmeden doğrudan yayınlamak uzaktaki diğer yeni kuralları silme riski taşır; önce mevcut kurallarla karşılaştırın.
4. Firestore veritabanı açık olmalı. Uygulama Firebase Firestore veritabanında `app_presence` koleksiyonunu kullanır.
5. Uygulamanın gizlilik politikasında anonim etkinlik kimliği ve etkinlik zamanı kullanımı açıklanmalı.

## Nasıl sayılır?

- Android uygulaması ön plandayken anonim Firebase Auth UID'si ile `app_presence/{uid}` dokümanı yazılır.
- Server-side timestamp `lastSeen` alanı, `foreground=true`, `platform=android` ve uygulama sürüm numarası tutulur.
- Arka plana geçildiğinde `foreground=false` kaydedilir.
- Ön plandayken yaklaşık her 45 saniyede yenilenir; 120 saniyeden eski kayıtlar sayılmaz.
- Plaka, araç detayı, konum, ad, e-posta ve reklam kimliği bu kayıtlarla paylaşılmaz.
- Sayım maksimum 500 taze kaydı okur; çok yüksek trafikte sunucuda toplulaştırılmış sayaca geçilmelidir.
- Firebase yapılandırması, kimlik doğrulama veya Firestore izni çalışmazsa ekranda **—** görünür; sahte/önbellek sayı gösterilmez.
- Eski sürümlerin kurulumları etkin görünmez; etkin kullanıcı sayımı yalnızca yeni sürümü kullanan kullanıcıların toplamıdır.

## Güvenli test

- Yeni test APK yükle.
- Uygulamayı açıp "Şu an uygulamada" göstergesini kontrol et.
- İki farklı test telefonunda eşzamanlı açıldığında sayı 2 olmalı (Firestore kuralları yayınlanmışsa).
- Bir uygulamayı arka plana atıp yenile; sayı azalmalı.
- Bağlantı kapatılınca `—` çıkmalı. Yanlışlıkla `0` gibi kesin sayı gösterilmemeli.

> Not: Yalnızca GitHub'a kod ve kural eklemek Firebase'deki canlı güvenlik kurallarını değiştirmez.