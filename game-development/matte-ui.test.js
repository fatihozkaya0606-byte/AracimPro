const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync(__dirname+'/style.css','utf8');
const js=fs.readFileSync(__dirname+'/game.js','utf8');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const clean=css.slice(css.indexOf('OK KAÇIŞ V26 — QUIET WOOD'));
test('clean matte art direction preserves 9x9, transparent hit surface and arrow contrast',()=>{
 assert.match(clean,/#playing \.grid-rock span\{/);
 assert.match(clean,/#playing \.piece \.piece-inner\{/);
 assert.match(clean,/--mat-body:#488dbb/);
 assert.match(clean,/--mat-body:#d5ad51/);
 assert.match(clean,/\.arrow-main\{/);
 assert.match(clean,/stroke:#344d5d!important/);
 assert.doesNotMatch(clean,/#playing \.board-touch-layer\{/);
 assert.match(html,/id="boardTouchLayer"/);
 assert.match(js,/function nearbyArrow\(x,y\)/);
 assert.match(js,/const SIZE = 9, TOTAL_LEVELS = 540/);
});
test('UI covers top, board, HUD, bottom, level cards and shop without game logic changes',()=>{
 for(const sel of ['#playing .objective-card{','#playing .board-frame{','#playing .grid-rock span{','#playing .game-bottom .btn.action{','#playing .play-utilities .powers-strip{','#levels .level-card{','#shop .shop-card']){
   assert.ok(clean.includes(sel),sel);
 }
 assert.match(css,/WOOLAND|WOODLAND 3D GLOBAL DESIGN SYSTEM/);
});
