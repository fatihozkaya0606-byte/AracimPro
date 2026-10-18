/* V113 add-on tools, without implying OBD hardware pairing or cloud family sync */
(function(){
'use strict';
const CODES={
 P0100:['Hava akış sensörü (MAF) devresi','Hava emişi, sensör soketi ve kablo kontrolü'],
 P0115:['Soğutma suyu sıcaklığı sensör devresi','Sensör ve kablo kontrolleri'],
 P0128:['Soğutma termostatı/sıcaklık aralığı','Termostat ve soğutma suyu kontrolü'],
 P0171:['Fakir karışım (Bank 1)','Emme kaçağı ve yakıt basıncının kontrolü'],
 P0300:['Birden çok silindirde rastgele tekleme','Buji, bobin, enjektör ve kompresyon kontrolü'],
 P0301:['1. silindirde tekleme','1. silindir buji, bobin ve enjektör kontrolü'],
 P0302:['2. silindirde tekleme','2. silindir buji, bobin ve enjektör kontrolü'],
 P0303:['3. silindirde tekleme','3. silindir buji, bobin ve enjektör kontrolü'],
 P0304:['4. silindirde tekleme','4. silindir buji, bobin ve enjektör kontrolü'],
 P0335:['Krank mili konum sensörü','Sensör fişi ve kablo kontrolü'],
 P0420:['Katalitik konvertör verimi düşük (Bank 1)','Egzoz kaçağı, lambda sensörü ve katalizör incelemesi'],
 P0430:['Katalitik konvertör verimi düşük (Bank 2)','Egzoz ve oksijen sensörü kontrolü'],
 P0442:['EVAP buhar sisteminde küçük kaçak','Yakıt depo kapağı ve EVAP hortum/valf kontrolü'],
 P0500:['Araç hız sensörü','Hız sensörü, ABS ve kablolar'],
 P0700:['Şanzıman kontrol sistemi arıza bildirimi','TCM alt arıza kodlarını serviste okut'],
 P0740:['Tork konvertörü kavrama devresi','Şanzıman yağı ve elektriksel kontroller'],
 U0100:['Motor ECU iletişim kaybı','Akü voltajı, CAN hattı ve bağlantılar'],
};
window.dtcLookup113=function(){
 modal('🧰 OBD2 Arıza Kodu','<div class="ap113Page"><div class="ap113Hero"><b>Arıza kodu sözlüğü</b><p>Bir OBD cihazından veya servisten öğrendiğin P0300 gibi kodu gir. <b>Bu özellik ECU’dan canlı veri okumaz.</b></p></div>'+
 '<form class="form" onsubmit="dtcSubmit113(event)"><label>Arıza kodu<input name="code" required maxlength="5" placeholder="P0300" autocapitalize="characters"></label>'+
 '<button class="primary wide" type="submit">Kodu Açıkla</button></form>'+
 '<div class="ap113Notice" id="ap113DtcResult">Bu bilgiler kesin teşhis yerine geçmez.</div>'+
 '<button class="secondary wide" onclick="faultGuideModal()">Aras ile konuş</button></div>');
};
window.dtcSubmit113=function(e){
 e.preventDefault();
 const code=String(new FormData(e.target).get('code')||'').trim().toUpperCase(),el=document.getElementById('ap113DtcResult');
 if(!el)return;
 if(!/^[PBCU][0-9A-F]{4}$/.test(code))return el.textContent='P0300 gibi 5 karakterli bir kod gir.';
 const row=CODES[code];
 el.innerHTML=row?'<b>'+esc(code)+' — '+esc(row[0])+'</b><p>Kontrol edilebilecekler: '+esc(row[1])+'</p>'+
 '<small>Araç marka ve modeline göre farklı nedenler olabilir.</small>':
 '<b>'+esc(code)+'</b><p>Bu kodun doğrulanmış açıklaması yerel listede yok. Üretici servis kaynağına başvur.</p>';
};
window.videoClip113=function(){
 modal('🎥 Kısa Araç Videosu','<div class="ap113Page"><div class="ap113Hero">Cihazın kamera uygulamasıyla <b>en fazla 60 saniyelik</b> video çek. Kaydedilen dosyanın saklanması kamera uygulamasına bağlıdır; döngüsel araç kamerası değildir.</div>'+
 '<div class="ap113Warning">Telefonu önceden sabitle. Sürüş sırasında eline alma veya uygulamayla işlem yapma.</div>'+
 '<button class="primary wide" onclick="Android.recordRoadVideo()">🎥 Video Çek</button>'+
 '<div id="ap113VideoStatus" class="hint">Video kaydı için telefonun kamera uygulaması açılır.</div></div>');
};
window.onRoadVideoRecorded=function(ok,msg){
 const e=document.getElementById('ap113VideoStatus');
 if(e)e.textContent=String(msg||'Video durumu bilinmiyor');
 toast(msg|| (ok?'Video tamamlandı':'Video kaydı iptal edildi'));
};
window.familySummary113=function(){
 const v=activeVehicle();if(!v){requireVehicle('Aileyle Paylaş');return}
 modal('👨‍👩‍👧 Aile Garajı Özeti','<div class="ap113Page"><div class="ap113Hero">'+
 '<b>Paylaşılan araç özeti</b><p>Bakım ve gider bilgilerini ailenle salt okunur metin olarak paylaşabilirsin. Bu sürümde aile üyeleri aynı araç kaydını canlı düzenleyemez.</p></div>'+
 '<div class="ap113Notice">'+esc([v.year,v.make,v.model].filter(Boolean).join(' '))+' • '+num(v.km||0)+' km</div>'+
 '<button class="primary wide" onclick="familyShare113()">Gider ve bakım özetini paylaş</button></div>');
};
window.familyShare113=function(){
 const v=activeVehicle();if(!v)return;
 const rows=[
 'ARACIM PRO — AİLE ARAÇ ÖZETİ',
 [v.year,v.make,v.model].filter(Boolean).join(' '),
 'Kilometre: '+num(v.km||0),
 'Yakıt gideri: '+money(sum(vf(state.fuel))),
 'Servis kayıtları: '+vf(state.services).length,
 'Yolculuk kayıtları: '+vf(state.trips).length,
 'Tarih: '+today()
 ];
 try{Android.shareText('Aracım Pro Aile Araç Özeti',rows.join('\n'))}catch(e){toast('Paylaşım açılamadı')}
};
})();
