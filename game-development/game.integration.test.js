const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const src=fs.readFileSync(__dirname+"/game.js","utf8");
const from=src.indexOf("  function rngFor(level){");
const to=src.indexOf("  function startLevel(n){",from);
assert.ok(from>0&&to>from,"Cannot find actual level generator");
const code="const SIZE=7,COLORS=['red','green','orange','purple','yellow','blue'];\n"+src.slice(from,to)+"\n({difficulty,makeLevel,availableCount,createSpecialTiles,occupancy,key,cells,freeExit});";
const game=vm.runInNewContext(code,{});
const level=n=>game.makeLevel(n);

test("first five stages are easy; stage six introduces challenge",()=>{
  for(let n=1;n<=5;n++){
    const d=game.difficulty(n), b=level(n);
    assert.equal(d.name,"Başlangıç");
    assert.equal(d.rocks,0);
    assert.ok(d.allowances>=10);
    assert.equal(game.createSpecialTiles(n,b).length,0);
    assert.equal(b.rocks.length,0);
    assert.ok(b.pieces.every(p=>!p.needsKey));
  }
  assert.ok(game.difficulty(6).target>game.difficulty(5).target);
  assert.ok(game.difficulty(6).allowances<game.difficulty(5).allowances);
  assert.ok(game.difficulty(6).rocks>0);
  assert.ok(game.createSpecialTiles(6,level(6)).length>=1);
});

test("seeded levels remain solveable in reverse placement order",()=>{
  for(const n of [1,2,3,4,5,6,7,8,9,10,12,16,20,25,35,50,75,100,160,250,540]){
    const b=level(n);let active=b.pieces.map(p=>({...p}));
    assert.ok(active.length>0,"empty stage "+n);
    assert.ok(game.availableCount(b)>=1,"no available moves at stage "+n);
    for(const inserted of b.pieces.slice().reverse()){
      const p=active.find(p=>p.id===inserted.id);
      assert.ok(p,"missing arrow");
      assert.ok(!p.needsKey || !active.some(q=>q.id===p.needsKey),"locked arrow out of order at "+n);
      assert.ok(game.freeExit(p,active,b.rocks),"blocked reverse solution at "+n);
      active=active.filter(q=>q.id!==p.id);
    }
    assert.equal(active.length,0);
  }
});

test("special tokens occupy only empty cells, away from obstacles",()=>{
  for(const n of [6,7,10,11,20,35,70,125]){
    const b=level(n);
    const gems=game.createSpecialTiles(n,b);
    const occupied=game.occupancy(b.pieces,b.rocks);
    assert.ok(gems.length>=1,"no gems at "+n);
    for(const gem of gems){
      assert.ok(gem.x>=0&&gem.x<7&&gem.y>=0&&gem.y<7);
      assert.equal(occupied.has(game.key(gem.x,gem.y)),false,"overlap at "+n);
      assert.ok(["bomb","lightning","spin","gift"].includes(gem.type));
    }
  }
});
