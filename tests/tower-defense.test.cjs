// Run: node --test tests/tower-defense.test.cjs
// Exercise production upgrade, combat, panel and undo code without a browser.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'..',process.env.TOWER_GAME || 'tower-defense.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function section(from,to){return script.slice(script.indexOf(from),script.indexOf(to,script.indexOf(from)));}
function setup(){
  const els=new Map();
  const $=id=>{
    if(!els.has(id))els.set(id,{textContent:'',firstChild:{textContent:''},classList:{toggle(){}},
      setAttribute(k,v){this[k]=v;},addEventListener(k,f){this[k]=f;}});
    return els.get(id);
  };
  const G={lv:0,gold:10000,t:0,lives:20,dmgTaken:0,castle:{type:'castle',lvl:1,x:0,y:0,cool:0,flash:0},towers:[],foes:[],shots:[],fx:[],selected:null};
  const hits=[];
  const c=vm.createContext({G,$,Math,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    foePos:f=>f.pos,atDist:()=>({x:2,y:0.5}),parts:()=>[],
    dmgFoe:(f,dmg,kind)=>{hits.push({f,dmg,kind});f.hp-=dmg;},
    FOES:{dummy:{tr:[]}},TRAITS:{},cellFree:()=>true,
    sndNope(){},sndShot(){},sndBuild(){},sndSell(){},sndTap(){},sndBoom(){},
    showHint(){},refreshHud(){},refreshPalette(){}});
  vm.runInContext(section('const TOWERS =','/* ============ враги'),c);
  vm.runInContext(section('let undoAction =','/* ============ старт уровня'),c);
  vm.runInContext(section('function towerStats(t){','/* ============ шаг мира'),c);
  vm.runInContext(section('function towerSummary(t, st, next){','/* ============ ввод'),c);
  vm.runInContext(section("$('#btnUp').addEventListener", "$('#btnGo').addEventListener"),c);
  const shots=section('  // снаряды\n','  // замок: тряска');
  vm.runInContext('function stepShots(dt){'+shots+'}',c);
  return {c,G,$,hits,eval:code=>vm.runInContext(code,c),
    tower(type,lvl=1){const t={type,lvl,x:0,y:0,cool:0};G.towers.push(t);G.selected=t;return t;},
    foe(x=.8,y=.5){const f={type:'dummy',pos:{x,y},d:x,r:.1,hp:10000,slow:0,slowT:0};G.foes.push(f);return f;}};
}
test('all four types upgrade to 5 on every map; max cannot charge or upgrade again',()=>{
  for(let lv=0;lv<Number(script.match(/const TOTAL_LEVELS = (\d+)/)[1]);lv++)for(const type of ['gun','frost','tesla','mortar']){
    const h=setup();h.G.lv=lv;const t=h.tower(type);let spent=h.eval(`TOWERS.${type}.cost`);
    for(let tier=2;tier<=5;tier++){
      const cost=h.eval('upCost(G.selected)'),before=h.G.gold;assert.ok(cost>0);h.$('#btnUp').click();
      assert.equal(t.lvl,tier);assert.equal(before-h.G.gold,cost);spent+=cost;
    }
    assert.equal(h.eval('upCost(G.selected)'),null);const before=h.G.gold;h.$('#btnUp').click();
    assert.equal(t.lvl,5);assert.equal(h.G.gold,before);assert.equal(h.eval('sellSum(G.selected)'),Math.round(spent*.6));
    h.c.refreshSel();assert.equal(h.$('#btnUp').disabled,true);assert.equal(h.$('#upCost').textContent,'5 / 5');
    assert.doesNotMatch(h.$('#selStats').textContent,/→|undefined|NaN/,'max tier shows only actual stats');
  }
});
test('insufficient gold, automatic affordability refresh, accurate preview, upgrade undo and sell undo',()=>{
  const h=setup(),t=h.tower('gun',3);h.G.gold=142;h.c.refreshSel();
  assert.equal(h.$('#btnUp').disabled,true);h.$('#btnUp').click();assert.equal(t.lvl,3);
  h.G.gold=143;h.c.refreshSel();assert.equal(h.$('#btnUp').disabled,false);
  assert.match(h.$('#selStats').textContent,/33 → 48/);
  h.$('#btnUp').click();assert.equal(t.lvl,4);assert.equal(h.G.gold,0);
  h.c.undoLastAction();assert.equal(t.lvl,3);assert.equal(h.G.gold,143);
  h.G.gold=1000;h.$('#btnUp').click();h.$('#btnUp').click();const before=h.G.gold;
  h.$('#btnSell').click();assert.equal(h.G.towers.length,0);assert.equal(h.G.gold,before+324);
  h.c.undoLastAction();assert.equal(h.G.towers[0].lvl,5);assert.equal(h.G.gold,before);
});
test('gun upgrades increase actual shot damage and fire rate; firing locks undo',()=>{
  const h=setup(),t=h.tower('gun',4);h.foe();h.$('#btnUp').click();
  h.c.fireTower(t);assert.equal(h.G.shots.length,1);
  assert.ok(Math.abs(h.G.shots[0].dmg-70.2)<1e-9);assert.equal(t.cool,1/1.75);
  h.c.undoLastAction();assert.equal(t.lvl,5);
});
test('chain reaches the tier target count, excludes hidden and dead enemies, and hits once each',()=>{
  for(let lvl=1;lvl<=5;lvl++){
    const h=setup(),t=h.tower('tesla',lvl);
    for(let i=0;i<7;i++)h.foe(.7+i*.15);
    h.G.foes[0].hidden=true;h.G.foes[1].dead=true;
    h.c.fireTower(t);assert.equal(h.hits.length,[3,3,4,4,5][lvl-1]);
    assert.equal(new Set(h.hits.map(v=>v.f)).size,h.hits.length);
    assert.ok(h.hits.every(v=>!v.f.hidden&&!v.f.dead));
  }
});
test('tier 5 mortar blast actually hits an enemy beyond the old radius',()=>{
  const h=setup(),t=h.tower('mortar',5);const target=h.foe(1),edge=h.foe(2.5);
  target.d=10;target.sp=0;target.siege=true;
  h.c.fireTower(t);assert.equal(h.G.shots[0].splash,1.7);
  h.c.stepShots(1);assert.ok(h.hits.some(hit=>hit.f===edge));
});
test('frost projectile carries upgraded slow; weaker frost does not replace or prolong it',()=>{
  const h=setup(),t=h.tower('frost',5),foe=h.foe();
  h.c.fireTower(t);assert.equal(h.G.shots[0].slow,.65);assert.equal(h.G.shots[0].slowT,2.5);
  h.c.stepShots(.1);assert.equal(foe.slow,.65);assert.equal(foe.slowT,2.5);
  h.G.shots=[];foe.slowT=.4;t.lvl=1;h.c.fireTower(t);h.c.stepShots(.1);
  assert.equal(foe.slow,.65);assert.equal(foe.slowT,.4);
  h.G.shots=[];foe.slowT=0;h.c.fireTower(t);h.c.stepShots(.1);
  assert.equal(foe.slow,.45);assert.equal(foe.slowT,1.7);
});

