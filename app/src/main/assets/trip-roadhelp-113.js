/* V113 travel timer and safer roadside assistance */
(function(){
'use strict';
const KEY='ap113_trip_session';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}};
const write=v=>v?localStorage.setItem(KEY,JSON.stringify(v)):localStorage.removeItem(KEY);
const secs=t=>Math.max(0,Math.floor((Date.now()-t)/1000));
const clock=n=>[Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,'0')).join(':');
window.tripTimer113=function(){
 const v=activeVehicle();if(!v){requireVehicle('Yolculuk Günlüğü');return}
 const a=read(),active=a&&a.vehicleId===v.id;
 const body='<div class="ap113Page"><div class="ap113Hero"><b>'+ (active?'Yolculuk sürüyor':'Yeni yolculuk')+'</b>'+
 '<p>Geçen süre kaydedilir, telefonu kapatsan bile devam eder. Mesafe GPS’ten otomatik ölçülmez; bitiş kilometresini sen yazarsın.</p></div>'+
 '<div class="ap113Timer" id="ap113Time">'+clock(active?secs(a.start):0)+'</div>'+
 (active?'<p class="ap113Notice">Başlangıç kilometresi: '+num(a.km)+' km</p>'+
 '<form class="form" onsubmit="tripFinish113(event)"><label>Bitiş kilometresi<input type="number" min="'+a.km+'" required name="km" value="'+Math.max(v.km,a.km)+'"></label>'+
 '<label>Güzergâh<input name="route" maxlength="120" placeholder="Örn. Ankara – Çankırı"></label>'+
 '<label>Ek gider (TL)<input type="number" min="0" step="0.01" value="0" name="cost"></label>'+
 '<button class="primary wide" type="submit">✓ Bitir ve Günlüğe Kaydet</button>'+
 '<button class="secondary wide" type="button" onclick="tripDiscard113()">Kaydı İptal Et</button></form>':
 '<div class="ap113Notice">Sürüş başlamadan ayarla. Araç kullanırken ekrana dokunma.</div>'+
 '<button class="primary wide" type="button" onclick="tripStart113()">▶ Başlat</button>')+'</div>';
 modal('🧭 Yolculuk Kronometresi',body);
};
window.tripStart113=function(){
 const v=activeVehicle();if(!v)return;
 if(read())return toast('Zaten bir yolculuk aktif; önce bitir');
 write({vehicleId:v.id,start:Date.now(),date:today(),km:+v.km||0});tripTimer113();
};
window.tripDiscard113=function(){
 if(!confirm('Kaydetmeden silmek istiyor musun?'))return;
 write(null);tripTimer113();
};
window.tripFinish113=function(e){
 e.preventDefault();const a=read(),v=activeVehicle();if(!a||!v||a.vehicleId!==v.id)return toast('Yolculuk bulunamadı');
 const f=new FormData(e.target),end=+f.get('km'),cost=+f.get('cost');
 if(!Number.isFinite(end)||end<a.km||end>2000000||!Number.isFinite(cost)||cost<0)return toast('Kilometre veya masraf geçersiz');
 const duration=secs(a.start),distance=end-a.km;
 const note='Süre: '+clock(duration)+(duration>=60&&distance?' • Ortalama: '+(distance/(duration/3600)).toFixed(1)+' km/sa':'');
 upsert('trips',{id:uid(),vehicleId:v.id,date:a.date,startKm:a.km,endKm:end,route:String(f.get('route')||'').trim(),purpose:'Diğer',
   cost,note,durationSeconds:duration,startedAt:a.start},'');
 v.km=Math.max(v.km,end);write(null);closeModal();save();toast('Yolculuk kaydedildi');
};
setInterval(()=>{
 const el=document.getElementById('ap113Time'),a=read();if(el&&a)el.textContent=clock(secs(a.start));
},1000);
window.roadHelp113=function(){
 const x=state.emergency||{},phone=String(x.roadsidePhone||'').replace(/[^\d+]/g,'');
 modal('🆘 Acil Yol Yardım','<div class="ap113Page"><div class="ap113Warning">'+
 '<b>Önce can güvenliği!</b><p>Güvenli bir noktada dur, dörtlüleri yak. Yaralanma, yangın, ciddi arıza veya trafik riski varsa acil çağrıyı kullan.</p></div>'+
 '<div class="ap113Grid">'+
 '<button class="danger" onclick="dial(apEmergency())">📞 Acil Çağrı ('+esc(apEmergency())+')</button>'+
 '<button class="secondary" onclick="nearbyRoadside()">🚚 Çekici Ara</button>'+
 '<button class="secondary" onclick="nearbyTire()">🛞 Lastikçi</button>'+
 '<button class="secondary" onclick="nearbyAutoElectric()">🔋 Akü / Oto Elektrik</button></div>'+
 '<div class="ap113Guide"><details><summary>Lastik patladı</summary>Güvenli dur. Trafiğin aktığı tehlikeli yerde lastik değiştirme; çekici ara.</details>'+
 '<details><summary>Motor hararet yaptı</summary>Güvenli yere çek, motoru durdur, sıcak radyatör kapağını açma.</details>'+
 '<details><summary>Akü bitti</summary>Yanlış takviye bağlantısından kaçın; uygun cihaz veya profesyonel destek iste.</details>'+
 '<details><summary>Fren veya direksiyon problemi</summary>Sürmeye devam etme. Güvenli yerde dur ve profesyonel yardım çağır.</details></div>'+
 (phone.length>=10?'<button class="secondary wide" onclick="dial('+JSON.stringify(phone).replace(/"/g,"'")+')">📞 Kayıtlı Çekicim</button>':'')+
 '<button class="secondary wide" onclick="emergencyModal()">Acil iletişim bilgilerim</button>'+
 '<button class="secondary wide" onclick="roadShare113()">📍 Konumumu isteyerek paylaş</button></div>');
};
window.roadShare113=function(){
 const p=window._lastGps;
 if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||Date.now()-(p.ts||0)>600000)
   return toast('Güncel GPS konumu yok. Canlı Sürüş bölümünden konum al.');
 try{Android.shareText('Konumumu paylaşıyorum','Yol yardım konumum: https://maps.google.com/?q='+p.lat.toFixed(6)+','+p.lon.toFixed(6))}
 catch(e){toast('Paylaşım açılamadı')}
};
})();
