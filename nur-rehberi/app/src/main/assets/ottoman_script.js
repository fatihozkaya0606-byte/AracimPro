/* Ottoman-script reading aid for original Nur Rehberi guides and online Turkish tafsir.
 * This is a deterministic character transcription, NOT a historical Ottoman
 * edition or a translation. Never describe the output as an original manuscript.
 * Arabic Quran text is deliberately unaffected. */
const NR_OSMANLICA_WORDS=Object.freeze({
 'allah':'الله','kur’an':'قرآن','kur\'an':'قرآن','kuran':'قرآن',
 'islam':'اسلام','islâm':'اسلام','peygamber':'پیغمبر','muhammed':'محمد',
 'iman':'ایمان','ibadet':'عبادت','namaz':'نماز','dua':'دعا',
 'zikir':'ذکر','ilmihal':'علم حال','ilim':'علم','ilmî':'علمی',
 'tefsir':'تفسیر','hadis':'حدیث','ayet':'آیت','âyet':'آیت',
 'sure':'سوره','sûre':'سوره','kitap':'کتاب','kitabı':'کتابی',
 'ahlâk':'اخلاق','ahlak':'اخلاق','hak':'حق','hakikat':'حقیقت',
 'müslüman':'مسلمان','osmanlı':'عثمانلی','türkçe':'تورکچه',
 'mekke':'مکه','medine':'مدینه','ramazan':'رمضان','zekât':'زکات',
 'sadaka':'صدقه','abdest':'آبدست','gusül':'غسل','kıble':'قبله',
 'hac':'حج','umre':'عمره','kâbe':'کعبه','merhamet':'مرحمت',
 'tarih':'تاریخ','dünya':'دنیا','ahiret':'آخرت','fıkıh':'فقه',
 'siyer':'سیر','hadisler':'حدیث‌لر','dualar':'دعالَر'
});
const NR_OSMANLICA_CHARS=Object.freeze({
 'a':'ا','b':'ب','c':'ج','ç':'چ','d':'د','e':'ه','f':'ف',
 'g':'گ','ğ':'غ','h':'ه','ı':'ی','i':'ی','j':'ژ','k':'ك',
 'l':'ل','m':'م','n':'ن','o':'و','ö':'و','p':'پ','r':'ر',
 's':'س','ş':'ش','t':'ت','u':'و','ü':'و','v':'و','y':'ی','z':'ز'
});
let nrOttomanEnabled=localStorage.getItem('nr-script-mode')!=='latin';
function nrOttomanTranscribe(input){
 return String(input).replace(/[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]+(?:[’'][A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]+)*/gu,word=>{
   const lower=word.toLocaleLowerCase('tr-TR');
   if(Object.prototype.hasOwnProperty.call(NR_OSMANLICA_WORDS,lower))return NR_OSMANLICA_WORDS[lower];
   const parts=lower.split(/[’']/);
   let head=parts[0],remaining=parts.slice(1);
   if(parts.length>2&&Object.prototype.hasOwnProperty.call(NR_OSMANLICA_WORDS,parts.slice(0,2).join('’'))){
     head=parts.slice(0,2).join('’');remaining=parts.slice(2);
   }
   if(remaining.length&&Object.prototype.hasOwnProperty.call(NR_OSMANLICA_WORDS,head)){
     return NR_OSMANLICA_WORDS[head]+'‌'+remaining.map(part=>nrOttomanTranscribe(part)).join('‌');
   }
   return [...lower.normalize('NFC')].map(c=>NR_OSMANLICA_CHARS[c]||({'â':'ا','î':'ی','û':'و','’':'','\'':''}[c])||c).join('');
 });
}
function nrBookText(text){return nrOttomanEnabled?nrOttomanTranscribe(text):String(text)}
function nrBookDirection(){return nrOttomanEnabled?' dir="rtl" lang="ota" class="nr-ottoman-text"':' dir="ltr" lang="tr"'}
function nrBookSwitch(){
 return '<div class="nr-script-switch" role="group" aria-label="Kitap yazı seçeneği">'+
  '<button type="button" data-script-mode="ottoman"'+(nrOttomanEnabled?' class="active" aria-pressed="true"':' aria-pressed="false"')+'>عثمانلیجه · Osmanlı harfleri</button>'+
  '<button type="button" data-script-mode="latin"'+(!nrOttomanEnabled?' class="active" aria-pressed="true"':' aria-pressed="false"')+'>Latin harfleri</button></div>';
}
function nrBookDisclaimer(){
 return nrOttomanEnabled?
 '<p class="nr-script-disclaimer">Bu görünüm, modern Türkçe rehber metninin <strong>otomatik Arap harfli aktarımıdır</strong>. Tarihî bir Osmanlıca baskı, yazma eser veya uzman tarafından doğrulanmış çeviri değildir. Kaynak metni görmek için Latin harflerini seçin.</p>':
 '<p class="nr-script-disclaimer">Bu metin Nur Rehberi için hazırlanmış Türkçe rehberdir. Osmanlı harfli aktarımı yukarıdan açabilirsiniz.</p>';
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-script-mode]');if(!button)return;
 const newMode=button.dataset.scriptMode;
 if(newMode!=='ottoman'&&newMode!=='latin')return;
 nrOttomanEnabled=newMode==='ottoman';
 try{localStorage.setItem('nr-script-mode',newMode)}catch(e){}
 if(st.page==='guide')nrGuide();
 else if(st.page==='tefsir')tefsirKitap();
 else if(st.page==='books')books();
});
