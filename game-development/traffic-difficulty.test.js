const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/game.js','utf8');
const start=src.indexOf('  function rngFor(level){');
const end=src.indexOf('  function startLevel(n){',start);
assert.ok(start>0&&end>start,'Puzzle source not found');
const script="const SIZE=9,COLORS=['red','green','orange','purple','yellow','blue'];\n"+src.slice(start,end)
 +"\n({makeLevel,difficulty,canRemoveArrow,verifyLevelSolution,availableCount,mechanicReason,mechanicsForLevel,occupancy,cells});";
const m=vm.runInNewContext(script,{});
const expected=[
 {start:1,end:5,name:'Kolay',min:6,max:10,locks:0,extra:10,bottlenecks:0,density:.08},
 {start:6,end:10,name:'Hafif Zor',min:11,max:15,locks:.12,extra:8,bottlenecks:0,density:.12},
 {start:11,end:20,name:'Orta',min:17,max:23,locks:.3,extra:6,bottlenecks:0,density:.24},
 {start:21,end:50,name:'Zor',min:29,max:33,locks:.69,extra:4,bottlenecks:1,density:.45},
 {start:51,end:100,name:'Çok Zor',min:35,max:39,locks:.84,extra:3,bottlenecks:2,density:.55},
 {start:101,end:540,name:'Aşırı Zor',min:40,max:43,locks:.92,extra:2,bottlenecks:3,density:.60}
];
test('all 540 levels follow six exact contiguous difficulty tiers and remain solvable',()=>{
 let count=0,guarded=0,stats=[];
 for(const tier of expected){
  for(let n=tier.start;n<=tier.end;n++){
   const d=m.difficulty(n),lvl=m.makeLevel(n),active=lvl.pieces;
   assert.equal(d.name,tier.name,'Wrong difficulty label '+n);
   assert.ok(d.target>=tier.min&&d.target<=tier.max,'Wrong target count at '+n);
   assert.ok(d.allowances<=tier.extra,'Too many extra moves at '+n);
   assert.ok(d.lockChance>=tier.locks,'Too few locks at '+n);
   assert.ok(active.length>0&&active.length<=d.target,'Invalid arrow placement '+n);
   assert.ok(lvl.metrics.density>=tier.density,'Board too empty at '+n);
   assert.ok(lvl.metrics.initiallyFree>=1,'No legal start at '+n);
   assert.ok(m.verifyLevelSolution(lvl),'No guaranteed complete solution at '+n);
   assert.ok(m.availableCount(lvl)>0,'No initial available arrow at '+n);
   const gates=active.flatMap(p=>(p.gates||[]).map(g=>({p,g})));
   const bottle=gates.filter(x=>x.g.kind==='bottleneck');
   assert.equal(bottle.length,tier.bottlenecks,'Wrong bottleneck depth at '+n);
   for(const {p,g} of bottle){
     assert.equal(g.requires.length,d.bottleneckKeys,'Wrong key count at '+n);
     for(const id of g.requires)assert.ok(active.some(x=>x.id===id&&x.id>p.id),'Backward key at '+n);
   }
   const guards=gates.filter(x=>x.g.kind==='guard');
   if(n<21)assert.equal(guards.length,0,'No hard-tier traps before level 21');
   if(n>=21)assert.ok(guards.length>=1,'No real order choices at '+n);
   for(const {p,g} of guards){
     const anchor=active.find(q=>q.id===g.anchorId);
     assert.ok(anchor&&anchor.id<p.id,'Wrong support anchor '+n);
     const guardOnly={...p,gates:[g]};
     assert.match(m.mechanicReason(guardOnly,active.filter(q=>q.id!==anchor.id),0,true),/Destek oku/);
     guarded++;
   }
   if([1,5,6,10,11,20,21,25,50,51,55,75,100,101,200,300,420,540].includes(n))
     stats.push({level:n,difficulty:d.name,arrows:active.length,occupied:lvl.metrics.occupied,density:Math.round(lvl.metrics.density*100),initialFree:lvl.metrics.initiallyFree,bottlenecks:bottle.length});
   count++;
  }
 }
 assert.equal(count,540);
 assert.ok(guarded>=50,'Advanced support traps are absent');
 console.log('SIX-TIER-BOARD-METRICS '+JSON.stringify({sample:stats,guards:guarded}));
});

test('difficulty increases at exact 5/6 10/11 20/21 50/51 100/101 boundaries',()=>{
 for(const [a,b] of [[5,6],[10,11],[20,21],[50,51],[100,101]]){
   const before=m.difficulty(a),after=m.difficulty(b);
   assert.ok(before.target<after.target,'Not enough new arrows at '+b);
   assert.ok(before.allowances>after.allowances,'Not fewer spare moves at '+b);
   assert.ok(before.lockChance<after.lockChance,'Not more key pressure at '+b);
 }
 assert.equal(m.difficulty(1).name,'Kolay');
 assert.equal(m.difficulty(540).name,'Aşırı Zor');
 assert.equal(m.difficulty(540).bottleneckCount,3);
 assert.equal(m.difficulty(540).bottleneckKeys,4);
 assert.equal(m.mechanicsForLevel(11).includes('ice'),true);
 assert.match(src,/const SIZE = 9, TOTAL_LEVELS = 540/);
});

test('V25 fast touch, undo, safe hints, rewards and matte UI hooks are preserved',()=>{
 assert.match(src,/boardTouchLayer\.addEventListener\('pointerdown'/);
 assert.match(src,/function safeHintCandidates\(/);
 assert.match(src,/guardStillNeeded\(p,pieces\)/);
 assert.match(src,/currentLevel<=30/);
 assert.match(src,/function snapshot\(/);
 assert.match(src,/function undo\(/);
 assert.match(src,/mechanicTooltip\(n\)/);
});
