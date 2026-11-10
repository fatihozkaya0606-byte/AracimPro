# Aracım Pro — güncel Google Play Veri Güvenliği kontrol listesi

**Kaynak sürümü:** 7.12.7 / versionCode 255 (10 Kasım 2026)  
**Uyarı:** Yayındaki sürümün AAB'si farklıysa Play Console beyanını o AAB'nin gerçek davranışına göre doldurun.

## Kod ve ağ güvenliği

- [x] Android Manifest içinde `usesCleartextTraffic="false"`.
- [x] `network_security_config.xml` içinde `cleartextTrafficPermitted="false"`.
- [x] WebView içinde karma içerik engeli.
- [x] FuelDataClient doğrudan isteklerinde kullanıcı kaynaklı HTTP uç noktalarının HTTPS kontrolü (güvenlik dalında).
- [ ] Release AAB birleştirilmiş manifest ve tüm SDK'lar test edildi.
- [ ] Reklam aracılık SDK'larının aktarım şifrelemesi doğrulandı.
- [ ] HTTPS ağ çağrıları, giriş, yorum, fiyat, AI ve reklamlar cihaz üzerinde test edildi.

## Play Console

- [ ] **Politika ve programlar → Uygulama içeriği → Veri Güvenliği** açıldı.
- [ ] Veri toplama ve paylaşım: Firebase, konum, yorumlar, reklam kimliği, cihaz bilgileri ve üçüncü taraf sağlayıcılar değerlendirildi.
- [ ] **Aktarım sırasında şifreleme:** yalnız tüm ilgili veri trafiği doğrulandıktan sonra Evet.
- [ ] Reklam içerir: Evet; gerçek SDK'larla ve aracılık yapılandırmasıyla tutarlı.
- [ ] Firebase hesap silme akışı ve web üzerinden silme talebi gerçekten test edildi.
- [ ] Gizlilik politikası ve hesap silme sayfası herkesin erişimine açık.
- [ ] Mağaza beyanları ile kod/SDK ve gizlilik politikası uyumlu.
- [ ] Form kaydedildi, incelemeye gönderildi, mağaza sayfasında güncellendi.

**Daha ayrıntılı kategori/SDK incelemesi:** `play-store/data-safety-draft-tr.md`.

**Not:** Bu dosyanın düzeltilmesi Google Play'deki etiketi kendiliğinden değiştirmez. Play Console formu ayrıca güncellenmelidir.
