const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../sand-trucks.js'),G=require('../arrow-escape.js');
function jam(limit){
 const s=T.create(1);if(limit)s.puzzle.limit=limit;
 // Create the wrong-color choice deliberately; the opening certificate's
 // colors can change when the picture is reauthored.
 const color=1,start=s.grains.length-s.puzzle.art.width;
 for(let i=0;i<s.puzzle.limit;i++){
  const id=G.available(s.puzzle,s.remaining).find(id=>s.puzzle.arrows[id].color!==color);
  assert.notEqual(id,undefined);assert.equal(T.dispatch(s,id),'ok');
 }
 for(let i=start;i<s.grains.length;i++)if(s.grains[i]!==color){const from=s.grains.findIndex((c,j)=>j<start&&c===color);assert.ok(from>=0);[s.grains[i],s.grains[from]]=[s.grains[from],s.grains[i]];}
 for(const c of s.active)c.phase='waiting';s.queue=s.active.map(c=>c.id);s.jammed=T.isJammed(s);assert.equal(s.jammed,true);return s;
}
test('one rescue slot releases the jam and permits exactly one additional truck',()=>{
 const s=jam(),limit=s.puzzle.limit;assert.equal(T.addSlot(s),true);assert.equal(s.jammed,false);assert.equal(T.slotLimit(s),limit+1);assert.equal(T.addSlot(s),false);
 assert.equal(T.dispatch(s,G.available(s.puzzle,s.remaining)[0]),'ok');assert.equal(T.workingCount(s),limit+1);
 assert.equal(T.dispatch(s,G.available(s.puzzle,s.remaining)[0]),'full');
 const r=T.restore(JSON.parse(JSON.stringify(T.snapshot(s))));assert.equal(T.slotLimit(r),limit+1);assert.deepEqual(r.active,s.active);assert.deepEqual(r.grains,s.grains);assert.equal(T.addSlot(r),false);
 const u=T.undo(r);assert.equal(u.extraSlot,true);assert.equal(T.slotLimit(u),limit+1);assert.equal(T.workingCount(u),limit);assert.equal(u.jammed,false);
});
test('the bonus survives undo across its activation but resets on restart and next level',()=>{
 const s=jam();T.addSlot(s);const u=T.undo(s);assert.equal(u.extraSlot,true);assert.equal(T.slotLimit(u),s.puzzle.limit+1);
 for(const level of[1,2]){const fresh=T.create(level);assert.equal(fresh.extraSlot,false);assert.equal(T.addSlot(fresh),false);assert.equal(T.slotLimit(fresh),fresh.puzzle.limit);}
});
test('old saves retain their normal limit and cannot restore excess active trucks',()=>{
 const s=jam(),old=T.snapshot(s);delete old.extraSlot;assert.deepEqual(T.restore(old).active,s.active);assert.equal(T.restore(old).extraSlot,false);
 T.addSlot(s);T.dispatch(s,G.available(s.puzzle,s.remaining)[0]);const excessive=T.snapshot(s);delete excessive.extraSlot;
 assert.equal(T.restore(excessive).active.length,0);assert.equal(T.restore({...old,extraSlot:3}).extraSlot,false);
});
test('a saved three-slot beginner jam resumes with its sand and a free base slot',()=>{
 const s=jam(3);
 const restored=T.restore(T.snapshot(s));assert.equal(restored.jammed,false);assert.equal(restored.extraSlot,false);assert.deepEqual(restored.grains,s.grains);assert.deepEqual(restored.active,s.active);
 assert.equal(T.dispatch(restored,G.available(restored.puzzle,restored.remaining)[0]),'ok');
});
