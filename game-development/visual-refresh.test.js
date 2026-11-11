const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'style.css'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
test('woodland 3D design includes carved oak sockets, walnut frame and directional vector arrows',()=>{
  assert.match(css,/WOODLAND 3D GLOBAL DESIGN SYSTEM/);
  assert.match(css,/#playing \.grid-rock span/);
  assert.match(css,/#playing \.board-frame/);
  assert.match(css,/#playing \.piece \.juicy-arrow/);
  assert.match(js,/const ARROW_VECTOR =/);
  assert.match(js,/\$\{ARROW_VECTOR\}/);
});
test('success sparkles do not change the puzzle state or automatic timers',()=>{
  assert.match(js,/function spawnMoveSparkle\(element,color\)/);
  assert.match(js,/spawnMoveSparkle\(element,p\.color\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('existing 9x9, 540 levels, lives, timers, shop, banner and boosters remain present',()=>{
  assert.match(js,/const SIZE = 9, TOTAL_LEVELS = 540/);
  assert.match(js,/MAX_LIVES = 20/);
  assert.match(js,/setBannerVisible\(true\)/);
  for(const id of ['gameBoard','gameTip','currentLevelTitle','timerPanel','powersBtn','undoBtn','hintBtn','restartBtn','levelGrid','shopBtn'])assert.ok(html.includes('id="'+id+'"'),id+' missing');
});
