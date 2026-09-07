# Aracım Pro V11 – 5.1.0

V11, V10 üzerindeki katalog/fotoğraf/değerleme sorunlarını düzeltmeye odaklanan sürümdür.

## Önemli düzeltmeler
- Araç fotoğrafı artık marka + model + yıl için **sıkı eşleme** ile aranır. Yanlış kardeş model (ör. Elantra yerine i20) otomatik seçilmez.
- Hyundai Elantra için Elantra/Avante adı eşlemesi bulunur.
- Mercedes-Benz E Serisi için E-Class ve kasa kodu (W212/W213/W214) fotoğraf eşlemesi bulunur.
- Mercedes E Serisi motor/versiyon kataloğu dönemlere göre genişletildi: E180, E200, E250, E220 d/CDI, E300, E350, E400, AMG ve PHEV seçenekleri.
- Mercedes C/A/S serileri ve BMW 5 Serisi katalogları genişletildi.
- Araç formunda **Motor / Versiyon** seçimi yakıttan önce gelir; motor/versiyon seçilince yakıt otomatik eşlenir.
- Paket alanı “Paket / Donanım” olarak ayrıldı ve dönem/model bazlı liste kullanır.
- Kaydetme sonrası otomatik piyasa değeri tetiklenir. Canlı değerleme sunucusu bağlıysa canlı sorgu yapılır; uygulamada doğrulanmış yerel referans bulunan bazı popüler araçlarda otomatik referans değer gösterilir.
- Ana ekranda “Otomatik piyasa / güncel değer” alanı görünür.

## Canlı piyasa değeri hakkında
Türkiye ikinci el piyasasının tüm marka/model/yıl/trimlerini güncel fiyatla vermek için lisanslı bir değerleme veri sağlayıcısı gerekir. V11, güvenli sunucu uç noktası bağlandığında bunu otomatik yapacak altyapıyı içerir. API anahtarı doğrudan APK içine konmamalıdır.

## Google Play
- applicationId: `com.aracimpro.app`
- versionCode: `12`
- versionName: `5.1.0`
- targetSdk: `36`
