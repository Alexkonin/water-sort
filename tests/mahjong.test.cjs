const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../mahjong.js');

test('a tile needs an uncovered top and at least one open horizontal side',()=>{
  const tiles=[{id:0,x:0,y:0,z:0,type:1},{id:1,x:1,y:0,z:0,type:1},{id:2,x:2,y:0,z:0,type:1},{id:3,x:0,y:0,z:1,type:1}];
  assert.equal(G.isFree(tiles[0],tiles),false);
  assert.equal(G.isFree(tiles[1],tiles),false);
  assert.equal(G.isFree(tiles[2],tiles),true);
  assert.equal(G.isFree(tiles[3],tiles),true);
  assert.equal(G.isFree(tiles[1],tiles.slice(1)),true);
  assert.equal(G.remove(tiles,[0,2]),null);
  assert.equal(G.remove(tiles,[2,2]),null);
  assert.equal(G.remove(tiles,[2,999]),null);
  assert.deepEqual(G.remove(tiles,[2,3]).map(t=>t.id),[0,1]);
  assert.equal(G.remove([{...tiles[2],type:2},tiles[3]],[2,3]),null);
});

test('all 10000 seeded layouts are distinct and their witnesses legally clear the entire board',()=>{
  const seen=new Set();
  for(let level=1;level<=G.LEVELS;level++){
    const p=G.generate(level);assert.deepEqual(p,G.generate(level));
    assert.equal(new Set(p.tiles.map(t=>`${t.x},${t.y},${t.z}`)).size,p.tiles.length);
    assert.ok(p.tiles.length>=32&&p.tiles.length<=144);
    assert.ok(p.tiles.every(t=>Number.isInteger(t.type)&&t.type>=0&&t.type<G.TYPES));
    assert.ok(G.pairs(p.tiles).length);
    const counts=new Map();p.tiles.forEach(t=>counts.set(G.matchKey(t.type),(counts.get(G.matchKey(t.type))||0)+1));
    assert.ok([...counts.values()].every(n=>n%2===0));
    let tiles=p.tiles;
    for(const ids of p.solution){tiles=G.remove(tiles,ids);assert.ok(tiles,`level ${level}, pair ${ids}`);}
    assert.equal(tiles.length,0);
    seen.add(require('node:crypto').createHash('sha256').update(JSON.stringify(p.tiles)).digest('hex'));
  }
  assert.equal(seen.size,G.LEVELS);
});

test('shuffling preserves remaining faces and count, and rescues arbitrary legal play',()=>{
  for(let level=1;level<=G.LEVELS;level++){
    const p=G.generate(level);let tiles=p.tiles;
    for(let n=0;n<12;n++){
      const pairs=G.pairs(tiles);if(!pairs.length)break;
      tiles=G.remove(tiles,pairs[(n*7+level)%pairs.length]);
    }
    const result=G.shuffle(tiles,p,level);
    assert.deepEqual(result.map(t=>t.type).sort(),tiles.map(t=>t.type).sort());
    let remaining=result;
    for(const ids of G.shufflePlan(tiles,p,level).solution){
      remaining=G.remove(remaining,ids);assert.ok(remaining);
    }
    assert.equal(remaining.length,0);
  }
});

test('shuffle also rescues a remainder with no free pair of positions',()=>{
  const p=G.generate(1,1),bottom=p.tiles.find(t=>t.z===0&&t.x===1&&t.y===1),top=p.tiles.find(t=>t.z===1&&t.x===1&&t.y===1);
  const stuck=[{...bottom,type:0},{...top,type:0}];
  assert.equal(G.pairs(stuck).length,0);
  const shuffled=G.shuffle(stuck,p,42);assert.equal(G.pairs(shuffled).length,1);
});

