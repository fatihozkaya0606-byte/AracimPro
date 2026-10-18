/* Aracım Pro 107 — ARAS branded companion + honest, cloud-backed auto market beta */
(function(){
'use strict';
const oldWelcome=welcome,oldHome=homeView,oldServices=moreAllServices;

function arasArt(){
  return '<svg class="arasMascotSvg" viewBox="0 0 132 118" role="img" aria-label="Aras, Aracım Pro asistanı">'+
  '<defs><linearGradient id="arasPaint107" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#78dcff"/><stop offset=".47" stop-color="#1687eb"/><stop offset="1" stop-color="#073ba3"/></linearGradient>'+
  '<linearGradient id="arasGlass107" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#143e75"/><stop offset="1" stop-color="#031c3f"/></linearGradient></defs>'+
  '<ellipse cx="66" cy="103" rx="50" ry="8" fill="#00b9ff" opacity=".2"/>'+
  '<path d="M19 65L30 43Q36 29 49 27H83Q96 29 103 43L113 65V88Q110 96 101 97H31Q22 96 19 88Z" fill="url(#arasPaint107)" stroke="#a9eaff" stroke-width="2.5"/>'+
  '<path d="M36 50Q41 37 51 36H81Q91 37 96 50L100 59H32Z" fill="url(#arasGlass107)" stroke="#8ce8ff" stroke-width="1.6"/>'+
  '<path d="M46 53Q50 48 55 53M77 53Q82 48 87 53" fill="none" stroke="#74eaff" stroke-width="5.2" stroke-linecap="round" class="arasEyes"/>'+
  '<path d="M58 76Q66 84 74 76" fill="none" stroke="#d8faff" stroke-width="3.2" stroke-linecap="round"/>'+
  '<rect x="21" y="67" width="20" height="12" rx="6" fill="#eaffff" opacity=".9"/><rect x="91" y="67" width="20" height="12" rx="6" fill="#eaffff" opacity=".9"/>'+
  '<rect x="31" y="91" width="19" height="11" rx="5" fill="#07294e"/><rect x="82" y="91" width="19" height="11" rx="5" fill="#07294e"/>'+
  '<path d="M54 14L66 7L78 14" stroke="#4edbff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="66" cy="7" r="5" fill="#8ff8ff" class="arasAntenna"/></svg>';
}
function arasHtml(){
 return '<button type="button" class="arasAssist107" onclick="arasOpenAi()" aria-label="Aras yapay zekâ asistanını aç">'+
 '<span class="arasArtWrap">'+arasArt()+'<span class="arasOnlineDot"></span></span>'+
 '<span class="arasCopy"><span class="arasKicker">ARACIM PRO • AKILLI ASİSTAN</span><strong>Merhaba, ben Aras!</strong><small>Arızanı anlat, birlikte inceleyelim.</small></span>'+
 '<span class="arasArrow">→</span></button>';
}
function marketTeaser(){
 return '<button type="button" class="arasMarketEntry" onclick="aracimMarketOpen()" aria-label="Araç Pazarı alım satım sayfasını aç">'+
 '<span class="arasMarketIcon">🚘</span><span><strong>Araç Pazarı <em>BETA</em></strong><small>İlan oluştur • Araç ara • Güvenli alışveriş ipuçları</small></span><b>›</b></button>';
}
window.arasOpenAi=function(){
  try{faultGuideModal()}catch(e){toast('Asistan şu anda açılamadı')};
};
welcome=function(){
 const s=oldWelcome();
 return s.replace('<div class="dailyQuickTitle"',arasHtml()+marketTeaser()+'<div class="dailyQuickTitle"');
};
homeView=function(){
 const s=oldHome();
 return s.replace('<div class="n97AdArea">',arasHtml()+marketTeaser()+'<div class="n97AdArea">');
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
function marketCarSymbol(){return '<span class="marketCarSymbol" aria-hidden="true">🚘</span>'}
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
 return rows.filter(x=>(!myListings||x.ownerId===uid)&&(!q||[x.make,x.model,x.city,String(x.year),x.fuel].join(' ').toLocaleLowerCase('tr-TR').includes(q))).sort((a,b)=>b.createdAt-a.createdAt);
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
function drawMarket(){
 modal('🚘 Araç Pazarı • BETA','<div class="market107">'+marketIntro()+
 '<div class="market107Filters"><input id="market107Search" type="search" aria-label="İlan ara" value="'+esc(activeFilter)+'" placeholder="Marka, model veya şehir ara" oninput="aracimMarketFilter(this.value)"/>'+
 '<label class="market107My"><input type="checkbox" '+(myListings?'checked':'')+' onchange="aracimMarketMy(this.checked)"> Yalnız ilanlarım</label></div>'+
 listingGrid()+'<div class="market107Footer">Aracım Pro alıcı/satıcı arasındaki ödemeye aracılık etmez. İlan bilgileri satıcı beyanıdır.</div></div>');
}
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
 modal('🚘 Araç Satış İlanı','<div class="market107"><div class="market107Notice">İlanı önce bu cihazda taslak olarak saklayabilirsin. Başka kullanıcılara yayımlamak için doğrulanmış hesap ve etkin Firebase ilan servisi gerekir.</div>'+
 '<form class="form market107Form" onsubmit="aracimMarketSave(event)">'+
 '<div class="formrow"><div class="field"><label>Marka</label><input name="make" maxlength="40" required value="'+esc(base.make||'')+'" placeholder="Örn. Hyundai"></div>'+
 '<div class="field"><label>Model</label><input name="model" maxlength="45" required value="'+esc(base.model||'')+'" placeholder="Örn. Elantra"></div></div>'+
 '<div class="formrow"><div class="field"><label>Model yılı</label><input type="number" name="year" min="1970" max="2027" required value="'+esc(base.year||'')+'"></div>'+
 '<div class="field"><label>Kilometre</label><input type="number" name="km" min="0" max="2000000" required value="'+esc(base.km||'')+'"></div></div>'+
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
