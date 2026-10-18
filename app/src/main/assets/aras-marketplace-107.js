/* Aracım Pro 107 — ARAS branded companion + honest, cloud-backed auto market beta */
(function(){
'use strict';
const oldWelcome=welcome,oldHome=homeView,oldServices=moreAllServices;


/* V108: ARAS is a small animated companion, not an oversized promotion card.
   The icon is an original SVG drawn in app; no external image or brand art. */
function arasArt(){
 return '<svg class="aras109Robot" viewBox="0 0 130 150" aria-hidden="true">'+
 '<defs>'+
 '<radialGradient id="aras109Shell" cx=".29" cy=".19" r=".88"><stop stop-color="#b4eaff"/><stop offset=".26" stop-color="#4bbbee"/><stop offset=".52" stop-color="#1266bd"/><stop offset=".83" stop-color="#091f52"/><stop offset="1" stop-color="#020917"/></radialGradient>'+
 '<linearGradient id="aras109Chrome" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".18" stop-color="#b9d6f3"/><stop offset=".49" stop-color="#4e89bf"/><stop offset=".69" stop-color="#f5fcff"/><stop offset="1" stop-color="#23537d"/></linearGradient>'+
 '<radialGradient id="aras109Lens"><stop stop-color="#ddfaff"/><stop offset=".24" stop-color="#45c8ff"/><stop offset=".51" stop-color="#0877e0"/><stop offset=".73" stop-color="#092f78"/><stop offset="1" stop-color="#02132a"/></radialGradient>'+
 '<linearGradient id="aras109Visor" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#123f77"/><stop offset=".4" stop-color="#040e24"/><stop offset=".9" stop-color="#081b41"/><stop offset="1" stop-color="#0b3261"/></linearGradient>'+
 '<radialGradient id="aras109Glow"><stop stop-color="#33bfff" stop-opacity=".6"/><stop offset="1" stop-color="#168cff" stop-opacity="0"/></radialGradient></defs>'+
 '<ellipse cx="62" cy="143" rx="51" ry="7" fill="#051329" opacity=".45"/>'+
 '<path d="M37 104L23 115L23 130L42 130L51 118" fill="url(#aras109Shell)" stroke="#54c6fa" stroke-width="2"/>'+
 '<path d="M87 104L106 115L109 130L92 131L79 116" fill="url(#aras109Shell)" stroke="#54c6fa" stroke-width="2"/>'+
 '<path d="M41 112Q30 111 30 122L30 143L53 143L57 122M73 122L78 143L99 143L100 121Q97 111 87 111" fill="url(#aras109Chrome)" stroke="#19568c" stroke-width="2"/>'+
 '<path d="M34 107Q64 97 94 107L103 126Q103 140 90 144H40Q29 141 28 129Z" fill="url(#aras109Shell)" stroke="#7ddbff" stroke-width="2.5"/>'+
 '<path d="M48 115Q65 105 82 115L84 131L65 138L46 131Z" fill="#0a2755" stroke="#51bdf1" stroke-width="1.3"/>'+
 '<path d="M58 117L70 117L75 127L64 134L54 127Z" fill="#19aaff"/><path d="M60 122H69L65 130Z" fill="#d6faff"/>'+
 '<rect x="10" y="43" width="20" height="46" rx="10" fill="url(#aras109Chrome)" stroke="#65bbee" stroke-width="2"/>'+
 '<rect x="102" y="43" width="20" height="46" rx="10" fill="url(#aras109Chrome)" stroke="#65bbee" stroke-width="2"/>'+
 '<path d="M16 68Q9 42 28 24Q42 8 66 9Q92 8 105 29Q115 46 113 69L104 96Q91 107 66 108Q39 108 24 95Z" fill="url(#aras109Chrome)" stroke="#70d7ff" stroke-width="2"/>'+
 '<path d="M26 56Q25 25 60 21Q101 18 105 54L101 82Q92 99 65 100Q38 99 29 82Z" fill="url(#aras109Visor)" stroke="#2c7bad" stroke-width="2"/>'+
 '<path d="M37 34Q61 23 85 33" fill="none" stroke="#76d7ff" stroke-width="2" opacity=".65"/>'+
 '<ellipse cx="46" cy="62" rx="19" ry="22" fill="url(#aras109Glow)"/><ellipse cx="84" cy="62" rx="19" ry="22" fill="url(#aras109Glow)"/>'+
 '<ellipse class="aras109Eye" cx="47" cy="62" rx="13" ry="16" fill="url(#aras109Lens)" stroke="#7de5ff" stroke-width="2"/>'+
 '<ellipse class="aras109Eye" cx="83" cy="62" rx="13" ry="16" fill="url(#aras109Lens)" stroke="#7de5ff" stroke-width="2"/>'+
 '<ellipse cx="43" cy="57" rx="4" ry="5" fill="#f5ffff"/><ellipse cx="79" cy="57" rx="4" ry="5" fill="#f5ffff"/>'+
 '<ellipse cx="51" cy="70" rx="2" ry="3" fill="#89eaff" opacity=".9"/><ellipse cx="87" cy="70" rx="2" ry="3" fill="#89eaff" opacity=".9"/>'+
 '<path d="M51 83Q65 92 79 83" stroke="#e6faff" fill="none" stroke-width="3" stroke-linecap="round"/>'+
 '<path d="M56 15V8" stroke="#8beaff" stroke-width="3"/><circle class="aras109Signal" cx="56" cy="7" r="5" fill="#87f5ff"/>'+
 '<circle cx="114" cy="110" r="10" fill="url(#aras109Chrome)" stroke="#5baeee" stroke-width="2"/>'+
 '<path d="M112 102L117 92M119 105L126 97M121 111L129 109" stroke="#cbf3ff" stroke-width="4" stroke-linecap="round"/>'+
 '</svg>';
}
function arasHtml(){
 return '<div class="aras108Dock" role="group" aria-label="Aras, Aracım Pro yapay zekâ asistanı">'+
 '<button type="button" class="aras108Bot" onclick="arasOpenAi()" aria-label="Aras ile konuş">'+arasArt()+
 '<span class="aras108BotAura"></span></button>'+
 '<button type="button" class="aras108Talk" onclick="arasOpenAi()">'+
 '<span class="aras108Eyebrow"><i></i> ARAS AI <span class="aras108Sparkle">✦</span></span>'+
 '<strong>Aracınla ilgili ne merak ediyorsun?</strong>'+
 '<small>Bir belirti yaz, birlikte inceleyelim <span aria-hidden="true">↗</span></small>'+
 '</button></div>';
}
function marketIcon(){
 return '<span class="market109Photo" aria-label="Gerçek otomobil fotoğrafı"><img src="r8ui/market.jpg" alt="Otomobil" loading="lazy"></span>';
}

function marketTeaser(){
 return '<button type="button" class="market108Link" onclick="aracimMarketOpen()" aria-label="Araç Pazarı alım satım bölümünü aç">'+
 '<span class="market108Icon">'+marketIcon()+'</span>'+
 '<span class="market108Copy"><span class="market108Title">ARAÇ PAZARI <i>BETA</i></span>'+
 '<span class="market108Desc">Satılık araçları incele · İlan ver</span></span>'+
 '<span class="market108Chevron" aria-hidden="true">›</span></button>';
}
window.arasOpenAi=function(){
 try{faultGuideModal()}catch(e){toast('Aras şu anda açılamadı')};
};
welcome=function(){
 return '<div class="proWelcome108">'+
 '<section class="proWelcomeHero108"><span class="proWelcomeEyebrow108">ARACIM PRO GARAJ</span>'+
 '<div class="proWelcomeHeroRow108"><div><h2>Aracın, tüm bilgileriyle burada.</h2>'+
 '<p>İlk aracını ekle; bakımını, giderlerini ve geçmişini tek yerden yönet.</p></div>'+
 '<div class="proWelcomeHeroGraphic108" aria-hidden="true">'+marketIcon()+'</div></div>'+
 '<button type="button" class="proWelcomeAdd108" onclick="openVehicle()">＋ Aracımı Ekle <span>→</span></button></section>'+
 arasHtml()+marketTeaser()+apMrecCardHtml()+dailyQuickHtml()+'</div>';
};
homeView=function(){
 const s=oldHome();
 if(s.includes('aras108Dock'))return s;
 const placement=arasHtml()+marketTeaser();
 return s.includes('<div class="n97AdArea">')?
 s.replace('<div class="n97AdArea">',placement+'<div class="n97AdArea">'):
 s.replace('<div class="sectionHead">',placement+'<div class="sectionHead">');
};
moreAllServices=function(){
 const out=oldServices();
 if(!out.some(x=>x.id==='auto-market')){
   const entry={id:'auto-market',cat:'tools',action:'aracimMarketOpen()',img:'market',
     icon:'car',title:'Araç Pazarı • BETA',sub:'Araç al, sat; güvenli ilanları incele'};
   const idx=out.findIndex(x=>x.id==='market');
   out.splice(idx<0?0:idx,0,entry);
 }
 return out;
};

/* Only genuine Firestore listings are presented as public listings.
 * A device-only draft is never labeled as online or published. */
const DRAFT_KEY='aracim_market_draft_107';
let rows=[],loading=false,lastError='',activeFilter='',myListings=false;
let marketFilterMake='',marketFilterModel='',marketFilterYear='',marketShowCatalog=false;
const MARKET_YEAR_MAX=new Date().getFullYear()+1;
function marketBrands(){
  return (typeof vehicleBrands!=='undefined'?vehicleBrands:[]).slice().sort(azSort);
}
function marketModels(make,year){
  if(!make)return[];
  const offline=typeof staticModels==='function'?staticModels(make):[];
  const remote=typeof remoteModelCache!=='undefined'?remoteModelCache[make+'|'+year]||[]:[];
  return [...new Set([...offline,...remote])].sort(azSort);
}
function marketSelect(list,value,placeholder){
  const vals=[...new Set((list||[]).filter(Boolean))];
  if(value&&!vals.includes(String(value)))vals.unshift(String(value));
  return '<option value="">'+esc(placeholder)+'</option>'+
    vals.map(s=>'<option value="'+esc(s)+'" '+(String(s)===String(value)?'selected':'')+'>'+esc(s)+'</option>').join('');
}
function marketYears(){
  return Array.from({length:MARKET_YEAR_MAX-1970+1},(_,i)=>String(MARKET_YEAR_MAX-i));
}
function marketFetchModels(make,year){
  if(!make||!year)return;
  try{Android.fetchVehicleModels(make,+year)}catch(e){}
}
window.onMarketVehicleModels=function(make,year,payload,error){
  const f=document.getElementById('market107Form');
  if(f&&f.elements.make.value===make&&+f.elements.year.value===+year){
    const model=f.elements.model,existing=model.value;
    model.innerHTML=marketSelect(marketModels(make,year),existing,'Model seç');
    model.value=existing;
    const status=document.getElementById('market111CatalogStatus');
    if(status)status.textContent=error?'Çevrimdışı model kataloğu kullanılıyor.':'Model listesi güncellendi.';
  }
  const browseMake=document.getElementById('marketBrowseMake');
  const browseModel=document.getElementById('marketBrowseModel');
  if(browseMake&&browseModel&&browseMake.value===make&&+marketFilterYear===+year){
    browseModel.innerHTML=marketSelect(marketModels(make,year),marketFilterModel,'Tüm modeller');
  }
};
// The garage catalog already refreshes remote models; also update market selects.
const previousVehicleModelsResult=window.onVehicleModelsResult;
window.onVehicleModelsResult=function(make,year,payload,error){
  if(typeof previousVehicleModelsResult==='function')
    previousVehicleModelsResult(make,year,payload,error);
  window.onMarketVehicleModels(make,year,payload,error);
};
window.aracimMarketMakeChanged=function(){
  const f=document.getElementById('market107Form');if(!f)return;
  const make=f.elements.make.value,year=f.elements.year.value;
  f.elements.model.innerHTML=marketSelect(marketModels(make,year),'','Model seç');
  const hint=document.getElementById('market111CatalogStatus');
  if(hint)hint.textContent=make?marketModels(make,year).length+' model seçime hazır.':'Önce marka seç.';
  marketFetchModels(make,year);
};
window.aracimMarketYearChanged=function(){
  const f=document.getElementById('market107Form');if(!f)return;
  const model=f.elements.model.value,make=f.elements.make.value,year=f.elements.year.value;
  f.elements.model.innerHTML=marketSelect(marketModels(make,year),model,'Model seç');
  marketFetchModels(make,year);
};
window.aracimMarketFromGarage=function(id){
  const v=(state.vehicles||[]).find(x=>x.id===id);
  const f=document.getElementById('market107Form');if(!v||!f)return;
  f.elements.make.innerHTML=marketSelect(marketBrands(),v.make,'Marka seç');
  f.elements.make.value=v.make;
  f.elements.year.value=String(v.year||'');
  f.elements.model.innerHTML=marketSelect(marketModels(v.make,v.year),v.model,'Model seç');
  f.elements.model.value=v.model;
  if(v.km)f.elements.km.value=v.km;
  if(v.fuel)f.elements.fuel.value=v.fuel;
  if(v.transmission)f.elements.transmission.value=v.transmission;
  marketFetchModels(v.make,v.year);
  toast('Araç bilgileri garajından aktarıldı');
};
function ready(){
 try{return JSON.parse(Android.communityStatus()||'{}')}catch(e){return{configured:false,signedIn:false}}
}
function safeNumber(n){return Number(n)||0}
function amount(n){return safeNumber(n).toLocaleString('tr-TR')+' ₺'}
function noPhone(v){return String(v||'').replace(/\D/g,'').slice(-15)}
function draftGet(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'null')}catch(e){return null}}
function draftPut(v){localStorage.setItem(DRAFT_KEY,JSON.stringify(v))}
function emptyText(){
 const account=ready();
 if(!account.configured)return 'Çevrimiçi ilan servisi henüz etkin değil. İlan taslağını bu cihazda saklayabilirsin; başka kullanıcılara gösterilmez.';
 return lastError?'İlanlar yüklenemedi: '+lastError:'Henüz yayımlanmış ilan bulunamadı. İlk ilanını oluşturabilirsin.';
}
function marketCarSymbol(){return '<span class="market108ListingCar" aria-hidden="true">'+marketIcon()+'</span>';}

