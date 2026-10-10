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
  const levels=[1,5,6,10,11,25,26,30,31,100,101,1000,1000000,Number.MAX_SAFE_INTEGER];
  for(const level of levels){
    const card=game.make(level);
    assert.deepEqual(card,game.make(level));
    const count=game.itemCount(level);
    assert.equal(card.slots.length,9);
    assert.equal(card.slots.filter(Boolean).length,count);
    assert.equal(new Set(card.slots.filter(Boolean).map(item=>item.id)).size,count);
    assert.equal(new Set(card.questions).size,count);
    assert.deepEqual([...card.questions].sort(),card.slots.flatMap((item,i)=>item?[i]:[]).sort());
    assert.equal(card.seconds,14);
    layouts.add(card.slots.map(item=>item?.id||'-').join(','));
  }
  assert.equal(layouts.size,levels.length);
  for(const level of [0,-1,1.5,Infinity,NaN,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>game.make(level),RangeError);
});

test('automatic difficulty grows only the number of pictures and questions',()=>{
  for(let level=1;level<=200;level++){
    assert.equal(game.itemCount(level),Math.min(9,3+Math.floor((level-1)/5)));
    for(let count=2;count<=9;count++){
      const card=game.make(level,12,count);
      assert.equal(card.slots.length,9);
      assert.equal(card.slots.filter(Boolean).length,count);
      assert.equal(card.questions.length,count);
      assert.equal(card.seconds,14);
    }
  }
  for(const difficulty of [null,0,1,10,2.5,'3','hard'])assert.throws(()=>game.make(1,0,difficulty),RangeError);
});

test('every new showing changes the card, including repeats and difficulty changes',()=>{
  let deal=0,previous=null;const encountered=new Set();
  for(let i=0;i<200;i++){
    const difficulty=i%8+2;
    const next=game.fresh(1,deal,previous,difficulty);
    assert.ok(next.deal>deal);
    assert.deepEqual(next.card,game.make(1,next.deal,difficulty,next.card.seed));
    if(previous){
      const ids=new Set(previous.slots.filter(Boolean).map(item=>item.id));
      assert.ok(next.card.slots.filter(item=>item&&ids.has(item.id)).length<=Math.min(4,Math.floor(difficulty/2)));
      assert.notDeepEqual(next.card.slots,previous.slots);
    }
    next.card.slots.filter(Boolean).forEach(item=>encountered.add(item.id));
    ({deal,card:previous}=next);
  }
  assert.equal(encountered.size,game.ITEMS.length);
  assert.ok(game.fresh(101,0xFFFFFFFF,previous).deal>=1);
});

test('scores and old saves survive beyond the former catalog',()=>{
  assert.deepEqual([0,1,2,3,4].map(n=>game.stars(n,4)),[0,0,1,2,3]);
  assert.deepEqual(game.restore({level:101,deal:12,best:{1:3,2:0,3:4,'4.5':2,100:1,101:3},sound:false,helpSeen:true}),
    {level:101,deal:12,best:{1:3,100:1,101:3},difficulty:'auto',sound:false,helpSeen:true});
  assert.equal(game.restore(null).level,1);
  assert.equal(game.restore({deal:-1}).deal,0);
  assert.equal(game.restore({level:1000000,difficulty:2}).difficulty,2);
  assert.equal(game.restore({difficulty:10}).difficulty,'auto');
  assert.equal(game.restore({level:Number.MAX_SAFE_INTEGER+1}).level,1);
});

test('new game is present in the menu and offline install',()=>{
  const root=path.join(__dirname,'..');
  const menu=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.match(menu,/file: 'memory-cards\.html'/);
  assert.match(sw,/'\.\/memory-cards\.html', '\.\/memory-cards\.js'/);
});
