const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const js = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
const native = fs.readFileSync(path.join(__dirname, 'native/MainActivity.java'), 'utf8');
const start = js.indexOf('  const defaultSave =');
const end = js.indexOf('  const TODAY=', start);
assert.ok(start > 0 && end > start, 'save migration source missing');

function migrate(raw) {
  return vm.runInNewContext(`
    const MAX_LIVES=20, TOTAL_LEVELS=540;
    const WORLDS=[{id:'forest'},{id:'desert'},{id:'snow'},{id:'sunset'},{id:'neon'}];
    const SKINS=[{id:'classic'},{id:'crystal'},{id:'metal'},{id:'neon'},{id:'candy'}];
    ${js.slice(start, end)}
    save;
  `, { localStorage: { getItem: () => raw } });
}

test('existing campaign progress and preferences survive the migration', () => {
  const save = migrate(JSON.stringify({
    highest: 354, coins: 9000, completed: { 353: 3 },
    selectedTheme: 'desert', selectedSkin: 'metal', lives: 4
  }));
  assert.equal(save.highest, 354);
  assert.equal(save.completed[353], 3);
  assert.equal(save.coins, 9000);
  assert.equal(save.selectedTheme, 'desert');
  assert.equal(save.selectedSkin, 'metal');
  assert.equal(save.lives, 4);
});

test('obsolete or damaged save preferences cannot crash the game on launch', () => {
  for (const raw of ['{broken json', 'null', JSON.stringify({
    highest: 'not-a-level', completed: 'invalid', dailyQuests: [],
    claimedAchievements: 'invalid', selectedTheme: 'removed-theme',
    selectedSkin: 'unavailable-skin'
  })]) {
    const save = migrate(raw);
    assert.equal(save.highest, 1);
    assert.equal(save.selectedTheme, 'auto');
    assert.equal(save.selectedSkin, 'classic');
    assert.equal(typeof save.completed, 'object');
    assert.equal(typeof save.dailyQuests, 'object');
  }
});

test('Android renderer recovery and offline-safe ad initialization are installed', () => {
  assert.match(native, /onRenderProcessGone\(WebView view, RenderProcessGoneDetail detail\)/);
  assert.match(native, /view\.destroy\(\)/);
  assert.match(native, /requestConsentAndInitialize\(\)/);
  assert.match(native, /catch \(RuntimeException error\)/);
  assert.match(native, /TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE/);
  assert.match(native, /TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE/);
  assert.match(native, /MAX_AD_CONTENT_RATING_G/);
});
