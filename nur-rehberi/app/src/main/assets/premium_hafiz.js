
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
let nrCuratedReaders=[],nrCuratedError='',nrSadienExpanded=false,nrSelectedCuratedId=null,nrCuratedSurah=36;
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

function nrCuratedEntry(id){
 const entry=nrCuratedReaders.find(x=>x.id===id);
 if(entry)return entry;
 const m=NR_SIMILAR_RECITERS.find(x=>x.id===id);
 const r=hafizCatalog.find(x=>x.id===id);
 return m&&r?{...r,name:m.name,style:m.desc,count:r.available.length}:null;
}
function nrPreferredSurah(reader){
 const preferred=nrCuratedSurah;
 return reader.available.includes(preferred)?preferred:
   (reader.available.includes(1)?1:reader.available[0]);
}
function nrOpenSimilar(id){
 const entry=nrCuratedEntry(id);
 if(!entry||!entry.available?.length){toast('Bu hafız için ses kaydı bulunamadı.');return}
 const n=nrPreferredSurah(entry);
 const url=entry.server+String(n).padStart(3,'0')+'.mp3';
 nrStartRecitation(url,entry.name+' — '+(NAMES[n-1]||n)+ ' Suresi',entry.name);
}
function nrCuratedDetails(){
 const reader=nrCuratedEntry(nrSelectedCuratedId);
 if(!reader)return '';
 const options=reader.available.map(n=>'<option value="'+n+'"'+(n===nrPreferredSurah(reader)?' selected':'')+'>'+
 n+'. '+esc(NAMES[n-1]||'Sure')+'</option>').join('');
 const selected=nrPreferredSurah(reader);
 const quick=[1,18,19,36,55,56,67,78,112,113,114].filter(n=>reader.available.includes(n));
 return '<div class="nr-curated-details" id="nr-curated-details"><div class="nr-curated-details-title">'+
 '<div><strong>♪ '+esc(reader.name)+'</strong><small>'+reader.available.length+' mevcut sure • '+esc(reader.moshaf||reader.style||'')+'</small></div>'+
 '<button data-sadien="hide-curated" aria-label="Kapat">✕</button></div>'+
 '<label>Dinlemek istediğin sureyi seç</label><select class="nr-input" id="nr-curated-surah">'+options+'</select>'+
 '<button class="btn gold nr-curated-mainplay" data-sadien="play-selected">▶ '+selected+'. sureyi dinle</button>'+
 '<div class="nr-curated-quick">'+quick.map(n=>'<button data-sadien="quick" data-n="'+n+'">'+
 '▶ '+esc(NAMES[n-1]||'Sure')+'</button>').join('')+'</div></div>';
}
function nrRenderPremium(){
 const node=document.getElementById('nr-premium-hafiz');if(!node)return;
 const source=nrSadienCatalog?.readers?.find(x=>x.id==='sadien');
 const tracks=source?.tracks||[];
 const similar=nrCuratedReaders.length?nrCuratedReaders:NR_SIMILAR_RECITERS.map(m=>nrCuratedEntry(m.id)).filter(Boolean);
 const short=nrSadienExpanded?tracks:tracks.slice(0,3);
 const total=similar.reduce((n,r)=>n+(r.available?.length||0),0);
 node.innerHTML=
 '<div class="sadien-star">✦ ÖNE ÇIKAN HAFIZ</div><h2>Abdurrahmaan Sadien</h2>'+
 '<p>Güney Afrikalı kârî. Doğrudan uygulamada dinle; kaynak: Quran Central.</p>'+
 (!tracks.length?'<div class="nr-premium-msg">'+esc(nrSadienError||'Ses kayıtları yükleniyor…')+'</div>':
 '<div class="nr-premium-status">'+tracks.length+' Sadien kaydı • Sonraki hafızlar hemen aşağıda</div>'+
 '<div class="nr-premium-tracks">'+short.map((x,i)=>'<button data-sadien="play" data-idx="'+i+'">'+
 '<span class="nr-premium-play">▶</span><span><strong>'+esc(x.title)+'</strong><small>'+
 esc(x.duration||'Ses kaydı')+' • Quran Central</small></span></button>').join('')+'</div>'+
 (tracks.length>3?'<button class="nr-sadien-more" data-sadien="more">'+
 (nrSadienExpanded?'Sadien kayıtlarını daralt ↑':'Sadien’in '+tracks.length+' kaydının tamamını göster ↓')+'</button>':''))+
 '<div class="nr-premium-divider">✦ SADİEN GİBİ ETKİLEYİCİ HAFIZLAR ✦</div>'+
 '<div class="nr-premium-status">'+
 (similar.length?similar.length+' hafız · '+total+' sure kaydı listelendi':'Hafız kataloğu yükleniyor…')+'</div>'+
 '<p>İsim seç, mevcut sureleri görüntüle ve istediğin sureyi uygulamadan çıkmadan dinle.</p>'+
 nrCuratedDetails()+
 '<div class="nr-similar-grid">'+similar.map(r=>{
   const safe=(r.available||[]);
   return '<div class="nr-similar-card"><b>'+esc(r.name)+'</b>'+
   '<small>'+esc(r.style||r.desc||r.moshaf||'Kıraat')+'</small>'+
   '<span>'+safe.length+' mevcut sure'+(r.checked_surah?' • bağlantı testli':'')+'</span>'+
   '<div class="nr-similar-buttons"><button data-sadien="similar" data-id="'+esc(r.id)+'"'+(!safe.length?' disabled':'')+'>▶ Dinle</button>'+
   '<button data-sadien="choose" data-id="'+esc(r.id)+'"'+(!safe.length?' disabled':'')+'>Sureler</button></div></div>';
 }).join('')+'</div>'+
 (nrCuratedError?'<div class="nr-premium-msg">'+esc(nrCuratedError)+'</div>':'')+
 '<p class="nr-premium-small">Kayıtlar yayıncılarının MP3 sunucularından çalınır. Sadien arşivindeki 24 bölüm dışında ona ait doğrulanmış yeni kayıt yoktur. Diğer hafızların mevcut sureleri ayrı listelenir.</p>';
}
async function nrLoadFeaturedVerified(){
 try{
  const r=await fetch('featured_reciters.json');
  if(!r.ok)throw Error('Öne çıkan hafız kataloğu bulunamadı.');
  const data=await r.json();
  nrCuratedReaders=(data.readers||[]).filter(x=>x.id&&x.server&&Array.isArray(x.available)&&x.available.length);
  if(nrCuratedReaders.length<15)throw Error('Yalnızca '+nrCuratedReaders.length+' okuyucuya ait erişilebilir kayıt bulundu.');
  nrFeaturedVerified=nrCuratedReaders.map(x=>x.id);
 }catch(e){
  nrCuratedError=String(e.message||'Hafız listesi yüklenemedi.');
  nrCuratedReaders=[];
  nrFeaturedVerified=[];
 }
 nrRenderPremium();
}
async function nrLoadPremiumHafiz(){
 if(nrSadienCatalog){nrRenderPremium();if(nrFeaturedVerified===null)nrLoadFeaturedVerified();return}
 try{
  const r=await fetch('premium_recitations.json');
  if(!r.ok)throw Error('Sadien ses kataloğu yüklenemedi.');
  const c=await r.json();
  if(!c.readers?.some(x=>x.id==='sadien'&&x.tracks?.length))throw Error('Sadien kayıtları bu sürümde bulunamadı.');
  nrSadienCatalog=c;
 }catch(e){nrSadienError=String(e.message||'Sadien kayıtları bulunamadı.')}
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
 else if(action==='more'){nrSadienExpanded=!nrSadienExpanded;nrRenderPremium();}
 else if(action==='choose'){
   nrSelectedCuratedId=b.dataset.id;
   const r=nrCuratedEntry(nrSelectedCuratedId);if(r)nrCuratedSurah=nrPreferredSurah(r);
   nrRenderPremium();
   document.getElementById('nr-curated-details')?.scrollIntoView({behavior:'smooth',block:'center'});
 }
 else if(action==='hide-curated'){nrSelectedCuratedId=null;nrRenderPremium();}
 else if(action==='play-selected'){nrOpenSimilar(nrSelectedCuratedId);}
 else if(action==='quick'){
   nrCuratedSurah=Number(b.dataset.n);
   nrOpenSimilar(nrSelectedCuratedId);
 }
 else if(action==='toggle'){
   if(NR_NATIVE){if(nrNativeState==='error'&&nrCurrentTrack)nrSendNative('audio-play',nrCurrentTrack.url);
     else nrSendNative('audio-toggle');}
   else if(nrSadienAudio.paused)nrSadienAudio.play().catch(()=>toast('Ses açılamadı.'));
   else nrSadienAudio.pause();
 }else if(action==='stop')nrStopSadien();
});

 document.addEventListener('change',ev=>{
  if(ev.target.id==='nr-curated-surah')nrCuratedSurah=Number(ev.target.value)||1;
 });
