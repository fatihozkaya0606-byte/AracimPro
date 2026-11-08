
'use strict';
/* Separate feature modules use original UI state, escape(), main and NAMES. */
const NR_LETTERS=[
['ا','Elif'],['ب','Be'],['ت','Te'],['ث','Se'],['ج','Cim'],['ح','Ha'],['خ','Hı'],['د','Dal'],['ذ','Zel'],['ر','Ra'],['ز','Ze'],['س','Sin'],['ش','Şın'],['ص','Sad'],['ض','Dad'],['ط','Tı'],['ظ','Zı'],['ع','Ayn'],['غ','Gayn'],['ف','Fe'],['ق','Kaf'],['ك','Kef'],['ل','Lam'],['م','Mim'],['ن','Nun'],['ه','He'],['و','Vav'],['ي','Ye']
];
const NR_DUA=[
['Bağışlanma','7:23'],['Dünya ve ahiret iyiliği','2:201'],['İlim talebi','20:114'],
['Kalbin sabit kalması','3:8'],['Namazda devamlılık','14:40'],['Hz. Yunus’un duası','21:87'],
['Merhamet dileği','23:118'],['Aile için dua','25:74'],['Güç yetiremeyeceğimiz yük','2:286'],
['Hayır dileği','28:24'],['Sabır dileği','7:126'],['Anne-babaya dua','17:24']
];
const NR_LIBRARY=[
['İlmihal kitapları','Diyanet resmî yayın kataloğu','https://yayin.diyanet.gov.tr/'],
['Kur’an Tefsiri','Diyanet’in tefsir arşivi','https://kuran.diyanet.gov.tr/tefsir/sure/1-fatiha-suresi'],
['Kur’an ve mealler','Kur’an ve Türkçe meal','https://kuran.diyanet.gov.tr/'],
['Hadislerle İslam','Diyanet hadis arşivi','https://hadislerleislam.diyanet.gov.tr/'],
['TDV İslam Ansiklopedisi','İslam ilimleri ve tarih arşivi','https://islamansiklopedisi.org.tr/'],
['Dijital kitaplık','Diyanet e-kitap ve basılı eserleri','https://yayin.diyanet.gov.tr/'],
['Elifba ve Tecvid','30 derslik sesli öğretim','https://kuran.diyanet.gov.tr/elifba/'],
['Aşr-ı Şerifler','Diyanet Türk hafız arşivi','https://kuran.diyanet.gov.tr/dijital/asri-serifler'],
['Akaid ve dinî meseleler','Din İşleri Yüksek Kurulu','https://kurul.diyanet.gov.tr/'],
['Hac ve Umre Rehberi','Diyanet Hac ve Umre','https://hacumre.diyanet.gov.tr/'],
['Dua ve zikir kitapları','Diyanet yayınları','https://yayin.diyanet.gov.tr/'],
['İslam tarihi ve Siyer','TDV kaynak maddeleri','https://islamansiklopedisi.org.tr/']
];
const NR_HADIS=[
['İman ve din','İman, din ve insan','https://hadislerleislam.diyanet.gov.tr/'],
['Namaz ve ibadet','Namaz, dua ve zikir bölümleri','https://hadislerleislam.diyanet.gov.tr/sayfa.php?CILT=1&SAYFA=10'],
['Ahlâk','Güzel davranışlar ve erdem','https://hadislerleislam.diyanet.gov.tr/'],
['Aile ve toplum','Aile ilişkileri ve komşuluk','https://hadislerleislam.diyanet.gov.tr/'],
['Hadislerle İslâm 1. Cilt','Diyanet PDF eser','https://hadislerleislam.diyanet.gov.tr/pdf/hadislerle_islam_cilt1.pdf'],
['Hadislerle İslâm arşivi','Bütün yayın kataloğu','https://hadislerleislam.diyanet.gov.tr/']
];
let nrBookQuery='',nrHadisQuery='',nrEsmaQuery='',nrEsmaNames=null,nrLetter=0,nrQuizN=0,nrTefsirN=1,nrTefsirA=1,nrReminderStatus='';
function nrTop(icon,title,sub){return '<div class="royal-page-head"><span>'+icon+'</span><h1>'+title+'</h1><small>'+sub+'</small></div>'}
function nrLink(url,title){return '<a class="btn gold nr-link" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(title)+' ↗</a>'}
const NR_BOOK_ROUTES=[
 ['guide',0],['tefsir',null],['quran',null],['guide',3],
 ['guide',4],['guide',5],['elifba',null],['hafizlar',null],
 ['guide',8],['guide',9],['dualar',null],['guide',11]
];
function nrLibraryButton(route){
 const [page,index]=route;
 return page==='guide'?
  '<button class="btn gold nr-link" data-library="'+index+'">İçeriği aç</button>':
  '<button class="btn gold nr-link" data-page="'+page+'">Bölümü aç</button>';
}
function nrBookItems(rows){
 return rows.map(r=>{
  const i=NR_LIBRARY.findIndex(row=>row[0]===r[0]),route=NR_BOOK_ROUTES[i]||['guide',0];
  return '<div class="nr-entry"><div><strong>'+esc(r[0])+'</strong><small>'+esc(r[1])+'</small></div>'+
   nrLibraryButton(route)+'</div>';
 }).join('');
}
function nrItems(rows){
 return rows.map(r=>'<div class="nr-entry"><div><strong>'+esc(r[0])+'</strong><small>'+
  esc(r[1])+'</small></div><button class="btn gold nr-link" data-library="3">Konuya gir</button></div>').join('');
}
function books(){
 const rows=NR_LIBRARY.filter(r=>(r[0]+' '+r[1]).toLocaleLowerCase('tr').includes(nrBookQuery.toLocaleLowerCase('tr')));
 main.innerHTML=nrTop('📚','İslami Kitaplık','Diyanet ve TDV yayınları')+
 '<p class="nr-note">Telifli eserler izinsiz kopyalanmıyor. Yayıncıların sunduğu okuma, PDF ve indirme seçenekleri resmî sayfalarda açılır.</p>'+
 '<input id="nr-book-search" class="nr-input" placeholder="Kitaplıkta ara" value="'+esc(nrBookQuery)+'"/>'+
 '<div class="nr-list" id="nr-book-results">'+nrBookItems(rows)+'</div>'+
 '<div class="nr-actions"><button data-page="ilmihal" class="btn gold">İlmihal konuları</button><button data-page="tefsir" class="btn ghost">Tefsir</button><button data-page="hadis" class="btn ghost">Hadisler</button></div>';
}
function hadis(){
 const rows=NR_HADIS.filter(r=>(r[0]+' '+r[1]).toLocaleLowerCase('tr').includes(nrHadisQuery.toLocaleLowerCase('tr')));
 main.innerHTML=nrTop('📜','Hadisler','Diyanet Hadislerle İslam')+
 '<p class="nr-note">Hadislerin metinleri güvenilir kaynaklarından okunur; bağlamı ve kaynağı verilmeden alıntı uydurulmaz.</p>'+
 '<input id="nr-hadis-search" class="nr-input" placeholder="Hadis konusu ara" value="'+esc(nrHadisQuery)+'"/>'+
 '<div id="nr-hadis-results" class="nr-list">'+nrItems(rows)+'</div>';
}
function tefsir(){tefsirKitap();}
async function nrReadVerse(){
 const n=Number(document.getElementById('nr-sure')?.value||1),a=Number(document.getElementById('nr-ayet')?.value||1);
 if(!Number.isInteger(n)||n<1||n>114||!Number.isInteger(a)||a<1||a>286){toast('Geçerli sure ve ayet seç.');return}
 nrTefsirN=n;nrTefsirA=a;
 const box=document.getElementById('nr-verse-result');box.textContent='Ayet yükleniyor…';
 try{
 const ans=await Promise.all(['quran-uthmani','tr.diyanet'].map(ed=>fetch('https://api.alquran.cloud/v1/ayah/'+n+':'+a+'/'+ed).then(r=>r.json())));
 if(ans.some(x=>x.code!==200||!x.data?.text))throw Error('Ayet bulunamadı');
 box.innerHTML='<div dir="rtl" lang="ar" class="nr-ar">'+esc(ans[0].data.text)+'</div><p>'+esc(ans[1].data.text)+'</p><small>'+n+':'+a+' • Arapça ayet ve Türkçe Diyanet meali</small><p>'+
 nrLink('https://kuran.diyanet.gov.tr/kuran?ayet='+a+'&mode=kuran-meal&sure='+n,'Diyanet’te aç')+'</p>';
 }catch(e){box.textContent='Ayet şu anda yüklenemedi. İnternet bağlantını kontrol et.'}
}
function dualar(){
 main.innerHTML=nrTop('🤲','Dua ve Zikir','12 Kur’an kaynaklı dua')+
 '<p class="nr-note">Kaynak ayete dokununca Arapça ayet ile Türkçe Diyanet meali açılır. Ayetin yalnızca dua kısmı değil tamamı gösterilir.</p>'+
 '<div class="nr-duas">'+NR_DUA.map((r,i)=>'<button data-nr="dua" data-idx="'+i+'"><strong>'+esc(r[0])+'</strong><small>'+r[1]+'</small></button>').join('')+'</div>'+
 '<div id="nr-dua-view"></div><div class="nr-actions"><button class="btn gold" data-page="worship">Tesbih</button><button data-page="esma" class="btn ghost">Esmaül Hüsna</button></div>';
}
async function nrShowDua(idx){
 const row=NR_DUA[idx],box=document.getElementById('nr-dua-view');if(!row||!box)return;
 box.innerHTML='<div class="nr-panel">Yükleniyor…</div>';
 try{
 const x=await Promise.all(['quran-uthmani','tr.diyanet'].map(ed=>fetch('https://api.alquran.cloud/v1/ayah/'+row[1]+'/'+ed).then(r=>r.json())));
 if(x.some(r=>r.code!==200||!r.data?.text))throw Error();
 box.innerHTML='<div class="nr-panel"><h3>'+esc(row[0])+' — '+row[1]+'</h3><div class="nr-ar" dir="rtl" lang="ar">'+esc(x[0].data.text)+'</div><p>'+esc(x[1].data.text)+'</p><small>Kur’an '+row[1]+' • Türkçe Diyanet meali</small></div>';
 box.scrollIntoView({block:'nearest',behavior:'smooth'});
 }catch(e){box.innerHTML='<div class="nr-panel">Ayet alınamadı. Bağlantıyı kontrol et.</div>'}
}
function esma(){
 main.innerHTML=nrTop('✦','Esmaül Hüsna','Allah’ın 99 güzel ismi')+
 '<p class="nr-note">99 ismin kısa Türkçe anlamları çevrimdışı saklanır. İsimlerin anlamları hakkında ayrıntılı açıklamalar için TDV İslam Ansiklopedisi’ni kullanabilirsin.</p>'+
 '<input id="nr-esma-search" class="nr-input" placeholder="İsim veya anlam ara" value="'+esc(nrEsmaQuery)+'"/>'+
 '<div id="nr-esma-list" class="nr-esma-list">Yükleniyor…</div>'+
 '<div class="nr-actions">'+nrLink('https://islamansiklopedisi.org.tr/esma-i-husna','Ayrıntılı açıklama')+'</div>';
 nrRenderEsma();
}
async function nrRenderEsma(){
 const node=document.getElementById('nr-esma-list');if(!node)return;
 if(!nrEsmaNames){
  try{const r=await fetch('esma.json');if(!r.ok)throw Error();nrEsmaNames=await r.json()}catch(e){node.textContent='Esmaül Hüsna verileri açılamadı.';return}
 }
 const saved=nrFaves(),rows=nrEsmaNames.filter(x=>(x.name+' '+x.meaning).toLocaleLowerCase('tr').includes(nrEsmaQuery.toLocaleLowerCase('tr')));
 node.innerHTML=rows.map(x=>'<div class="nr-esma"><small>'+x.number+'</small><strong>'+esc(x.name)+'</strong><span>'+esc(x.meaning)+'</span><button data-nr="esma-fav" data-id="'+x.number+'">'+(saved.includes(x.number)?'♥ Kaydedildi':'♡ Kaydet')+'</button></div>').join('');
}
function nrFaves(){try{return JSON.parse(localStorage.getItem('nr-esma-fav')||'[]')}catch(e){return []}}
function nrQuiz(){
 const correct=NR_LETTERS[nrQuizI%28],used=[correct],opts=[];
 for(let j=1;used.length<4;j++){const x=NR_LETTERS[(nrQuizI*3+j*7)%28];if(!used.some(y=>y[0]===x[0]))used.push(x)}
 const shift=nrQuizI%4;opts.push(...used.slice(shift),...used.slice(0,shift));
 return '<div class="nr-panel"><h3>Harf alıştırması • '+(nrQuizI+1)+'/28</h3><div class="nr-big-ar">'+correct[0]+'</div><p>Bu harfin adı nedir?</p><div class="nr-answer">'+opts.map(x=>'<button data-nr="answer" data-value="'+esc(x[1])+'">'+esc(x[1])+'</button>').join('')+'</div><small>Bu oturum doğru: '+nrQuizCorrect+'</small></div>';
}
let nrQuizI=0,nrQuizCorrect=0;
function elifba(){
 const l=NR_LETTERS[nrLetter];
 main.innerHTML=nrTop('۞','Elifba ve Tecvid','28 harf • alıştırma • Diyanet')+
 '<p class="nr-note">28 Arap harfini öğren; seçtiğin harfin örnek harekelerini incele ve harf tanıma alıştırması yap. Doğru telaffuz ve tam tecvid için resmî 30 derslik Diyanet eğitimini aç.</p>'+
 '<div class="nr-letters">'+NR_LETTERS.map((x,i)=>'<button data-nr="letter" data-idx="'+i+'"'+(i===nrLetter?' class="selected"':'')+'><b>'+x[0]+'</b><small>'+esc(x[1])+'</small></button>').join('')+'</div>'+
 '<div class="nr-panel"><h3>'+esc(l[1])+' harfi</h3><div class="nr-big-ar">'+l[0]+'</div><p>Hareke örnekleri <span class="nr-inline-ar" dir="rtl">'+l[0]+'َ　'+l[0]+'ِ　'+l[0]+'ُ</span></p><small>Üstün, esre, ötre. Harfin doğru telaffuzunu sesli derslerde dinle.</small></div>'+
 '<div id="nr-quiz">'+nrQuiz()+'</div>'+
 '<div class="nr-actions">'+nrLink('https://kuran.diyanet.gov.tr/elifba/','Diyanet 30 sesli ders')+'</div>';
}
function nrAnswer(value){
 const correct=NR_LETTERS[nrQuizI%28][1];
 if(value===correct){nrQuizCorrect++;try{localStorage.setItem('nr-elifba-best',String(Math.max(nrQuizCorrect,Number(localStorage.getItem('nr-elifba-best')||0))))}catch(e){}toast('Doğru!')}
 else toast('Doğrusu: '+correct);
 nrQuizI=(nrQuizI+1)%28;
 const box=document.getElementById('nr-quiz');if(box)box.innerHTML=nrQuiz();
}
function bildirimler(){
 main.innerHTML=nrTop('🔔','Ezan Bildirimleri','Android sistem bildirimi')+
 '<p class="nr-note">Seçili şehir: <strong>'+esc(st.city)+'</strong>. Vakit takvimi Android alarm sistemine kaydedilir; uygulama kapalıyken de bildirim gönderilebilir. Telefonun izin ve pil ayarları nedeniyle tam dakika hassasiyeti garanti edilmez.</p>'+
 '<div class="nr-panel"><h3>İmsak • Öğle • İkindi • Akşam • Yatsı</h3><p>Bildirim sesinde kısa ezan bölümü çalınabilir. Android bildirimleri tam ezanın arka planda kesintisiz çalınmasını garanti etmez. Diyanet ile hesaplama servisi arasında küçük vakit farklılıkları olabilir.</p>'+
 '<div class="nr-actions"><button class="btn gold" data-nr="alarm-enable">Bildirimleri aç / yenile</button><button class="btn ghost" data-nr="alarm-test">Test bildirimi</button><button class="btn ghost" data-nr="alarm-disable">Kapat</button></div><p id="nr-alarm-status">'+esc(nrReminderStatus||'İzin için “Bildirimleri aç” düğmesine bas.')+'</p></div>'+
 '<div class="nr-actions"><button data-page="worship" class="btn gold">Şehir seç</button>'+nrLink('https://namazvakitleri.diyanet.gov.tr/','Diyanet resmî vakitleri')+'</div>';
}
async function nrSetAlarms(){
 const n=document.getElementById('nr-alarm-status');if(n)n.textContent='Vakit takvimi alınıyor…';
 try{
 const now=new Date(),ym=now.getFullYear(),mm=now.getMonth()+1;
 const m1={y:ym,m:mm},m2={y:mm===12?ym+1:ym,m:mm===12?1:mm+1};
 const c=st.city;
 const months=await Promise.all([m1,m2].map(({y,m})=>fetch('https://api.aladhan.com/v1/calendarByCity/'+y+'/'+m+'?city='+encodeURIComponent(c)+'&country=Turkey&method=13').then(r=>r.json())));
 if(months.some(x=>x.code!==200||!Array.isArray(x.data)))throw Error('takvim alınamadı');
 const entries=[];
 for(const month of months)for(const day of month.data){
  const parts=String(day.date?.gregorian?.date||'').split('-');if(parts.length!==3)continue;
  const iso=parts[2]+'-'+parts[1]+'-'+parts[0];
  for(const [k,name] of [['Fajr','İmsak'],['Dhuhr','Öğle'],['Asr','İkindi'],['Maghrib','Akşam'],['Isha','Yatsı']]){
   const hhmm=String(day.timings?.[k]||'').match(/^(\d\d:\d\d)/)?.[1];if(!hhmm)continue;
   const when=Date.parse(iso+'T'+hhmm+':00+03:00');
   if(Number.isFinite(when)&&when>Date.now()+60000&&when<Date.now()+31*86400000)entries.push({t:when,p:name});
  }
 }
 entries.sort((a,b)=>a.t-b.t);
 if(entries.length<15)throw Error('Yeterli gün bulunamadı');
 nrReminderStatus=c+' için '+entries.length+' bildirim vakti hazır. Android bildirim iznini ver.';
 if(n)n.textContent=nrReminderStatus;
 window.location.href='nur://schedule?city='+encodeURIComponent(c)+'&items='+encodeURIComponent(JSON.stringify(entries.slice(0,155)));
 }catch(e){nrReminderStatus='Vakit takvimi alınamadı; internete bağlıyken yeniden dene.';if(n)n.textContent=nrReminderStatus}
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('[data-nr]');if(!b)return;
 const act=b.dataset.nr;
 if(act==='verse')nrReadVerse();
 else if(act==='dua')nrShowDua(Number(b.dataset.idx));
 else if(act==='letter'){nrLetter=Number(b.dataset.idx);elifba()}
 else if(act==='answer')nrAnswer(b.dataset.value);
 else if(act==='esma-fav'){
  const id=Number(b.dataset.id),f=nrFaves();try{localStorage.setItem('nr-esma-fav',JSON.stringify(f.includes(id)?f.filter(x=>x!==id):f.concat(id)))}catch(e){}
  nrRenderEsma();
 }else if(act==='alarm-enable')nrSetAlarms();
 else if(act==='alarm-test')window.location.href='nur://test';
 else if(act==='alarm-disable')window.location.href='nur://disable';
});
document.addEventListener('input',ev=>{
 if(ev.target.id==='nr-book-search'){nrBookQuery=ev.target.value;document.getElementById('nr-book-results').innerHTML=nrBookItems(NR_LIBRARY.filter(x=>(x[0]+' '+x[1]).toLocaleLowerCase('tr').includes(nrBookQuery.toLocaleLowerCase('tr'))))}
 else if(ev.target.id==='nr-hadis-search'){nrHadisQuery=ev.target.value;document.getElementById('nr-hadis-results').innerHTML=nrItems(NR_HADIS.filter(x=>(x[0]+' '+x[1]).toLocaleLowerCase('tr').includes(nrHadisQuery.toLocaleLowerCase('tr'))))}
 else if(ev.target.id==='nr-esma-search'){nrEsmaQuery=ev.target.value;nrRenderEsma()}
});
