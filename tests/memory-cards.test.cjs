const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=require('../memory-cards.js');

test('all cards are reproducible and each question has one unambiguous position',()=>{
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

test('scores and saved progress stay within the catalog',()=>{
  assert.deepEqual([0,1,2,3,4].map(n=>game.stars(n,4)),[0,0,1,2,3]);
  assert.deepEqual(game.restore({level:101,best:{1:3,2:0,3:4,'4.5':2,100:1,101:3},sound:false,helpSeen:true}),
    {level:1,best:{1:3,100:1},sound:false,helpSeen:true});
  assert.equal(game.restore(null).level,1);
});

test('new game is present in the menu and offline install',()=>{
  const root=path.join(__dirname,'..');
  const menu=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.match(menu,/file: 'memory-cards\.html'/);
  assert.match(sw,/'\.\/memory-cards\.html', '\.\/memory-cards\.js'/);
});
