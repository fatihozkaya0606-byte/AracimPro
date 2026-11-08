
/* Nur Rehberi 3D — direct in-app playback: native Android MediaPlayer preferred.
 * Tracks remain hosted by Quran Central or MP3Quran. Never impersonate one reader as another.
 */
const NR_SADİEN_SOURCE='https://qurancentral.com/audio/abdurrahmaan-sadien/';
const NR_SIMILAR_RECITERS=[
 {id:'51-51',name:'Abdülbasit Abdüssamed',desc:'Mücevved ve makamlı kıraat'},
 {id:'125-288',name:'Mustafa İsmail',desc:'Makamlı klasik kıraat'},
 {id:'112-113',name:'Muhammed Sıddık el-Minşâvî',desc:'Duygulu kıraat'},
 {id:'106-10912',name:'Muhammed Tablavî',desc:'Klasik Mısır kıraati'},
 {id:'9-9',name:'Ahmed Nuayna',desc:'Makamlı tilavet'},
 {id:'121-122',name:'Mahmud Ali el-Bennâ',desc:'Klasik tilavet'},
 {id:'241-241',name:'Muhammed Rıfat',desc:'Tarihî kıraat • kısmi sureler'},
 {id:'118-119',name:'Mahmud Halil el-Husarî',desc:'Tecvidli klasik kıraat'},
 {id:'128-128',name:'Muammer ZA',desc:'Endonezya • makamlı okuyuş • kısmi sureler'},
 {id:'4-4',name:'Ebubekir eş-Şâtırî',desc:'Akıcı tilavet'}
];
let nrSadienCatalog=null,nrSadienError='',nrCurrentTrack=null,nrNativeState='stopped',nrNativeError='',nrFeaturedVerified=null;
const nrSadienAudio=new Audio();nrSadienAudio.preload='none';
const nrSadienBar=document.createElement('div');nrSadienBar.id='nr-sadien-bar';nrSadienBar.hidden=true;
document.querySelector('.app-shell').appendChild(nrSadienBar);
const NR_NATIVE=location.hostname==='appassets.androidplatform.net';
function nrSendNative(action,src=''){
 const suffix=src?'?src='+encodeURIComponent(src):'';
 location.href='nur://'+action+suffix;
}
window.NurNativeAudio={
 onState(state,message){
  nrNativeState=state;
  if(state==='error'){nrNativeError=message||'Ses kaydı açılamadı.';toast(nrNativeError)}
  if(state==='ended'||state==='stopped'){
    nrCurrentTrack=null;
  }
  nrDrawSadienBar();
 }
};
function nrStopSadien(){
 nrSadienAudio.pause();nrSadienAudio.removeAttribute('src');nrSadienAudio.load();
 if(NR_NATIVE&&nrCurrentTrack)nrSendNative('audio-stop');
 nrCurrentTrack=null;nrNativeError='';nrNativeState='stopped';nrDrawSadienBar();
}
function nrDrawSadienBar(){
 if(!nrCurrentTrack){nrSadienBar.hidden=true;return;}
 nrSadienBar.hidden=false;
 const status=NR_NATIVE?nrNativeState:(nrSadienAudio.paused?'paused':'playing');
 const icon=status==='playing'?'Ⅱ':status==='loading'?'…':'▶';
 const info=status==='error'?('⚠ '+nrNativeError):status==='loading'?'Ses hazırlanıyor…':
  status==='playing'?'Ses oynatılıyor':'Duraklatıldı';
 nrSadienBar.innerHTML='<div><strong>♫ '+esc(nrCurrentTrack.title)+'</strong><small>'+
 esc(nrCurrentTrack.reader)+' • '+esc(info)+'</small></div>'+
 '<button data-sadien="toggle" aria-label="Oynat veya duraklat">'+icon+'</button>'+
 '<button data-sadien="stop" aria-label="Durdur">✕</button>';
}
function nrStartRecitation(url,title,reader){
 if(!/^https:\/\//i.test(url)){toast('Geçersiz ses kaynağı');return;}
 // Stop other player types without trying to load the podcast in an HTML WebView.
 stopAudio();stopAdhan();
 try{hafizAudio.pause();}catch(e){}
 nrSadienAudio.pause();nrSadienAudio.removeAttribute('src');
 nrCurrentTrack={url,title,reader};nrNativeState='loading';nrNativeError='';
 nrDrawSadienBar();
 if(NR_NATIVE)nrSendNative('audio-play',url);
 else {
  nrSadienAudio.src=url;nrSadienAudio.load();
  nrSadienAudio.play().then(nrDrawSadienBar).catch(()=>{nrNativeState='error';nrNativeError='Tarayıcı ses akışını açamadı.';toast(nrNativeError);nrDrawSadienBar()});
 }
}
function nrOpenSadienTrack(index){
 const r=nrSadienCatalog?.readers?.find(x=>x.id==='sadien');
 const entry=r?.tracks?.[index];if(!entry)return;
 nrStartRecitation(entry.url,entry.title,'Abdurrahmaan Sadien');
}
function nrOpenSimilar(id){
 const m=NR_SIMILAR_RECITERS.find(x=>x.id===id);
 const r=hafizCatalog.find(x=>x.id===id);
 if(!r||!m){toast('Bu hafızın ses listesi yüklenmedi. Yenile.');return;}
 const select=document.getElementById('hafiz-surah');
 const preferred=Number(select?.value||hafizSurah||1);
 const n=r.available.includes(preferred)?preferred:r.available[0];
 if(!n){toast('Bu hafız için oynatılabilir sure bulunamadı.');return}
 if(n!==preferred)toast('Seçilen sure yok; mevcut '+n+'. sure açılıyor.');
 const url=r.server+String(n).padStart(3,'0')+'.mp3';
 nrStartRecitation(url,m.name+' — '+(NAMES[n-1]||n)+ ' Suresi',m.name);
}
function nrRenderPremium(){
 const node=document.getElementById('nr-premium-hafiz');if(!node)return;
 const source=nrSadienCatalog?.readers?.find(x=>x.id==='sadien');
 const tracks=source?.tracks||[];
 node.innerHTML=
 '<div class="sadien-star">✦ ÖNE ÇIKAN HAFIZ</div><h2>Abdurrahmaan Sadien</h2>'+
 '<p>Güney Afrikalı kârî • Kaynak: Quran Central. Kayıtları başka bir siteye gitmeden uygulamada dinle.</p>'+
 (!tracks.length?'<div class="nr-premium-msg">'+esc(nrSadienError||'Ses kataloğu yükleniyor…')+'</div>':
 '<div class="nr-premium-status">'+tracks.length+' yayıncı ses kaydı</div><div class="nr-premium-tracks">'+
 tracks.map((x,i)=>'<button data-sadien="play" data-idx="'+i+'"><span class="nr-premium-play">▶</span>'+
 '<span><strong>'+esc(x.title)+'</strong><small>'+esc(x.duration||'Kayıt')+' • Quran Central</small></span></button>').join('')+'</div>')+
 '<p class="nr-premium-small">Sesler uygulamada açılır, internete ihtiyaç duyar. Kayıtlar hak sahibinin sunucusundadır.</p>'+
 '<div class="nr-premium-divider">✦ BENZER GÜZEL SESLER ✦</div>'+
 '<p>Abdülbasit, Mustafa İsmail, Minşavî ve başka etkileyici kıraatler. Yukarıdaki “Dinlenecek sure” seçimin kullanılır.</p>'+
 '<div class="nr-similar-grid">'+NR_SIMILAR_RECITERS.map(m=>{
  const entry=hafizCatalog.find(x=>x.id===m.id);
  const verified=Array.isArray(nrFeaturedVerified)&&nrFeaturedVerified.includes(m.id);
  return '<div class="nr-similar-card"><b>'+esc(m.name)+'</b><small>'+esc(m.desc)+'</small>'+
  '<span>'+(entry?entry.available.length+' sure • '+(verified?'MP3 erişimi doğrulandı':'Yayın testi kesin değil'):'Katalog yükleniyor…')+'</span>'+
  '<button data-sadien="similar" data-id="'+esc(m.id)+'" '+(!entry?'disabled':'')+'>▶ Uygulamada dinle</button></div>';
 }).join('')+'</div>';
}

async function nrLoadFeaturedVerified(){
 try{
  const r=await fetch('featured_verified.json');
  if(r.ok){const x=await r.json();nrFeaturedVerified=Array.isArray(x)?x:[];}
 }catch(e){nrFeaturedVerified=[];}
 nrRenderPremium();
}

async function nrLoadPremiumHafiz(){
 if(nrSadienCatalog){nrRenderPremium();if(nrFeaturedVerified===null)nrLoadFeaturedVerified();return;}
 try{
  const r=await fetch('premium_recitations.json');
  if(!r.ok)throw Error('Hafız kataloğu yüklenemedi.');
  const c=await r.json();
  if(!c.readers?.some(x=>x.id==='sadien'&&x.tracks?.length))throw Error('Kayıtlar bu sürümde doğrulanamadı.');
  nrSadienCatalog=c;
 }catch(e){nrSadienError=String(e.message||'Kayıt bulunamadı.');}
 nrRenderPremium();
 if(nrFeaturedVerified===null)nrLoadFeaturedVerified();
}
nrSadienAudio.addEventListener('playing',nrDrawSadienBar);
nrSadienAudio.addEventListener('pause',nrDrawSadienBar);
nrSadienAudio.addEventListener('ended',nrStopSadien);
nrSadienAudio.addEventListener('error',()=>{if(!NR_NATIVE&&nrCurrentTrack){nrNativeState='error';nrNativeError='Tarayıcı ses akışı açılamadı.';nrDrawSadienBar()}});
document.addEventListener('click',ev=>{
 const b=ev.target.closest('[data-sadien]');if(!b)return;
 const action=b.dataset.sadien;
 if(action==='play')nrOpenSadienTrack(Number(b.dataset.idx));
 else if(action==='similar')nrOpenSimilar(b.dataset.id);
 else if(action==='toggle'){
   if(NR_NATIVE){if(nrNativeState==='error'&&nrCurrentTrack)nrSendNative('audio-play',nrCurrentTrack.url);
     else nrSendNative('audio-toggle');}
   else if(nrSadienAudio.paused)nrSadienAudio.play().catch(()=>toast('Ses açılamadı.'));
   else nrSadienAudio.pause();
 }else if(action==='stop')nrStopSadien();
});
