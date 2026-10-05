const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../tower-defense.html'),'utf8');
const section=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
const c=vm.createContext({console,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
vm.runInContext(section('const COLS =','/* ============ башни')+section('function mulberry32(','let terrain =')+section('function buildPath(','/* ============ состояние')+section('function meadowPlan(','function buildTerrain('),c);
const maps=vm.runInContext('MAPS',c);
function plan(lv){
  const m=maps[lv],paths=c.buildPaths(m),road=new Set(paths.flatMap(p=>[...p.cellKey])),blocked=new Set((m.blocked||[]).map(p=>p.join(',')));
  return {paths,road,blocked,layout:c.meadowPlan(lv,paths,road,blocked)};
}
test('level scenery repeats exactly and has a distinct layout across all 1000 levels',()=>{
  const layouts=maps.map((_,lv)=>{
    const first=JSON.stringify(plan(lv).layout);
    assert.equal(first,JSON.stringify(plan(lv).layout));
    return first;
  });
  assert.equal(new Set(layouts).size,1000);
});
test('foliage clears routes, entrances, castle and tower centers on every map',()=>{
  for(let lv=0;lv<maps.length;lv++){
    const {paths,road,blocked,layout}=plan(lv);
    for(const p of layout.plants){
      const x=Math.floor(p.x),y=Math.floor(p.y),key=x+','+y;
      assert.ok(!road.has(key)&&!blocked.has(key));
      assert.ok(Math.hypot(p.x-x-.5,p.y-y-.5)-p.radius>.32,'tower base clearance');
      for(const path of paths){
        for(const s of path.seg){
          const nearestX=Math.max(Math.min(s.from.x,s.to.x),Math.min(Math.max(s.from.x,s.to.x),p.x));
          const nearestY=Math.max(Math.min(s.from.y,s.to.y),Math.min(Math.max(s.from.y,s.to.y),p.y));
          assert.ok(Math.hypot(p.x-nearestX,p.y-nearestY)-p.radius>=.49-1e-9,'road clearance');
        }
        for(const q of [path.pts[0],path.pts.at(-1)])assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=.8);
      }
    }
  }
});

test('all maps have valid routes and generated entrances have enough approach distance',()=>{
  assert.equal(maps.length,1000);
  assert.equal(new Set(maps.map(m=>m.name)).size,1000);
  const warnings=[];
  c.console={warn:msg=>warnings.push(msg)};
  vm.runInContext(section('(function validateMaps(){','/* ============ пуск'),c);
  assert.deepEqual(warnings,[]);
  for(let lv=24;lv<maps.length;lv++){
    const {paths,road}=plan(lv);
    assert.ok(117-road.size>=55,'buildable space on level '+(lv+1));
    assert.ok(paths[0].len>=28,'main route length on level '+(lv+1));
    assert.equal(paths.length,lv<69?2:3,'entrance count on level '+(lv+1));
    assert.ok(paths.every(p=>p.len>=18),'short approach on level '+(lv+1));
    const destination=paths[0].pts.at(-1);
    for(const p of paths)assert.deepEqual(p.pts.at(-1),destination);
  }
});

test('extra levels keep bounded wave sizes, health and starting gold',()=>{
  const balance=vm.createContext({HAND_MAPS:24,Ugolek:{},BOSS_SKINS:[],clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
  vm.runInContext(section('const balanceLevel =','/* ============ сохранение')+section('const FOES =','// список особенностей'),balance);
  const snapshot=L=>vm.runInContext(`JSON.stringify({gold:startGold(${L}),waves:Array.from({length:waveCount(${L})},(_,w)=>({hp:hpScale(${L},w,1),groups:waveGroups(${L},w)}))})`,balance);
  const limit=snapshot(119);
  for(const lv of [120,249,499,749,999])assert.equal(snapshot(lv),limit);
  assert.ok(JSON.parse(limit).waves.every(w=>Number.isFinite(w.hp)&&w.groups.every(g=>g.n>0&&g.gap>0)));
});

test('short tributaries affect health even beside a long main road',()=>{
  const balance=vm.createContext({clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
  vm.runInContext(section('const mapFactor =','/* ============ сохранение'),balance);
  const factor=paths=>vm.runInContext('mapFactor('+JSON.stringify(paths)+')',balance);
  assert.equal(factor([{len:32}]),1);
  assert.equal(factor([{len:24}]),.75);
  assert.equal(factor([{len:6},{len:32}]),.6);
  assert.ok(factor(plan(23).paths)<.8,'Fortress short entrance must reduce wave health');
  assert.equal(factor([{len:32},{len:32}]),1);
});
