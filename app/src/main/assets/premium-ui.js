
/* Aracım Pro v93 premium UI. All values come from the local vehicle records. */
(function(){
'use strict';
const oldHeader=header,oldNav=nav,oldView=view;
function monthlyBreakdown(){
  const d=new Date(),ym=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  const total=(items,key)=>items.filter(x=>String(x.dateDone||x.date||'').startsWith(ym)).reduce((a,x)=>a+(Number(x[key]??x.cost??0)||0),0);
  const fuel=total(vf(state.fuel||[]),'cost');
  const maintenance=total(vf(state.maintenance||[]),'cost')+total(vf(state.services||[]),'total');
  const other=total(vf(state.expenses||[]),'cost');
  return {fuel,maintenance,other,all:fuel+maintenance+other};
}
function ap93Reminders(){
  const r=state.prefs.driverReminders||{};
  let list=[];
  for(const [key,label,emoji] of [['inspection','Muayene','🧾'],['insurance','Sigorta','🛡️']]){
    const days=typeof daysToDate==='function'?daysToDate(r[key]):null;
    if(days!==null&&Number.isFinite(days))list.push({label,emoji,when:days<0?Math.abs(days)+' gün geçti':days+' gün kaldı',days});
  }
  for(const x of upcoming().slice(0,3)) {
    let when='Planlandı';
    if(Number.isFinite(x.days)&&x.days<99999)when=x.days<0?Math.abs(x.days)+' gün geçti':Math.max(0,x.days)+' gün kaldı';
    else if(Number.isFinite(x.km)&&x.km<999999)when=Math.max(0,Math.round(x.km))+' km kaldı';
    list.push({label:x.name||'Bakım',when,emoji:'🔧',days:x.days});
  }
  return list.slice(0,3);
}
function ap93Header(){
  const alerts=smartAlertItems();
  return '<header class="header ap93Header">'+
    '<div class="ap93Head">'+
      '<div class="ap93Brand"><span class="ap93Logo">'+ico('car')+'</span>Aracım <b>Pro</b></div>'+
      '<button type="button" class="ap93Icon" aria-label="Bildirimler" onclick="smartAlertsModal()">'+ico('bell')+(alerts.length?'<i class="ap93Bubble"></i>':'')+'</button>'+
      '<button type="button" class="ap93Icon" aria-label="Ayarlar" onclick="openSettings()">'+ico('settings')+'</button>'+
    '</div></header>';
}
function ap93Nav(){
 const items=[['home','home','Ana Sayfa'],['garage','car','Araçlarım'],['plan','wrench','Bakım'],['reports','chart','Raporlar'],['more','menu','Daha Fazla']];
 return '<nav class="nav" aria-label="Ana menü">'+items.map(([k,icon,label])=>'<button class="'+(current===k?'active':'')+'" onclick="go(\''+k+'\',true)"><i>'+ico(icon)+'</i>'+label+'</button>').join('')+'</nav>';
}
function ap93Home(){
 const v=activeVehicle(),costs=v?monthlyBreakdown():{fuel:0,maintenance:0,other:0,all:0};
 const h=v?vehicleHealthScore():null, reminders=v?ap93Reminders():[];
 const avg=v?avgConsumption():0;
 const ph=v&&typeof v.photo==='string'&&(/^(data:image\/(jpeg|png|webp);base64,|https:\/\/)/i.test(v.photo))?v.photo:'';
 const name=v?[v.year,v.make,v.model].filter(Boolean).join(' '):'Aracını ekleyerek başla';
 const next=upcoming().find(x=>Number.isFinite(x.km)&&x.km<999999);
 const nextText=next?num(Math.max(0,Math.round(next.km)))+' km':'Kayıt yok';
 const safe=esc;
 return '<section class="ap93" aria-label="Aracım Pro premium ana sayfa">'+
   '<div class="ap93Hero">'+
     (ph?'<img class="ap93HeroPhoto" src="'+safe(ph)+'" alt="Kayıtlı aracın fotoğrafı" onerror="this.style.display=\'none\'">':'')+
     '<div class="ap93HeroText"><div class="ap93Kicker">Aktif Aracım</div><h1>'+safe(name)+'</h1>'+
      (v&&v.plate?'<span class="ap93Plate">TR • '+safe(v.plate)+'</span>':'')+
      '<div class="ap93Specs">'+(v?[[v.engine||'',v.fuel||'',v.transmission||''].filter(Boolean).map(safe).join(' · ')||'Araç özellikleri bekleniyor']:'Araç eklediğinde bilgilerin burada görünecek')+'</div>'+
      (!ph?'<div class="ap93Ghost">📷 Gerçek araç fotoğrafını ekle</div>':'')+
      '<button class="ap93HeroAction" onclick="'+(v?"go('garage')":"openVehicle()")+'">'+(v?'Aracımı Gör ›':'Araç Ekle +')+'</button>'+
    '</div></div>'+
   '<button class="ap93Tile ap93Health" onclick="'+(v?'vehicleHealthModal()':'openVehicle()')+'"><div><h2>💠 Aracımın Durumu</h2><p>'+(v?'Kayıtlı bakım ve tarihlerden hesaplanan yardımcı puan.':'Aracını ekleyip durumunu takip et.')+'</p></div><div class="ap93HealthRing" style="--p:'+(h?h.score:0)+'%"><div><b>'+(h?h.score:'—')+'</b><small>/100</small></div></div></button>'+
   '<div class="ap93Quick3">'+
      '<button class="ap93Tile ap93Small" onclick="go(\'plan\')"><span class="ic">🔧</span><small>Sonraki Bakım</small><strong>'+safe(nextText)+'</strong></button>'+
      '<button class="ap93Tile ap93Small" onclick="go(\'records\')"><span class="ic">▥</span><small>Aylık Masraf</small><strong>'+money(costs.all)+'</strong></button>'+
      '<button class="ap93Tile ap93Small" onclick="go(\'records\');recordsTab=\'fuel\';render()"><span class="ic">⛽</span><small>Yakıt Ort.</small><strong>'+(avg>0?avg.toFixed(1)+' L/100 km':'Kayıt yok')+'</strong></button>'+
   '</div>'+
   '<button class="ap93Route" onclick="go(\'navigation\')"><span class="pin">📍</span><span><strong>Rota Oluştur</strong><small>Haritada adres ara • GPS ile yol tarifi</small></span><span class="arrow">➤</span></button>'+
   '<section class="ap93Panel"><div class="ap93SectionHead"><strong>📅 Yaklaşan Hatırlatmalar</strong><button onclick="driverReminderModal()">Tümünü Gör ›</button></div>'+
       (reminders.length?reminders.map(x=>'<button class="ap93Reminder" onclick="driverReminderModal()"><i>'+x.emoji+'</i><span><b>'+safe(x.label)+'</b><small>'+safe(x.when)+'</small></span><span class="arr">›</span></button>').join(''):'<div class="ap93Empty">Henüz yaklaşan kayıt yok. Muayene, sigorta ve bakım tarihlerini ekleyebilirsin.</div>')+
   '</section>'+
   '<section class="ap93Panel"><div class="ap93SectionHead"><strong>▥ Bu Ay</strong><button onclick="go(\'reports\')">Detaylı Rapor ›</button></div>'+
     '<div class="ap93Costs"><div><small>⛽ Yakıt</small><b>'+money(costs.fuel)+'</b></div><div><small>🔧 Bakım</small><b>'+money(costs.maintenance)+'</b></div><div><small>📊 Toplam</small><b>'+money(costs.all)+'</b></div></div>'+
   '</section>'+
   '<div class="ap93Tools"><button onclick="go(\'records\')">📋 Kayıtlar</button><button onclick="marketValueModal()">📈 Araç Değeri</button><button onclick="try{Android.dial(\'112\')}catch(e){}">🆘 112 Acil</button></div>'+
   apMrecCardHtml()+
 '</section>';
}
header=function(){return current==='home'?ap93Header():oldHeader()};
nav=function(){return current==='home'?ap93Nav():oldNav()};
view=function(){return current==='home'?ap93Home():oldView()};
/* Upgrade the existing functional Leaflet navigation screen without altering its GPS engine. */
apNavView=function(){
 return '<section class="apNavScreen ap93NavScreen" aria-label="GPS navigasyon">'+
   '<div id="apNavMap" class="apNavMap"><div class="apNavMapLoading">Gerçek harita yükleniyor…</div></div>'+
   '<div class="apNavHeader"><button class="apNavBack" onclick="go(\'home\')" aria-label="Geri">‹</button>'+
      '<div class="apNavTitle"><b>🚘 ARACIM <em>PRO</em></b><span>Gerçek harita · GPS · Yol tarifi</span></div>'+
      '<button class="apNavLocate" onclick="apNavCenter()" aria-label="Konumum">⌖</button></div>'+
   '<div class="apNavSearchWrap"><div class="apNavSearchBar"><span class="apNavSearchIcon">⌕</span>'+
      '<input id="apNavSearch" type="search" placeholder="Nereye gitmek istiyorsun?" maxlength="110" autocomplete="off" onkeydown="if(event.key===\'Enter\'){event.preventDefault();apNavSearchPlaces()}"/>'+
      '<button onclick="apNavSearchPlaces()">ARA</button></div><div id="apNavResults" class="apNavResults" hidden></div></div>'+
   '<div class="ap93NavChoices" id="ap93NavChoices"><button class="selected" disabled>📍 GPS bekleniyor<small>Başlangıç konumu</small></button></div>'+
   '<div class="apNavControls"><button onclick="apNavCenter()" title="Konumuma dön">◎</button><button onclick="apNavZoom(1)" title="Yakınlaştır">＋</button><button onclick="apNavZoom(-1)" title="Uzaklaştır">－</button><button onclick="apNavToggleVoice()" id="apNavVoice" title="Sesli yönlendirme">🔊</button></div>'+
   '<div class="apNavBottom">'+
      '<div class="apNavTopline"><b id="apNavInstruction">Adres ara veya haritadan hedef seç</b><span id="apNavSpeed">— km/sa</span></div>'+
      '<div class="apNavMetrics"><div><strong id="apNavDistance">—</strong><small>Mesafe</small></div><div><strong id="apNavDuration">—</strong><small>Sürüş süresi</small></div><div><strong id="apNavEta">—</strong><small>Varış saati</small></div></div>'+
      '<div id="apNavInfo" class="apNavInfo">Konum iznini ver. Adres ara veya haritaya dokun.</div>'+
      '<div class="ap93TrafficNotice">ⓘ Canlı trafik, radar ve hız limiti verisi bulunmuyor; süre tahminidir.</div>'+
      '<button class="ap93NavDetailButton" onclick="ap93ToggleSteps()">☰ Dönüşleri ve rota detaylarını göster</button>'+
      '<div id="ap93NavSteps" class="ap93NavDetails" hidden></div>'+
      '<div class="apNavBottomButtons"><button id="apNavStart" class="apNavStart" onclick="apNavToggleGuidance()" disabled>ROTA HAZIRLANIYOR</button><button class="apNavStop" onclick="apNavClearRoute()">Temizle</button></div>'+
      '<div class="apNavDisclaimer">OSM harita + OSRM deneme rotası • Gerçek trafik verisi yok. Araç kullanırken telefona bakma, işaretlere uy. © OpenStreetMap katkıda bulunanlar.</div>'+
    '</div>'+
 '</section>';
};
/* Ask consent before precise GPS/start and destination coordinates leave the phone. */
const ap93RouteEndpointConsentKey='ap93_route_external_service_consent_v1';
const originalRouteLoad=apNavLoadRoute;
apNavLoadRoute=function(isReroute){
  if(localStorage.getItem(ap93RouteEndpointConsentKey)==='yes')return originalRouteLoad(isReroute);
  const screen=document.querySelector('.apNavScreen');if(!screen)return;
  if(screen.querySelector('.ap93RouteConsent'))return;
  const modal=document.createElement('div');
  modal.className='ap93RouteConsent';
  modal.innerHTML='<div class="ap93RouteConsentCard" role="dialog" aria-modal="true" aria-label="Rota veri izni">'+
   '<strong>📍 Rota için konum paylaşımı</strong>'+
   '<p>Rota hesaplamak için bulunduğun konumun ve seçtiğin hedefin koordinatları harici OSRM deneme sunucusuna gönderilir. Bu veriler olmadan rota oluşturulamaz. Canlı trafik verisi sağlanmaz.</p>'+
   '<button type="button" class="ap93ConsentYes">Kabul et ve rotayı hesapla</button>'+
   '<button type="button" class="ap93ConsentNo">Vazgeç</button></div>';
  modal.querySelector('.ap93ConsentYes').addEventListener('click',()=>{
    localStorage.setItem(ap93RouteEndpointConsentKey,'yes');modal.remove();originalRouteLoad(isReroute);
  });
  modal.querySelector('.ap93ConsentNo').addEventListener('click',()=>{
    modal.remove();apNavInfo('Rota hesaplanmadı. İstersen sadece haritayı kullanabilirsin.');
  });
  screen.appendChild(modal);
};
const origPaint=apNavPaintRoute,origUpdate=apNavUpdateBottom,origClear=apNavClearRoute;
apNav.selected=0;
function ap93SetRoute(idx){
  if(!apNav.routes[idx])return;
  apNav.selected=idx;apNav.route=apNav.routes[idx];apNav.stepIndex=0;apNav.lastSpoken=-1;
  apNavPaintRoute();apNavUpdateBottom();
}
window.ap93SetRoute=ap93SetRoute;
apNavPaintRoute=function(){
  if(!apNav.map||!apNav.route)return;
  if(apNav.line){apNav.map.removeLayer(apNav.line);apNav.line=null;}
  const selected=apNav.routes.indexOf(apNav.route);
  const features=apNav.routes.map((r,i)=>({type:'Feature',geometry:r.geometry,properties:{index:i}}));
  apNav.line=L.geoJSON({type:'FeatureCollection',features},{style:f=>({
    color:f.properties.index===selected?'#02baff':'#8da9cb',
    weight:f.properties.index===selected?8:4,
    opacity:f.properties.index===selected?1:.55
  })}).addTo(apNav.map);
  if(!apNav.active){try{apNav.map.fitBounds(apNav.line.getBounds(),{padding:[55,55],maxZoom:15})}catch(e){}}
};
apNavUpdateBottom=function(){
  origUpdate();
  const opts=document.getElementById('ap93NavChoices');
  if(opts){
    opts.innerHTML=apNav.routes.length
      ?apNav.routes.slice(0,4).map((r,i)=>'<button class="'+(r===apNav.route?'selected':'')+'" onclick="ap93SetRoute('+i+')">'+(i===0?'➤ Önerilen':'↗ Alternatif '+i)+'<small>'+apNavDuration(r.duration)+' · '+apNavKm(r.distance)+'</small></button>').join('')
      :'<button disabled>📍 Hedef ara<small>GPS konumundan rota</small></button>';
  }
  const steps=document.getElementById('ap93NavSteps');
  if(steps && !steps.hidden)window.ap93RenderSteps();
};
window.ap93RenderSteps=function(){
  const el=document.getElementById('ap93NavSteps');if(!el)return;
  const steps=apNav.route?.legs?.[0]?.steps||[];
  el.innerHTML=steps.length?steps.slice(0,25).map((s,i)=>'<div><b>'+(i+1)+'.</b> '+apNavEsc(apNavStepText(s))+' <small>('+apNavKm(s.distance||0)+')</small></div>').join(''):'<div>Rota oluşturunca dönüş listesi burada görünecek.</div>';
};
window.ap93ToggleSteps=function(){const el=document.getElementById('ap93NavSteps');if(!el)return;el.hidden=!el.hidden;if(!el.hidden)window.ap93RenderSteps()};
apNavClearRoute=function(){apNav.selected=0;origClear();};
const init=()=>{try{render()}catch(e){console.warn('Premium view:',e)}};
init();
})();
