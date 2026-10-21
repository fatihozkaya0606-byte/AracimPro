/* Aracim Pro V120 — embedded 3D OpenFreeMap preview + Google Maps navigation.
   No API keys, backend, or user-location persistence. */
(function(){
'use strict';
if(window.ap120NavigationLoaded)return;
window.ap120NavigationLoaded=true;
const ASSET='https://appassets.androidplatform.net/assets/3d-map-120.html';
let selectedTarget='';
window.ap120OpenRoute=function(){
  const v=typeof activeVehicle==='function'?activeVehicle():null;
  const avg=v&&typeof avgConsumption==='function'?Number(avgConsumption()):0;
  const price=v&&typeof lastFuelPrice==='function'?Number(lastFuelPrice()):0;
  const html='<div class="ap120Route">'+
    '<div class="ap120Hero"><b>🧭 R8 • 3D Harita ve Navigasyon</b>'+
    '<p>Haritayı sürükle, döndür ve 3D binaları gör. Noktaya dokunarak hedef seç veya aşağıya adres yaz.</p></div>'+
    '<div class="ap120MapBox"><iframe id="ap120MapFrame" title="Aracım Pro 3 boyutlu harita" src="'+ASSET+'" loading="eager" referrerpolicy="no-referrer"></iframe></div>'+
    '<div class="ap120MapActions">'+
    '<button type="button" class="secondary" id="ap120Locate">⌖ Konumumu Göster</button>'+
    '<button type="button" class="secondary" id="ap120Tilt">◇ 3D / 2D Değiştir</button></div>'+
    '<form id="ap120RouteForm">'+
    '<label class="ap120Destination" for="ap120Dest">Nereye gitmek istiyorsun?'+
    '<input type="text" id="ap120Dest" name="destination" required maxlength="150" autocomplete="off" placeholder="Örn: Anıtkabir, Ankara"></label>'+
    '<div class="ap120Status" id="ap120Status" role="status">Haritadan nokta seçebilir veya hedefin adını yazabilirsin. Rota ve trafik Google Haritalar ile hesaplanır.</div>'+
    '<button type="submit" class="primary ap120Start">▶ Google Haritalar ile Navigasyonu Başlat</button></form>'+
    '<p class="ap120Foot">3D görünüm: MapLibre + OpenFreeMap / OpenStreetMap. Bina yükseklikleri her bölgede aynı ayrıntıda değildir. GPS için izin isteyeceğiz. Gerçek dönüş talimatları ve trafik Google Haritalar tarafından sağlanır.</p>'+
   '</div>';
  modal('🧭 R8 • 3D Navigasyon',html);
  selectedTarget='';
  const f=document.getElementById('ap120RouteForm');
  if(f)f.addEventListener('submit',function(e){
    e.preventDefault();
    const destination=String(f.elements.destination.value||'').trim();
    if(destination.length<2){if(typeof toast==='function')toast('Hedef gir veya haritadan bir nokta seç');return}
    const url='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(destination)+'&travelmode=driving&dir_action=navigate';
    try{Android.openUri(url,'')}catch(e){try{openOfficialUrl(url)}catch(_){}}
  });
  const locate=document.getElementById('ap120Locate');
  if(locate)locate.addEventListener('click',()=>{
    const node=document.getElementById('ap120Status');
    if(node)node.textContent='Konum isteniyor. İlk seferde izin vermen gerekebilir.';
    try{
      if(typeof Android==='undefined'||typeof Android.locateMap120!=='function'){
       if(node)node.textContent='Bu sürümde konum servisi bulunamadı. Hedefi haritadan seçebilirsin.';return;
      }
      Android.locateMap120();
    }catch(err){if(node)node.textContent='Konum servisine erişilemedi.';}
  });
  let tilted=true;
  const toggle=document.getElementById('ap120Tilt');
  if(toggle)toggle.addEventListener('click',()=>{
    tilted=!tilted;
    postMap({type:'ap120-tilt',pitch:tilted?57:0});
  });
};
function postMap(message){
 const frame=document.getElementById('ap120MapFrame');
 if(frame&&frame.contentWindow)frame.contentWindow.postMessage(message,'https://appassets.androidplatform.net');
}
window.addEventListener('message',function(e){
 const frame=document.getElementById('ap120MapFrame');
 if(!frame||e.source!==frame.contentWindow||e.origin!=='https://appassets.androidplatform.net')return;
 if(!e.data||e.data.type!=='ap120-destination')return;
 const lat=Number(e.data.lat),lon=Number(e.data.lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return;
 selectedTarget=lat.toFixed(6)+','+lon.toFixed(6);
 const input=document.getElementById('ap120Dest');
 if(input)input.value=selectedTarget;
 const status=document.getElementById('ap120Status');
 if(status)status.textContent='Hedef haritadan seçildi: '+selectedTarget+'. Navigasyonu başlatabilirsin.';
});
window.ap120NativeLocation=function(lat,lon,error){
 const box=document.getElementById('ap120Status');
 if(!document.getElementById('ap120MapFrame'))return;
 const a=Number(lat),b=Number(lon);
 if(error){if(box)box.textContent=String(error).slice(0,170);return;}
 if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a)>90||Math.abs(b)>180)return;
 postMap({type:'ap120-center',lat:a,lon:b});
 if(box)box.textContent='Harita konumuna yaklaştırıldı. Bir hedef noktası seçebilirsin.';
};
})();

/* V127 separate-install interactive dashboard preview; no changes to native ads. */
(function(){
 if(window.ap127BootScheduled)return;
 window.ap127BootScheduled=true;
 const style=document.createElement('link');
 style.rel='stylesheet';
 style.href='ap-neon-127.css';
 document.head.appendChild(style);
 const script=document.createElement('script');
 script.src='ap-neon-127.js';
 script.addEventListener('error',()=>console.error('V127 neon preview could not load'));
 document.body.appendChild(script);
})();
