# Ok Kaçış V32.1 — Patron kapısı oyun içinde

**Neden:** V32'de ek modlar sadece ayrı menüdeydi; 20. seviyede değişiklik hissedilmiyordu. V32.1 bu deneyimi ana kampanyaya bağlar.

- Her 10. seviye (10, 20, 30, ... 540) oyun içinde **👑 Patron Kapısı** görünümü alır. Altın renkli tahta çerçevesi ve tıklanabilir kapı düğmesi vardır.
- Bölüm başarıyla tamamlandığında zafer ekranında **Patron Mücadelesine Başla** düğmesi görünür; 3 aşamalı arena oynamak için başka menü aramak gerekmez.
- Bölümler ekranının üst kısmında en son açılan patron seviyesi canlı ve belirgindir.
- Ana menüde mevcut **Yeni Modlar** düğmesi ana oynama düğmesinin hemen altında büyük ve görünür hâle getirilmiştir.
- Arena **3 kalkan** ve **3 hata hakkı** içerir. Yanlış (kilitli) oka dokunmak bir hata hakkı eksiltir. 3. hatadan sonra mücadele kaybedilir.
- **🧪 20. Patron TEST**: Yeni test uygulamasında 20. patronu hiç bölüm geçmeden hemen oynamayı sağlar. Önizleme ilerleme, rütbe, patron zaferi ya da altın kazancı yazmaz.
- Eski V32 test uygulamasının ilerlemesini kaybetme riskine karşı bu Android test paketi **farklı uygulama kimliğiyle** yanına kurulur: `.wood3d.v321`. Eski testten yeni teste ilerleme **otomatik taşınmaz**.
- 540 bölümün içeriği, rütbeler, dokunma katmanı ve ana kampanya ilerleme mantığı değişmemiştir; yalnızca yeni bonus deneyim bağlanmıştır.
- Haftalık ortak bulmacalar yerel kişisel rekorludur; çevrimiçi liderlik tablosu yoktur.

İnceleme: Node 540 seviye ve V32/V32.1 davranış testleri, Android APK derlemesi, APK dosya bütünlüğü.