test('saved actions replay, undo shuffle restores exact board, corrupt saves reset safely',()=>{
  const p=G.generate(8),first={kind:'pair',ids:p.solution[0]},shuffle={kind:'shuffle',seed:1234};
  const before=G.apply(p.tiles,p,first),after=G.apply(before,p,shuffle);
  const actions=[first,shuffle,{kind:'pair',ids:G.pairs(after)[0]}];
  const state=G.restore({version:G.VERSION,level:8,actions,sound:false,completed:[1,1,2,G.LEVELS+1,'3']});
  assert.deepEqual(state.tiles,G.replay(p,actions));assert.equal(state.sound,false);assert.deepEqual(state.completed,[1,2]);
  assert.deepEqual(G.replay(p,actions.slice(0,1)),before);
  assert.deepEqual(G.restore({...state,actions:[{kind:'pair',ids:[1,1]}]}).tiles,p.tiles);
  assert.deepEqual(G.restore({...state,version:0}).actions,[]);
  for(const bad of [null,[],42,'bad',{level:-1},{level:100000},{level:1,version:1,actions:Array(1001).fill(shuffle)}])assert.equal(G.restore(bad).level,1);
  for(const action of [null,{kind:'shuffle',seed:-1},{kind:'shuffle',seed:NaN},{kind:'pair',ids:[]},{kind:'oops'}])assert.equal(G.apply(p.tiles,p,action),null);
});

test('a completed board restores without inventing a fresh game',()=>{
  const p=G.generate(1),actions=p.solution.map(ids=>({kind:'pair',ids}));
  const restored=G.restore({version:G.VERSION,level:1,actions});
  assert.equal(restored.tiles.length,0);assert.equal(G.apply([],p,{kind:'shuffle',seed:1}),null);
});


test('menu and offline installation include every Mahjong resource',()=>{
  const fs=require('node:fs'),path=require('node:path'),base=path.join(__dirname,'..');
  const sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');
  for(const file of ['mahjong.html','mahjong.css','mahjong.js','mahjong-glyphs.js','mahjong-art.js','mahjong-ui.js']){
    assert.ok(sw.includes("'./"+file+"'"));assert.ok(fs.existsSync(path.join(base,file)));
  }
  assert.ok(fs.readFileSync(path.join(base,'index.html'),'utf8').includes("file: 'mahjong.html'"));
});


test('expansion preserves the original 60 deals and their saved action histories',()=>{
  const crypto=require('node:crypto');
  const originals=Array.from({length:60},(_,i)=>G.generate(i+1,1));
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(originals)).digest('hex'),
    'b0ca3d8b012080e848c095af55ad5f4f50b66d829cf1d05bfbb5acbcd62de75b');
  const actions=originals[59].solution.slice(0,14).map(ids=>({kind:'pair',ids}));
  const restored=G.restore({version:1,level:60,actions,completed:[1,2,59],sound:false,helpSeen:true});
  assert.equal(restored.level,60);assert.deepEqual(restored.actions,actions);
  assert.equal(restored.tiles.length,originals[59].tiles.length-28);
  assert.deepEqual(restored.completed,[1,2,59]);
});

test('new levels and the final level resume with achievements, out-of-range levels are rejected',()=>{
  assert.equal(G.LEVELS,10000);
  for(const level of [61,500,999,1000,1001,9999,10000]){
    const p=G.generate(level),actions=p.solution.slice(0,3).map(ids=>({kind:'pair',ids}));
    const state=G.restore({version:G.VERSION,level,actions,completed:[60,61,999,1000,10000,10001]});
    assert.equal(state.level,level);assert.deepEqual(state.actions,actions);
    assert.equal(state.tiles.length,p.tiles.length-6);assert.deepEqual(state.completed,[60,61,999,1000,10000]);
  }
  assert.equal(G.restore({level:10001}).level,1);
  assert.throws(()=>G.generate(10001));
});


test('partial top overlap and staggered side neighbors block correctly',()=>{
  const bottom={id:0,x:0,y:0,z:0,type:0};
  assert.equal(G.isFree(bottom,[bottom,{id:1,x:.5,y:.5,z:1,type:0}]),false);
  assert.equal(G.isFree(bottom,[bottom,{id:1,x:1,y:0,z:1,type:0}]),true);
  const sides=[bottom,{id:1,x:-1,y:.5,z:0,type:0},{id:2,x:1,y:-.5,z:0,type:0}];
  assert.equal(G.isFree(bottom,sides),false);
  assert.equal(G.isFree(bottom,sides.slice(0,2)),true);
});

