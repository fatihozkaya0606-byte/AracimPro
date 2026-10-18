/* Aracim Pro R8 Interactive Studio — additive enhancement, no data migrations. */
(function(){
'use strict';
if(window.ap116StudioLoaded)return;
window.ap116StudioLoaded=true;
const E=v=>esc(String(v==null?'':v));
const car=()=>typeof activeVehicle==='function'?activeVehicle():null;
const carName=v=>[v.year,v.make,v.model].filter(Boolean).join(' ');
const panel=(title,body)=>modal(title,'<div class="ap116Page">'+body+'</div>');
const notice=(message)=>'<div class="ap116Note">'+message+'</div>';
const controls=[
 ['garage','🚘','Akıllı Garaj'],['health','💚','Araç Sağlığı'],
 ['route','🧭','Rota Merkezi'],['hud','◉','Dijital HUD'],
 ['compare','⇄','Karşılaştır']
];
const dock=()=>'<section class="ap116Dock" aria-label="R8 akıllı sürüş araçları">'+
 '<div class="ap116DockHeading"><strong>R8 • AKILLI SÜRÜŞ</strong><span>5 etkileşimli araç</span></div>'+
 '<div class="ap116DockScroll">'+controls.map(x=>'<button type="button" data-ap116="'+x[0]+'"><span aria-hidden="true">'+x[1]+'</span><b>'+x[2]+'</b></button>').join('')+'</div></section>';
function wantVehicle(){
 const v=car();
 if(!v){if(typeof requireVehicle==='function')requireVehicle('Akıllı Garaj');else toast('Önce bir araç ekle');}
 return v;
}
function garage(){
 const v=wantVehicle();if(!v)return;
 const photo=v.photo?'<img src="'+E(v.photo)+'" alt="'+E(carName(v))+'">' :
 '<div class="ap116NoPhoto">🚘<small>Gerçek araç fotoğrafını eklediğinde burada görünecek</small></div>';
 panel('🚘 R8 • 3D Akıllı Garaj',
 '<div class="ap116Hero"><small>ARACIM PRO • R8 STÜDYO</small><h2>'+E(carName(v))+'</h2>'+
 '<p>'+E([v.trim,v.engine,v.transmission].filter(Boolean).join(' • ')||'Araç bilgileri')+'</p></div>'+
 '<div class="ap116Stage" id="ap116Stage" role="group" aria-label="Araç fotoğrafı: sürükleyerek görseli hafifçe eğ">'+
 '<div class="ap116CarFrame" id="ap116CarFrame">'+photo+'</div>'+
 '<span class="ap116StageLabel">FOTOĞRAF • DERİNLİK EFEKTİ</span></div>'+
 notice('Fotoğrafta 3D derinlik ve eğim efekti vardır; gerçek 360° model değildir. Aracın fotoğrafı değiştirilmez.')+
 '<div class="ap116Stats"><div><span>Kilometre</span><b>'+num(v.km||0)+' km</b></div>'+
 '<div><span>Motor</span><b>'+E(v.engine||'Belirtilmedi')+'</b></div>'+
 '<div><span>Yakıt</span><b>'+E(v.fuel||'Belirtilmedi')+'</b></div>'+
 '<div><span>Donanım</span><b>'+E(v.trim||'Belirtilmedi')+'</b></div></div>'+
 '<div class="ap116Actions"><button data-ap116="health" class="primary">💚 Araç Sağlığım</button>'+
 '<button data-ap116="edit" class="secondary">📷 Fotoğrafı / Aracı Düzenle</button></div>');
}
function health(){
 const v=wantVehicle();if(!v)return;
 const h=vehicleHealthScore();
 const systems=[
 ['engine','⚙️','Motor'],['brakes','◉','Fren'],['gearbox','▣','Şanzıman'],
 ['tyres','⬡','Lastikler'],['suspension','↕','Süspansiyon'],['electric','ϟ','Akü / Elektrik']
 ];
 panel('💚 R8 • Araç Sağlık Ekranı',
 '<div class="ap116Hero"><small>BAKIM KAYDI TEMELLİ SAĞLIK</small><h2>'+E(carName(v))+'</h2>'+
 '<p>Canlı OBD ölçümü değildir; yalnızca uygulamadaki kayıtlardan hesaplanır.</p></div>'+
 '<div class="ap116HealthTop"><div class="ap116Gauge" style="--ap116Health:'+Math.min(100,Math.max(0,h.score||0))+'"><b>'+E(h.score)+'</b><small>/100</small></div>'+
 '<div class="ap116HealthText"><b>Bakım takip puanı</b><span>'+E(h.label)+'</span>'+
 '<small>Kayıt eksikliği puanı etkileyebilir. Gerçek mekanik arızaya teşhis koymaz.</small></div></div>'+
 '<div class="ap116Systems">'+systems.map(x=>'<button type="button" data-ap116="part:'+x[0]+'"><span>'+x[1]+'</span><b>'+x[2]+'</b><small>Kontrol rehberi →</small></button>').join('')+'</div>'+
 '<div class="ap116Card"><b>Takip edilmesi gerekenler</b>'+
 (h.notes||[]).map(s=>'<p class="ap116Check">• '+E(s)+'</p>').join('')+'</div>'+
 '<div class="ap116Actions"><button data-ap116="plan" class="primary">🔧 Bakım Planını Aç</button>'+
 '<button data-ap116="anatomy" class="secondary">🚘 Parça Rehberi</button></div>');
}
function route(){
 const v=car();
 const avg=v&&typeof avgConsumption==='function'?avgConsumption():0;
 const price=v&&typeof lastFuelPrice==='function'?lastFuelPrice():0;
 panel('🧭 R8 • Navigasyon & Rota',
 '<div class="ap116Hero"><small>ROTAN HAZIR</small><h2>Akıllı Rota Merkezi</h2>'+
 '<p>Hedefini yaz, Google Haritalar üzerinden navigasyonu başlat. Harita uygulaması internet isteyebilir.</p></div>'+
 '<form id="ap116RouteForm" class="ap116RouteForm">'+
 '<label>Gidilecek yer<input name="destination" required maxlength="140" placeholder="Örn: Anıtkabir, Ankara" autocomplete="off"></label>'+
 '<label>Yaklaşık mesafe (km) — isteğe bağlı<input name="distance" type="number" min="0.1" max="10000" step="0.1" inputmode="decimal" placeholder="Örn: 80"></label>'+
 '<div class="ap116Stats"><div><span>Kayıtlı ort. tüketim</span><b>'+ (avg>0?avg.toFixed(1)+' L/100 km':'Veri yok')+'</b></div>'+
 '<div><span>Son kayıtlı litre fiyatı</span><b>'+(price>0?money(price)+'/L':'Veri yok')+'</b></div></div>'+
 '<div class="ap116Cost" id="ap116Cost" role="status">Yakıt tahmini için mesafe, tüketim ve fiyat bilgisi gerekir.</div>'+
 '<button type="submit" class="primary wide">🧭 Google Haritalar ile Rota Başlat</button></form>'+
 notice('Mesafe haritadan otomatik okunmaz; girersen kayıtlı yakıt verilerine dayalı tahmin yapılır. Gerçek rota ve trafik bilgisi harita uygulamasındadır.')+
 '<div class="ap116Actions"><button data-ap116="hud" class="secondary">◉ Dijital Gösterge</button>'+
 '<button data-ap116="road" class="secondary">🚧 Yol Durumu</button></div>');
 updateCost();
}
function updateCost(){
 const f=document.getElementById('ap116RouteForm'),out=document.getElementById('ap116Cost');
 if(!f||!out)return;
 const v=car(),dist=Number(f.elements.distance.value);
 const avg=v&&typeof avgConsumption==='function'?Number(avgConsumption()):0;
 const price=v&&typeof lastFuelPrice==='function'?Number(lastFuelPrice()):0;
 out.textContent=dist>0&&avg>0&&price>0?'Tahmini tek yön yakıt maliyeti: '+money(dist*avg/100*price):
 'Yakıt tahmini için mesafe, tüketim ve fiyat bilgisi gerekir.';
}
function navigate(f){
 const d=String(f.elements.destination.value||'').trim();
 if(d.length<2){toast('Lütfen bir hedef yaz');return;}
 // No location data or entered destination is stored in the app.
 const url='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(d)+'&travelmode=driving';
 try{Android.openUri(url,'')}catch(e){try{openOfficialUrl(url)}catch(_){toast('Harita açılamadı')}}
}
const ROWS=[
 ['Motor','engine'],['Donanım','trim'],['Güç (hp)','powerHp'],['Tork (Nm)','torqueNm'],
 ['Şanzıman','transmission'],['Yakıt','fuel'],['Çekiş','drive'],
 ['0–100 (sn)','zeroTo100'],['Tüketim (L/100 km)','avgConsumptionL'],
 ['Bagaj (L)','trunkL'],['Menzil (km)','rangeKm']
];
function comparableValue(v,k){
 const val=v[k];
 return val===null||val===undefined||String(val).trim()===''?'—':String(val);
}
function compare(){
 if(typeof isPremium==='function'&&!isPremium()){
   if(typeof compareVehicles==='function')compareVehicles();
   return;
 }
 const cars=(state.vehicles||[]);
 if(cars.length<2){
   panel('⇄ R8 • Araç Karşılaştırma','<div class="ap116Hero"><h2>İki kayıtlı araç gerekli</h2>'+
   '<p>Teknik verileri bulunan araçları garaja ekledikten sonra yan yana karşılaştırabilirsin.</p></div>'+
   '<button data-ap116="addcar" class="primary wide">+ Araç Ekle</button>');
   return;
 }
 const active=car(),first=cars.findIndex(x=>x.id===active?.id),other=cars.findIndex(x=>x.id!==active?.id);
 const options=(pick)=>cars.map((x,i)=>'<option value="'+E(x.id)+'" '+(i===pick?'selected':'')+'>'+
 E(carName(x))+'</option>').join('');
 panel('⇄ R8 • Araç Karşılaştırma',
 '<div class="ap116Hero"><small>İKİ ARAÇ • TEK EKRAN</small><h2>Donanım & Performans</h2>'+
 '<p>Yalnızca seçtiğin araçların kaydedilmiş teknik verileri kullanılır.</p></div>'+
 '<div class="ap116ComparePick"><label>Birinci araç<select id="ap116CompareA">'+options(Math.max(0,first))+'</select></label>'+
 '<label>İkinci araç<select id="ap116CompareB">'+options(other>=0?other:1)+'</select></label></div>'+
 '<div id="ap116Comparison"></div>'+
 notice('Eksik teknik veriler “—” gösterilir. Farklı modelin motoru veya donanımı başka bir araçla eşleştirilmez.'));
 renderCompare();
}
function renderCompare(){
 const a=document.getElementById('ap116CompareA'),b=document.getElementById('ap116CompareB'),target=document.getElementById('ap116Comparison');
 if(!a||!b||!target)return;
 const x=state.vehicles.find(v=>v.id===a.value),y=state.vehicles.find(v=>v.id===b.value);
 if(!x||!y)return;
 if(x.id===y.id){target.innerHTML=notice('Karşılaştırmak için iki farklı araç seç.');return;}
 target.innerHTML='<div class="ap116CompareTitle"><div>'+E(carName(x))+'<small>'+E(x.specSource||'Kullanıcı kaydı')+'</small></div>'+
 '<div>'+E(carName(y))+'<small>'+E(y.specSource||'Kullanıcı kaydı')+'</small></div></div>'+
 ROWS.map(r=>'<div class="ap116CompareRow"><span>'+E(r[0])+'</span><b>'+E(comparableValue(x,r[1]))+'</b>'+
 '<b>'+E(comparableValue(y,r[1]))+'</b></div>').join('');
}
function launch(kind){
 if(kind==='garage')return garage();
 if(kind==='health')return health();
 if(kind==='route')return route();
 if(kind==='compare')return compare();
 if(kind==='hud')return typeof hud114==='function'?hud114():toast('GPS HUD kullanılamıyor');
 if(kind==='anatomy')return anatomy114();
 if(kind==='plan'){closeModal();return go('plan')}
 if(kind==='road')return roadStatusModal();
 if(kind==='edit'){const v=car();if(v){closeModal();openVehicle(v.id)}return}
 if(kind==='addcar'){closeModal();return openVehicle()}
 if(kind.startsWith('part:'))return anatomy114(kind.slice(5));
}
window.ap116StudioOpen=launch;
document.addEventListener('click',function(ev){
 const btn=ev.target.closest('[data-ap116]');
 if(btn){ev.preventDefault();launch(btn.getAttribute('data-ap116'));}
});
document.addEventListener('submit',function(ev){
 if(ev.target.id==='ap116RouteForm'){ev.preventDefault();navigate(ev.target);}
});
document.addEventListener('input',function(ev){
 if(ev.target.closest('#ap116RouteForm'))updateCost();
});
document.addEventListener('change',function(ev){
 if(ev.target.matches('#ap116CompareA,#ap116CompareB'))renderCompare();
});
let dragging=false;
document.addEventListener('pointerdown',function(ev){
 const frame=ev.target.closest('#ap116Stage');
 if(!frame||ev.target.closest('button'))return;
 dragging=true;try{frame.setPointerCapture(ev.pointerId)}catch(_){}
});
document.addEventListener('pointermove',function(ev){
 const frame=ev.target.closest('#ap116Stage');
 if(!dragging||!frame||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const box=frame.getBoundingClientRect();
 const dx=Math.max(-1,Math.min(1,(ev.clientX-box.left-box.width/2)/(box.width/2)));
 const dy=Math.max(-1,Math.min(1,(ev.clientY-box.top-box.height/2)/(box.height/2)));
 frame.style.setProperty('--ap116rx',(-dy*5).toFixed(1)+'deg');
 frame.style.setProperty('--ap116ry',(dx*9).toFixed(1)+'deg');
});
document.addEventListener('pointerup',()=>{dragging=false});
document.addEventListener('pointercancel',()=>{dragging=false});
const priorHome=homeView,priorGarage=garageView,priorServices=moreAllServices;
homeView=function(){
 const html=priorHome();
 if(html.includes('ap116Dock'))return html;
 return html.includes('<section class="ap114Discovery"')?
  html.replace('<section class="ap114Discovery"',dock()+'<section class="ap114Discovery"'):
  dock()+html;
};
garageView=function(){return dock()+priorGarage();};
moreAllServices=function(){
 const list=priorServices();
 const links=[
 ['garage116','Akıllı 3D Garaj','Gerçek fotoğraf • derinlik efekti','garage','tools','car'],
 ['health116','Araç Sağlığı R8','Bakım puanı ve parça rehberi','health','service','engine'],
 ['route116','Rota Merkezi','Hedef seç ve haritayla yol al','route','travel','road'],
 ['compare116','Premium Karşılaştırma','İki kayıtlı aracın teknik verisi','compare','tools','car']
 ];
 for(const a of links)if(!list.some(x=>x.id===a[0]))
   list.push({id:a[0],title:a[1],sub:a[2],action:"ap116StudioOpen('"+a[3]+"')",cat:a[4],icon:a[5],img:'drive'});
 return list;
};
setTimeout(function(){try{if(current==='home')render()}catch(e){console.warn('R8 studio',e)}},380);
})();