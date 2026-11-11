const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/game.js','utf8');
const css=fs.readFileSync(__dirname+'/style.css','utf8');
const from=src.indexOf('  function refreshAfterArrow(){'), to=src.indexOf('  function undo(){',from);
assert.ok(from>=0&&to>from,'fast touch functions not found');
const body=src.slice(from,to);
test('pointerdown listener is attached once, click is only fallback',()=>{
 assert.match(src,/inputBoard\.addEventListener\('pointerdown'/);
 assert.match(src,/event\.preventDefault\(\)/);
 assert.match(src,/if\(window\.PointerEvent&&event\.detail!==0\)return/);
 assert.doesNotMatch(src,/querySelectorAll\('\.piece'\)\.forEach\(el=>el\.addEventListener\('click'/);
});
test('single-tap updates state immediately and allows next arrow without 135ms lock',()=>{
 const els=[1,2,3].map(id=>({
   dataset:{id:String(id)},classList:{add(){},remove(){},toggle(){}},
   style:{},querySelector:()=>null, parentNode:null, remove(){this.removed=true}
 }));
 const board={querySelectorAll:()=>els.filter(e=>!e.removed&&!e.style.pointerEvents),
   contains:()=>true};
 els.forEach(el=>{el.parentNode=board;});
 const nodes={gameBoard:board,modal:{hidden:true},progressTxt:{},movesTxt:{},difficultyLabel:{},undoBadge:{},hintBadge:{},undoBtn:{},hintBtn:{},gameTip:{}};
 const events=[];
 const ctx={
   pieces:[{id:1,dir:'R',color:'red'},{id:2,dir:'L',color:'blue'},{id:3,dir:'U',color:'yellow'}],
   removed:0,movesLeft:5,currentLevel:6,screen:'playing',busy:false,lostThisRun:false,
   levelData:{pieces:[1,2,3],difficulty:{name:'Isınma'},rocks:[]},
   history:[],hintId:-1,comboStreak:0,awardedCombos:new Set(),
   save:{undos:3,hints:3,totalArrows:0,dailyQuests:{arrows:0},coins:100},
   $:id=>nodes[id],
   snapshot(){return {pieces:ctx.pieces.map(p=>({...p})),removed:ctx.removed,movesLeft:ctx.movesLeft}},
   freeExit(){return true},ensureDaily(){},playSound(){},vibrate(){},persist(){},
   renderComboHud(){},updatePowerButtons(){},toast(){},spawnMoveSparkle(){},
   completeLevel(){events.push('won')},failLevel(){events.push('lost')},
   setTimeout(fn){events.push('cleanup');return 1},
 };
 vm.runInNewContext(body+';this.runTap=tapPiece;',ctx);
 ctx.runTap(1,els[0]);
 assert.equal(ctx.pieces.length,2);
 assert.equal(ctx.removed,1);
 assert.equal(ctx.movesLeft,4);
 assert.equal(nodes.progressTxt.textContent,'1/3');
 ctx.runTap(2,els[1]); // no timer or requestAnimationFrame required
 assert.equal(ctx.pieces.length,1);
 assert.equal(ctx.removed,2);
 assert.equal(ctx.movesLeft,3);
 assert.equal(nodes.progressTxt.textContent,'2/3');
 assert.equal(ctx.history.length,2);
 assert.equal(ctx.busy,false);
 // A repeat contact against the just-removed piece must not double count.
 ctx.runTap(2,els[1]);
 assert.equal(ctx.removed,2);
 assert.match(css,/V24 input latency fix/);
});
