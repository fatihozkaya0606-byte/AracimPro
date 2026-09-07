# Aracım Pro V11 — Hepsi Bir Arada 5.1.0

V11, önceki sürümlerdeki çalışan özellikleri tek projede birleştirir ve araç sahipliği tarafını teknik rehber, piyasa değeri ve akaryakıt gündemiyle genişletir.

## Araç ekleme ve katalog
- Yıl → marka → model → araç türü → kasa → yakıt → motor → şanzıman → çekiş → paket → renk seçimli akış
- Listeler Türkçe A-Z sıralı
- Türkiye'de yaygın modeller için model/yıl bazlı motor ve paket kataloğu
- Elantra, Passat, Golf, Polo, Tiguan, Corolla, Civic, Clio, Megane, Egea, Focus, Astra, 3008, 508, Tucson, Sportage, Qashqai, Duster, Superb, Leon, A3, BMW 3/5, Mercedes C/E, Chery Tiggo 7/8 Pro ve başka yaygın modeller için genişletilmiş varyantlar
- İnternet varsa NHTSA vPIC ile model listesi genişletme
- Wikimedia Commons üzerinden açık lisanslı gerçek araç fotoğrafı arama; sonuç yoksa galeriden kendi fotoğrafını seçme

## Günlük araç yönetimi
- Çoklu araç / garaj
- Yakıt ve ortalama tüketim
- Şehir içi / uzun yol ayrımı
- Gider kategorileri ve km başı toplam maliyet
- Bakım, servis, muayene, sigorta, kasko ve MTV takibi
- Tarih ve kilometre bazlı hatırlatmalar
- Lastik setleri, ebat, marka, sezon ve kullanım geçmişi
- Akü geçmişi
- Yolculuk kayıtları ve yol/yakıt maliyet hesabı
- Kaza / hasar kayıtları
- Belge kasası
- Acil durum / yol yardım bilgileri
- Ana ekran widget'ı
- PIN ve biyometrik uygulama kilidi
- JSON yedek / geri yükleme
- PDF, CSV ve Excel dışa aktarma

## Araç Rehberi
V11'da model-özel profil bulunan araçlarda aşağıdaki bilgiler tek ekranda gösterilebilir:
- Fabrika lastik ölçüleri ve jant seçenekleri
- Önerilen lastik basıncı / bijon bilgisi notları
- Motor yağı standardı ve kapasite
- Antifriz / soğutma sıvısı tipi ve kapasitesi
- Şanzıman sıvısı ve fren hidroliği
- Triger zincir/kayış rehberi
- Akü, ampul/far, silecek ve yakıt deposu bilgileri
- Bakım aralığı rehberi
- Sık kontrol edilen / kronik olarak raporlanan noktalar
- İkinci el satın alma ekspertiz kontrol listesi

Kesin parça, sıvı, basınç ve bakım bilgisi için VIN, kapı etiketi ve üretici kullanım kılavuzu her zaman önceliklidir. Profil olmayan araçlarda uygulama veri uydurmaz; doğrulama gerektiğini açıkça belirtir.

## Piyasa Değeri Merkezi
- Alt / ortalama / üst fiyat göstergesi
- Emsal sayısı ve 30 günlük trend alanı
- Kilometre, kondisyon ve tramer etkili şeffaf yerel tahmin
- Değer geçmişi
- Canlı değerleme sağlayıcısı için güvenli backend endpoint desteği

Canlı Türkiye ilan/piyasa verisi lisanslı bir veri sağlayıcısı gerektirir. API anahtarı APK içine gömülmez. Endpoint ayarlanmazsa yalnız kullanıcı referansı ve kayıtlı değerler üzerinden tahmini gösterge çalışır.

## Akaryakıt Gündemi
- Şehir seçimine göre güncel benzin / motorin / LPG gösterimi
- Zam / indirim haber akışı
- Uygulama içi güncelleme
- Kullanıcı açarsa yaklaşık 6 saatte bir arka plan kontrolü
- Fiyat değişiminde veya yeni zam/indirim başlığında Android bildirimi

İnternet gerekir. Pompa fiyatları ilçe, istasyon ve saate göre değişebilir. Android güç tasarrufu arka plan kontrolünü geciktirebilir.

## Premium hazırlığı
Google Play Billing henüz bağlı değildir; test sürümünde özellikler açıktır. Sonraki Play sürümünde Premium için planlananlar: reklamsız kullanım, sınırsız araç, canlı piyasa/emsal analizi, gelişmiş raporlar, bulut yedekleme, gelişmiş karşılaştırma ve premium veri/görsel özellikleri.

## Google Play
- applicationId: `com.aracimpro.app`
- compileSdk / targetSdk: 36
- minSdk: 24
- versionCode: 11
- versionName: 5.1.0
- Debug APK workflow'u hazır
- İmzalı release AAB workflow'u hazır