function listingCard(v){
 const uid=ready().uid||'';
 const mine=uid&&v.ownerId===uid;
 return '<article class="market107Item">'+
 '<div class="market107Cover">'+marketCarSymbol()+
   '<span class="market107Year">'+esc(v.year)+'</span></div>'+
 '<div class="market107Info"><div class="market107Price">'+amount(v.price)+'</div>'+
 '<strong>'+esc(v.make)+' '+esc(v.model)+'</strong>'+
 '<small>'+esc(v.city)+' · '+num(v.km)+' km · '+esc(v.fuel||'Belirtilmedi')+'</small>'+
 '<div class="market107Actions"><button type="button" data-id="'+esc(v.id)+'" onclick="aracimMarketDetails(this.dataset.id)">İlan detayları →</button>'+
 (mine?'<span class="market107Own">İlanım</span>':'')+
 '</div></div></article>';
}
function filtered(){
 const q=activeFilter.trim().toLocaleLowerCase('tr-TR');
 const uid=ready().uid||'';
 return rows.filter(x=>(!myListings||x.ownerId===uid)
  &&(!marketFilterMake||x.make===marketFilterMake)
  &&(!marketFilterModel||x.model===marketFilterModel)
  &&(!marketFilterYear||String(x.year)===marketFilterYear)
  &&(!q||[x.make,x.model,x.city,String(x.year),x.fuel].join(' ').toLocaleLowerCase('tr-TR').includes(q))
 ).sort((a,b)=>b.createdAt-a.createdAt);
}
function listingGrid(){
 const found=filtered();
 return '<div class="market107List" id="market107List">'+
 (loading?'<div class="market107Notice">İlanlar getiriliyor…</div>':
 found.length?found.map(listingCard).join(''):'<div class="market107Notice">'+esc(emptyText())+'</div>')+'</div>';
}
function marketIntro(){
 const account=ready();
 return '<section class="market107Header"><div class="market107Eyebrow">ARACIM PRO • ARAÇ PAZARI</div>'+
 '<h2>Hayalindeki aracı bul.</h2><p>İlanlara göz at veya kendi aracın için bir satış ilanı oluştur.</p>'+
 '<div class="market107HeaderBtns"><button type="button" onclick="aracimMarketCreate()">＋ İlan oluştur</button>'+
 '<button type="button" onclick="aracimMarketRefresh()">↻ Yenile</button></div></section>'+
 (!account.configured?'<div class="market107Notice"><b>Beta / çevrimdışı taslak modu.</b> Firebase ilan yayınlama servisi yapılandırılmadığında ilanları başka kullanıcılara gösteremeyiz.</div>':'')+
 '<div class="market107Guide">🔐 Araç ruhsatı, plaka, şasi numarası, kimlik ve kapora bilgilerini paylaşma. Satın almadan önce ekspertiz, noter ve güvenli ödeme doğrulaması yap.</div>';
}
function marketCatalogHtml(){
 if(!marketShowCatalog)return '';
 const makes=marketFilterMake?[marketFilterMake]:marketBrands().slice(0,45);
 const cards=makes.map(make=>{
  const models=marketModels(make,marketFilterYear);
  return '<div class="market111CatalogMake"><b>'+esc(make)+'</b>'+
    '<small>'+models.length+' kayıtlı model</small>'+
    '<div class="market111CatalogChips">'+models.slice(0,12).map(model=>
      '<button type="button" data-make="'+esc(make)+'" data-model="'+esc(model)+'" onclick="aracimMarketCatalogPick(this.dataset.make,this.dataset.model)">'+esc(model)+'</button>').join('')+
    (models.length>12?'<span>+'+(models.length-12)+' model</span>':'')+'</div></div>';
 }).join('');
 return '<div class="market111Catalog"><div class="market111CatalogInfo">Katalogdaki araçlar satılık ilan değildir. Satılık ilanları kullanıcılar oluşturdukça aşağıda görünür.</div>'+cards+'</div>';
}
function drawMarket(){
 modal('🚘 Araç Pazarı • BETA','<div class="market107">'+marketIntro()+
 '<div class="market111Browse"><label>Marka<select id="marketBrowseMake" onchange="aracimMarketBrowseMake(this.value)">'+marketSelect(marketBrands(),marketFilterMake,'Tüm markalar')+'</select></label>'+
 '<label>Model<select id="marketBrowseModel" onchange="aracimMarketBrowseModel(this.value)">'+marketSelect(marketModels(marketFilterMake,marketFilterYear),marketFilterModel,'Tüm modeller')+'</select></label>'+
 '<label>Yıl<select id="marketBrowseYear" onchange="aracimMarketBrowseYear(this.value)">'+marketSelect(marketYears(),marketFilterYear,'Tüm yıllar')+'</select></label></div>'+
 '<div class="market107Filters"><input id="market107Search" type="search" aria-label="İlan ara" value="'+esc(activeFilter)+'" placeholder="İlanlarda şehir veya araç ara" oninput="aracimMarketFilter(this.value)"/>'+
 '<label class="market107My"><input type="checkbox" '+(myListings?'checked':'')+' onchange="aracimMarketMy(this.checked)"> Yalnız ilanlarım</label></div>'+
 '<button type="button" class="market111CatalogToggle" onclick="aracimMarketToggleCatalog()">🚘 '+(marketShowCatalog?'Araç kataloğunu gizle':'Tüm araç markalarını ve modelleri gör')+' <span>›</span></button>'+
 '<button type="button" class="market111ExternalSearch" onclick="aracimMarketExternalSearch()">🔎 Seçtiğim aracı internette satılık ara ↗</button>'+
 marketCatalogHtml()+
 '<h3 class="market111ResultsTitle">Yayımlanmış satış ilanları</h3>'+
 listingGrid()+'<div class="market107Footer">Araç kataloğu ilan değildir. Satılık ilanlar yalnız gerçek kullanıcı yayımladığında gösterilir. Aracım Pro ödemeye aracılık etmez.</div></div>');
}
window.aracimMarketBrowseMake=function(make){
 marketFilterMake=String(make||'');marketFilterModel='';
 drawMarket();marketFetchModels(marketFilterMake,marketFilterYear);
};
window.aracimMarketBrowseModel=function(model){marketFilterModel=String(model||'');drawMarket()};
window.aracimMarketBrowseYear=function(year){
 marketFilterYear=String(year||'');marketFilterModel='';drawMarket();
 marketFetchModels(marketFilterMake,marketFilterYear);
};
window.aracimMarketExternalSearch=function(){
 if(!marketFilterMake){toast('Önce bir marka seç');return;}
 const query=[marketFilterYear,marketFilterMake,marketFilterModel,'satılık araç ilanları'].filter(Boolean).join(' ');
 const url='https://www.google.com/search?q='+encodeURIComponent(query);
 try{Android.openUri(url,'')}catch(e){toast('Tarayıcı bağlantısı açılamadı')}
};
window.aracimMarketToggleCatalog=function(){marketShowCatalog=!marketShowCatalog;drawMarket()};
window.aracimMarketCatalogPick=function(make,model){
 marketFilterMake=make;marketFilterModel=model;marketShowCatalog=false;drawMarket();
};
window.aracimMarketOpen=function(){
 drawMarket();
 aracimMarketRefresh();
};
window.aracimMarketRefresh=function(){
 const account=ready();
 if(!account.configured){rows=[];loading=false;lastError='';drawMarket();return;}
 loading=true;lastError='';drawMarket();
 try{Android.marketFetchListings()}catch(e){loading=false;lastError='Bağlantı kurulamadı';drawMarket()}
};
window.onMarketListings=function(payload,error){
 loading=false;lastError=String(error||'');
 if(!error){
  try{const data=JSON.parse(payload||'[]');rows=Array.isArray(data)?data.filter(x=>x&&typeof x==='object').slice(0,80):[]}
  catch(e){rows=[];lastError='İlan bilgileri okunamadı'}
 }
 if(document.querySelector('#modalRoot .market107'))drawMarket();
};
window.aracimMarketFilter=function(q){
 activeFilter=String(q||'').slice(0,90);
 const box=document.getElementById('market107List');
 if(box)box.outerHTML=listingGrid();
};
window.aracimMarketMy=function(value){
 myListings=!!value;const box=document.getElementById('market107List');
 if(box)box.outerHTML=listingGrid();
};
window.aracimMarketDetails=function(id){
 const v=rows.find(r=>String(r.id)===String(id));if(!v)return toast('İlan bulunamadı');
 const uid=ready().uid||'';
 const mine=v.ownerId===uid&&!!uid;
 modal('İlan Detayı','<div class="market107"><div class="market107Details">'+
 '<div class="market107DetailCar">'+marketCarSymbol()+'</div>'+
 '<h2>'+esc(v.make)+' '+esc(v.model)+'</h2><div class="market107DetailPrice">'+amount(v.price)+'</div>'+
 '<div class="market107Facts"><span>📆 '+esc(v.year)+'</span><span>🛣 '+num(v.km)+' km</span><span>📍 '+esc(v.city)+'</span><span>⛽ '+esc(v.fuel||'—')+'</span><span>⚙️ '+esc(v.transmission||'—')+'</span></div>'+
 '<div class="market107Desc">'+esc(v.description||'Açıklama yok')+'</div>'+
 '<p class="market107Seller">İlan sahibi: '+esc(v.sellerName||'Aracım Pro kullanıcısı')+'</p>'+
 (v.publicPhone?'<button class="primary wide" type="button" data-id="'+esc(v.id)+'" onclick="aracimMarketContact(this.dataset.id)">Satıcıyla WhatsApp üzerinden görüş</button>':'<div class="market107Notice">Satıcı iletişim numarası paylaşmamış.</div>')+
 (mine?'<button class="secondary wide" type="button" data-id="'+esc(v.id)+'" onclick="aracimMarketSold(this.dataset.id)">İlanı kaldır / Satıldı</button>':
 '<button class="secondary wide" type="button" data-id="'+esc(v.id)+'" onclick="aracimMarketReport(this.dataset.id)">⚑ İlanı şikâyet et</button>')+
 '<button class="secondary wide" type="button" onclick="aracimMarketOpen()">← Tüm ilanlara dön</button></div></div>');
};
window.aracimMarketContact=function(id){
 const v=rows.find(r=>String(r.id)===String(id));if(!v||!v.publicPhone)return;
 const phone=noPhone(v.publicPhone);if(phone.length<10)return toast('Telefon numarası geçersiz');
 const msg='Merhaba, Aracım Pro Araç Pazarı üzerinde '+v.year+' '+v.make+' '+v.model+' ilanınızı gördüm.';
 const url='https://wa.me/'+phone+'?text='+encodeURIComponent(msg);
 try{Android.openMarketplaceLink(url)}catch(e){toast('WhatsApp bağlantısı açılamadı')}
};
window.aracimMarketSold=function(id){
 if(!confirm('İlanı yayından kaldırmak istiyor musun?'))return;
 try{Android.marketCloseListing(String(id))}catch(e){toast('İlan kaldırılamadı')}
};
window.onMarketClosed=function(payload,error){
 if(error){toast('İlan kaldırılamadı: '+String(error).slice(0,160));return;}
 toast('İlan yayından kaldırıldı');aracimMarketRefresh();
};
window.aracimMarketReport=function(id){
 if(!ready().signedIn){toast('İlanı bildirmek için hesapla giriş yapmalısın');return;}
 if(!confirm('Bu ilanı yanıltıcı veya uygunsuz olarak bildir?'))return;
 try{Android.marketReportListing(String(id))}catch(e){toast('Şikâyet gönderilemedi')}
};
window.onMarketReported=function(payload,error){toast(error?'Şikâyet gönderilemedi: '+String(error).slice(0,160):'İlan bildirimi alındı, teşekkürler')};

