const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

for (const file of ['tower-defense.html', 'tower-diorama.html']) {
  const script = fs.readFileSync(path.join(__dirname, '..', file), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  const section = (from, to) => script.slice(script.indexOf(from), script.indexOf(to, script.indexOf(from)));
  function setup(storage = {value: null}) {
    const els = new Map();
    const $ = id => {
      if (!els.has(id)) els.set(id, {textContent: '', style: {}, classList: {remove() {}}, setAttribute() {}});
      return els.get(id);
    };
    const G = {};
    const context = vm.createContext({G, $, HAND_MAPS: 24, START_LIVES: 20,
      SAVE_KEY: file, MAPS: Array.from({length: 120}, () => ({name: 'Map'})),
      balanceLevel: L => Math.min(L, 119), clamp: (n, min, max) => Math.max(min, Math.min(max, n)),
      buildPaths: () => [{cellKey: [], pts: [{x: 1, y: 1}]}], mapFactor: () => 1,
      DioramaMaps: {occupancy: () => new Map()}, sfx: {stop() {}},
      clearUndo() {}, closeAll() {}, layout() {}, refreshHud() {}, refreshPalette() {}, refreshSel() {},
      showOverlay() {}, sndWin() {}, sndLose() {}, plural: () => 'ударов', waveCount: () => 8,
      localStorage: {getItem: () => storage.value, setItem: (_key, value) => {storage.value = value;}}
    });
    vm.runInContext(section('const startGold =', 'const WAVE_BONUS'), context);
    vm.runInContext(section('/* ============ сохранение', '// открыт'), context);
    vm.runInContext(section('function startLevel(i){', '/* ============ волны'), context);
    vm.runInContext(section('function levelWin(){', '/* ============ оверлеи'), context);
    return {G, $, storage, run: code => vm.runInContext(code, context)};
  }

  test(`${file}: victory carries remaining gold on top of the unchanged next-level budget`, () => {
    const h = setup();
    h.run('startLevel(0)'); assert.equal(h.G.gold, 240);
    h.G.gold = 100; h.run('levelWin(); startLevel(1)');
    assert.equal(h.G.gold, 380);
    assert.match(h.$('#winSub').textContent, /\+100 золота/);
    h.G.gold = 150; h.run('levelWin(); startLevel(2)');
    assert.equal(h.G.gold, 470);
    h.run('startLevel(40)'); assert.equal(h.G.gold, h.run('startGold(40)'));
    h.run('startLevel(0)'); assert.equal(h.G.gold, 240);
  });

  test(`${file}: reload, restart and defeat preserve the incoming bonus without duplicating it`, () => {
    const h = setup(); h.run('startLevel(0)'); h.G.gold = 100; h.run('levelWin()');
    const restored = setup(h.storage); restored.run('startLevel(1)'); assert.equal(restored.G.gold, 380);
    restored.G.gold = 10; restored.run('startLevel(1)'); assert.equal(restored.G.gold, 380);
    restored.G.gold = 50; restored.run('levelLose(); startLevel(1)'); assert.equal(restored.G.gold, 380);
    restored.run('startLevel(2)'); assert.equal(restored.G.gold, 320);
  });

  test(`${file}: replay replaces the bonus even with unchanged stars or zero gold`, () => {
    const h = setup(); h.run('startLevel(0)'); h.G.gold = 100; h.run('levelWin()');
    h.run('startLevel(0)'); h.G.gold = 40; h.G.dmgTaken = 10; h.run('levelWin(); startLevel(1)');
    assert.equal(h.G.gold, 320); assert.equal(h.run('save.stars[0]'), 3);
    const restored = setup(h.storage); restored.run('startLevel(1)'); assert.equal(restored.G.gold, 320);
    h.run('startLevel(0)'); h.G.gold = 0; h.run('levelWin(); startLevel(1)'); assert.equal(h.G.gold, 280);
  });

  test(`${file}: old saves and invalid balances retain the normal starting budget`, () => {
    for (const value of [null, '{', JSON.stringify({stars: {0: 3}, seen: {}}),
      ...[-100, '100', null].map(gold => JSON.stringify({goldRemaining: {0: gold}}))]) {
      const h = setup({value}); h.run('startLevel(1)'); assert.equal(h.G.gold, 280);
    }
  });
}