test('every tower targets the physically nearest foe, regardless of path progress or spawn order',()=>{
  for(const type of ['gun','frost','tesla','mortar'])for(const reversed of [false,true]){
    const h=setup(),t=h.tower(type,5);
    const far=h.foe(2.5),near=h.foe(.8,.7);
    far.d=100;far.pi=0;near.d=1;near.pi=1;
    far.siege=near.siege=true;
    if(reversed)h.G.foes.reverse();
    h.c.fireTower(t);
    if(type==='tesla')assert.equal(h.hits[0].f,near);
    else if(type==='mortar')assert.equal(h.G.shots[0].to,near.pos);
    else assert.equal(h.G.shots[0].target,near);
  }
});

test('nearest targeting skips hidden, dead and out-of-range enemies',()=>{
  const h=setup(),t=h.tower('gun');
  h.foe(.55).dead=true;h.foe(.6).hidden=true;
  const outside=h.foe(5),visible=h.foe(1);
  outside.d=100;h.c.fireTower(t);assert.equal(h.G.shots[0].target,visible);
  visible.dead=true;h.G.shots=[];t.cool=0;
  h.c.fireTower(t);assert.equal(h.G.shots.length,0);assert.equal(t.cool,0);
});

test('each new shot reselects the nearest foe without retargeting a projectile already in flight',()=>{
  const h=setup(),t=h.tower('gun'),first=h.foe(.8),second=h.foe(2);
  h.c.fireTower(t);assert.equal(h.G.shots[0].target,first);
  first.pos={x:3,y:.5};second.pos={x:.7,y:.5};
  h.c.fireTower(t);assert.equal(h.G.shots[1].target,second);
  assert.equal(h.G.shots[0].target,first);
});


test('castle upgrades add only new wall health, obey prices/cap and cannot be sold',()=>{
  const h=setup();h.G.selected=h.G.castle;h.G.lives=12;h.G.dmgTaken=8;
  for(const [level,cost,hp] of [[2,80,20],[3,130,30],[4,190,40],[5,270,52]]){
    const gold=h.G.gold;h.$('#btnUp').click();
    assert.equal(h.G.castle.lvl,level);assert.equal(h.G.gold,gold-cost);assert.equal(h.G.lives,hp);
    assert.equal(h.G.dmgTaken,8);assert.equal(h.$('#btnSell').hidden,true);
  }
  const gold=h.G.gold;h.$('#btnUp').click();h.$('#btnSell').click();
  assert.equal(h.G.castle.lvl,5);assert.equal(h.G.gold,gold);assert.equal(h.G.lives,52);
  assert.equal(h.$('#btnUp').disabled,true);
  h.G.selected=h.tower('gun');h.c.refreshSel();assert.equal(h.$('#btnSell').hidden,false);
});

