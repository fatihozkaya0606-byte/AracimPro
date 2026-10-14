/* V94 fixes: keep map spacious; query on explicit search; route details expand on demand. */
(function(){
'use strict';
const orig=window.ap93ToggleSteps;
window.ap93ToggleSteps=function(){
 const el=document.getElementById('ap93NavSteps'),screen=document.querySelector('.apNavScreen');
 if(!el||!screen)return;
 const show=el.hidden;
 el.hidden=!show;
 screen.classList.toggle('ap94Expanded',show);
 if(show && window.ap93RenderSteps)window.ap93RenderSteps();
 const button=document.querySelector('.ap93NavDetailButton');
 if(button)button.textContent=show?'⌃ Ayrıntıları kapat':'≡ Rota ayrıntılarını göster';
 if(apNav.map)setTimeout(()=>apNav.map.invalidateSize(),80);
};
const originalSearchResults=window.apNavSearchResults;
window.apNavSearchResults=function(payload){
 let entries=[];try{entries=JSON.parse(payload||'[]')}catch(e){}
 if(Array.isArray(entries)&&entries.length){originalSearchResults(payload);return}
 const q=(document.getElementById('apNavSearch')?.value||'').trim();
 if(q.length<2){originalSearchResults('[]');return}
 const box=document.getElementById('apNavResults');
 if(box){box.hidden=false;box.textContent='Alternatif adres kaynağı aranıyor…'}
 /* Photon is queried only after user presses ARA and Android Geocoder has no result.
    No fabricated suggestions; on network failure show explicit error. */
 const reqId=++(window.ap94SearchReq||0);
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),8500);
 fetch('https://photon.komoot.io/api/?q='+encodeURIComponent(q+', Türkiye')+'&limit=6&lang=tr',{signal:controller.signal})
 .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()})
 .then(d=>{
   if(reqId!==window.ap94SearchReq || current!=='navigation' || (document.getElementById('apNavSearch')?.value||'').trim()!==q)return;
   const arr=(d.features||[]).filter(x=>x.geometry?.type==='Point'&&Array.isArray(x.geometry.coordinates))
    .slice(0,6).map(x=>({lat:x.geometry.coordinates[1],lon:x.geometry.coordinates[0],
      name:[x.properties?.name,x.properties?.street,x.properties?.city,x.properties?.state,x.properties?.country]
      .filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', ')||q}));
   originalSearchResults(JSON.stringify(arr));
 })
 .catch(e=>{if(reqId!==window.ap94SearchReq)return;originalSearchResults('[]');
   const b=document.getElementById('apNavResults');
   if(b){b.hidden=false;b.textContent='Adres araması başarısız. İnterneti kontrol et veya haritadan hedef seç.'}
 })
 .finally(()=>clearTimeout(timeout));
};
})();
