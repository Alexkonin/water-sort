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

test('all 1000 seeded layouts are distinct and their witnesses legally clear the entire board',()=>{
  const seen=new Set();
  for(let level=1;level<=G.LEVELS;level++){
    const p=G.generate(level);assert.deepEqual(p,G.generate(level));
    assert.equal(new Set(p.tiles.map(t=>`${t.x},${t.y},${t.z}`)).size,p.tiles.length);
    assert.ok(p.tiles.length>=28&&p.tiles.length<=80);
    assert.ok(p.tiles.every(t=>Number.isInteger(t.type)&&t.type>=0&&t.type<G.TYPES));
    assert.ok(G.pairs(p.tiles).length);
    const counts=new Map();p.tiles.forEach(t=>counts.set(t.type,(counts.get(t.type)||0)+1));
    assert.ok([...counts.values()].every(n=>n%2===0));
    let tiles=p.tiles;
    for(const ids of p.solution){tiles=G.remove(tiles,ids);assert.ok(tiles,`level ${level}, pair ${ids}`);}
    assert.equal(tiles.length,0);
    seen.add(JSON.stringify(p.tiles));
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
    for(const ids of p.solution.slice(p.solution.length-result.length/2)){
      remaining=G.remove(remaining,ids);assert.ok(remaining);
    }
    assert.equal(remaining.length,0);
  }
});

test('shuffle also rescues a remainder with no free pair of positions',()=>{
  const p=G.generate(1),bottom=p.tiles.find(t=>t.z===0&&t.x===1&&t.y===1),top=p.tiles.find(t=>t.z===1&&t.x===1&&t.y===1);
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
  for(const file of ['mahjong.html','mahjong.css','mahjong.js','mahjong-ui.js']){
    assert.ok(sw.includes("'./"+file+"'"));assert.ok(fs.existsSync(path.join(base,file)));
  }
  assert.ok(fs.readFileSync(path.join(base,'index.html'),'utf8').includes("file: 'mahjong.html'"));
});


test('expansion preserves the original 60 deals and their saved action histories',()=>{
  const crypto=require('node:crypto');
  const originals=Array.from({length:60},(_,i)=>G.generate(i+1));
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(originals)).digest('hex'),
    'b0ca3d8b012080e848c095af55ad5f4f50b66d829cf1d05bfbb5acbcd62de75b');
  const actions=originals[59].solution.slice(0,14).map(ids=>({kind:'pair',ids}));
  const restored=G.restore({version:1,level:60,actions,completed:[1,2,59],sound:false,helpSeen:true});
  assert.equal(restored.level,60);assert.deepEqual(restored.actions,actions);
  assert.equal(restored.tiles.length,originals[59].tiles.length-28);
  assert.deepEqual(restored.completed,[1,2,59]);
});

test('new levels and the final level resume with achievements, out-of-range levels are rejected',()=>{
  assert.equal(G.LEVELS,1000);
  for(const level of [61,500,999,1000]){
    const p=G.generate(level),actions=p.solution.slice(0,3).map(ids=>({kind:'pair',ids}));
    const state=G.restore({version:1,level,actions,completed:[60,61,999,1000,1001]});
    assert.equal(state.level,level);assert.deepEqual(state.actions,actions);
    assert.equal(state.tiles.length,p.tiles.length-6);assert.deepEqual(state.completed,[60,61,999,1000]);
  }
  assert.equal(G.restore({level:1001}).level,1);
  assert.throws(()=>G.generate(1001));
});
