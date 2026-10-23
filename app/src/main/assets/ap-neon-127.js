/* V132 premium live dashboard. Every reading is taken from persisted vehicle
 * records; every card is interactive. In-feed 300x250 is a real native AdMob.
 */
(function(){
'use strict';
if(window.ap132Loaded)return;
window.ap132Loaded=true;
window.apNeon127Loaded=true;
document.body.classList.add('apNeon127','ap132');
const priorView=view;

const icons={
 service:'<path d="M22 7a7 7 0 0 1-9 8L6 22a3 3 0 0 1-4-4l7-7a7 7 0 0 1 8-9l-4 5 4 4z"/>',
 fuel:'<rect x="4" y="3" width="12" height="19" rx="2"/><path d="M6 8h8M6 17h8M16 7l4 4v6a2 2 0 0 0 4 0v-6l-3-4"/>',
 expense:'<ellipse cx="12" cy="6" rx="9" ry="3"/><path d="M3 6v6c0 2 4 4 9 4s9-2 9-4V6M3 12v6c0 2 4 4 9 4s9-2 9-4v-6"/>',
 records:'<path d="M6 2h10l4 4v16H6zM16 2v5h4M9 12h8M9 16h8M9 20h5"/>',
 value:'<path d="M3 21h19M6 17v-6M12 17V5M18 17V9"/><rect x="4" y="17" width="4" height="4" rx="1"/><rect x="10" y="17" width="4" height="4" rx="1"/><rect x="16" y="17" width="4" height="4" rx="1"/>',
 ai:'<circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M7.05 7.05l-2.1-2.1m12 12 2.1 2.1M7 12c2.4-4 7.6-4 10 0M8 16c2.2 2 5.8 2 8 0"/>',
 sos:'<path d="M12 2 2 21h20z"/><path d="M12 8v6M12 18h.01"/>',
 more:'<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>',
 check:'<rect x="4" y="4" width="16" height="18" rx="2"/><path d="M8 2v4M16 2v4M4 10h16m-12 5 2 2 5-5"/>',
 speed:'<path d="M3 18a9 9 0 0 1 18 0M12 17l5-7M7 18h.01M17 18h.01"/>',
 calendar:'<rect x="3" y="5" width="18" height="17" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M8 16l2 2 5-5"/>'
};
function symbol(key){
 return '<svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[key]||icons.more)+'</svg>';
}
function quick(key,label,sub,action,color){
 return '<button type="button" class="ap127-feature" onclick="'+action+'" aria-label="'+label+'">'+
 '<span class="ap127-cube '+color+'">'+symbol(key)+'</span><b>'+label+'</b><small>'+sub+'</small></button>';
}
window.ap127Tab=function(which,tab){
 if(which==='records')recordsTab=tab;
 else if(which==='plan')planTab=tab;
 go(which);
};
function safeDate(d){
 if(!d)return '';
 const s=String(d);
 if(/^\d{4}-\d{2}-\d{2}/.test(s))return esc(s.substring(8,10)+'.'+s.substring(5,7)+'.'+s.substring(0,4));
 return esc(s);
}
function daysFromDate(d){
 if(!d)return null;
 const t=Date.parse(String(d).substring(0,10)+'T12:00:00');
 return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/86400000)):null;
}
function home(){
 const v=activeVehicle();
 if(v&&!v.photo) setTimeout(ensureRef791VehiclePhoto,350);
 const name=v?esc([v.make,v.model].filter(Boolean).join(' ')||'Aracım'):'Garajım';
 const specs=v?esc([v.year,v.engine,v.fuel,v.transmission].filter(Boolean).join(' • ')):'Araç ekleyerek dijital garajını oluştur';
 const photo=esc(v?.photo||'r8ui/market.jpg');
 const services=v?vf(state.services||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))):[];
 const maintenance=v?vf(state.maintenance||[]):[];
 const accidents=v?vf(state.accidents||[]):[];
 const batteries=v?vf(state.batteries||[]):[];
 const svc=services[0]||null;
 const fuel=v?vf(state.fuel||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]:null;
 const exp=v?vf(state.expenses||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]:null;
 const due=v?upcoming()[0]:null;
 const scoreData=v?vehicleHealthScore():null;
 const hasScoreData=!!v&&(services.length+maintenance.length+accidents.length+batteries.length)>0;
 const score=hasScoreData&&Number.isFinite(scoreData?.score)?Math.max(0,Math.min(100,Math.round(scoreData.score))):null;
 const gaugeColor=score===null?'#539ab7':score>=80?'#2be9bb':score>=60?'#ffc355':'#ff637b';
 const svcKm=svc&&Number.isFinite(+svc.km)&&+svc.km>0&&+v.km>=+svc.km?Math.max(0,Math.round((+v.km)-(+svc.km))):null;
 const svcText=svc?(svcKm!==null?num(svcKm)+' km önce':safeDate(svc.date||'')||'Kayıtlı bakım'):'Kayıt yok';
 const svcProgress=svcKm!==null?Math.max(7,100-Math.min(100,svcKm/100)):null;
 const cost=v?money(totalAll()):'—';
 const kmText=v?num(v.km||0)+' km':'—';
 const dueLabel=due?esc(due.name||due.title||'Yaklaşan bakım'):'Bakım hatırlatmaların';
 const dueSub=due?(Number.isFinite(due.km)&&due.km<999999?Math.max(0,Math.round(due.km))+' km kaldı':Number.isFinite(due.days)&&due.days<99999?Math.max(0,due.days)+' gün kaldı':'Bakım hatırlatması'):'Bakımlarını ekle, zamanında öğren';
 const dueUrgent=due&&(due.days<=7||due.km<=500);
 const fuelSub=fuel?safeDate(fuel.date)+' • '+money(fuel.cost||0):'Yakıt ekle';
 const fuelRight=fuel?esc(fuel.station||fuel.brand||'Kayıtlı'):'Kayıt yok';
 const expSub=exp?esc(exp.title||exp.name||exp.category||'Masraf kaydı'):'İlk masrafını kaydet';
 const expRight=exp?money(exp.cost||0):'Kayıt yok';
 const heroAction=v?"openVehicle('"+esc(v.id)+"')":"openVehicle()";
 return '<div class="ap127-dashboard">'+
  '<section class="ap127-hero" aria-label="Dijital garaj">'+
   '<div class="ap127-hero-photo"><img src="'+photo+'" alt="'+(v?name:'Örnek araç')+'" onerror="this.style.display=\'none\'"></div>'+
   '<div class="ap127-hero-shade"></div>'+
   '<div class="ap127-hero-info">'+
    '<div class="ap127-overline"><span>ARACIM</span><button onclick="go(\'garage\')">Tüm Araçlarım　→</button></div>'+
    '<button type="button" class="ap127-edit" aria-label="Aracı düzenle" onclick="'+heroAction+'">✎</button>'+
    '<h1>'+name+'</h1><p>'+specs+'</p>'+
    (!v?'<button class="ap127-addvehicle" onclick="openVehicle()">＋ Aracımı Ekle</button>':'')+
   '</div>'+
   '<div class="ap132-hero-bottom">'+
    '<button class="ap132-health '+(score===null?'unknown':'')+'" onclick="'+(v?'vehicleHealthModal()':'openVehicle()')+'" aria-label="Araç sağlık puanını gör" style="--gauge:'+gaugeColor+';--angle:'+(score===null?0:score*3.6)+'deg">'+
     '<span class="ap132-health-core"><small>Araç Sağlığı</small><b>'+(score===null?'—':score)+'</b><em>'+(score===null?'Kayıt ekle':'/100')+'</em></span>'+
    '</button>'+
    '<div class="ap127-stats">'+
      '<button onclick="ap127Tab(\'records\',\'fuel\')"><span class="ap127-sticon aqua">'+symbol('speed')+'</span><span><small>Kilometre</small><b>'+kmText+'</b></span></button>'+
      '<button onclick="ap127Tab(\'records\',\'services\')"><span class="ap127-sticon mint">'+symbol('service')+'</span><span><small>Son Bakım</small><b>'+svcText+'</b>'+(svcProgress!==null?'<i class="ap132-progress"><i style="width:'+svcProgress+'%"></i></i>':'')+'</span></button>'+
      '<button onclick="go(\'reports\')"><span class="ap127-sticon gold">'+symbol('expense')+'</span><span><small>Toplam Masraf</small><b>'+cost+'</b></span></button>'+
    '</div>'+
   '</div>'+
  '</section>'+
  '<section class="ap127-ad-space" aria-label="AdMob 300x250 sponsorlu reklam">'+apMrecCardHtml()+'</section>'+
  '<section class="ap127-features" aria-label="Araç özellikleri">'+
   quick('service','Bakım','Hatırlatmalar',"ap127Tab('plan','maintenance')",'blue')+
   quick('fuel','Yakıt','Tüketim takibi',"ap127Tab('records','fuel')",'green')+
   quick('expense','Masraflar','Giderlerini yönet',"ap127Tab('records','expenses')",'amber')+
   quick('records','Kayıtlar','Tüm kayıtların',"go('records')",'ice')+
   quick('value','Araç Değeri','Piyasa analizi',"marketValueModal()",'purple')+
   quick('ai','ARAS AI','Sana yardımcı',"faultGuideModal()",'cyan')+
   quick('sos','Yol Yardım','Acil durumlarda',"accidentAssistModal()",'red')+
   quick('more','Daha Fazla','Tüm özellikler',"go('more')",'steel')+
  '</section>'+
  '<section class="ap127-today">'+
   '<div class="ap127-today-title"><div><span>'+symbol('calendar')+'</span><b>Bugün</b><small>Senin için önemli bilgiler</small></div><button onclick="go(\'records\')">Tümünü Gör　→</button></div>'+
   '<button class="ap127-today-row" onclick="ap127Tab(\'plan\',\'maintenance\')"><i class="'+(dueUrgent?'warn':'gold')+'">'+symbol('service')+'</i><span><b>'+dueLabel+'</b><small>'+dueSub+'</small></span><strong class="'+(dueUrgent?'hot':'')+'">Hatırlat →</strong></button>'+
   '<button class="ap127-today-row" onclick="ap127Tab(\'records\',\'fuel\')"><i class="mint">'+symbol('fuel')+'</i><span><b>Son yakıt alımı</b><small>'+fuelSub+'</small></span><strong>'+fuelRight+'　›</strong></button>'+
   '<button class="ap127-today-row" onclick="ap127Tab(\'records\',\'expenses\')"><i class="purple">'+symbol('expense')+'</i><span><b>Son masraf</b><small>'+expSub+'</small></span><strong>'+expRight+'　›</strong></button>'+
  '</section>'+
 '</div>';
}
view=function(){return current==='home'?home():priorView()};
/* The in-feed real 300x250 MREC must not cover any other card or navigation. */
window.apSyncMrecSlot=function(){
 apMrecFrameQueued=false;
 try{
  if(typeof Android==='undefined'||!Android.updateMrecSlot)return;
  const slot=document.getElementById('apMrecSlot'),vw=window.innerWidth;
  if(!slot||document.hidden||Date.now()<apMrecScrollBlockedUntil){
   Android.updateMrecSlot(0,0,0,0,vw,false);return;
  }
  const r=slot.getBoundingClientRect();
  const overlayOpen=['modalRoot','lockRoot'].some(id=>{const e=document.getElementById(id);return !!(e&&e.innerHTML.trim())});
  const nav=document.querySelector('nav.nav, .nav');
  const navTop=nav?nav.getBoundingClientRect().top:window.innerHeight-86;
  const header=document.querySelector('#app>.header');
  const topGuard=header?header.getBoundingClientRect().bottom+6:85;
  const visible=document.body.classList.contains('apMrecReady')&&!overlayOpen
    && r.width>=299 && r.height>=249 && r.left>=0 && r.right<=vw+2
    && r.top>=Math.max(170,topGuard) && r.bottom<=Math.min(window.innerHeight-86,navTop-10);
  Android.updateMrecSlot(r.left,r.top,r.width,r.height,vw,visible);
 }catch(e){}
};
const prevRender=render;
render=function(){prevRender();setTimeout(()=>{try{apMrecQueueSync()}catch(e){}},125)};
render();
})();