test('castle upgrades reject insufficient gold, paused games and completed games',()=>{
  const h=setup();h.G.selected=h.G.castle;h.G.gold=79;h.c.refreshSel();
  assert.equal(h.$('#btnUp').disabled,true);h.$('#btnUp').click();assert.equal(h.G.castle.lvl,1);
  h.G.gold=80;h.c.refreshSel();assert.equal(h.$('#btnUp').disabled,false);
  h.G.paused=true;h.$('#btnUp').click();assert.equal(h.G.castle.lvl,1);
  h.G.paused=false;h.G.over=true;h.$('#btnUp').click();assert.equal(h.G.castle.lvl,1);
  h.G.over=false;h.$('#btnUp').click();assert.equal(h.G.castle.lvl,2);assert.equal(h.G.gold,0);
});

test('castle armor reduces real damage at each tier without erasing the star history',()=>{
  for(const [lvl,damage] of [[1,3],[2,2.7],[3,2.4],[4,2.25],[5,2.1]]){
    const h=setup();h.G.castle.lvl=lvl;h.c.damageCastle(3);
    assert.ok(Math.abs(h.G.lives-(20-damage))<1e-9);assert.equal(h.G.dmgTaken,3);
  }
  const h=setup();h.G.castle.lvl=5;h.G.lives=.5;h.c.damageCastle(1);assert.equal(h.G.lives,0);
  h.c.damageCastle(1);assert.equal(h.G.lives,0);
});

test('castle upgrade can be undone until its first received hit or its first shot',()=>{
  for(const effect of ['none','hit','shot']){
    const h=setup();h.G.castle.lvl=3;h.G.selected=h.G.castle;h.G.lives=23;
    const before=h.G.gold;h.$('#btnUp').click();assert.equal(h.G.lives,33);
    if(effect==='hit')h.c.damageCastle(1);
    if(effect==='shot'){h.foe();h.c.fireCastle();}
    h.c.undoLastAction();
    assert.equal(h.G.castle.lvl,effect==='none'?3:4);
    assert.equal(h.G.gold,effect==='none'?before:before-190);
    if(effect==='none')assert.equal(h.G.lives,23);
  }
});

test('castle gains modest ranged attacks only at tiers 4 and 5, targets nearest visible foe',()=>{
  for(let lvl=1;lvl<=5;lvl++){
    const h=setup();h.G.castle.lvl=lvl;
    h.foe(.55).hidden=true;h.foe(.6).dead=true;h.foe(2);const near=h.foe(.8);
    h.c.fireCastle();
    if(lvl<=3){assert.equal(h.G.shots.length,0);continue;}
    const shot=h.G.shots[0];assert.equal(shot.target,near);assert.equal(shot.kind,'arrow');
    assert.equal(shot.dmg,lvl===4?6:10);assert.equal(h.G.castle.cool,lvl===4?1/.75:1);
    h.c.stepShots(.1);assert.equal(h.hits.length,1);assert.equal(h.hits[0].f,near);
    assert.equal(h.hits[0].kind,'ball','arrows respect the same physical resistances as gun shots');
  }
  const h=setup();h.G.castle.lvl=5;h.foe(5);h.c.fireCastle();assert.equal(h.G.shots.length,0);
  h.foe(.8);h.G.lives=0;h.c.fireCastle();assert.equal(h.G.shots.length,0);
});

test('persistent inspection supports direct tower, castle and build selection without closing',()=>{
  const h=setup();
  const first=h.tower('gun'),second=h.tower('frost');
  first.x=1;first.y=1;second.x=2;second.y=1;
  h.G.selected=first;h.G.armed=null;
  let pointer;
  h.c.COLS=9;h.c.ROWS=13;
  const projection=process.env.TOWER_GAME==='tower-diorama.html'?require('../tower-diorama-geometry.js'):null;
  if(projection)h.c.DioramaGeometry=projection;
  h.c.cv={getBoundingClientRect:()=>({left:0,top:0,width:projection?projection.width*10:90,height:projection?projection.height*10:130}),
    addEventListener:(name,fn)=>{if(name==='pointerdown')pointer=fn;}};
  vm.runInContext(section('function cellAt(ev){',"$('#btnUp').addEventListener"),h.c);
  const tap=(x,y)=>{const p=projection?projection.project(x+.5,y+.5,0,10):{x:x*10+5,y:y*10+5};pointer({clientX:p.x,clientY:p.y,preventDefault(){}});};
  tap(1,1);assert.equal(h.G.selected,first,'repeat tap preserves inspection');
  tap(4,4);assert.equal(h.G.selected,first,'empty cell preserves inspection');
  tap(2,1);assert.equal(h.G.selected,second,'another tower switches inspection directly');
  h.c.selectCastle();h.c.selectCastle();
  assert.equal(h.G.selected,h.G.castle,'repeat castle tap preserves inspection');
  h.$('#palette').click({target:{closest:()=>({dataset:{t:'gun'}})}});
  assert.equal(h.G.armed,'gun','construction remains available from the castle card');
  assert.equal(h.G.selected,null);
  tap(2,1);assert.equal(h.G.selected,second);assert.equal(h.G.armed,null,'inspection cancels placement');
});
