const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=require('../memory-cards.js');

test('40 distinct symbols have drawings and each question has one unambiguous position',()=>{
  assert.equal(game.ITEMS.length,40);
  const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
  let artBytes=0;
  for(const item of game.ITEMS){
    const file='memory-art/v1/'+item.id+'.png';
    const png=fs.readFileSync(path.join(__dirname,'..',file));
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file);
    assert.equal(png.readUInt32BE(16),256,file+' width');
    assert.equal(png.readUInt32BE(20),256,file+' height');
    assert.ok(sw.includes("'./"+file+"'"),file+' must work offline on first visit');
    artBytes+=png.length;
    assert.ok(['plant','animal','sky','object'].includes(item.group));
  }
  assert.ok(artBytes<4*1024*1024,'all 40 runtime illustrations stay under 4 MiB');
  assert.equal(new Set(game.ITEMS.map(item=>item.id)).size,game.ITEMS.length);
  const layouts=new Set();
  for(let level=1;level<=game.COUNT;level++){
    const card=game.make(level);
    assert.deepEqual(card,game.make(level));
    assert.equal(card.slots.length,9);
    assert.equal(new Set(card.slots.map(item=>item.id)).size,9);
    assert.equal(new Set(card.questions).size,card.questions.length);
    assert.ok(card.questions.every(index=>Number.isInteger(index)&&index>=0&&index<9));
    assert.equal(card.questions.length,level<=20?4:level<=50?5:6);
    assert.ok(card.seconds>=8&&card.seconds<=14);
    layouts.add(card.slots.map(item=>item.id).join(','));
  }
  assert.equal(layouts.size,game.COUNT);
  assert.throws(()=>game.make(0),RangeError);
  assert.throws(()=>game.make(101),RangeError);
});

test('every new showing changes the card and shares at most four symbols with the last',()=>{
  let deal=0,previous=null;const encountered=new Set();
  for(let i=0;i<200;i++){
    const next=game.fresh(1,deal,previous);
    assert.ok(next.deal>deal);
    assert.deepEqual(next.card,game.make(1,next.deal));
    if(previous){
      const ids=new Set(previous.slots.map(item=>item.id));
      assert.ok(next.card.slots.filter(item=>ids.has(item.id)).length<=4);
      assert.notDeepEqual(next.card.slots.map(item=>item.id),previous.slots.map(item=>item.id));
    }
    next.card.slots.forEach(item=>encountered.add(item.id));
    ({deal,card:previous}=next);
  }
  assert.equal(encountered.size,game.ITEMS.length);
});

test('scores and saved progress stay within the catalog',()=>{
  assert.deepEqual([0,1,2,3,4].map(n=>game.stars(n,4)),[0,0,1,2,3]);
  assert.deepEqual(game.restore({level:101,deal:12,best:{1:3,2:0,3:4,'4.5':2,100:1,101:3},sound:false,helpSeen:true}),
    {level:1,deal:12,best:{1:3,100:1},sound:false,helpSeen:true});
  assert.equal(game.restore(null).level,1);
  assert.equal(game.restore({deal:-1}).deal,0);
});

test('new game is present in the menu and offline install',()=>{
  const root=path.join(__dirname,'..');
  const menu=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.match(menu,/file: 'memory-cards\.html'/);
  assert.match(sw,/'\.\/memory-cards\.html', '\.\/memory-cards\.js'/);
});
