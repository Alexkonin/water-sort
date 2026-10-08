// Run: node --test tests/towers-three-star.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHarness}=require('../scripts/audit-towers.cjs');
const witness=require('./fixtures/towers-111-three-star.json');

function assertPerfect(result){
  assert.equal(result.win,true,'all waves must be defeated');
  assert.equal(result.wave,14);
  assert.equal(result.damage,0,'repair must never disguise damage');
  assert.equal(result.lives,20);
  assert.equal(result.stars,3,'production victory screen must award three stars');
  assert.equal(result.waves.length,14);
  assert.ok(result.waves.every(w=>w.damage===0&&w.lives===20));
}

test('111: fixed legal action sequence earns three stars with only the base budget',()=>{
  const h=createHarness({seed:witness.seed});
  assert.equal(witness.initialGold,h.maps[110].gold);
  assert.equal(witness.actions.filter(a=>a.kind==='castle').length,3);
  assert.ok(witness.actions.every(a=>['build','upgrade','castle'].includes(a.kind)));
  const result=h.runReplay(witness);
  assertPerfect(result);
  assert.equal(result.actions,witness.actions.length);
  assert.equal(result.gold,witness.expected.gold);
  assert.equal(result.hero,false);
});

for(const seed of [2,3,10])test(`111: three-star strategy tolerates combat randomness, seed ${seed}`,()=>{
  const result=createHarness({seed,trace:true}).runAudit(111,'three-star');
  assertPerfect(result);
  assert.equal(result.initialGold,witness.initialGold);
  assert.equal(result.castle.lvl,4,'no final repair upgrade');
});

test('fixed witness cannot buy on a road or spend extra money',()=>{
  const invalid=structuredClone(witness);
  Object.assign(invalid.actions[0],{x:8,y:2});
  assert.throws(()=>createHarness({seed:witness.seed}).runReplay(invalid),/Occupied cell/);
  const richer=structuredClone(witness);richer.initialGold++;
  assert.throws(()=>createHarness({seed:witness.seed}).runReplay(richer),/starting budget changed/);
});