window.aracimMarketCreate=function(){
 const v=activeVehicle()||{},d=draftGet()||{},base={year:v.year||'',make:v.make||'',model:v.model||'',km:v.km||'',fuel:v.fuel||'',transmission:v.transmission||'',...d};
 const options=(list,val)=>list.map(x=>'<option '+(x===val?'selected':'')+' value="'+esc(x)+'">'+esc(x||'Seçiniz')+'</option>').join('');
 const cars=(state.vehicles||[]);
 const garage=cars.length?'<div class="market111Garage"><label>Garajımdaki araçlardan seç</label><select onchange="if(this.value)aracimMarketFromGarage(this.value)"><option value="">Araç seçerek bilgileri aktar</option>'+
 cars.map(car=>'<option value="'+esc(car.id)+'">'+esc([car.year,car.make,car.model].filter(Boolean).join(' '))+'</option>').join('')+'</select></div>':'';
 modal('🚘 Araç Satış İlanı','<div class="market107"><div class="market107Notice">Aracını katalogdan seç; marka ve modeli elle yazman gerekmiyor. İlanı bu cihazda taslak olarak saklayabilirsin. Yayımlama için doğrulanmış hesap ve Firebase ilan servisi gerekir.</div>'+
 garage+
 '<form id="market107Form" class="form market107Form" onsubmit="aracimMarketSave(event)">'+
 '<div class="formrow"><div class="field"><label>Marka</label><select name="make" required onchange="aracimMarketMakeChanged()">'+marketSelect(marketBrands(),base.make,'Marka seç')+'</select></div>'+
 '<div class="field"><label>Model</label><select name="model" required>'+marketSelect(marketModels(base.make,base.year),base.model,'Model seç')+'</select></div></div>'+
 '<div class="formrow"><div class="field"><label>Model yılı</label><select name="year" required onchange="aracimMarketYearChanged()">'+marketSelect(marketYears(),base.year,'Yıl seç')+'</select></div>'+
 '<div class="field"><label>Kilometre</label><input type="number" name="km" min="0" max="2000000" required value="'+esc(base.km||'')+'"></div></div>'+
 '<div id="market111CatalogStatus" class="market111CatalogStatus">Marka ve model seçimi mevcut araç kataloğundan yapılır.</div>'+
 '<div class="formrow"><div class="field"><label>Fiyat (TL)</label><input type="number" name="price" min="10000" max="100000000" required value="'+esc(base.price||'')+'" placeholder="1200000"></div>'+
 '<div class="field"><label>İl</label><input name="city" maxlength="45" required value="'+esc(base.city||'')+'" placeholder="Örn. Ankara"></div></div>'+
 '<div class="formrow"><div class="field"><label>Yakıt</label><select name="fuel">'+options(['Benzin','Dizel','LPG','Hibrit','Elektrik','Diğer'],base.fuel)+'</select></div>'+
 '<div class="field"><label>Şanzıman</label><select name="transmission">'+options(['Otomatik','Manuel','Diğer'],base.transmission)+'</select></div></div>'+
 '<div class="field"><label>İlan açıklaması</label><textarea name="description" minlength="15" maxlength="1200" required placeholder="Bakım geçmişi, hasar durumu, önemli özellikler…">'+esc(base.description||'')+'</textarea></div>'+
 '<div class="field"><label>WhatsApp numarası (isteğe bağlı, ilan yayımlanırsa herkese açık)</label><input type="tel" name="publicPhone" inputmode="tel" maxlength="20" value="'+esc(base.publicPhone||'')+'" placeholder="905xxxxxxxxx"></div>'+
 '<label class="market107Consent"><input type="checkbox" name="sharePhone" '+(base.sharePhone?'checked':'')+'> Telefon eklersem ilanı gören herkesin numaramı görebileceğini kabul ediyorum.</label>'+
 '<div class="market107Guide">Plaka, şasi no, ruhsat ve kimlik fotoğrafı yüklemeyin. Fotoğraflı ilanlar için güvenli dosya depolama sonraki aşamada eklenecek.</div>'+
 '<button class="secondary wide" type="submit" name="saveAction" value="draft">Taslak kaydet</button>'+
 '<button class="primary wide" type="submit" name="saveAction" value="publish">İlanı yayımla</button>'+
 '<button class="secondary wide" type="button" onclick="aracimMarketOpen()">← Pazara dön</button></form></div>');
 const m=document.getElementById('market107Form');
 if(m&&m.elements.make.value&&m.elements.year.value)marketFetchModels(m.elements.make.value,m.elements.year.value);
};
window.aracimMarketSave=function(event){
 event.preventDefault();
 const f=new FormData(event.target),e=event.submitter||document.activeElement;
 const d={make:String(f.get('make')||'').trim(),model:String(f.get('model')||'').trim(),year:+f.get('year'),km:+f.get('km'),price:+f.get('price'),
 city:String(f.get('city')||'').trim(),fuel:String(f.get('fuel')||''),transmission:String(f.get('transmission')||''),
 description:String(f.get('description')||'').trim(),publicPhone:noPhone(f.get('publicPhone')),sharePhone:f.has('sharePhone')};
 if(d.make.length<2||d.model.length<2||d.city.length<2||d.description.length<15||d.year<1970||d.year>2027||d.price<10000||d.price>100000000||d.km<0||d.km>2000000){toast('Lütfen ilan bilgilerini kontrol et');return}
 if(d.publicPhone&&(d.publicPhone.length<10||d.publicPhone.length>15||!d.sharePhone)){toast('İletişim numarası için onay kutusunu işaretle veya numarayı kaldır');return}
 if(e?.value!=='publish'){draftPut(d);toast('Taslak yalnız bu cihaza kaydedildi');return}
 const account=ready();
 if(!account.configured){draftPut(d);toast('Firebase ilan servisi hazır değil; taslak kaydedildi');return}
 if(!account.signedIn||!account.emailVerified){draftPut(d);toast('İlan yayımlamak için hesabına giriş yap ve e-postanı doğrula. Taslağın kaydedildi.');return}
 if(!d.publicPhone){draftPut(d);toast('Yayımlamak için iletişim numarası eklemelisin. Taslağın kaydedildi.');return}
 if(!confirm('İlanın ve onayladığın iletişim numaran herkese açık yayımlanacak. Onaylıyor musun?'))return;
 draftPut(d);
 try{Android.marketPublishListing(JSON.stringify(d));toast('İlan gönderiliyor…')}catch(e){toast('İlan yayımlanamadı; taslak cihazda saklandı')}
};
window.onMarketPublished=function(payload,error){
 if(error){toast('İlan yayımlanamadı: '+String(error).slice(0,190));return}
 localStorage.removeItem(DRAFT_KEY);toast('İlanın yayımlandı');aracimMarketOpen();
};
// Initial HTML rendered before extension scripts loaded: refresh once so ARAS
// and the market entry are visible immediately, without waiting for a tab change.
setTimeout(()=>{try{if(document.getElementById('app'))render()}catch(e){}},80);
})();
