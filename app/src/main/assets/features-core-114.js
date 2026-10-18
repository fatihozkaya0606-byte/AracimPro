/* ARACIM PRO V114 — interactive vehicle anatomy, voice Aras, year recap, forecast,
   maintenance story and earned badges. All summaries use saved user data only. */
(function(){
'use strict';
const V114_TODAY = () => new Date().toISOString().slice(0,10);
const vehicle114=()=>activeVehicle();
const owner114=()=>{const v=vehicle114();if(!v){requireVehicle('Bu özellik');return null}return v};
const storage114=()=>{state.prefs=state.prefs||{};return state.prefs};
const items114=(arr)=>{const v=vehicle114();return v&&Array.isArray(arr)?arr.filter(x=>x.vehicleId===v.id):[]};
const amount114=n=>money(Number(n)||0);
const allEvents114=()=>{
 const a=[],add=(source,kind,description,value=0,km=0)=>{for(const x of items114(source||[])){
  const date=String(x.dateDone||x.date||x.installDate||x.createdAt||'').slice(0,10);
  if(!/^\d{4}-\d\d-\d\d$/.test(date))continue;
  a.push({date,kind,description:typeof description==='function'?description(x):description,
    cost:typeof value==='function'?Number(value(x))||0:Number(x[value])||0,
    km:typeof km==='function'?Number(km(x))||0:Number(x[km])||0});
 }};
 add(state.fuel,'Yakıt',x=>(x.station||'Yakıt alımı')+' · '+(x.liters||'?')+' L','cost','km');
 add(state.expenses,'Gider',x=>x.category||'Diğer gider','cost');
 add(state.services,'Servis',x=>x.work||x.shop||'Servis',x=>x.total||x.cost||0,'km');
 add(state.maintenance,'Bakım',x=>x.name||'Bakım','cost','dueKm');
 add(state.trips,'Yolculuk',x=>x.route||'Yolculuk','cost',x=>Math.max(0,(+x.endKm||0)-(+x.startKm||0)));
 add(state.accidents,'Hasar',x=>x.title||'Hasar kaydı','cost','km');
 return a.sort((a,b)=>b.date.localeCompare(a.date));
};
const year114=(year)=>{
 const events=allEvents114().filter(x=>x.date.startsWith(String(year)));
 const t=items114(state.trips||[]).filter(x=>String(x.date||'').startsWith(String(year)));
 const firstFuel=items114(state.fuel||[]).filter(x=>String(x.date||'').startsWith(String(year)));
 const pointKms=[...firstFuel.map(x=>+x.km||0),...t.flatMap(x=>[+x.startKm||0,+x.endKm||0])].filter(x=>x>0);
 const travel=t.reduce((a,x)=>a+Math.max(0,(+x.endKm||0)-(+x.startKm||0)),0);
 const dist=travel|| (pointKms.length>1?Math.max(...pointKms)-Math.min(...pointKms):0);
 const cost=events.reduce((sum,x)=>sum+x.cost,0);
 const groups={};for(const e of events)groups[e.kind]=(groups[e.kind]||0)+e.cost;
 const best=t.map(x=>({route:x.route||'Yolculuk',km:Math.max(0,(+x.endKm||0)-(+x.startKm||0))})).sort((a,b)=>b.km-a.km)[0]||null;
 return {events,cost,groups,dist,tripCount:t.length,best,fillCount:firstFuel.length,maint:events.filter(x=>x.kind==='Servis'||x.kind==='Bakım').length};
};
function years114(){
 const known=new Set([new Date().getFullYear()]);
 for(const e of allEvents114()) known.add(+e.date.slice(0,4));
 return [...known].filter(x=>x>=2000&&x<=new Date().getFullYear()).sort((a,b)=>b-a);
}
window.yearWrapped114=function(yr){
 const v=owner114();if(!v)return;
 yr=+yr||new Date().getFullYear();
 const d=year114(yr);
 const years=years114().map(x=>'<option value="'+x+'" '+(x===yr?'selected':'')+'>'+x+'</option>').join('');
 const card=(label,value,ico)=>'<div class="ap114Metric"><span>'+ico+'</span><small>'+label+'</small><b>'+value+'</b></div>';
 modal('✨ Aracım Pro Yılın Özeti','<div class="ap114Page"><div class="ap114Hero ap114Wrapped"><small>YILIN YOL HİKÂYESİ</small>'+
 '<h2>'+yr+' • '+esc(v.make+' '+v.model)+'</h2><p>Bu özet yalnız uygulamaya kaydettiğin verilerle oluşturuldu.</p></div>'+
 '<label class="ap114Label">Yıl seç<select onchange="yearWrapped114(+this.value)">'+years+'</select></label>'+
 '<div class="ap114MetricGrid">'+card('Kayıtlı yol mesafesi',d.dist?num(d.dist)+' km':'Veri yok','🛣')+
 card('Yolculuk',d.tripCount+' kayıt','🧭')+
 card('Toplam kayıtlı masraf',amount114(d.cost),'₺')+
 card('Bakım / servis',d.maint+' kayıt','🔧')+'</div>'+
 '<div class="ap114Panel"><b>En uzun kayıtlı yolculuk</b><p>'+(d.best&&d.best.km?esc(d.best.route)+' · '+num(d.best.km)+' km':'Yolculuk mesafesi kaydedilmemiş')+'</p>'+
 '<b>Yakıt alımı</b><p>'+d.fillCount+' kez</p>'+
 '<b>Masraf dağılımı</b>'+Object.entries(d.groups).map(([name,total])=>
 '<div class="ap114Split"><span>'+esc(name)+'</span><strong>'+amount114(total)+'</strong></div>').join('')+
 (!d.events.length?'<p>Bu yıl için henüz kayıt bulunmuyor.</p>':'')+'</div>'+
 '<button class="primary wide" onclick="shareYear114('+yr+')">↗ Yılın özetini paylaş</button></div>');
};
window.shareYear114=function(year){
 const v=vehicle114(),d=year114(year);if(!v)return;
 const text=['ARACIM PRO • '+year+' YILIN ÖZETİ',v.year+' '+v.make+' '+v.model,
  'Kaydedilen mesafe: '+(d.dist?num(d.dist)+' km':'Veri yok'),
  'Yolculuk: '+d.tripCount,'Masraf: '+amount114(d.cost),
  'Bakım/servis: '+d.maint,'Bu rapor yalnız elle kaydedilen verilere dayanır.'].join('\n');
 try{Android.shareText('Aracım Pro Yılın Özeti',text)}catch(e){toast('Paylaşım açılamadı')}
};
function monthlyCosts114(){
 const months={};
 for(const e of allEvents114()){
  const key=e.date.slice(0,7);
  if(!months[key])months[key]={cost:0,fuel:0,other:0};
  months[key].cost+=e.cost;
  if(e.kind==='Yakıt')months[key].fuel+=e.cost;
  else months[key].other+=e.cost;
 }
 return months;
}
window.costForecast114=function(){
 if(!owner114())return;
 const months=monthlyCosts114(),keys=Object.keys(months).sort().slice(-12);
 const fuel=keys.reduce((n,k)=>n+months[k].fuel,0)/Math.max(1,keys.length);
 const other=keys.reduce((n,k)=>n+months[k].other,0)/Math.max(1,keys.length);
 const distance=+state.prefs.annualKm||12000;
 modal('📈 12 Aylık Masraf Senaryosu','<form class="ap114Page" onsubmit="forecastCompute114(event)">'+
 '<div class="ap114Hero"><b>Masrafını önceden gör</b><p>Kaydettiğin giderlerden senaryo oluştur. Bu bir fiyat garantisi veya canlı piyasa tahmini değildir.</p></div>'+
 '<div class="ap114Panel"><b>Veri temeli:</b> '+keys.length+' kayıtlı ay<br>'+
 'Yakıt aylık ort.: '+amount114(fuel)+' • Diğer aylık: '+amount114(other)+'</div>'+
 '<div class="ap114Two"><label>Yıllık beklenen km<input name="km" type="number" min="1" max="100000" required value="'+distance+'"></label>'+
 '<label>Gelecek yıl fiyat değişimi (%)<input name="inflation" type="number" min="-50" max="300" step="1" value="20"></label></div>'+
 '<label>Geçen yıla göre kilometre değişimi (%)<input name="kmchange" type="number" min="-90" max="500" step="1" value="0"></label>'+
 '<button type="submit" class="primary wide">12 ayı hesapla</button>'+
 '<div class="ap114Panel" id="ap114ForecastResult">Veri azsa tahminin güvenilirliği düşer. Kullanıcı girdileri varsayımdır.</div></form>');
};
window.forecastCompute114=function(event){
 event.preventDefault();
 const f=new FormData(event.target),months=monthlyCosts114(),keys=Object.keys(months).sort().slice(-12);
 const sumFuel=keys.reduce((s,k)=>s+months[k].fuel,0),sumOther=keys.reduce((s,k)=>s+months[k].other,0);
 const inflation=1+(+f.get('inflation')||0)/100;
 const priorKm=Math.max(1,+state.prefs.annualKm||12000);
 const chosenKm=Math.max(1,+f.get('km')||priorKm);
 const kmChange=1+(+f.get('kmchange')||0)/100;
 const distanceFactor=chosenKm/priorKm*kmChange;
 const annualFuel=(sumFuel/Math.max(1,keys.length))*12*distanceFactor*inflation;
 const annualOther=(sumOther/Math.max(1,keys.length))*12*inflation;
 const el=document.getElementById('ap114ForecastResult');if(!el)return;
 el.innerHTML='<strong>12 aylık senaryo</strong>'+
 '<div class="ap114Split"><span>Yakıt</span><b>'+amount114(annualFuel)+'</b></div>'+
 '<div class="ap114Split"><span>Bakım / diğer</span><b>'+amount114(annualOther)+'</b></div>'+
 '<div class="ap114Result">'+amount114(annualFuel+annualOther)+'</div>'+
 '<small>Varsayım: %'+esc(f.get('inflation'))+' fiyat, %'+esc(f.get('kmchange'))+
 ' kilometre değişimi. '+keys.length+' kayıtlı ay baz alındı; eksik kayıtlar sonucu düşürür.</small>';
};
const PARTS114={
 engine:{title:'Motor',place:'front',text:'Çekiş, hararet, yağlama ve titreşim belirtileri motor ve yardımcı sistemlerle bağlantılı olabilir.',tests:['Motor arıza lambası var mı?','Soğuk ve sıcakken farklı mı?','Yağ ve soğutma sıvısı uyarısı var mı?'],question:'Motorla ilgili bir belirtiyi nasıl ayırt edebilirim?'},
 brakes:{title:'Fren Sistemi',place:'front',text:'Disk, balata, kaliper ve hidrolik bileşenleri içerir. Fren zayıflığında sürüşü bırak.',tests:['Frenlemede titreşim var mı?','Pedal dibe iniyor mu?','Metal sürtme sesi geliyor mu?'],question:'Frene basınca titreme neden olur?'},
 gearbox:{title:'Şanzıman',place:'center',text:'Manuel, otomatik veya DCT sistemlerinde vuruntu ve gecikmenin nedenleri farklı olabilir.',tests:['Soğukken mi vuruntu yapıyor?','Hangi viteste oluyor?','İkaz lambası var mı?'],question:'Şanzıman vites geçişinde vuruntu yapıyor.'},
 tyres:{title:'Lastik & Jant',place:'wheels',text:'Lastik basıncı, balans ve jant deformasyonu titreşim ve tutuşu etkiler.',tests:['Belli hızda titreşim oluyor mu?','Lastikte balon veya yarık var mı?','Diş aşınması eşit mi?'],question:'Araba yüksek hızda titriyor; lastik ve jant açısından neye bakmalıyım?'},
 suspension:{title:'Süspansiyon',place:'center',text:'Amortisör, rot, rotil, salıncak ve burçları kapsar.',tests:['Kasislerde ses var mı?','Araç sağa sola çekiyor mu?','Direksiyonda boşluk var mı?'],question:'Kasislerden geçerken ön takımdan ses geliyor.'},
 electric:{title:'Elektrik & Akü',place:'front',text:'Akü, alternatör, sigortalar ve elektronik kontrol sistemlerini kapsar.',tests:['Marş ağır mı dönüyor?','Farlar titriyor mu?','Akü uyarısı çıkıyor mu?'],question:'Akü ve şarj sistemi sorunlarını nasıl ayırt ederim?'}
};
window.anatomy114=function(part){
 const v=owner114();if(!v)return;
 part=PARTS114[part]?part:'engine';const info=PARTS114[part];
 const buttons=Object.entries(PARTS114).map(([id,p])=>
  '<button type="button" class="'+(id===part?'active':'')+'" onclick="anatomy114(\''+id+'\')">'+esc(p.title)+'</button>').join('');
 modal('🚘 İnteraktif Araç Anatomisi','<div class="ap114Page"><div class="ap114Hero"><b>'+esc(v.make)+' '+esc(v.model)+'</b><p>Gerçek araç fotoğrafı ve açıklamalı parça seçimi. Konumlar şematiktir, marka özel mühendislik çizimi değildir.</p></div>'+
 '<div class="ap114Anatomy"><img src="r8ui/service.jpg" alt="Gerçek araç servis fotoğrafı">'+
 '<span class="ap114CarOverlay">ARAÇ SİSTEMLERİ · PARÇA REHBERİ</span>'+
 '<button style="left:28%;top:38%" onclick="anatomy114(\'engine\')" aria-label="Motor">⚙️</button>'+
 '<button style="left:70%;top:65%" onclick="anatomy114(\'brakes\')" aria-label="Frenler">◉</button>'+
 '<button style="left:50%;top:62%" onclick="anatomy114(\'gearbox\')" aria-label="Şanzıman">▣</button></div>'+
 '<div class="ap114Parts">'+buttons+'</div>'+
 '<div class="ap114Panel"><h3>'+esc(info.title)+'</h3><p>'+esc(info.text)+'</p>'+
 '<b>Kontrol soruları</b><ul>'+info.tests.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></div>'+
 '<button class="primary wide" onclick="anatomyAsk114(\''+part+'\')">Aras’a bu parça hakkında sor</button></div>');
};
window.anatomyAsk114=function(part){
 const p=PARTS114[part];if(!p)return;
 faultGuideModal();
 setTimeout(()=>faultGuideRun(p.question),120);
};
window.story114=function(){
 const v=owner114();if(!v)return;
 const list=allEvents114().slice(0,120);
 modal('🗓 Aracımın Hikâyesi','<div class="ap114Page"><div class="ap114Hero"><b>'+
 esc(v.year+' '+v.make+' '+v.model)+'</b><p>Bakım, yolculuk, yakıt ve gider geçmişin bir zaman tünelinde.</p></div>'+
 '<div class="ap114Timeline">'+(list.length?list.map((x,i)=>
 '<div class="ap114Event"><span class="ap114EventDot">'+(x.kind==='Yolculuk'?'🧭':x.kind==='Yakıt'?'⛽':x.kind==='Hasar'?'🛠':'🔧')+'</span>'+
 '<small>'+esc(x.date)+' • '+esc(x.kind)+'</small><b>'+esc(x.description)+'</b>'+
 '<span>'+[x.km?num(x.km)+' km':'',x.cost?amount114(x.cost):''].filter(Boolean).join(' · ')+'</span></div>').join(''):
 '<div class="ap114Panel">Henüz kaydedilmiş bir araç etkinliği yok.</div>')+'</div></div>');
};
const badges114=()=>{
 const events=allEvents114(),trips=items114(state.trips||[]),services=items114(state.services||[]),
 fuel=items114(state.fuel||[]),exp=items114(state.expenses||[]),maint=items114(state.maintenance||[]);
 const dist=trips.reduce((s,x)=>s+Math.max(0,(+x.endKm||0)-(+x.startKm||0)),0);
 const countPerYear={};for(const x of services)if(x.date)countPerYear[x.date.slice(0,4)]=true;
 return [
 ['🚘','İlk kayıt',events.length>=1,'Garajda ilk kayıt'],
 ['🧭','10 yolculuk',trips.length>=10,'10 yolculuk kaydı'],
 ['🛣','1.000 km',dist>=1000,'Kayıtlı yolculuk toplamında 1.000 km'],
 ['⛽','Yakıt takipçisi',fuel.length>=10,'10 yakıt fişi'],
 ['🔧','Bakım düzeni',services.length+maint.filter(x=>x.completed).length>=5,'5 bakım / servis kaydı'],
 ['📊','Hesap uzmanı',exp.length>=10,'10 masraf kaydı'],
 ['🏁','50 yolculuk',trips.length>=50,'50 yolculuk kaydı'],
 ['🏆','Garaj emektarı',Object.keys(countPerYear).length>=2,'İki ayrı yılda servis kaydı']
 ];
};
window.badges114=function(){
 if(!owner114())return;
 const rows=badges114(),earned=rows.filter(x=>x[2]).length;
 modal('🏅 Garaj Başarılarım','<div class="ap114Page"><div class="ap114Hero"><b>'+earned+' / '+rows.length+' rozet kazanıldı</b><p>Rozetler mevcut kayıtlarından otomatik hesaplanır; hayalî puan eklenmez.</p></div>'+
 '<div class="ap114Badges">'+rows.map(x=>'<div class="ap114Badge '+(x[2]?'earned':'locked')+'"><span>'+x[0]+'</span><b>'+esc(x[1])+'</b><small>'+esc(x[3])+'</small><em>'+(x[2]?'Kazanıldı':'Henüz değil')+'</em></div>').join('')+'</div>'+
 '<button class="primary wide" onclick="shareBadges114()">Kazandıklarımı paylaş</button></div>');
};
window.shareBadges114=function(){
 const v=vehicle114(),rows=badges114().filter(x=>x[2]);if(!v)return;
 try{Android.shareText('Aracım Pro rozetlerim',['ARACIM PRO BAŞARILARIM',
 v.make+' '+v.model,...rows.map(x=>x[0]+' '+x[1])].join('\n'))}catch(e){toast('Paylaşım açılamadı')}
};
})();
