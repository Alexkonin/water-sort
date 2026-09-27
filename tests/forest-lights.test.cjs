const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {step,valid,search,solution}=require('../forest-lights.js');
const ctx={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../forest-lights-levels.js'),'utf8'),ctx);
const levels=ctx.FOREST_LEVELS;
test('the controls move exactly the documented positions, including empty slots',()=>{
 assert.equal(step('12345670','L'),'23456701');
 assert.equal(step('12345670','R'),'01234567');
 assert.equal(step('12345670','T'),'12364570');
 assert.equal(step('10002003','T'),'10000203');
 for(const s of ['12345670','10002003']){
  assert.equal(step(step(s,'L'),'R'),s);
  assert.equal(step(step(step(s,'T'),'T'),'T'),s);
  assert.equal(step(step(s,'T'),'U'),s);
 }
});
test('save validation rejects missing or duplicated lights and invalid types',()=>{
 assert.ok(valid('00120000','10002000'));
 for(const s of [null,{},123,'10000000','11002000','1000200x','100020000'])assert.equal(valid(s,'10002000'),false);
});
test('all 1000 levels are distinct, valid and solvable using only player controls',()=>{
 assert.equal(levels.length,1000);const unique=new Set();let lastPar=0;
 for(const l of levels){
  assert.ok(valid(l.start,l.target));assert.notEqual(l.start,l.target);
  assert.match(l.solution,/^[LRT]+$/);assert.equal(l.solution.length,l.par);
  let s=l.start;for(const m of l.solution)s=step(s,m);assert.equal(s,l.target);
  assert.ok(l.par>=lastPar);lastPar=l.par;
  unique.add(l.start+':'+l.target);
  const colors=[...l.target].filter(c=>c!=='0');assert.equal(colors.length,new Set(colors).size);
 }
 assert.equal(unique.size,1000);
 assert.equal(levels[0].par,2);assert.equal(levels.at(-1).par,18);
});
test('every published solution is shortest in the directed graph',()=>{
 const targets=new Set(levels.map(l=>l.target));
 for(const target of targets){
  const table=search(target);
  for(const l of levels.filter(l=>l.target===target)){
   assert.equal(table.get(l.start).depth,l.par);
   assert.equal(solution(l.start,target,table),l.solution);
  }
  // Exhaustive Bellman condition: no legal next move can provide a shorter path.
  for(const [state,{depth,move}] of table){
   for(const m of ['L','R','T'])assert.ok(depth<=1+table.get(step(state,m)).depth);
   if(depth)assert.equal(table.get(step(state,move)).depth,depth-1);
  }
 }
});
test('all files required by the third game are installed in the offline cache',()=>{
 const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
 for(const name of ['forest-lights.html','forest-lights.js','forest-lights-levels.js'])assert.ok(sw.includes("'./"+name+"'"));
 const menu=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 assert.ok(menu.includes("file: 'forest-lights.html'"));assert.ok(menu.includes("read('forestlights.v1')"));
});
test('opening levels introduce more lights and require real rearrangement',()=>{
 const colors=l=>[...l.target].filter(c=>c!=='0').length;
 assert.equal(colors(levels[2]),3);assert.equal(colors(levels[6]),3);assert.equal(colors(levels[8]),4);
 const pattern=s=>s[0]==='R'?s.replace(/[LR]/g,m=>m==='L'?'R':'L'):s;
 for(const [i,l] of levels.entries()){
  let ring=l.start;for(let n=0;n<8;n++,ring=step(ring,'R'))assert.notEqual(ring,l.target,'Rotation-only level '+(i+1));
  let trio=l.start;for(let n=0;n<3;n++,trio=step(trio,'T'))assert.notEqual(trio,l.target,'Trio-only level '+(i+1));
  assert.ok([...l.start].filter((c,n)=>c!=='0'&&c!==l.target[n]).length>=2);
  if(i>0&&![2,8,280,500,740].includes(i))assert.notEqual(pattern(l.solution),pattern(levels[i-1].solution));
 }
});
test('catalog upgrade keeps achievements and level number, but resets obsolete boards and records',()=>{
 const {restoreProgress}=require('../forest-lights.js');
 const old={level:7,state:'00002001',moves:2,history:['00020001'],best:{1:2,2:2,3:2,4:2,5:2,6:3},sound:false,helpSeen:true};
 const loaded=restoreProgress(old,levels,ctx.FOREST_CATALOG_VERSION);
 assert.equal(loaded.level,7);assert.equal(loaded.state,levels[6].start);
 assert.equal(loaded.moves,0);assert.deepEqual(loaded.history,[]);assert.deepEqual(loaded.best,{});
 assert.equal(Object.keys(loaded.completed).length,6);assert.deepEqual(loaded.legacyBest,old.best);
 // Even matching color counts cannot restore a board from another catalog.
 assert.equal(restoreProgress({...old,level:1},levels,ctx.FOREST_CATALOG_VERSION).state,levels[0].start);
});
test('same-catalog reload preserves the current board, undo and new records',()=>{
 const {restoreProgress}=require('../forest-lights.js');
 const l=levels[6],state=step(l.start,'T');
 const saved={catalogVersion:ctx.FOREST_CATALOG_VERSION,level:7,state,moves:1,history:[l.start],best:{1:levels[0].par},completed:{1:true,2:true},legacyBest:{2:2}};
 const loaded=restoreProgress(saved,levels,ctx.FOREST_CATALOG_VERSION);
 assert.equal(loaded.state,state);assert.equal(loaded.moves,1);assert.deepEqual(loaded.history,[l.start]);
 assert.deepEqual(loaded.best,saved.best);assert.deepEqual(loaded.completed,saved.completed);assert.deepEqual(loaded.legacyBest,saved.legacyBest);
});
