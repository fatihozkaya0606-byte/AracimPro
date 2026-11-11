# Ok Kaçış V21 • Ahşap 3D Tasarım Testi

Bu test dalı **V20 9×9 / 540 bölüm** oyun motorunu ve **alt AdMob banner + Unity mediation test** ayarını korur.

## Yenilenen görseller
- Tüm ekranlarda sıcak ahşap/vitrin yüzeyleri, ceviz tabelalar, mağaza kartları ve seviyeler.
- Oyun ekranında meşe 9×9 gömülü yuvalar, koyu ceviz çerçeve, pirinç köşeler.
- Uzunluk ve yön fark etmeksizin yüksek çözünürlüklü, gölgeli SVG ok simgeli kabartma renkli bloklar.
- Dokunma, engellenme, ipucu, başarılı hamle kıvılcımı; azaltılmış hareket ayarına uyum.
- Hedef, hamle, can, süre, müzik, güçler ve alt butonlarda tutarlı 3D görünüm.

## Güvenlik
- Production/Google Play dalına dokunulmaz. Paket kimliğine `.wood3d` eklenir, mevcut kurulu sürümün üstüne yazmaz.
- Oyun kuralları, 540 seviye, 9×9 tahta, süre/can/ipuçları ve mevcut ayarlar korunur.
- APK içinde offline CSS/SVG kullanılır, yeni sunucu izni gerekmez.

## Test

`node --test game-development/*.test.js` ve GitHub Actions Android Debug APK görevi.
