const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'style.css'),'utf8');
const tap=js.slice(js.indexOf('  function tapPiece(id,element){'),js.indexOf('  function undo(){'));
test('V21 stable move sequence restored; logical state changes only after exit animation',()=>{
  assert.match(tap,/busy=true;spawnMoveSparkle\(element,p\.color\)/);
  assert.match(tap,/element\.classList\.add\('escaping'\)/);
  assert.match(tap,/setTimeout\(\(\)=>\{\s*pieces=pieces\.filter/);
  assert.match(tap,/\},135\);/);
  assert.match(tap,/drawBoard\(\)/);
  assert.doesNotMatch(tap,/refreshLiveBoardHud/);
});
test('V22 visual and interaction overrides are completely absent',()=>{
  assert.match(css,/WOODLAND 3D GLOBAL DESIGN SYSTEM/);
  assert.doesNotMatch(css,/V22: responsive tap/);
  assert.doesNotMatch(js,/function refreshLiveBoardHud/);
  assert.match(css,/V23 STABILITY FIX/);
});
test('Original 9x9 540-level engine and test banner preserved',()=>{
  assert.match(js,/const SIZE = 9, TOTAL_LEVELS = 540/);
  assert.match(js,/setBannerVisible\(true\)/);
  assert.match(js,/ok-kacis-v1/);
});
