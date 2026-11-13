const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Engine=require('./v32-engine.js');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const game=fs.readFileSync(__dirname+'/game.js','utf8');
const ui=fs.readFileSync(__dirname+'/v32-features.js','utf8');
const css=fs.readFileSync(__dirname+'/style.css','utf8');
test('editor validates no overlap, out-of-bounds, and only truly solvable puzzles',()=>{
 const valid=[
  {id:1,x:1,y:1,length:1,dir:'R',color:'blue'},
  {id:2,x:3,y:3,length:1,dir:'U',color:'green'},
  {id:3,x:5,y:5,length:1,dir:'D',color:'red'}
 ];
 assert.equal(Engine.validateLevel(valid,[]).ok,true);
 assert.equal(Engine.validateLevel(valid.slice(0,2),[]).ok,false);
 assert.equal(Engine.canPlace({id:4,x:8,y:3,length:2,dir:'R',color:'blue'},valid,[]),false);
 assert.equal(Engine.canPlace({id:4,x:1,y:1,length:1,dir:'R',color:'blue'},valid,[]),false);
 assert.equal(Engine.canPlace({id:4,x:6,y:5,length:1,dir:'L',color:'blue'},valid,['6,5']),false);
 const deadlock=[
  {id:1,x:4,y:4,length:1,dir:'R',color:'blue'},
  {id:2,x:5,y:4,length:1,dir:'L',color:'green'},
  {id:3,x:0,y:0,length:1,dir:'U',color:'red'}
 ];
 assert.equal(Engine.validateLevel(deadlock,[]).ok,false);
 assert.equal(Engine.validateLevel(valid,['1,1']).ok,false); // disallow rock overlap
});
test('custom level normalization strips unknown metadata and rejects invalid layouts',()=>{
 const p=[{id:19,x:0,y:0,length:1,dir:'U',color:'blue',unexpected:'bad'},
 {id:83,x:2,y:2,length:1,dir:'D',color:'red'},
 {id:200,x:4,y:4,length:1,dir:'L',color:'green'}];
 const clean=Engine.normaliseLevel({pieces:p,rocks:[]});
 assert.ok(clean);
 assert.deepEqual(clean.pieces.map(x=>x.id),[1,2,3]);
 assert.equal('unexpected' in clean.pieces[0],false);
 assert.equal(Engine.normaliseLevel({pieces:[],rocks:[]}),null);
});
test('weekly puzzle seed is fixed throughout UTC week and changes on Monday',()=>{
 const a=Engine.weekChallengeLevel(new Date('2026-11-09T03:00:00Z'));
 const b=Engine.weekChallengeLevel(new Date('2026-11-15T22:59:59Z'));
 const c=Engine.weekChallengeLevel(new Date('2026-11-16T00:00:00Z'));
 assert.deepEqual(a,b);
 assert.notEqual(a.week,c.week);
 assert.ok(a.level>=21&&a.level<=100);
 assert.ok(c.level>=21&&c.level<=100);
});
test('540 levels map to 27 ordered islands matching every 20-level world',()=>{
 const map=Engine.mapIslands();
 assert.equal(map.length,27);
 assert.equal(map[0].start,1);
 assert.equal(map[26].end,540);
 for(let i=0;i<27;i++){
  assert.equal(map[i].start,i*20+1);
  assert.equal(map[i].end,(i+1)*20);
  if(i)assert.equal(map[i].start,map[i-1].end+1);
 }
});
test('bosses unlock every ten levels and require three consecutive puzzle stages',()=>{
 assert.deepEqual(Engine.bossStages(10),[8,9,10]);
 assert.deepEqual(Engine.bossStages(20),[18,19,20]);
 assert.deepEqual(Engine.bossStages(540),[538,539,540]);
 assert.deepEqual(Engine.bossStages(11),[]);
 assert.deepEqual(Engine.bossStages(0),[]);
});
test('speed, boss, weekly and custom modes are playable, have direct touch, clock and result updates',()=>{
 assert.match(ui,/function begin\(mode,options/);
 assert.match(ui,/function beginStage\(\)/);
 assert.match(ui,/function completeStage\(\)/);
 assert.match(ui,/function finish\(won\)/);
 assert.match(ui,/function tick\(now\)/);
 assert.match(ui,/v32TouchLayer'\)\.addEventListener\('pointerdown'/);
 assert.match(ui,/B\.canRemoveArrow\(/);
 assert.match(ui,/E\.canExit\(/);
 assert.match(ui,/60000/);
 assert.match(ui,/E\.weekChallengeLevel\(/);
 assert.match(ui,/save\.v32BossWins/);
 assert.match(ui,/save\.v32SpeedBest/);
 assert.match(ui,/save\.v32Weekly/);
});
test('editor, catalog, map and local-only tournament views are wired to UI elements',()=>{
 for(const id of ['v32HubOpen','v32Menu','v32Play','v32Editor','v32Map','v32BossStart',
 'v32SpeedStart','v32WeekStart','v32SkinsOpen','v32MapStops','v32EditorBoard','v32SavedLevels',
 'v32EditColor','v32EditorSave','v32EditorTest','v32Board','v32TouchLayer']){
  assert.match(html,new RegExp('id="'+id+'"'),id);
 }
 assert.match(ui,/E\.normaliseLevel\(/);
 assert.match(ui,/E\.validateLevel\(/);
 assert.match(ui,/B\.openLevelPage/);
 assert.match(ui,/B\.openShopSkins/);
 assert.match(html,/kişisel rekordur/);
 for(const skin of ['ice','lava','diamond'])assert.match(game,new RegExp("id:'"+skin+"'"));
 assert.match(css,/#app\.skin-diamond #playing/);
});
test('V31 save, direct touch, 540 stages, ranks and advertising policy are unchanged',()=>{
 assert.match(game,/localStorage\.getItem\('ok-kacis-v1'/);
 assert.match(game,/localStorage\.setItem\('ok-kacis-v1'/);
 assert.match(game,/const SIZE = 9, TOTAL_LEVELS = 540/);
 assert.match(game,/boardTouchLayer\.addEventListener\('pointerdown'/);
 assert.match(game,/const RANKS=Object\.freeze/);
 assert.match(game,/window\.__okKacisV32Bridge/);
 assert.match(game,/setBannerVisible\(true\)/);
 assert.match(html,/<script src="v32-engine\.js"><\/script>/);
 assert.match(html,/<script src="v32-features\.js"><\/script>/);
});
