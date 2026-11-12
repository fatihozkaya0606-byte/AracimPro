const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/game.js','utf8');
const start=src.indexOf('  function rngFor(level){');
const end=src.indexOf('  function startLevel(n){',start);
assert.ok(start>0&&end>start,'Cannot locate the real playable puzzle engine');
const code="const SIZE=9,COLORS=['red','green','orange','purple','yellow','blue'];\n"
 +src.slice(start,end)
 +"\n({makeLevel,canRemoveArrow,verifyLevelSolution,mechanicReason,difficulty});";
const game=vm.runInNewContext(code,{});

test('every level above 20 offers genuine bad and safe removal choices, but has a full solution',()=>{
 const stats=[];
 for(let n=1;n<=540;n++){
  const lvl=game.makeLevel(n),all=lvl.pieces;
  assert.ok(game.verifyLevelSolution(lvl),'No reverse-order solution at level '+n);
  const legal=all.filter(p=>game.canRemoveArrow(p,all,lvl,0,true));
  const dangerous=legal.filter(p=>p.holdsFor&&all.some(q=>q.id===p.holdsFor));
  const safe=legal.filter(p=>!p.holdsFor||!all.some(q=>q.id===p.holdsFor));
  const min=n<=20?0:n<=50?1:n<=100?2:n<=220?3:4;
  assert.equal(lvl.criticalDecisions,dangerous.length,'Wrong counted opening choices at level '+n);
  assert.ok(dangerous.length>=min,'Level '+n+' has no real wrong first move');
  assert.ok(safe.length>=1,'No safe starting move at level '+n);
  if(n<=20)assert.equal(dangerous.length,0,'Tutorial level has irreversible traps '+n);
  for(const anchor of dangerous){
    const target=all.find(p=>p.id===anchor.holdsFor);
    assert.ok(target,'Trap has no protected arrow '+n);
    assert.ok(target.id-anchor.id>=4,'No advance planning depth at '+n);
    assert.ok(!game.canRemoveArrow(target,all,lvl,0,true),'Trap target trivially removable at '+n);
    const wrongState=all.filter(p=>p.id!==anchor.id);
    const guardOnly={...target,gates:(target.gates||[]).filter(g=>g.kind==='guard'&&g.anchorId===anchor.id)};
    assert.equal(guardOnly.gates.length,1,'Missing explicit support dependency at '+n);
    assert.match(game.mechanicReason(guardOnly,wrongState,0,true),/Destek oku/,'Wrong opening did not create dead end at '+n);
  }
  if([1,5,6,10,11,20,21,24,25,30,50,51,75,100,101,150,220,221,300,420,540].includes(n))
    stats.push({level:n,tier:lvl.difficulty.name,legal:legal.length,unsafe:dangerous.length,safe:safe.length,arrows:all.length});
 }
 console.log('V30-REAL-CHOICE-METRICS '+JSON.stringify(stats));
});

test('the complete reverse solution never loses a required support or violates a time gate',()=>{
 for(let n=21;n<=540;n++){
  const lvl=game.makeLevel(n);
  let active=lvl.pieces.slice();
  for(const p of lvl.pieces.slice().reverse()){
    assert.ok(game.canRemoveArrow(p,active,lvl,0,true),'Broken safe route: '+n+' at arrow '+p.id);
    active=active.filter(x=>x.id!==p.id);
  }
  assert.equal(active.length,0);
 }
});

test('puzzle difficulty comes from bad legal forks, not from punishing taps or replacing touch engine',()=>{
 assert.match(src,/function injectChoiceTraps\(n,pcs,rand,rocks\)/);
 assert.match(src,/dangerousOpenings/);
 assert.match(src,/boardTouchLayer\.addEventListener\('pointerdown'/);
 assert.match(src,/function safeHintCandidates\(active,lvl\)/);
 assert.match(src,/function guardStillNeeded\(p,active\)/);
 assert.match(src,/function undo\(\)/);
 assert.match(src,/currentLevel<=30/);
 assert.match(src,/const SIZE = 9, TOTAL_LEVELS = 540/);
});
