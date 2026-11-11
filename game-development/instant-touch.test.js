const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'style.css'),'utf8');
const tap=js.slice(js.indexOf('  function tapPiece(id,element){'),js.indexOf('  function undo(){'));
test('success commits state synchronously, no 275ms busy delay',()=>{
  const a=tap.indexOf('pieces=pieces.filter(q=>q.id!==id);');
  const b=tap.indexOf('setTimeout(()=>element.remove(),160);');
  assert.ok(a>=0 && b>a,'move must commit before delayed cosmetic cleanup');
  assert.ok(!tap.includes('},275)'),'275ms interaction lock must be gone');
  assert.ok(!tap.includes('drawBoard()'),'successful tap must not rebuild entire 9x9 grid');
  assert.match(tap,/refreshLiveBoardHud\(\)/);
});
test('wood material and strong arrow silhouette remain visible',()=>{
  assert.match(css,/V22: responsive tap/);
  assert.match(css,/arrow-main\{[\s\S]*?stroke:#1b4965!important/);
  assert.match(css,/#playing \.grid-rock span\{/);
  assert.match(css,/#playing \.piece \.piece-inner\{/);
});
test('9x9, 540 levels, test banners, and existing save identifier preserved',()=>{
  assert.match(js,/const SIZE = 9, TOTAL_LEVELS = 540/);
  assert.match(js,/ok-kacis-v1/);
  assert.match(js,/setBannerVisible\(true\)/);
});
