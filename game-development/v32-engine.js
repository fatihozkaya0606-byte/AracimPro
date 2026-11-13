/* Ok Kaçış V32 – shared, offline-testable puzzle & event rules. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.OkKacisV32Engine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SIZE=9;
 const directions=['R','L','U','D'];
 const colors=['blue','green','orange','purple','yellow','red'];
 function cells(p){
   const result=[];
   for(let i=0;i<p.length;i++){
     result.push([p.x+((p.dir==='L'||p.dir==='R')?i:0),p.y+((p.dir==='U'||p.dir==='D')?i:0)]);
   }
   return result;
 }
 function occupy(pieces,rocks){
   const used=new Set(rocks||[]);
   for(const p of pieces)for(const [x,y] of cells(p))used.add(x+','+y);
   return used;
 }
 function canPlace(piece,pieces,rocks){
   if(!piece||!directions.includes(piece.dir)||!colors.includes(piece.color)||![1,2,3].includes(piece.length))return false;
   const busy=occupy(pieces,rocks);
   return cells(piece).every(([x,y])=>x>=0&&x<SIZE&&y>=0&&y<SIZE&&!busy.has(x+','+y));
 }
 function canExit(p,pieces,rocks){
   const busy=occupy(pieces.filter(q=>q.id!==p.id),rocks);
   const dx=p.dir==='R'?1:p.dir==='L'?-1:0,dy=p.dir==='D'?1:p.dir==='U'?-1:0;
   const tip=cells(p).reduce((a,b)=>b[0]*dx+b[1]*dy>a[0]*dx+a[1]*dy?b:a);
   for(let x=tip[0]+dx,y=tip[1]+dy;x>=0&&x<SIZE&&y>=0&&y<SIZE;x+=dx,y+=dy)
     if(busy.has(x+','+y))return false;
   return true;
 }
 function validateLevel(pieces,rocks){
   if(!Array.isArray(pieces)||!Array.isArray(rocks)||pieces.length<3||pieces.length>12||rocks.length>14)
     return {ok:false,reason:'3–12 ok ve en fazla 14 taş gerekiyor.'};
   const filled=new Set(rocks);
   if(filled.size!==rocks.length||rocks.some(k=>!/^([0-8]),([0-8])$/.test(k)))return {ok:false,reason:'Taş yerleşimi geçersiz.'};
   const ids=new Set();
   for(const p of pieces){
     if(!Number.isInteger(p.id)||ids.has(p.id)||!canPlace(p,[],[]) || !canPlace(p,[],[...filled]))
       return {ok:false,reason:'Taşan veya taşla çakışan ok var.'};
     ids.add(p.id);
     for(const [x,y] of cells(p)){
       const k=x+','+y;
       if(filled.has(k))return {ok:false,reason:'Oklar çakışıyor.'};
       filled.add(k);
     }
   }
   const memo=new Set();
   function solve(active){
     if(!active.length)return true;
     const mask=active.map(p=>p.id).join(',');
     if(memo.has(mask))return false;
     for(const p of active){
       if(canExit(p,active,rocks)&&solve(active.filter(q=>q.id!==p.id)))return true;
     }
     memo.add(mask);
     return false;
   }
   return solve(pieces)?{ok:true,reason:'Bulmaca çözülebilir.'}:{ok:false,reason:'Bu düzenin çözümü yok. Okların yönlerini değiştir.'};
 }
 function normaliseLevel(level){
   if(!level||!Array.isArray(level.pieces)||!Array.isArray(level.rocks))return null;
   const pieces=level.pieces.slice(0,12).map((p,i)=>({
     id:i+1,x:Number(p.x),y:Number(p.y),length:Number(p.length),dir:String(p.dir),color:String(p.color)
   }));
   const rocks=level.rocks.slice(0,14).map(String);
   const checked=validateLevel(pieces,rocks);
   return checked.ok?{pieces,rocks}:null;
 }
 function utcWeekKey(date){
   const d=new Date(date);
   if(!Number.isFinite(d.getTime()))throw Error('Invalid calendar date');
   const midnight=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
   const day=new Date(midnight).getUTCDay();
   const monday=midnight-((day+6)%7)*86400000;
   return new Date(monday).toISOString().slice(0,10);
 }
 function weekChallengeLevel(date){
   const key=utcWeekKey(date);
   const seed=Number(key.replace(/-/g,''))>>>0;
   return {week:key,level:21+(Math.imul(seed,2654435761)>>>0)%80};
 }
 function bossStages(bossLevel){
   const n=Math.floor(Number(bossLevel));
   if(n<10||n>540||n%10)return [];
   return [Math.max(1,n-2),n-1,n];
 }
 function mapIslands(){
   const names=[['🌿','Yeşil Vadi'],['🏜️','Altın Çöl'],['❄️','Buz Tepeleri'],['🌅','Günbatımı'],['🌌','Neon Evren']];
   return Array.from({length:27},(_,i)=>{
     const start=i*20+1,end=Math.min(540,start+19);
     const world=names[i%names.length];
     return {number:i+1,start,end,icon:world[0],name:world[1]};
   });
 }
 function arrowAt(pieces,x,y){
   return pieces.find(p=>cells(p).some(v=>v[0]===x&&v[1]===y))||null;
 }
 function validEditorCoord(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<9&&y>=0&&y<9;}
 return {SIZE,directions,colors,cells,occupy,canPlace,canExit,validateLevel,normaliseLevel,
         utcWeekKey,weekChallengeLevel,bossStages,mapIslands,arrowAt,validEditorCoord};
});