test('full sets have 34 ordinary quartets, four flowers and four seasons',()=>{
  for(const level of [151,152,160,1000,10000]){
    const p=G.generate(level),counts=Array(42).fill(0);p.tiles.forEach(t=>counts[t.type]++);
    assert.deepEqual(counts,[...Array(34).fill(4),...Array(8).fill(1)]);
  }
  const tile=(id,type)=>({id,type,x:id*2,y:0,z:0});
  assert.deepEqual(G.remove([tile(0,34),tile(1,37)],[0,1]),[]);
  assert.deepEqual(G.remove([tile(0,38),tile(1,41)],[0,1]),[]);
  assert.equal(G.remove([tile(0,34),tile(1,38)],[0,1]),null);
  assert.equal(G.remove([tile(0,0),tile(1,18)],[0,1]),null);
});

test('new shuffle keeps feasible geometry, rebuilds impossible stacks and is replayable',()=>{
  const p=G.generate(151),before=G.remove(p.tiles,p.solution[0]);
  const after=G.shuffle(before,p,123);
  assert.deepEqual(after.map(({id,x,y,z})=>({id,x,y,z})),before.map(({id,x,y,z})=>({id,x,y,z})));
  const actions=[{kind:'pair',ids:p.solution[0]},{kind:'shuffle',seed:123}];
  assert.deepEqual(G.restore({version:G.VERSION,level:151,actions}).tiles,after);
  assert.deepEqual(G.replay(p,actions.slice(0,1)),before);
  const stuck=[{id:0,x:0,y:0,z:0,type:34},{id:1,x:0,y:0,z:1,type:35}];
  assert.equal(G.pairs(stuck).length,0);
  const rescued=G.shuffle(stuck,p,123);assert.equal(G.pairs(rescued).length,1);
  assert.deepEqual(rescued.map(t=>t.type).sort(),[34,35]);
});

test('all old deals and old shuffle histories remain compatible',()=>{
  const crypto=require('node:crypto'),hash=crypto.createHash('sha256'),historyHash=crypto.createHash('sha256');
  for(let level=1;level<=1000;level++){
    const p=G.generate(level,1);hash.update(JSON.stringify(p));
    const actions=[{kind:'pair',ids:p.solution[0]},{kind:'shuffle',seed:7654}];
    const state=G.restore({version:1,level,actions,completed:[1,999],sound:false,helpSeen:true});
    historyHash.update(JSON.stringify(state.tiles));
    assert.equal(state.version,1);assert.deepEqual(state.tiles,G.replay(p,actions));
    assert.deepEqual(state.completed,[1,999]);assert.equal(state.sound,false);assert.equal(state.helpSeen,true);
  }
  assert.equal(historyHash.digest('hex'),'9e3635cf68f94b74b0b6c1d63437a4e020d74529ac7c1fb3d7698a511b2a252c');
  assert.equal(hash.digest('hex'),'77ce1bab1633571e2a09c60e70ba213926fe3a73b013f48ba47135d0885c1b5a');
});


test('all geometries have full support, no same-layer overlap and varied half-grid layouts',()=>{
  const geometries=new Set();
  for(let level=1;level<=G.LEVELS;level++){
    const {tiles}=G.layout(level);
    geometries.add(tiles.map(t=>`${t.x},${t.y},${t.z}`).sort().join(';'));
    assert.ok(tiles.some(t=>t.x%1||t.y%1));
    for(const a of tiles){
      assert.ok(!tiles.some(b=>a.id!==b.id&&a.z===b.z&&Math.abs(a.x-b.x)<1&&Math.abs(a.y-b.y)<1),`overlap at level ${level}`);
      if(a.z)assert.ok([.25,.75].every(dx=>[.25,.75].every(dy=>tiles.some(b=>b.z===a.z-1&&a.x+dx>b.x&&a.x+dx<b.x+1&&a.y+dy>b.y&&a.y+dy<b.y+1))),`unsupported tile at level ${level}`);
    }
  }
  assert.ok(geometries.size>=600);
});
