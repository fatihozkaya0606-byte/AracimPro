const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync(__dirname+'/game.js','utf8');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),css=fs.readFileSync(__dirname+'/style.css','utf8');
const from=js.indexOf("  const inputBoard=$('gameBoard');"),to=js.indexOf('  function penalizeMistake(',from);
assert.ok(from>0&&to>from,'touch surface handler missing');
const source=js.slice(from,to);
function setup(){
 const calls=[],listeners={};
 const rect=(l,t,r,b)=>({left:l,top:t,right:r,bottom:b,width:r-l,height:b-t});
 const piece=(id,r)=>({dataset:{id:String(id)},style:{},classList:{contains:()=>false}});
 const a=piece(3,rect(100,100,136,136)),b=piece(5,rect(160,100,196,136));
 const gem={dataset:{gem:'gift_1'},getBoundingClientRect:()=>rect(230,100,263,133)};
 const board={clientWidth:360,getBoundingClientRect:()=>rect(10,10,370,370),
  querySelector:s=>s.includes('[data-id="3"]')?a:s.includes('[data-id="5"]')?b:null,
  querySelectorAll:s=>s==='.power-gem'?[gem]:[a,b],addEventListener:(n,fn)=>listeners['board-'+n]=fn};
 const overlay={addEventListener:(n,fn)=>listeners['overlay-'+n]=fn,closest:()=>null};
 const sandbox={SIZE:9,screen:'playing',busy:false,movesLeft:10,window:{PointerEvent:function(){}},
  pieces:[{id:3,x:2.25,y:2.25,length:1,dir:'R'},{id:5,x:3.75,y:2.25,length:1,dir:'L'}],
  specialTiles:[{id:'gift_1',x:6,y:2}],
  $:id=>({gameBoard:board,boardTouchLayer:overlay,modal:{hidden:true}}[id]),
  tapPiece:id=>calls.push('arrow:'+id),useSpecialTile:id=>calls.push('gem:'+id),
  playSound(){},vibrate(){},penalizeMistake:()=>calls.push('blank'),toast(){}};
 vm.runInNewContext(source,sandbox);
 const event=(x,y)=>({clientX:x,clientY:y,pointerType:'touch',isPrimary:true,target:overlay,
  preventDefault(){this.prevented=true}});
 return {calls,listeners,event,overlay,pieces:[a,b]};
}
test('transparent surface covers the board but preserves visible arrows',()=>{
 assert.match(html,/id="boardTouchLayer"/);
 assert.match(css,/#playing \.board-touch-layer\{/);
 assert.match(css,/background:transparent!important/);
 assert.match(js,/const ARROW_VECTOR =/);
});
test('10 px off a 36px arrow and two rapid sequential taps are processed',()=>{
 const c=setup(),first=c.event(90,118);
 c.listeners['overlay-pointerdown'](first);
 assert.equal(first.prevented,true);
 c.listeners['overlay-pointerdown'](c.event(178,118));
 assert.deepEqual(c.calls,['arrow:3','arrow:5']);
 c.listeners['board-click']({detail:1,target:{closest:()=>null}});
 assert.deepEqual(c.calls,['arrow:3','arrow:5']);
});
test('special gems are reachable through the overlay',()=>{
 const c=setup();c.listeners['overlay-pointerdown'](c.event(269,119));
 assert.deepEqual(c.calls,['gem:gift_1']);
});
test('keyboard fallback remains enabled',()=>{
 const c=setup();
 c.listeners['board-click']({detail:0,target:{closest:s=>s==='.piece'?c.pieces[0]:null}});
 assert.deepEqual(c.calls,['arrow:3']);
});
test('540 levels and existing monetization settings not changed',()=>{
 assert.match(js,/const SIZE = 9, TOTAL_LEVELS = 540/);
 assert.match(js,/setBannerVisible\(true\)/);
 assert.match(js,/ok-kacis-v1/);
});
