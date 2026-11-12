const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/game.js','utf8');
const start=src.indexOf('  function rngFor(level){');
const end=src.indexOf('  function startLevel(n){',start);
assert.ok(start>0&&end>start);
const script="const SIZE=9,COLORS=['red','green','orange','purple','yellow','blue'];\n"+src.slice(start,end)
 +"\n({makeLevel,difficulty,canRemoveArrow,verifyLevelSolution,availableCount,mechanicReason,mechanicsForLevel,occupancy,cells});";
const m=vm.runInNewContext(script,{});

test('level 24 onward: higher target, denser placements, mandatory multikey bottleneck, solvable',()=>{
 const stats=[];
 let holdLevels=0,minimum=100;
 for(let n=24;n<=540;n++){
   const lvl=m.makeLevel(n),d=m.difficulty(n),active=lvl.pieces;
   assert.ok(m.verifyLevelSolution(lvl),'No complete solution at '+n);
   assert.ok(m.availableCount(lvl)>=1,'No legal starting move at '+n);
   assert.ok(d.target>=31,'Not a harder target at '+n);
   assert.ok(d.visibleGoal<=3,'Too many free choices at '+n);
   assert.ok(lvl.metrics.density>.29,'Almost empty stage '+n);
   assert.ok(lvl.metrics.initiallyFree>=1);
   assert.ok(lvl.metrics.initiallyFree<=Math.max(3,d.visibleGoal),'Too many accessible starting arrows at '+n);
   const gates=active.flatMap(p=>(p.gates||[]).map(g=>({p,g})));
   const bottlenecks=gates.filter(x=>x.g.kind==='bottleneck');
   assert.ok(bottlenecks.length>=1,'Missing bottleneck '+n);
   for(const {p,g} of bottlenecks){
     assert.ok(g.requires.length>=3&&g.requires.length<=4,'Wrong multikey count at '+n);
     for(const id of g.requires){
       const k=active.find(q=>q.id===id);
       assert.ok(k && k.id>p.id,'Invalid bottleneck direction at '+n);
     }
   }
   for(const {p,g} of gates.filter(x=>x.g.kind==='guard')){
     const anchor=active.find(q=>q.id===g.anchorId);
     assert.ok(anchor,'Missing hold anchor at '+n);
     assert.ok(anchor.id<p.id,'Support anchor must be inserted before guarded arrow '+n);
     assert.ok(m.canRemoveArrow(p,active,lvl,0,true)===false || m.mechanicReason(p,active,0,true)==='');
     assert.match(m.mechanicReason(p,active.filter(q=>q.id!==anchor.id),0,true),/Destek oku/,'Wrong start must block guarded exit '+n);
     holdLevels++;
   }
   minimum=Math.min(minimum,lvl.metrics.density);
   if(n===24||n===25||n===30||n===35||n===50||n===100||n===181||n===300||n===540)
     stats.push({level:n,arrows:active.length,occupied:lvl.metrics.occupied,percent:Math.round(lvl.metrics.density*100),free:lvl.metrics.initiallyFree,guards:lvl.metrics.guards});
 }
 console.log('V28-BOARD-METRICS '+JSON.stringify({stats,minimumDensity:minimum,guardedPuzzles:holdLevels}));
});
test('5-level challenge pulses add density goals without mutating early stages',()=>{
 const before=m.difficulty(23),v24=m.difficulty(24),challenge=m.difficulty(25),next=m.difficulty(26);
 assert.equal(before.target,25);
 assert.ok(v24.target>before.target);
 assert.ok(challenge.target>v24.target);
 assert.ok(next.target<challenge.target);
 assert.ok(challenge.rocks>=v24.rocks);
 assert.equal(m.mechanicsForLevel(23).includes('switch'),true);
 assert.match(src,/const SIZE = 9, TOTAL_LEVELS = 540/);
});
test('input, undo, bonus powers, progression and on-screen guidance survive',()=>{
 assert.match(src,/boardTouchLayer\.addEventListener\('pointerdown'/);
 assert.match(src,/function safeHintCandidates\(/);
 assert.match(src,/guardStillNeeded\(p,pieces\)/);
 assert.match(src,/p\.holdsFor&&pieces\.some/);
 assert.match(src,/currentLevel<=30/);
 assert.match(src,/function snapshot\(/);
 assert.match(src,/function undo\(/);
 assert.match(src,/mechanicTooltip\(n\)/);
});
