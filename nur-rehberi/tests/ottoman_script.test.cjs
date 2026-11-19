'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const assets=path.join(__dirname,'../app/src/main/assets');
const stored=new Map();
const listeners=new Map();
const page={innerHTML:''};
const book={innerHTML:''};
const context=vm.createContext({
  localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,val)=>stored.set(key,String(val))},
  document:{
    addEventListener:(name,fn)=>{const callbacks=listeners.get(name)||[];callbacks.push(fn);listeners.set(name,callbacks)},
    getElementById:id=>id==='nr-tafsir-book'?book:null
  },
  st:{page:'books'},main:page,
  window:{scrollTo:()=>{}},
  esc:x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
  toast:()=>{},
  NAMES:['Fâtiha'],
  nrTop:()=>'',
  setTimeout,clearTimeout,
  go(next){context.st.page=next;if(next==='guide')vm.runInContext('nrGuide()',context)}
});
for(const name of ['ottoman_script.js','book_reader.js','tafsir_reader.js']){
  vm.runInContext(fs.readFileSync(path.join(assets,name),'utf8'),context,{filename:name});
}
const evalIn=text=>vm.runInContext(text,context);

assert.equal(evalIn('nrOttomanEnabled'),true,'Ottoman-script mode must be default');
assert.equal(evalIn('nrOttomanTranscribe("İslam ve namaz 114")'),'اسلام وه نماز 114');
assert.match(evalIn('nrOttomanTranscribe("Mekke’de dua")'),/مکه/);
assert.match(evalIn('nrBookDisclaimer()'),/Tarihî bir Osmanlıca baskı/);
evalIn('nrOpenGuide(0)');
assert.match(page.innerHTML,/dir="rtl" lang="ota"/);
assert.match(page.innerHTML,/عثمانلیجه/);
assert.match(page.innerHTML,/otomatik Arap harfli aktarımı/);
assert.match(page.innerHTML,/1 \/ 4/);
const switches=listeners.get('click');
assert.ok(switches.length>=2);
const clickMode=mode=>{
 const event={target:{closest:selector=>selector==='[data-script-mode]'?{dataset:{scriptMode:mode}}:null}};
 switches.forEach(fn=>fn(event));
};
clickMode('latin');
assert.equal(stored.get('nr-script-mode'),'latin');
assert.match(page.innerHTML,/İlmihale Giriş/);
assert.doesNotMatch(page.innerHTML,/dir="rtl" lang="ota"/);
evalIn('nrGuideChange(1)');
assert.equal(stored.get('nr-guide-page-0'),'1');
clickMode('ottoman');
assert.equal(stored.get('nr-script-mode'),'ottoman');
assert.match(page.innerHTML,/2 \/ 4/);
assert.match(page.innerHTML,/dir="rtl" lang="ota"/);
const guides=evalIn('NR_LOCAL_GUIDES.length');
assert.equal(guides,12);
for(let i=0;i<guides;i++){
 const pages=evalIn(`NR_LOCAL_GUIDES[${i}].pages.length`);
 evalIn(`nrOpenGuide(${i})`);
 for(let p=0;p<pages;p++){
   assert.match(page.innerHTML,/dir="rtl" lang="ota"/);
   assert.match(page.innerHTML,/Osmanlı harfleri/);
   if(p<pages-1)evalIn('nrGuideChange(1)');
 }
}

// The online tafsir keeps its source text and only changes the visible script.
context.st.page='tefsir';
evalIn('nrTafsirLoading=false;nrTafsirCurrent=[{ayah:1,lastAyah:1,text:"İslam ve namaz"}];nrTafsirError="";nrTafsirSurah=1;nrTafsirPage=1;');
evalIn('nrTafsirCache.set("turkish-mokhtasar-1",nrTafsirCurrent)');
evalIn('nrTafsirReadPage()');
assert.match(book.innerHTML,/اسلام وه نماز/);
assert.match(book.innerHTML,/dir="rtl" lang="ota"/);
clickMode('latin');
evalIn('nrTafsirReadPage()');
assert.match(book.innerHTML,/İslam ve namaz/);
assert.doesNotMatch(book.innerHTML,/dir="rtl" lang="ota"/);
console.log('Ottoman-script reader: guide, bookmark, UI switch, tafsir, source disclaimer OK');
