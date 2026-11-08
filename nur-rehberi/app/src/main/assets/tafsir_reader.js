
/* Nur Rehberi 3D — native in-app paged Turkish Tafsir reader.
 * Only on-demand source-publisher streaming. Does NOT bundle rights-restricted books.
 * Edition: Turkish Al-Mukhtasar (QUL 258); Sa'di Turkish (QUL 484)
 * API docs: https://github.com/spa5k/tafsir_api
 */
const NR_TAFSIR_EDITIONS=[
  {id:'turkish-mokhtasar',name:'Muhtasar Tefsir (Türkçe)',source:'Quranic Universal Library — 258',origin:'https://qul.tarteel.ai/resources/tafsir/258'},
  {id:'turkish-tafsir-as-saadi-turkish',name:'Sa‘dî Tefsiri (Türkçe)',source:'Quranic Universal Library — 484',origin:'https://qul.tarteel.ai/resources/tafsir/484'}
];
const NR_TAFSIR_API='https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/';
const NR_TAFSIR_PER_PAGE=5;
let nrTafsirEdition=localStorage.getItem('nr-tafsir-edition')||NR_TAFSIR_EDITIONS[0].id;
let nrTafsirSurah=Number(localStorage.getItem('nr-tafsir-surah')||'1');
let nrTafsirPage=Number(localStorage.getItem('nr-tafsir-page')||'1');
let nrTafsirFont=Number(localStorage.getItem('nr-tafsir-font')||'17');
let nrTafsirLoading=false,nrTafsirError='';
const nrTafsirCache=new Map();
let nrTafsirCurrent=[];
function nrTafsirIsValidEdition(edition){return NR_TAFSIR_EDITIONS.some(x=>x.id===edition)}
if(!nrTafsirIsValidEdition(nrTafsirEdition))nrTafsirEdition=NR_TAFSIR_EDITIONS[0].id;
if(!Number.isInteger(nrTafsirSurah)||nrTafsirSurah<1||nrTafsirSurah>114)nrTafsirSurah=1;
if(!Number.isInteger(nrTafsirPage)||nrTafsirPage<1)nrTafsirPage=1;
if(!Number.isInteger(nrTafsirFont)||nrTafsirFont<14||nrTafsirFont>28)nrTafsirFont=17;
function nrTafsirSave(){
  try{
    localStorage.setItem('nr-tafsir-edition',nrTafsirEdition);
    localStorage.setItem('nr-tafsir-surah',nrTafsirSurah);
    localStorage.setItem('nr-tafsir-page',nrTafsirPage);
    localStorage.setItem('nr-tafsir-font',nrTafsirFont);
  }catch(e){}
}
function nrTafsirActions(){
  return '<div class="nr-tafsir-top"><button data-page="books" class="btn ghost">‹ Kitaplık</button>'+
    '<button data-page="quran" class="btn ghost">Kur’an ↗</button></div>';
}
function nrTafsirControls(){
 const editions=NR_TAFSIR_EDITIONS.map(x=>'<option value="'+x.id+'"'+(x.id===nrTafsirEdition?' selected':'')+'>'+esc(x.name)+'</option>').join('');
 return '<div class="nr-panel nr-tafsir-controls"><label>Tefsir kaynağı<select id="nr-tafsir-edition" class="nr-input">'+editions+'</select></label>'+
  '<label>Sure<select id="nr-tafsir-surah" class="nr-input">'+NAMES.map((name,i)=>'<option value="'+(i+1)+'"'+(nrTafsirSurah===i+1?' selected':'')+'>'+(i+1)+'. '+esc(name)+'</option>').join('')+'</select></label>'+
  '<div class="nr-tafsir-controls-actions"><button data-treader="font-smaller" class="btn ghost" aria-label="Yazıyı küçült">A−</button>'+
  '<span>Yazı: '+nrTafsirFont+'px</span><button data-treader="font-bigger" class="btn ghost" aria-label="Yazıyı büyüt">A+</button>'+
  '<button data-treader="bookmark" class="btn gold">♡ Yer imi</button></div></div>';
}
function tefsirKitap(){
 main.innerHTML=nrTop('📖','Tefsir Kitaplığı','Uygulama içinde sayfa sayfa oku')+nrTafsirActions()+
 '<div class="nr-note">Türkçe tefsir metni yayıncı kaynaklarından internet üzerinden yüklenir; kitap sayfası gibi uygulamanın içinde görüntülenir. Bunlar Diyanet’in telifli tefsiri değil, adları gösterilen farklı tefsirlerdir.</div>'+
 nrTafsirControls()+
 '<div id="nr-tafsir-book" class="nr-tafsir-book"><div class="nr-panel">Tefsir yükleniyor…</div></div>'+
 '<div class="nr-note">Kaynak: <a style="color:#ffde98" href="https://github.com/spa5k/tafsir_api">Tafsir API</a> / QUL. Diyanet tefsiri için <a style="color:#ffde98" href="https://kuran.diyanet.gov.tr/tefsir/sure/1-fatiha-suresi">resmî tefsir arşivi</a>. Bu sayfalar dijital okuma sayfasıdır; basılı kitabın özgün sayfa numaraları değildir.</div>';
 nrTafsirFetchAndDraw();
}
function nrTafsirPageCount(){return Math.max(1,Math.ceil(nrTafsirCurrent.length/NR_TAFSIR_PER_PAGE))}
function nrTafsirReadPage(){
 if(st.page!=='tefsir')return;
 const box=document.getElementById('nr-tafsir-book');if(!box)return;
 if(nrTafsirError){
   box.innerHTML='<div class="nr-panel"><h3>Metin alınamadı</h3><p>'+esc(nrTafsirError)+'</p>'+
   '<button class="btn gold" data-treader="retry">Yeniden dene</button></div>';return;
 }
 if(nrTafsirLoading){
  box.innerHTML='<div class="nr-panel">Sure tefsiri yükleniyor…</div>';return;
 }
 const count=nrTafsirPageCount();
 nrTafsirPage=Math.max(1,Math.min(nrTafsirPage,count));
 const start=(nrTafsirPage-1)*NR_TAFSIR_PER_PAGE;
 const rows=nrTafsirCurrent.slice(start,start+NR_TAFSIR_PER_PAGE);
 const edition=NR_TAFSIR_EDITIONS.find(x=>x.id===nrTafsirEdition);
 const nav='<div class="nr-tafsir-nav"><button data-treader="prev"'+(nrTafsirPage<=1?' disabled':'')+'>‹ Önceki</button>'+
 '<strong>'+nrTafsirPage+' / '+count+'. sayfa</strong>'+
 '<button data-treader="next"'+(nrTafsirPage>=count?' disabled':'')+'>Sonraki ›</button></div>';
 box.innerHTML='<div class="nr-tafsir-sheet">'+
 '<div class="nr-tafsir-sheet-header">❖ <span>'+esc(NAMES[nrTafsirSurah-1])+' Suresi</span> ❖</div>'+
 '<div class="nr-tafsir-sheet-sub">'+esc(edition.name)+' · '+(start+1)+'–'+Math.min(start+NR_TAFSIR_PER_PAGE,nrTafsirCurrent.length)+'. ayet açıklamaları</div>'+
 rows.map((r,i)=>{
   const text=String(r.text||'').replace(/<[^>]*>/g,' ').trim();
   return '<article class="nr-tafsir-verse"><div class="nr-tafsir-marker">'+(Number(r.ayah)||start+i+1)+'. AYET</div>'+
      '<p style="font-size:'+nrTafsirFont+'px">'+esc(text||'Bu ayetin tefsir metni kaynakta bulunmuyor.')+'</p></article>';
 }).join('')+
 '<div class="nr-tafsir-sheet-end">✦ Nur Rehberi • '+nrTafsirPage+'. sayfa ✦</div></div>'+
 nav+'<div class="nr-tafsir-bottom">'+
 '<button class="btn ghost" data-treader="first">İlk sayfa</button><button class="btn gold" data-treader="bookmark">Kaldığım yeri kaydet</button></div>';
 nrTafsirSave();
}
async function nrTafsirFetchAndDraw(){
 if(st.page!=='tefsir')return;
 const edition=nrTafsirEdition,surah=nrTafsirSurah,key=edition+'-'+surah;
 nrTafsirError='';
 if(nrTafsirCache.has(key)){nrTafsirCurrent=nrTafsirCache.get(key);nrTafsirLoading=false;nrTafsirReadPage();return}
 nrTafsirLoading=true;nrTafsirReadPage();
 try{
   const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),22000);
   let result;
   try{
     result=await fetch(NR_TAFSIR_API+edition+'/'+surah+'.json',{signal:ctl.signal,cache:'default'});
   }finally{clearTimeout(timeout)}
   if(!result.ok)throw new Error('Servis geçici olarak yanıt vermiyor (HTTP '+result.status+').');
   const rows=await result.json();
   if(!Array.isArray(rows)||!rows.length)throw new Error('Bu sure için metin bulunamadı.');
   // Old stale asynchronous fetches cannot overwrite a newly-selected edition.
   if(nrTafsirEdition!==edition||nrTafsirSurah!==surah||st.page!=='tefsir')return;
   nrTafsirCurrent=rows.filter(x=>x&&typeof x.text==='string').sort((a,b)=>Number(a.ayah)-Number(b.ayah));
   if(!nrTafsirCurrent.length)throw new Error('Kaynakta tefsir metni bulunamadı.');
   nrTafsirCache.set(key,nrTafsirCurrent);
 }catch(err){
   if(nrTafsirEdition!==edition||nrTafsirSurah!==surah)return;
   nrTafsirError=String(err.message||'Sunucuya ulaşılamıyor.');
 }finally{
   if(nrTafsirEdition===edition&&nrTafsirSurah===surah){nrTafsirLoading=false;nrTafsirReadPage()}
 }
}
document.addEventListener('change',ev=>{
 if(ev.target.id==='nr-tafsir-edition'){
   const id=ev.target.value;
   if(!nrTafsirIsValidEdition(id))return;
   nrTafsirEdition=id;nrTafsirPage=1;nrTafsirSave();nrTafsirFetchAndDraw();
 }else if(ev.target.id==='nr-tafsir-surah'){
   const n=Number(ev.target.value);
   if(!Number.isInteger(n)||n<1||n>114)return;
   nrTafsirSurah=n;nrTafsirPage=1;nrTafsirSave();nrTafsirFetchAndDraw();
 }
});
document.addEventListener('click',ev=>{
 const btn=ev.target.closest('[data-treader]');if(!btn)return;
 const a=btn.dataset.treader;
 if(a==='next'){nrTafsirPage=Math.min(nrTafsirPage+1,nrTafsirPageCount());nrTafsirReadPage();document.getElementById('nr-tafsir-book')?.scrollIntoView({behavior:'smooth',block:'start'})}
 else if(a==='prev'){nrTafsirPage=Math.max(nrTafsirPage-1,1);nrTafsirReadPage();document.getElementById('nr-tafsir-book')?.scrollIntoView({behavior:'smooth',block:'start'})}
 else if(a==='first'){nrTafsirPage=1;nrTafsirReadPage()}
 else if(a==='font-bigger'){nrTafsirFont=Math.min(28,nrTafsirFont+2);nrTafsirSave();tefsirKitap()}
 else if(a==='font-smaller'){nrTafsirFont=Math.max(14,nrTafsirFont-2);nrTafsirSave();tefsirKitap()}
 else if(a==='bookmark'){nrTafsirSave();toast('Kaldığın sayfa kaydedildi.')}
 else if(a==='retry'){nrTafsirCache.delete(nrTafsirEdition+'-'+nrTafsirSurah);nrTafsirFetchAndDraw()}
});
