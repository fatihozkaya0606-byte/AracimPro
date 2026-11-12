# Ok Kaçış V30 – Gerçek Bulmaca Kararları

Kullanıcı geri bildirimi: *"Oyun halen çok basit."* Sadece ok yoğunluğunu veya renkli kilitleri artırmak bu sorunu çözmedi. V29'da geçerli hamlelerin çoğu güvenliydi; oyuncu yalnızca çıkarılabilir oku arayarak ilerliyordu.

## V30 farkı

Geçerli ama **yanlış sırada oynandığında sonraki oku kalıcı olarak kilitleyen** kararlar eklendi. Oyuncu bu hatayı `Geri Al` veya `Yeniden` ile düzeltir; özel güçler yine kullanılabilir. Örnek: ⚓ destek okunun yolu açık görünür; önce onu kaldırırsan 🧷 korunan oka erişim kaybolur. Doğru çözümde önce diğer oklar çıkarılıp korunan ok kurtarılır, destek ok en son kaldırılır.

| Bölüm | Zorluk | En az tehlikeli (ama oynanabilir) ilk hamle |
|---|---|---|
| 1–5 | Kolay | 0 |
| 6–10 | Hafif Zor | 0 |
| 11–20 | Orta | 0 |
| 21–50 | Zor | 1 |
| 51–100 | Çok Zor | 2 |
| 101–220 | Aşırı Zor | 3 |
| 221–540 | Aşırı Zor | 4 |

- Tuzağın destek oku ve koruduğu ok arasında **en az 4 yerleştirme adımlık** sıra farkı vardır.
- Her bölümde en az bir doğru başlangıç ve test edilmiş tam çözüm korunur.
- Yeni kilitler, 3–4 anahtarlı dar boğazlar, süreli kapılar, bonuslar, seviye ilerlemesi korunur.
- V26 mat ahşap, V25 şeffaf hızlı dokunma, 9×9 ve 540 bölüm korunur.
- GitHub otomatik testleri, bütün 540 bölümde hem *gerçek yanlış ama yasal hamleyi* hem de *tam doğru çözüm yolunu* sınar.
- Google Play'deki canlı sürüm değiştirilmedi. Yeni sürüm ayrı test APK'sıdır.

**Dikkat:** Destek okları küçük ⚓ simgesiyle işaretlenir, koruduğu hedefin yanında 🧷 bulunur. Bu özelliği ilk olarak Seviye 21'de sınamak gerekir.
