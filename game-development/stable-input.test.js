const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'style.css'),'utf8');
const tap=js.slice(js.indexOf('  function tapPiece(id,element){'),js.indexOf('  function undo(){'));
test('V23 graphics are stable while V24 immediately commits valid touch input',()=>{
  assert.match(tap,/history\.push\(snapshot\(\)\)/);
  assert.match(tap,/pieces=pieces\.filter\(q=>q\.id!==id\)/);
  assert.match(tap,/element\.classList\.add\('escaping'\)/);
  assert.match(tap,/refreshAfterArrow\(\)/);
  assert.doesNotMatch(tap,/busy=true;spawnMoveSparkle\(element,p\.color\)/);
  assert.doesNotMatch(tap,/setTimeout\(\(\)=>\{\s*pieces=pieces\.filter/);
  assert.doesNotMatch(tap,/drawBoard\(\)/);
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
