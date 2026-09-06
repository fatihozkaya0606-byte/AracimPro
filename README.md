# Aracım Pro

Google Play hedefli, internetsiz çalışan Android araç takip uygulaması.

## İlk sürümde hazır olanlar
- Araç ekleme/düzenleme ve kilometre güncelleme
- Yakıt kayıtları, litre fiyatı, toplam/aylık yakıt gideri
- İki veya daha fazla dolumdan ortalama tüketim hesabı
- Bakım, muayene, sigorta vb. KM/tarih hatırlatmaları
- Yaklaşan/geciken işlem durumu
- Bakım ve yakıt masraf raporları
- Son 6 ay gider grafiği
- CSV dışa aktarma
- JSON yedekleme ve geri yükleme
- Android paylaşım menüsü
- Tamamen cihaz içi veri saklama; internet izni yok
- Android 16 / API 36 hedefi

## Telefondan APK alma (GitHub Actions)
1. Bu klasördeki tüm dosyaları yeni bir GitHub deposuna yükleyin.
2. GitHub deposunda **Actions** sekmesine girin.
3. **Android Build** iş akışını açın ve **Run workflow** seçin. Push yaptığınızda da otomatik çalışır.
4. İşlem yeşil olduğunda en alttaki **Artifacts** bölümünden **AracimPro-APK** dosyasını indirin.
5. ZIP içindeki `app-debug.apk` dosyasını Android telefona kurabilirsiniz.

> Google Play yayını için debug APK değil, imzalı release AAB gerekir. Projede AAB üretim adımı hazırdır; mağaza yayını öncesinde geliştirici imzası/keystore eklenmelidir.
