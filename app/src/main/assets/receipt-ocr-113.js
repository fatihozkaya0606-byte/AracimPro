/* V113 private, editable receipt text recognition. */
(function(){
'use strict';
const prevImage=window.onNativeImagePicked;
let receipt=null;
function moneyNum(x){
 const s=String(x||'').replace(/[^\d,.]/g,'');
 if(!s)return 0;
 const k=Math.max(s.lastIndexOf(','),s.lastIndexOf('.'));
 if(k>=0&&s.length-k-1<=2&&s.length-k-1>0)
   return Number(s.slice(0,k).replace(/\D/g,'')+'.'+s.slice(k+1).replace(/\D/g,''))||0;
 return Number(s.replace(/\D/g,''))||0;
}
function parseReceipt(text){
 const lines=String(text||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 let date=today(),cost=0,liters=0,kind='expense',totals=[];
 for(const line of lines){
   const upper=line.toLocaleUpperCase('tr-TR');
   if(/BENZİN|MOTORİN|DİZEL|AKARYAKIT|LİTRE|LITRE|LPG|LT\b/.test(upper))kind='fuel';
   const amount=upper.match(/(\d{1,6}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(?:TL|₺)?\s*$/);
   if(amount&&/TOPLAM|TUTAR|ÖDENECEK/.test(upper)){const n=moneyNum(amount[1]);if(n>0&&n<1000000)totals.push(n)}
   const vol=upper.match(/(\d{1,3}[.,]\d{1,3})\s*(?:LT\b|L\b|LİTRE|LITRE)/);
   if(vol&&kind==='fuel'){const n=moneyNum(vol[1]);if(n>0&&n<200)liters=n}
   const dm=line.match(/\b(\d\d)[.\/-](\d\d)[.\/-](20\d\d)\b/);
   if(dm&&+dm[1]>0&&+dm[1]<=31&&+dm[2]>0&&+dm[2]<=12)date=dm[3]+'-'+dm[2]+'-'+dm[1];
 }
 cost=totals.length?totals[totals.length-1]:0;
 return {date,cost,liters,kind,raw:lines.join('\n').slice(0,2400)};
}
window.receiptScan113=function(){
 if(!activeVehicle()){requireVehicle('Fiş Okut');return}
 modal('🧾 Fiş Tarayıcı','<div class="ap113Page"><div class="ap113Hero">Fişin fotoğrafını çek veya galeriden seç. Metin telefonda işlenir; <b>tutarı ve tarihi onaylamadan</b> kayıt yapılmaz.</div>'+
 '<div class="ap113Grid"><button class="primary" type="button" onclick="Android.captureImage(&quot;receipt-113&quot;)">📷 Fotoğraf Çek</button>'+
 '<button class="secondary" type="button" onclick="Android.pickImage(&quot;receipt-113&quot;)">🖼 Galeriden Seç</button></div>'+
 '<div id="ap113ScanState" class="ap113Notice">Lütfen net ve okunabilir bir fiş seç.</div></div>');
};
window.onNativeImagePicked=function(ctx,image){
 if(ctx==='receipt-113'){
  const status=document.getElementById('ap113ScanState');
  if(status)status.textContent='Fiş metni tanınıyor…';
  try{Android.scanReceiptText(image)}catch(e){window.onReceiptOcrResult('','Metin tanıma başlatılamadı')}
  return;
 }
 if(typeof prevImage==='function')prevImage(ctx,image);
};
window.onReceiptOcrResult=function(text,error){
 receipt=parseReceipt(text);
 const r=receipt;
 modal('🧾 Fişi Kontrol Et','<form class="form ap113Page" onsubmit="receiptSave113(event)">'+
 '<div class="ap113Hero">'+(error?'Metin okunamadı, alanları elle doldurabilirsin.':'Fiş okundu. Kaydetmeden önce her alanı kontrol et.')+'</div>'+
 '<label>Tür<select name="kind"><option value="fuel"'+(r.kind==='fuel'?' selected':'')+'>Yakıt alımı</option>'+
 '<option value="expense"'+(r.kind==='expense'?' selected':'')+'>Servis / Diğer gider</option></select></label>'+
 '<div class="ap113Grid"><label>Tarih<input type="date" required name="date" value="'+esc(r.date)+'"></label>'+
 '<label>Tutar (TL)<input type="number" min="0.01" max="1000000" step="0.01" required name="cost" value="'+(r.cost||'')+'"></label></div>'+
 '<div class="ap113Grid"><label>Yakıt litre / kWh<input type="number" min="0" step="0.01" name="liters" value="'+(r.liters||'')+'"></label>'+
 '<label>Kilometre<input type="number" min="0" name="km" value="'+(activeVehicle()?.km||0)+'"></label></div>'+
 '<label>Not<textarea maxlength="500" name="note" placeholder="Örn. istasyon veya servis notu"></textarea></label>'+
 '<details class="ap113Raw"><summary>Okunan fiş metni</summary><pre>'+esc(r.raw||error||'Fiş okunamadı')+'</pre></details>'+
 '<button class="primary wide" type="submit">✓ Kontrol Ettim • Kaydet</button></form>');
};
window.receiptSave113=function(ev){
 ev.preventDefault();const v=activeVehicle(),f=new FormData(ev.target);if(!v)return;
 const cost=+f.get('cost'),liters=+f.get('liters'),km=+f.get('km'),type=f.get('kind');
 if(!Number.isFinite(cost)||cost<=0||!Number.isFinite(km)||km<0){toast('Tutar ve kilometreyi kontrol et');return}
 if(type==='fuel'){
   if(!(liters>0)){toast('Yakıt için litre / kWh gir');return}
   upsert('fuel',{id:uid(),vehicleId:v.id,date:f.get('date'),km,liters,cost,station:'Fiş tarama',
        driveType:'Karma',fillType:'Kısmi Dolum'},'');
 }else{
   upsert('expenses',{id:uid(),vehicleId:v.id,date:f.get('date'),cost,category:'Diğer',
        note:String(f.get('note')||'Fişten aktarıldı').slice(0,500)},'');
 }
 if(km>v.km)v.km=km;
 receipt=null;closeModal();save();toast('Fiş kaydı oluşturuldu');
};
})();
