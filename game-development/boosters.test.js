/* node --test game-development/boosters.test.js */
const test = require("node:test");
const assert = require("node:assert/strict");
const boosters = require("./boosters.js");

function arrow(direction = "up") { return { type: "arrow", direction }; }
function board() {
  return [
    [arrow(), arrow(), { type:"key", protected:true }],
    [arrow(), arrow(), { type:"exit", protected:true }],
    [arrow(), { type:"obstacle", locked:true }, arrow()]
  ];
}

test("levels one to five stay easy; level six is first challenge", () => {
  for (let n=1; n<=5; n++) {
    const d=boosters.difficultyFor(n);
    assert.equal(d.tier, 0);
    assert.equal(d.extraObstacles, 0);
    assert.equal(d.comboEnabled, false);
  }
  assert.equal(boosters.difficultyFor(6).tier, 1);
  assert.equal(boosters.difficultyFor(6).comboEnabled, true);
  assert.ok(boosters.difficultyFor(21).tier > boosters.difficultyFor(6).tier);
});

test("level five blocks all powerups", () => {
  assert.equal(boosters.preview(board(),"bomb",{row:1,col:1},{level:5}).ok,false);
});

test("bomb clears a 3x3 area but protects keys, exits and locked blocks", () => {
  const before=board();
  const res=boosters.preview(before,"bomb",{row:1,col:1},{level:6});
  assert.equal(res.ok,true);
  assert.equal(res.affected.length,6);
  assert.equal(res.board[0][2].type,"key");
  assert.equal(res.board[1][2].type,"exit");
  assert.equal(res.board[2][1].locked,true);
  assert.equal(before[0][0].type,"arrow");
});

test("lightning clears only the selected row", () => {
  const res=boosters.preview(board(),"lightning",{row:1,col:0},{level:8});
  assert.equal(res.ok,true);
  assert.equal(res.board[0][0].type,"arrow");
  assert.equal(res.board[1][0],null);
  assert.equal(res.board[1][2].type,"exit");
});

test("rotation is clockwise and only works on unlocked arrows", () => {
  const res=boosters.preview(board(),"rotate",{row:0,col:0},{level:6});
  assert.equal(res.ok,true);
  assert.equal(res.board[0][0].direction,"right");
  assert.equal(boosters.preview(board(),"rotate",{row:0,col:2},{level:6}).ok,false);
});

test("invalid target, unknown booster and invalid board do not change anything", () => {
  assert.equal(boosters.preview(board(),"hammer",{row:9,col:0},{level:6}).ok,false);
  assert.equal(boosters.preview(board(),"bad",{row:1,col:1},{level:6}).ok,false);
  assert.equal(boosters.preview([],"bomb",{row:0,col:0},{level:6}).ok,false);
});

test("host solvability validator can reject a powerup", () => {
  const res=boosters.preview(board(),"hammer",{row:0,col:0},{level:6,canCommit:()=>false});
  assert.equal(res.ok,false);
  assert.equal(res.reason,"puzzle-state-rejected");
});

test("inventory is spent only after successful use and five successful moves reward booster", () => {
  let b=board();
  const control=boosters.createController({
    getBoard:()=>b, setBoard:next=>{b=next;}, getLevel:()=>6,
    canCommit:()=>true
  },{ inventory: {hammer:1,bomb:0,lightning:0,rotate:0} });
  assert.equal(control.use("hammer",{row:0,col:2}).ok,false);
  assert.equal(control.getInventory().hammer,1);
  assert.equal(control.use("hammer",{row:0,col:0}).ok,true);
  assert.equal(control.getInventory().hammer,0);
  assert.equal(control.use("hammer",{row:0,col:1}).ok,false);
  let reward;
  for (let i=0;i<5;i++) reward=control.recordMove(true);
  assert.equal(reward.rewarded,"hammer");
  assert.equal(control.getInventory().hammer,1);
  assert.equal(control.recordMove(false).combo,0);
});
