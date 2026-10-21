/* ARACIM PRO V127: interactive neon home on a test-only branch.
 * AdMob is native: native 300x250 MREC is mounted into apMrecSlot,
 * bottom banner and interstitial rewarded Java flows remain untouched.
 */
(function(){
'use strict';
if(window.apNeon127Loaded)return;
window.apNeon127Loaded=true;
document.body.classList.add('apNeon127');
const previousView=view;
function quick(icon,label,sub,action,shade){
 return '<button type="button" class="ap127-feature" onclick="'+action+'">'+
  '<span class="ap127-cube '+shade+'">'+icon+'</span>'+
  '<b>'+label+'</b><small>'+sub+'</small></button>';
}
window.ap127Tab=function(which,tab){if(which==='records')recordsTab=tab;else if(which==='plan')planTab=tab;go(which)};
function home(){
 const v=activeVehicle();
 if(v && !v.photo) setTimeout(ensureRef791VehiclePhoto,350);
 const name=v?esc(([v.make,v.model].filter(Boolean).join(' ')||'Aracım')):'Garajım';
 const desc=v?esc([v.year,v.engine,v.fuel,v.transmission].filter(Boolean).join(' • ')):'Araç ekleyerek dijital garajını oluştur';
 const pic=v&&v.photo?v.photo:'r8ui/market.jpg';
 const photoLabel=v&&v.photo?'Aracımın fotoğrafı':'Örnek araç fotoğrafı';
 const svc=v?vf(state.services).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]:null;
 const fuel=v?vf(state.fuel).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]:null;
 const exp=v?vf(state.expenses).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]:null;
 const due=v?upcoming()[0]:null;
 const cost=v?money(totalAll()):'—';
 const svcText=svc?(svc.km?num(svc.km)+' km':'Kayıtlı bakım'):'Kayıt yok';
 const kmText=v?num(v.km||0)+' km':'—';
 const fuelText=fuel?money(fuel.cost||0):'Kayıt yok';
 const fuelDate=fuel?esc(fuel.date||''):'Yakıt ekle';
 const expText=exp?money(exp.cost||0):'Kayıt yok';
 const expName=exp?esc(exp.title||exp.name||exp.category||'Masraf kaydı'):'İlk masrafını kaydet';
 const dueName=due?esc(due.name||due.title||'Yaklaşan bakım'):'Bakım hatırlatmaların';
 const dueSub=due?(due.km<999999?Math.max(0,Math.round(due.km))+' km kaldı':Number.isFinite(due.days)?Math.max(0,due.days)+' gün kaldı':'Kayıtlı hatırlatma'):'Bakımlarını ekle, zamanında öğren';
 const heroButton=v?'openVehicle(\''+esc(v.id)+'\')':'openVehicle()';
 const vehicleButton=v?"go('garage')":"openVehicle()";
 return '<div class="ap127-dashboard">'+
  '<section class="ap127-hero">'+
    '<div class="ap127-hero-photo"><img src="'+pic+'" alt="'+photoLabel+'" onerror="this.style.display=\'none\'"></div>'+
    '<div class="ap127-hero-shade"></div>'+
    '<div class="ap127-hero-info">'+
     '<div class="ap127-overline"><span>ARACIM</span><button onclick="'+vehicleButton+'">Tüm Araçlarım　→</button></div>'+
     '<button type="button" class="ap127-edit" aria-label="Aracı düzenle" onclick="'+heroButton+'">✎</button>'+
     '<h1>'+name+'</h1><p>'+desc+'</p>'+
     (!v?'<button class="ap127-addvehicle" onclick="openVehicle()">＋ Aracımı Ekle</button>':'')+
    '</div>'+
    '<div class="ap127-stats">'+
       '<button onclick="ap127Tab(\'records\',\'fuel\')"><span class="ap127-sticon aqua">⛽</span><span><small>Kilometre</small><b>'+kmText+'</b></span></button>'+
       '<button onclick="ap127Tab(\'records\',\'services\')"><span class="ap127-sticon mint">🔧</span><span><small>Son Bakım</small><b>'+svcText+'</b></span></button>'+
       '<button onclick="go(\'reports\')"><span class="ap127-sticon gold">🪙</span><span><small>Toplam Masraf</small><b>'+cost+'</b></span></button>'+
    '</div>'+
  '</section>'+
  '<section class="ap127-features" aria-label="Araç araçları">'+
   quick('🔧','Bakım','Hatırlatmalar',"ap127Tab('plan','maintenance')",'blue')+
   quick('⛽','Yakıt','Tüketim takibi',"ap127Tab('records','fuel')",'green')+
   quick('🪙','Masraflar','Giderlerini yönet',"ap127Tab('records','expenses')",'amber')+
   quick('📑','Kayıtlar','Tüm kayıtların',"go('records')",'ice')+
   quick('📊','Araç Değeri','Piyasa analizi',"marketValueModal()",'purple')+
   quick('🤖','ARAS AI','Sana yardımcı',"faultGuideModal()",'cyan')+
   quick('🆘','Yol Yardım','Acil durumlarda',"accidentAssistModal()",'red')+
   quick('✚','Daha Fazla','Tüm özellikler',"go('more')",'steel')+
  '</section>'+
  '<section class="ap127-ad-space" aria-label="AdMob orta reklam alanı">'+apMrecCardHtml()+'</section>'+
  '<section class="ap127-today">'+
   '<div class="ap127-today-title"><div><span>▣</span><b>Bugün</b><small>Senin için önemli bilgiler</small></div><button onclick="go(\'records\')">Tümünü Gör　→</button></div>'+
   '<button class="ap127-today-row" onclick="ap127Tab(\'plan\',\'maintenance\')"><i class="gold">🔧</i><span><b>'+dueName+'</b><small>'+dueSub+'</small></span><strong>Hatırlat →</strong></button>'+
   '<button class="ap127-today-row" onclick="ap127Tab(\'records\',\'fuel\')"><i class="mint">⛽</i><span><b>Son yakıt alımı</b><small>'+fuelDate+'</small></span><strong>'+fuelText+'　›</strong></button>'+
   '<button class="ap127-today-row" onclick="ap127Tab(\'records\',\'expenses\')"><i class="purple">▤</i><span><b>Son masraf</b><small>'+expName+'</small></span><strong>'+expText+'　›</strong></button>'+
  '</section>'+
  '<div class="ap127-bottom-note">Alt AdMob banner alanı gezinme çubuğunun altında, Android tarafından yönetilir.</div>'+
 '</div>';
}
view=function(){
  if(current==='home')return home();
  return previousView();
};
const origRender=render;
render=function(){origRender(); if(current==='home') setTimeout(()=>{try{apMrecQueueSync()}catch(e){}},150)};
render();
})();
