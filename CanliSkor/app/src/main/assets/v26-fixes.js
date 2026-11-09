/* Canlı Skor+ v2.6: Source-safe league assignment and favorite notifications. */
(function(){
'use strict';
const safe=x=>String(x??'').trim();
const normal=x=>safe(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function countryCode(v){
 if(v&&typeof v==='object')v=v.name||v.country||v.code||'';
 const c=normal(v);
 const aliases={'turkey':'TR','turkiye':'TR','türkiye':'TR','england':'GB','ingiltere':'GB','united kingdom':'GB','spain':'ES','espana':'ES','ispanya':'ES','italy':'IT','italia':'IT','italya':'IT','germany':'DE','almanya':'DE','france':'FR','fransa':'FR','tr':'TR','gb':'GB','uk':'GB','es':'ES','it':'IT','de':'DE','fr':'FR'};
 return aliases[c]||c.toUpperCase();
}
function parts(row,provider){
 const raw=row?.league??row?.competition??row?.tournament??{};
 const id=safe(row?.league_id||raw?.id||row?.competition_id||'');
 let name=safe((typeof raw==='string'?raw:raw?.name||raw?.title||raw?.league_name)||row?.league_name||row?.competition_name||row?.tournament_name||'');
 let country=safe(row?.country_name||row?.country?.name||row?.country||raw?.country?.name||raw?.country||'');
 if(provider==='bsd'){
  const mapped=STATE.leagueMap[id]||{};
  country ||= safe(mapped.country);
  if(!name||/^Lig #/.test(name))name=safe(mapped.name)||name;
 }
 return {name,id,country};
}
function safeLeague(row,provider){
 const {name,id,country}=parts(row,provider);
 const n=normal(name),c=countryCode(country);
 const youth=/(women|woman|female|femenin|femen|kad[ıi]n|u[- ]?(?:1[789]|2[013])\b|youth|reserve|junior|academy|amateur)/i.test(name);
 const match=(countryCode,re)=>!youth&&c===countryCode&&re.test(n);
 let key='';
 if(match('TR',/(trendyol\s+)?(super|s[uü]per)\s*lig/))key='tr-super';
 else if(match('TR',/(trendyol\s*)?(?:1\.?\s*lig|birinci\s*lig|tff\s*1)/))key='tr-first';
 else if(match('GB',/^(?:english\s+)?premier\s+league$/))key='eng-premier';
 else if(match('ES',/la\s*liga|primera\s+division/))key='esp-laliga';
 else if(match('IT',/^serie\s*a$/))key='ita-seriea';
 else if(match('DE',/^bundesliga$/))key='ger-bundesliga';
 else if(match('FR',/^ligue\s*1$/))key='fra-ligue1';
 else if(provider==='bsd'&&!c&&!youth&&/trendyol\s+(?:super|s[uü]per)\s+lig/.test(n))key='tr-super';
 else if(provider==='bsd'&&!c&&!youth&&/trendyol\s+1\.?\s*lig/.test(n))key='tr-first';
 if(!key){
  const fallback=normal(name||'bilinmeyen').replace(/[^a-z0-9]+/g,'-').slice(0,70);
  key='other:'+provider+':'+(id?encodeURIComponent(id):c+'-'+fallback);
 }
 const f=FEATURED.find(x=>x.key===key);
 return {key,title:f?.title||(country?country+' - ':'')+(name||'Lig bilgisi yok'),flag:f?.flag||'⚽',id,provider};
}
const originalNormalize=normalize;
normalize=function(row,provider,fromLive){
 const m=originalNormalize(row,provider,fromLive);m.league=safeLeague(row,provider);return m;
};
const originalFixtures=fixtures;
fixtures=async function(day){return (await originalFixtures(day)).map(m=>{m.league=safeLeague(m.raw||{},m.provider);return m})};
const originalLive=liveMatches;
liveMatches=async function(){return (await originalLive()).map(m=>{m.league=safeLeague(m.raw||{},m.provider);return m})};
try{if(localStorage.getItem('csV26LeagueMigrated')!=='1'){localStorage.removeItem('scoreCacheV4');localStorage.setItem('csV26LeagueMigrated','1')}}catch(_){}
const originalRender=render;
render=function(){
 for(const m of [...STATE.matches,...STATE.liveMatches])if(m?.raw&&m.provider)m.league=safeLeague(m.raw,m.provider);
 originalRender();
};
const recent=new Map();
function tracked(){
 const selected=[...new Set([...favorites,...watchedMatchAlerts])].slice(0,50);
 const known=[...STATE.liveMatches,...STATE.matches];
 return selected.map(key=>{
  const m=known.find(x=>matchKey(x)===key)||recent.get(key);
  if(m)recent.set(key,m);
  const provider=key.startsWith('b:')?'bsd':key.startsWith('s:')?'sportscore':key.startsWith('a:')?'api-football':'';
  return {key,provider,id:m?.id||key.slice(2),slug:m?.slug||'',home:m?.home||'',away:m?.away||''};
 }).filter(x=>x.provider==='bsd'&&/^\d+$/.test(x.id)||x.provider==='sportscore'&&/^[a-z0-9-]{3,140}$/.test(x.slug));
}
function sync(autoEnable){
 const android=window.AndroidApi;if(!android)return;
 const list=tracked();
 try{
  if(typeof android.setTrackedMatches==='function')android.setTrackedMatches(JSON.stringify(list));
  if(autoEnable&&list.length&&typeof android.setBackgroundGoals==='function'){
   localStorage.setItem('csBackgroundGoalOn','true');
   android.setBackgroundGoals(true,bsdToken||'');
  }
 }catch(e){console.warn('Background sync failed',e)}
}
document.addEventListener('click',event=>{
 if(event.target.closest('[data-star],[data-row-alert]'))setTimeout(()=>sync(true),60);
 if(event.target.closest('[data-save-token],[data-clear-token],[data-v25-background]'))setTimeout(()=>sync(false),140);
 if(event.target.closest('[data-v26-test-alert]')){
  try{window.AndroidApi?.testNotification?.()}catch(_){window.alert('Cihazda deneme bildirimi çalıştırılamadı.')}
 }
},true);
const oldSettings=screenSettings;
screenSettings=function(){
 return oldSettings()+'<section class="setting"><h3>🔔 Favori maç bildirimleri</h3><p>Yıldızladığın veya zilini açtığın maçlar Android takibine aktarılır. Gol, kırmızı kart, devre arası ve maç sonu desteklenir. Telefon uygulamayı kapattığında Android yaklaşık 15 dakikada bir kontrol edebilir. Anlık bildirim için ayrıca sunucu ve Firebase gerekir.</p><p>Takip edilen, bu kaynaklarda desteklenen maç: <b>'+tracked().length+'</b>. Bildirim izni ve pil tasarrufu ayarlarını da kontrol et.</p><button class="secondary" data-v26-test-alert="1">🔔 Deneme bildirimi gönder</button></section>';
};
setTimeout(()=>sync(false),1200);
window.__cs_v26={safeLeague,tracked,sync};
})();