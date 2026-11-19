# Nur Rehberi / Nur Mektebi — Osmanlı Harfleri Deneme Sürümü

Bu değişiklik sadece mevcut uygulamanın kitaplık ve tefsir okuma ekranlarını
etkiler. Kur’an'ın Arapça metni, Türkçe meali, hafızlar, ezan, namaz vakitleri,
yer imleri ve mevcut sayfa düzeni korunur.

- Kitaplık ve tefsir okuma ekranında **Osmanlı harfleri / Latin harfleri** seçilir.
- Varsayılan görünüm Osmanlı harfleridir; tercih cihazda saklanır.
- Uygulama içinde yazılmış 12 kısa rehberdeki başlıklar ve paragraflar dönüştürülür.
- Yayınevi kaynağından Türkçe gelen çevrimiçi tefsir metni okuma sırasında aktarılır.
- Önceki sayfa, sonraki sayfa ve yer imi davranışları korunur.

**Önemli:** Bu yöntem modern Türkçe metni Arap harflerine otomatik aktarır.
Osmanlı Türkçesine filolojik çeviri değildir; tarihî baskı, özgün Osmanlıca
nüsha veya doğrulanmış yazma eser olarak tanıtılamaz. Kelime yazımları
uzmanca kontrol edilmeden tarihî belge olarak kullanılmamalıdır.
Telifli kitaplar ve üçüncü taraf katalog bağlantıları içeriğe kopyalanmaz.

Gerçek Osmanlıca tam metinleri eklemek için her eser için özgün eser nüshası,
sayfa/baskı bilgisi ve yayınlama izni (gerekiyorsa) ayrıca sağlanmalıdır.

## Test

`node nur-rehberi/tests/ottoman_script.test.cjs`

Android test APK'sı, `.github/workflows/nur-rehberi-ezan.yml` iş akışı
tamamlanırsa `app/build/outputs/apk/debug/app-debug.apk` çıktısından alınır.
