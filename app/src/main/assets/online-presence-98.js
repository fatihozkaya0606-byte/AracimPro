/* Aracım Pro v98 • actual Firebase online presence (no fabricated counts). */
(function(){
'use strict';
let ap98Count=null,ap98Error='',ap98CheckedAt=0;
const earlierHome=homeView,earlierHeader=header,earlierPresence=window.onPresenceCount;
function ap98OnlineCard(){
 const loaded=ap98Count!==null;
 const stateText=loaded?'Bağlı • Son 2 dakika':ap98Error?'Bağlantı kurulamadı':'Canlı veri bekleniyor';
 return '<section class="ap98Online" aria-label="Çevrimiçi kullanıcı durumu">'+
  '<span class="ap98OnlineIcon" aria-hidden="true">👥</span>'+
  '<span class="ap98OnlineCopy"><strong>Şu an uygulamada</strong>'+
  '<small id="ap98OnlineStatus">'+stateText+'</small></span>'+
  '<span class="ap98OnlineNumber" id="ap98OnlineCount" aria-live="polite">'+
  (loaded?String(ap98Count):'—')+' <small>kişi</small></span>'+
  '<button class="ap98OnlineRefresh" type="button" onclick="ap98RefreshOnline()" aria-label="Kullanıcı sayısını yenile">↻</button>'+
  '</section>';
}
homeView=function(){
 const markup=earlierHome();
 if(!markup.includes('<div class="n97Dashboard">'))return markup;
 return markup.replace('<div class="n97Dashboard">','<div class="n97Dashboard">'+ap98OnlineCard());
};
header=function(){
 const html=earlierHeader();
 // Preserve clock, buttons, AdMob, vehicle selector, and existing counter.
 return html.replace(/(<span class="apLiveMini active"[^>]*>)[\s\S]*?(<\/span>)/,
   '<span class="apLiveMini active" title="Son 2 dakikada uygulaması açık cihaz sayısı">'+
   '<b id="apActiveUsers">—</b> çevrimiçi</span>');
};
window.onPresenceCount=function(count,error){
 if(typeof earlierPresence==='function')earlierPresence(count,error);
 const n=Number(count),ok=Number.isInteger(n)&&n>=0;
 ap98Count=ok?n:null;
 ap98Error=ok?'':String(error||'Bağlantı yok');
 ap98CheckedAt=Date.now();
 const number=document.getElementById('ap98OnlineCount');
 if(number)number.innerHTML=(ok?String(n):'—')+' <small>kişi</small>';
 const status=document.getElementById('ap98OnlineStatus');
 if(status)status.textContent=ok?'Bağlı • Son 2 dakika':'Canlı sayı alınamıyor';
 const box=document.querySelector('.ap98Online');
 if(box)box.classList.toggle('ap98OnlineOffline',!ok);
 const corner=document.getElementById('apActiveUsers');
 if(corner)corner.textContent=ok?String(n):'—';
};
window.ap98RefreshOnline=function(){
 const status=document.getElementById('ap98OnlineStatus');
 if(status)status.textContent='Güncelleniyor…';
 try {apRefreshPresence()}catch(e){
   window.onPresenceCount(-1,'Firebase bağlantısı yok');
 }
};
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden'){
   ap98Count=null;ap98Error='';ap98CheckedAt=0;
 }else{
   window.ap98RefreshOnline();
 }
});
render();
setTimeout(window.ap98RefreshOnline,300);
})();