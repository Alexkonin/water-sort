const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const launches = require('../launch-history.js');
const root = path.join(__dirname, '..');
const games = launches.FILES.map(file => ({file}));
function storage(initial){
  let value = initial;
  return {getItem(){return value ?? null;},setItem(key,next){assert.equal(key,launches.KEY);value=next;}};
}

test('menu starts in the requested order and every game records its own opening',()=>{
  const menu = fs.readFileSync(path.join(root,'index.html'),'utf8');
  const files = [...menu.matchAll(/    file: '([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(files,launches.FILES);
  assert.deepEqual(launches.rank(games,[]).map(g => g.file),launches.FILES);
  const source = fs.readFileSync(path.join(root,'launch-history.js'),'utf8');
  for(const file of launches.FILES){
    assert.match(fs.readFileSync(path.join(root,file),'utf8'),/src="launch-history\.js\?v=60"/);
    const saved = storage();
    vm.runInNewContext(source,{location:{pathname:'/games/'+file},localStorage:saved});
    assert.deepEqual(JSON.parse(saved.getItem()),[file]);
  }
  assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/'\.\/launch-history\.js'/);
});

test('frequent games lead based on the latest 30 openings; ties keep the default order',()=>{
  const saved = storage();
  for(let i=0;i<20;i++) launches.record('forest-lights.html',saved);
  for(let i=0;i<10;i++) launches.record('water-sort.html',saved);
  assert.equal(launches.read(saved).length,30);
  assert.deepEqual(launches.rank(games,launches.read(saved)).map(g=>g.file),
    ['forest-lights.html','water-sort.html','tower-defense.html','arrow-escape.html','mahjong.html','memory-cards.html']);
  for(let i=0;i<30;i++) launches.record('tower-defense.html',saved);
  assert.deepEqual(launches.read(saved),Array(30).fill('tower-defense.html'));
  assert.deepEqual(launches.rank(games,launches.read(saved)).map(g=>g.file),launches.FILES);
  assert.deepEqual(launches.rank(games,['forest-lights.html','arrow-escape.html']).map(g=>g.file),
    ['arrow-escape.html','forest-lights.html','tower-defense.html','water-sort.html','mahjong.html','memory-cards.html']);
});

test('damaged or unavailable local storage falls back to the default order',()=>{
  assert.deepEqual(launches.read(storage('{broken')),[]);
  const blocked = {getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.deepEqual(launches.record('forest-lights.html',blocked),['forest-lights.html']);
  assert.deepEqual(launches.rank(games,launches.read(blocked)).map(g=>g.file),launches.FILES);
  const saved = storage(JSON.stringify(['unknown.html','water-sort.html']));
  assert.deepEqual(launches.record('unknown.html',saved),['water-sort.html']);
  assert.deepEqual(launches.read(saved),['water-sort.html']);
});
