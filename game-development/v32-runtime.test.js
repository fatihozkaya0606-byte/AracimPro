const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Engine=require('./v32-engine.js');
const source=fs.readFileSync(__dirname+'/v32-features.js','utf8');
function harness(){
 const nodes={};
 class El{
   constructor(id=''){this.id=id;this.hidden=false;this.innerHTML='';this.textContent='';this.value='';this.disabled=false;
     this.style={};this.dataset={};this.listeners={};this.children=[];this.selected=false;}
   addEventListener(name,cb){this.listeners[name]=cb;}
   querySelector(){return {insertAdjacentHTML(){}};}
   appendChild(c){this.children.push(c);if(c.selected)this.value=c.value;}
   getBoundingClientRect(){return {left:0,top:0,width:90,height:90};}
   closest(){return null;}
 }
 const document={hidden:false,getElementById(id){return nodes[id]||(nodes[id]=new El(id));},
   createElement(){return new El();}};
 const get=id=>document.getElementById(id);
 const save={highest:11,completed:{},coins:2500,v32BossWins:{},v32CustomLevels:[]};
 let persisted=0,shown='';
 const pieces=[
   {id:1,x:0,y:0,length:1,dir:'U',color:'blue'},
   {id:2,x:2,y:2,length:1,dir:'R',color:'red'},
   {id:3,x:4,y:4,length:1,dir:'D',color:'green'}
 ];
 const bridge={save,persist(){persisted++;},show(s){shown=s;},sound(){},toast(){},
   makeLevel(n){return {level:n,pieces:pieces.map(p=>({...p})),rocks:[]};},
   canRemoveArrow(p,active,lvl){return Engine.canExit(p,active,lvl.rocks);},
   addCoins(amount){save.coins+=amount;persisted++;},
   openShopSkins(){shown='shop';},openLevelPage(n){shown='levels:'+n;}};
 const window={__okKacisV32Bridge:bridge,OkKacisV32Engine:Engine};
 const sandbox={window,document,performance:{now(){return 1000;}},setInterval(){},Date,Math,Number,Infinity,console};
 vm.runInNewContext(source,sandbox,{filename:'v32-features.js'});
 const api=window.__okKacisV32Test;
 const press=(x,y)=>get('v32TouchLayer').listeners.pointerdown({
   isPrimary:true,pointerType:'touch',button:0,clientX:x*10+5,clientY:y*10+5,
   preventDefault(){}
 });
 return {api,save,get,press,bridge,shown:()=>shown,persisted:()=>persisted};
}

test('60-second mode draws real arrows, accepts direct touch and moves to next board',()=>{
 const t=harness();t.api.hub();
 t.get('v32SpeedStart').onclick();
 assert.equal(t.api.getState().mode,'speed');
 assert.equal(t.api.getState().pieces,3);
 t.press(0,0);
 assert.equal(t.api.getState().pieces,2);
 assert.equal(t.api.getState().score,10);
 t.press(2,2);t.press(4,4);
 assert.equal(t.api.getState().pieces,3,'new round should begin immediately');
 assert.ok(t.api.getState().score>=65,'score should include stage clear');
 assert.equal(t.shown(),'v32');
});
test('weekly challenge saves local best, pays once and does not touch normal level progression',()=>{
 const t=harness(),highest=t.save.highest;
 t.api.begin('weekly');for(const xy of [[0,0],[2,2],[4,4]])t.press(...xy);
 assert.ok(t.save.v32Weekly.best>=65);
 assert.equal(t.save.coins,2700);
 assert.equal(t.save.highest,highest);
 t.api.begin('weekly');for(const xy of [[0,0],[2,2],[4,4]])t.press(...xy);
 assert.equal(t.save.coins,2700,'weekly coins must not be farmable');
});
test('three boss phases are playable and first-time reward is one-time',()=>{
 const t=harness();t.api.begin('boss',{boss:10});
 assert.equal(t.api.getState().mode,'boss');
 for(let step=0;step<9;step++){const xy=[[0,0],[2,2],[4,4]][step%3];t.press(...xy);}
 assert.equal(t.save.v32BossWins[10],true);
 assert.equal(t.save.coins,2720);
 t.api.begin('boss',{boss:10});
 for(let step=0;step<9;step++)t.press(...[[0,0],[2,2],[4,4]][step%3]);
 assert.equal(t.save.coins,2720);
});
test('editor builds, checks and saves a playable custom 9x9 board',()=>{
 const t=harness();t.get('v32EditKind').value='arrow';t.get('v32EditDir').value='U';
 t.get('v32EditLen').value='1';t.get('v32EditColor').value='blue';
 t.get('v32EditorOpen').onclick();
 t.api.editCell(0,0);t.api.editCell(2,2);t.api.editCell(4,4);
 assert.equal(t.api.checkEditor(),true);
 t.get('v32EditorSave').onclick();
 assert.equal(t.save.v32CustomLevels.length,1);
 assert.equal(t.save.v32CustomLevels[0].pieces.length,3);
 t.get('v32EditorTest').onclick();
 assert.equal(t.api.getState().mode,'custom');
 for(const xy of [[0,0],[2,2],[4,4]])t.press(...xy);
 assert.equal(t.api.getState().mode,null);
 assert.equal(t.save.coins,2500,'custom levels must not mint coins');
});
test('map navigation and skin catalog links use existing unlocked level and shop',()=>{
 const t=harness();
 t.get('v32MapOpen').onclick();
 assert.match(t.get('v32MapStops').innerHTML,/1\. Yeşil Vadi/);
 assert.match(t.get('v32MapStops').innerHTML,/Seviye 521–540/);
 t.get('v32SkinsOpen').onclick();
 assert.equal(t.shown(),'shop');
});
