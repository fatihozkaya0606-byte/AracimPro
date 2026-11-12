const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/game.js','utf8');
const from=src.indexOf('  function rngFor(level){');
const to=src.indexOf('  function startLevel(n){',from);
assert.ok(from>0&&to>from,'Cannot locate playable puzzle engine');
const code="const SIZE=9,COLORS=['red','green','orange','purple','yellow','blue'];\n"
 +src.slice(from,to)
 +"\n({makeLevel,mechanicsForLevel,canRemoveArrow,mechanicReason,verifyLevelSolution,availableCount,timedGateOpen,freeExit,cells});";
const model=vm.runInNewContext(code,{});

test('all 540 generated stages have a complete reverse-order solution and no cyclic keys',()=>{
 const counts={};
 for(let n=1;n<=540;n++){
   const lvl=model.makeLevel(n);
   assert.ok(lvl.pieces.length>0,'Empty level '+n);
   assert.ok(model.verifyLevelSolution(lvl),'Unsatisfiable level '+n);
   assert.ok(model.availableCount(lvl)>0,'No starting arrow at '+n);
   const available=model.mechanicsForLevel(n);
   const found=[...new Set(lvl.pieces.flatMap(p=>(p.gates||[]).map(g=>g.kind)))];
   assert.equal(found.length,available.length,'Missing mechanics at level '+n);
   for(const name of available){assert.ok(found.includes(name),'Missing '+name+' at level '+n);counts[name]=(counts[name]||0)+1;}
   const indexes=new Map(lvl.pieces.map((p,i)=>[p.id,i]));
   for(const p of lvl.pieces){
     for(const [x,y] of model.cells(p))assert.ok(x>=0&&x<9&&y>=0&&y<9,'Out of bounds '+n);
     for(const gate of p.gates||[]){
       assert.ok(gate.requires.length>0,'Empty gate key at '+n);
       for(const keyId of gate.requires)assert.ok(indexes.get(keyId)>indexes.get(p.id),'Backward dependency at '+n);
       if(gate.kind==='double')assert.equal(gate.requires.length,2);
       if(gate.kind==='color'){
         const key=lvl.pieces.find(x=>x.id===gate.requires[0]);
         assert.equal(key.color,p.color,'Color-key mismatch at '+n);
       }
       if(gate.kind==='tunnel')assert.equal(gate.exitDir,p.dir);
       if(gate.kind==='rotate')assert.equal(gate.alignDir,p.dir);
     }
   }
 }
 for(const kind of ['ice','tunnel','switch','chain','color','timed','double','rotate'])
   assert.ok(counts[kind]>0,'Never generated '+kind);
});

test('teaching tiers introduce every requested mechanic in sequence',()=>{
 const firsts={11:'ice',16:'tunnel',21:'switch',31:'chain',41:'color',51:'timed',101:'double',181:'rotate'};
 for(const [n,name] of Object.entries(firsts))assert.ok(model.mechanicsForLevel(+n).includes(name),n+' missing '+name);
 assert.equal(model.mechanicsForLevel(10).length,0);
 assert.equal(model.mechanicsForLevel(540).length,4);
 assert.equal(model.mechanicsForLevel(101).length,3);
 assert.equal(model.mechanicsForLevel(181).length,3);
});

test('ice gate needs release; timed door alternates and always reopens',()=>{
 const p={id:1,x:0,y:0,length:1,dir:'R',gates:[{kind:'ice',requires:[2]},{kind:'timed',requires:[3]}]};
 assert.match(model.mechanicReason(p,[p,{id:2},{id:3}],0,true),/Buzu/);
 assert.match(model.mechanicReason(p,[p,{id:3}],0,true),/Kapıyı/);
 assert.equal(model.mechanicReason(p,[p],0,false),'');
 assert.match(model.mechanicReason(p,[p],8000,false),/Kapı/);
 assert.equal(model.mechanicReason(p,[p],12000,false),'');
 assert.equal(model.timedGateOpen(0),true);
 assert.equal(model.timedGateOpen(8000),false);
 assert.equal(model.timedGateOpen(12000),true);
});

test('UI path, full-board touch layer, hint and automatic boosters honor mechanics',()=>{
 assert.match(src,/function mechanicBadges\(p,active/);
 assert.match(src,/mechanicBadges\(p,pieces\)/);
 assert.match(src,/mechanicReason\(p,pieces\)/);
 assert.match(src,/canRemoveArrow\(p,pieces,levelData\)/);
 assert.match(src,/boardTouchLayer\.addEventListener\('pointerdown'/);
 assert.match(src,/currentLevel<=30/);
 assert.match(src,/mechanicTooltip\(n\)/);
 assert.match(src,/const SIZE = 9, TOTAL_LEVELS = 540/);
});
