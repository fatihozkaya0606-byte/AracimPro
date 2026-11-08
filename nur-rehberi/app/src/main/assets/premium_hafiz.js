
/* Native Nur Rehberi in-app player for Quran Central's public audio podcast feed.
   Audio files remain on original publisher servers; NOT bundled or mirrored. */
let nrSadienCatalog=null,nrSadienError='',nrSadienCurrent=null;
const nrSadienAudio=new Audio();
nrSadienAudio.preload='none';
const nrSadienBar=document.createElement('div');
nrSadienBar.id='nr-sadien-bar';nrSadienBar.hidden=true;
document.querySelector('.app-shell').appendChild(nrSadienBar);
function nrStopSadien(){
 nrSadienAudio.pause();nrSadienAudio.removeAttribute('src');nrSadienAudio.load();
 nrSadienCurrent=null;nrDrawSadienBar();
}
function nrDrawSadienBar(){
 if(!nrSadienCurrent){nrSadienBar.hidden=true;return;}
 nrSadienBar.hidden=false;
 nrSadienBar.innerHTML='<div><strong>♫ '+esc(nrSadienCurrent.title)+'</strong><small>Abdurrahmaan Sadien • Quran Central</small></div>'+
 '<button data-sadien="toggle">'+(nrSadienAudio.paused?'▶':'Ⅱ')+'</button><button data-sadien="stop">✕</button>';
}
function nrOpenSadienTrack(i){
 const source=nrSadienCatalog?.readers?.[0]?.tracks||[];
 const x=source[i];if(!x)return;
 const url=String(x.url||'');
 if(!/^https:\/\//i.test(url)){toast('Geçersiz ses kaynağı.');return}
 stopAudio();stopHafiz();stopAdhan();nrStopSadien();
 nrSadienCurrent=x;nrSadienAudio.src=url;nrSadienAudio.load();nrDrawSadienBar();
 nrSadienAudio.play().then(()=>nrDrawSadienBar()).catch(()=>{toast('Ses akışı açılamadı.');nrStopSadien()});
}
function nrRenderPremium(){
 const node=document.getElementById('nr-premium-hafiz');if(!node)return;
 const tracks=nrSadienCatalog?.readers?.[0]?.tracks||[];
 node.innerHTML='<div class="sadien-star">✦ ÖNE ÇIKAN HAFIZ</div>'+
 '<h2>Abdurrahmaan Sadien</h2><p>Güney Afrikalı kârî · Kaynak: Quran Central · Uygulamadan çıkmadan dinle.</p>'+
 (!tracks.length?'<div class="nr-premium-msg">'+esc(nrSadienError||'24 ses kaydı listesi yükleniyor…')+'</div>':
 '<div class="nr-premium-status">'+tracks.length+' doğrulanmış yayıncı ses kaydı</div>'+
 '<div class="nr-premium-tracks">'+tracks.map((x,i)=>'<button data-sadien="play" data-idx="'+i+'">'+
 '<span class="nr-premium-play">▶</span><span><strong>'+esc(x.title)+'</strong><small>'+esc(x.duration||'Ses kaydı')+' • Quran Central</small></span></button>').join('')+'</div>')+
 '<small>Sesler uygulamanın oynatıcısında açılır; internet gerekir. Kayıtlar Quran Central sunucularında kalır, APK’ya kopyalanmamıştır.</small>';
}
async function nrLoadPremiumHafiz(){
 if(nrSadienCatalog){nrRenderPremium();return;}
 try{
 const res=await fetch('premium_recitations.json');
 if(!res.ok)throw Error('Katalog bulunamadı');
 const content=await res.json();
 const reciters=content.readers||[];
 if(!reciters.length||!reciters[0]?.tracks?.length)throw Error('Bu hafızın yayıncı akışları şu an doğrulanamadı.');
 nrSadienCatalog=content;
 }catch(e){nrSadienError=String(e.message||'Kayıt listesine ulaşılamıyor.');}
 nrRenderPremium();
}
nrSadienAudio.addEventListener('playing',nrDrawSadienBar);
nrSadienAudio.addEventListener('pause',nrDrawSadienBar);
nrSadienAudio.addEventListener('ended',nrStopSadien);
nrSadienAudio.addEventListener('error',()=>{if(nrSadienCurrent){toast('Kayıt açılamadı');nrStopSadien()}});
document.addEventListener('click',ev=>{
 const b=ev.target.closest('[data-sadien]');if(!b)return;
 if(b.dataset.sadien==='play')nrOpenSadienTrack(Number(b.dataset.idx));
 else if(b.dataset.sadien==='toggle'){
  if(nrSadienAudio.paused)nrSadienAudio.play().catch(()=>toast('Ses başlatılamadı'));
  else nrSadienAudio.pause();
 }else if(b.dataset.sadien==='stop')nrStopSadien();
});
