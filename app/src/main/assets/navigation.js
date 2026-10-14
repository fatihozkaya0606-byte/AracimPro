/* Aracım Pro Navigasyon • separate test edition. BSD-2-Clause Leaflet + OSM / OSRM demo. */
var apNav = {
  map:null, mapEl:null, tile:null, meMarker:null, endMarker:null, line:null,
  routes:[], route:null, dest:null, pos:null, origin:null, active:false,
  firstGps:true, searchResults:[], searchBusy:false, searchReq:0,
  request:null, requestNo:0, tracking:false, following:true, voice:true,
  lastSpoken:-1, stepIndex:0, lastReroute:0, loaded:false
};
function apNavView(){
  return '<section class="apNavScreen" aria-label="Aracım Pro navigasyon">'+
    '<div id="apNavMap" class="apNavMap"><div class="apNavMapLoading">Harita hazırlanıyor…</div></div>'+
    '<div class="apNavHeader">'+
      '<button class="apNavBack" onclick="go(\'home\')" aria-label="Geri">‹</button>'+
      '<div class="apNavTitle"><b>NAVİGASYON <em>PRO</em></b><span>Canlı GPS • Yol tarifi • Sesli yönlendirme</span></div>'+
      '<button class="apNavLocate" onclick="apNavCenter()" title="Konumuma dön">⌖</button>'+
    '</div>'+
    '<div class="apNavSearchWrap"><div class="apNavSearchBar">'+
      '<span class="apNavSearchIcon">⌕</span>'+
      '<input id="apNavSearch" type="search" autocomplete="off" placeholder="Nereye gitmek istiyorsun?" onkeydown="if(event.key===\'Enter\'){event.preventDefault();apNavSearchPlaces()}" />'+
      '<button onclick="apNavSearchPlaces()" title="Ara">ARA</button>'+
      '</div><div id="apNavResults" class="apNavResults" hidden></div></div>'+
    '<div class="apNavControls">'+
      '<button onclick="apNavCenter()" title="GPS konumumu göster">◎<span>Konumum</span></button>'+
      '<button onclick="apNavZoom(1)" title="Yakınlaştır">＋</button>'+
      '<button onclick="apNavZoom(-1)" title="Uzaklaştır">－</button>'+
      '<button onclick="apNavToggleVoice()" id="apNavVoice" title="Sesli yönlendirme">🔊</button>'+
    '</div>'+
    '<div class="apNavBottom">'+
      '<div class="apNavTopline"><b id="apNavInstruction">Hedef ara veya haritaya dokun</b><span id="apNavSpeed">0 km/sa</span></div>'+
      '<div class="apNavMetrics"><div><strong id="apNavDistance">—</strong><small>Mesafe</small></div>'+
      '<div><strong id="apNavDuration">—</strong><small>Tahmini süre</small></div>'+
      '<div><strong id="apNavEta">—</strong><small>Varış</small></div></div>'+
      '<div id="apNavInfo" class="apNavInfo">GPS izni ver. Haritaya dokunarak hedef seçebilir veya yukarıdan arayabilirsin.</div>'+
      '<div class="apNavBottomButtons">'+
      '<button class="apNavStart" id="apNavStart" onclick="apNavToggleGuidance()" disabled>ROTA HAZIRLANIYOR</button>'+
      '<button class="apNavStop" onclick="apNavClearRoute()">Temizle</button>'+
      '</div>'+
      '<div class="apNavDisclaimer">TEST • OSM / OSRM demo verileri • Canlı trafik, yol kapanışı ve hız limiti doğrulaması yok. Trafik işaretlerine uy.</div>'+
    '</div></section>';
}
function apNavEl(id){return document.getElementById(id);}
function apNavInfo(msg){var el=apNavEl('apNavInfo');if(el)el.textContent=msg;}
function apNavText(id, value){var e=apNavEl(id);if(e)e.textContent=value;}
function apNavAfterRender(){
  if(current!=='navigation')return;
  var element=apNavEl('apNavMap');
  if(!element)return;
  if(apNav.map && apNav.mapEl !== element){apNav.map.remove();apNav.map=null;apNav.meMarker=null;apNav.endMarker=null;apNav.line=null;}
  if(typeof L==='undefined'){
    apNavInfo('Harita yükleniyor; internet bağlantısı gerekiyor.');
    element.innerHTML='<div class="apNavMapLoading">Harita altyapısı yükleniyor…</div>';
    apNav.loaderRetry=(apNav.loaderRetry||0)+1;
    if(apNav.loaderRetry<25)setTimeout(function(){if(current==='navigation')apNavAfterRender();},600);
    else apNavInfo('Harita yüklenemedi. İnternetini kontrol edip sayfadan çıkıp tekrar gir.');
    return;
  }
  apNav.loaderRetry=0;
  if(!apNav.map){
    element.innerHTML='';
    apNav.map=L.map(element,{zoomControl:false,preferCanvas:true,attributionControl:true});
    apNav.mapEl=element;
    apNav.map.setView([40.15,32.70],9);
    apNav.tile=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      minZoom:3,maxZoom:19,maxNativeZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(apNav.map);
    apNav.map.on('click',function(e){apNavSelectDestination(e.latlng.lat,e.latlng.lng,'Haritada seçilen nokta');});
    apNav.map.on('dragstart',function(){apNav.following=false;});
    if(apNav.pos)apNavPaintGps();
    if(apNav.dest)apNavPaintDest();
    if(apNav.route)apNavPaintRoute();
  }
  setTimeout(function(){if(apNav.map)apNav.map.invalidateSize();},220);
  apNav.tracking=true;
  try{Android.navStartTracking();}catch(e){apNavInfo('Konum erişimi açılamadı: '+e.message);}
  apNavInfo(apNav.pos?'Konum hazır. Hedef ara veya haritadan seç.':'GPS konumu bekleniyor; izin gerekiyorsa onayla.');
  apNavUpdateBottom();
}
function apNavOnExit(){
  if(!apNav.tracking)return;
  apNav.tracking=false;
  if(apNav.request){try{apNav.request.abort();}catch(e){}apNav.request=null;}
  try{Android.navStopTracking();}catch(e){}
}
function apNavPinClass(type){return L.divIcon({className:'apNavPin '+type,html:type==='start'?'➤':'◆',iconSize:[33,33],iconAnchor:[16,16]});}
function apNavPaintGps(){
  if(!apNav.map||!apNav.pos)return;
  var point=[apNav.pos.lat,apNav.pos.lon];
  if(!apNav.meMarker)apNav.meMarker=L.marker(point,{icon:apNavPinClass('start'),zIndexOffset:1200}).addTo(apNav.map);
  else apNav.meMarker.setLatLng(point);
  if(apNav.firstGps){apNav.map.setView(point,15,{animate:true});apNav.firstGps=false;}
  else if(apNav.active&&apNav.following)apNav.map.panTo(point,{animate:true,duration:.6});
}
function apNavPaintDest(){
  if(!apNav.map||!apNav.dest)return;
  var point=[apNav.dest.lat,apNav.dest.lon];
  if(!apNav.endMarker)apNav.endMarker=L.marker(point,{icon:apNavPinClass('end'),zIndexOffset:1000}).addTo(apNav.map);
  else apNav.endMarker.setLatLng(point);
  apNav.endMarker.bindPopup(apNavEsc(apNav.dest.name||'Hedef'));
}
function apNavEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]});}
function apNavCenter(){
  apNav.following=true;
  if(apNav.map&&apNav.pos)apNav.map.setView([apNav.pos.lat,apNav.pos.lon],16,{animate:true});
  else{try{Android.navStartTracking();}catch(e){}apNavInfo('GPS sinyali bekleniyor.');}
}
function apNavZoom(n){if(apNav.map)apNav.map.setZoom(apNav.map.getZoom()+n);}
function apNavSelectDestination(lat,lon,name){
  if(!Number.isFinite(+lat)||!Number.isFinite(+lon))return;
  apNav.dest={lat:+lat,lon:+lon,name:name||'Seçilen hedef'};
  apNav.active=false;apNav.route=null;apNav.routes=[];apNav.lastSpoken=-1;
  var input=apNavEl('apNavSearch');if(input)input.value=apNav.dest.name;
  var box=apNavEl('apNavResults');if(box)box.hidden=true;
  if(apNav.map && apNav.line){apNav.map.removeLayer(apNav.line);apNav.line=null;}
  apNavPaintDest();
  apNavLoadRoute(false);
}
function apNavSearchPlaces(){
  var input=apNavEl('apNavSearch'),q=input&&input.value.trim();
  if(!q)return apNavInfo('Hedef aramak için bir yer adı yaz.');
  if(q.length>110)return apNavInfo('Yer adını biraz kısalt.');
  var m=q.match(/^(-?\d{1,2}\.\d+)\s*[,; ]\s*(-?\d{1,3}\.\d+)$/);
  if(m){apNavSelectDestination(+m[1],+m[2],'Koordinat: '+q);return;}
  apNavInfo('Adres aranıyor…');
  var box=apNavEl('apNavResults');if(box){box.hidden=false;box.textContent='Adres aranıyor…';}
  try{Android.navSearchPlaces(q);}catch(e){apNavInfo('Adres araması bu cihazda kullanılamadı. Haritadan nokta seç.');}
}
window.apNavSearchResults=function(payload){
  if(current!=='navigation')return;
  var results=[];try{results=JSON.parse(payload||'[]');}catch(e){}
  apNav.searchResults=Array.isArray(results)?results:[];
  var box=apNavEl('apNavResults');if(!box)return;
  box.hidden=false;
  if(!apNav.searchResults.length){box.textContent='Sonuç bulunamadı. Şehir/ilçe ekleyerek ara veya haritaya dokun.';apNavInfo('Adres bulunamadı.');return;}
  box.innerHTML=apNav.searchResults.slice(0,5).map(function(a,i){return '<button onclick="apNavChooseResult('+i+')"><b>📍 '+apNavEsc(a.name)+'</b><small>'+Number(a.lat).toFixed(5)+', '+Number(a.lon).toFixed(5)+'</small></button>'}).join('');
  apNavInfo('Hedef seçmek için sonuçlardan birine dokun.');
};
function apNavChooseResult(i){var a=apNav.searchResults[i];if(a)apNavSelectDestination(a.lat,a.lon,a.name);}
function apNavKm(m){return m>=1000?(m/1000).toFixed(m>=10000?0:1)+' km':Math.round(m)+' m';}
function apNavDuration(s){var mins=Math.max(1,Math.round(s/60));return mins>=60?Math.floor(mins/60)+' sa '+(mins%60)+' dk':mins+' dk';}
function apNavNowETA(s){return new Date(Date.now()+s*1000).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});}
function apNavLoadRoute(isReroute){
  if(!apNav.dest)return;
  if(!apNav.pos){apNavInfo('GPS konumu bekleniyor. Konum iznini ver ve açık alanda bekle.');return;}
  if(apNav.request){try{apNav.request.abort();}catch(e){}}
  var serial=++apNav.requestNo;
  var controller=new AbortController();apNav.request=controller;
  var timer=setTimeout(function(){controller.abort();},13000);
  apNavInfo(isReroute?'Rota yeniden hesaplanıyor…':'En uygun sürüş rotası hesaplanıyor…');
  apNavText('apNavInstruction','ROTA HESAPLANIYOR');
  var coords=[apNav.pos.lon,apNav.pos.lat,apNav.dest.lon,apNav.dest.lat].map(function(n){return Number(n).toFixed(6)});
  var url='https://router.project-osrm.org/route/v1/driving/'+coords[0]+','+coords[1]+';'+coords[2]+','+coords[3]+'?overview=full&geometries=geojson&steps=true&alternatives=true';
  fetch(url,{signal:controller.signal}).then(function(r){if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(function(data){
    if(serial!==apNav.requestNo)return;
    if(data.code!=='Ok'||!data.routes||!data.routes.length)throw Error('Rota bulunamadı');
    apNav.routes=data.routes;apNav.route=data.routes[0];apNav.active=isReroute&&apNav.active;apNav.stepIndex=0;apNav.lastSpoken=-1;
    apNavPaintRoute();apNavUpdateBottom();
    apNavInfo('Rota hazır. '+(data.routes.length>1?'Alternatif rotalar da bulundu. ':'')+'Başlat düğmesine basarak yönlendirmeye geç.');
    if(apNav.active)apNavSpeak('Rota yeniden hesaplandı.');
  }).catch(function(err){
    if(serial!==apNav.requestNo)return;
    if(err.name==='AbortError')apNavInfo('Rota isteği zaman aşımına uğradı. Tekrar deneyebilirsin.');
    else apNavInfo('Rota servisi yanıt vermedi: '+err.message+'. Harita üzerinden hedef seçimi çalışmaya devam eder.');
    apNavText('apNavInstruction','Rota alınamadı');
  }).finally(function(){clearTimeout(timer);if(serial===apNav.requestNo)apNav.request=null;});
}
function apNavPaintRoute(){
  if(!apNav.map||!apNav.route)return;
  if(apNav.line){apNav.map.removeLayer(apNav.line);apNav.line=null;}
  var features=apNav.routes.map(function(r,i){return {type:'Feature',geometry:r.geometry,properties:{id:i}}});
  apNav.line=L.geoJSON({type:'FeatureCollection',features:features},{style:function(f){
    return {color:f.properties.id===0?'#1f76ff':'#7ca8d8',weight:f.properties.id===0?7:4,opacity:f.properties.id===0?.95:.42};
  }}).addTo(apNav.map);
  if(!apNav.active){try{apNav.map.fitBounds(apNav.line.getBounds(),{padding:[35,35],maxZoom:15});}catch(e){}}
}
function apNavToggleGuidance(){
  if(!apNav.route){apNavLoadRoute(false);return;}
  apNav.active=!apNav.active;
  apNav.following=apNav.active;
  apNavUpdateBottom();
  if(apNav.active){
    apNavCenter();
    apNavSpeak('Navigasyon başladı. Lütfen yola odaklanın.');
    apNavInfo('Navigasyon açık • GPS hareketine göre dönüşleri izle.');
  }else{try{Android.navStopSpeech();}catch(e){}apNavInfo('Yönlendirme duraklatıldı.');}
}
function apNavToggleVoice(){apNav.voice=!apNav.voice;var e=apNavEl('apNavVoice');if(e)e.textContent=apNav.voice?'🔊':'🔇';if(!apNav.voice){try{Android.navStopSpeech();}catch(e){}}}
function apNavSpeak(txt){if(!apNav.voice||!apNav.active)return;try{Android.navSpeak(String(txt).slice(0,230));}catch(e){}}
function apNavClearRoute(){
  apNav.active=false;apNav.route=null;apNav.routes=[];apNav.dest=null;apNav.stepIndex=0;apNav.lastSpoken=-1;
  if(apNav.map){if(apNav.line)apNav.map.removeLayer(apNav.line);if(apNav.endMarker)apNav.map.removeLayer(apNav.endMarker);}
  apNav.line=null;apNav.endMarker=null;
  var input=apNavEl('apNavSearch');if(input)input.value='';
  var box=apNavEl('apNavResults');if(box)box.hidden=true;
  apNavUpdateBottom();
  apNavInfo('Yeni rota için hedef ara veya haritaya dokun.');
  try{Android.navStopSpeech();}catch(e){}
}
function apNavHaversine(a,b){
  var R=6371000,rd=Math.PI/180,dLat=(b.lat-a.lat)*rd,dLon=(b.lon-a.lon)*rd;
  var x=Math.sin(dLat/2)**2+Math.cos(a.lat*rd)*Math.cos(b.lat*rd)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));
}
function apNavNextStep(){
  if(!apNav.route)return null;
  var legs=apNav.route.legs||[],steps=legs[0]?legs[0].steps||[]:[];
  if(!steps.length)return null;
  var index=Math.min(apNav.stepIndex,steps.length-1);
  for(var i=index;i<steps.length-1;i++){
    var m=steps[i].maneuver&&steps[i].maneuver.location;
    if(!m)continue;
    var dist=apNav.pos?apNavHaversine(apNav.pos,{lat:m[1],lon:m[0]}):Infinity;
    if(dist<27&&apNav.active){apNav.stepIndex=Math.min(i+1,steps.length-1);index=apNav.stepIndex;}else break;
  }
  return steps[index];
}
function apNavStepText(s){
  if(!s)return 'Rota hazır';
  var type=s.maneuver&&s.maneuver.type||'',dir=s.maneuver&&s.maneuver.modifier||'',n=s.name||'yol';
  if(type==='arrive')return 'Hedefine ulaştın';
  if(type==='depart')return n+' yönünde ilerle';
  if(type==='roundabout'||type==='rotary')return 'Dönel kavşağı takip et';
  var labels={right:'sağa',left:'sola','slight right':'hafif sağa','slight left':'hafif sola','sharp right':'keskin sağa','sharp left':'keskin sola','straight':'düz','uturn':'U dönüşü'};
  return (labels[dir]||'İleri')+' dön'+(n?' • '+n:'');
}
function apNavUpdateBottom(){
  var route=apNav.route,btn=apNavEl('apNavStart');
  if(btn){btn.disabled=!route;btn.textContent=!route?'ROTA BEKLENİYOR':apNav.active?'DURAKLAT':'YÖNLENDİRMEYİ BAŞLAT';}
  if(!route){apNavText('apNavDistance','—');apNavText('apNavDuration','—');apNavText('apNavEta','—');apNavText('apNavInstruction','Hedef ara veya haritaya dokun');return;}
  var step=apNavNextStep();
  apNavText('apNavDistance',apNavKm(route.distance));
  apNavText('apNavDuration',apNavDuration(route.duration));
  apNavText('apNavEta',apNavNowETA(route.duration));
  apNavText('apNavInstruction',step?apNavStepText(step):'Rota hazır');
}
function apNavOffRoute(){
  if(!apNav.route||!apNav.pos||!apNav.active)return false;
  if(!apNav.pos.accuracy || apNav.pos.accuracy>45)return false;
  var coordinates=apNav.route.geometry.coordinates||[];
  if(!coordinates.length)return false;
  var nearest=Infinity;
  for(var i=0;i<coordinates.length;i+=Math.max(1,Math.floor(coordinates.length/450))){
    var c=coordinates[i],m=apNavHaversine(apNav.pos,{lat:c[1],lon:c[0]});
    if(m<nearest)nearest=m;
  }
  return nearest>130;
}
window.apNavGps=function(payload){
  if(!apNav.tracking)return;
  var p=payload;
  if(typeof p==='string'){try{p=JSON.parse(p);}catch(e){return;}}
  if(!p||!Number.isFinite(+p.lat)||!Number.isFinite(+p.lon))return;
  if(p.time && Date.now()-p.time>90000)return;
  apNav.pos={lat:+p.lat,lon:+p.lon,accuracy:+p.accuracy||0,speed:+p.speed||0,bearing:+p.bearing||0,time:p.time||Date.now()};
  apNavPaintGps();
  apNavText('apNavSpeed',Math.round(apNav.pos.speed)+' km/sa');
  if(apNav.dest&&!apNav.route&&!apNav.request)apNavLoadRoute(false);
  if(!apNav.active||!apNav.route)return;
  var s=apNavNextStep();
  if(s){
    apNavText('apNavInstruction',apNavStepText(s));
    var m=s.maneuver&&s.maneuver.location;
    var d=m?apNavHaversine(apNav.pos,{lat:m[1],lon:m[0]}):Infinity;
    var idx=apNav.stepIndex;
    if(d<210&&idx!==apNav.lastSpoken){apNav.lastSpoken=idx;apNavSpeak((d>70?Math.round(d/10)*10+' metre sonra ':'')+apNavStepText(s));}
  }
  if(apNav.dest&&apNavHaversine(apNav.pos,apNav.dest)<38){
    apNavSpeak('Hedefine ulaştın');apNav.active=false;apNavText('apNavInstruction','HEDEFE ULAŞTIN');apNavInfo('Güvenli şekilde park ederek navigasyonu sonlandırabilirsin.');
  }else if(Date.now()-apNav.lastReroute>90000&&apNavOffRoute()){
    apNav.lastReroute=Date.now();apNavLoadRoute(true);
  }
};
