const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const G=require('../arrow-escape.js');

test('100 reproducible levels have connected, non-overlapping arrows and a full legal solution',()=>{
  const unique=new Set();let early=0,late=0,lateArrows=0,lateFree=0;
  for(let n=1;n<=G.LEVELS;n++){
    const p=G.generate(n),occupied=new Map();
    assert.deepEqual(p,G.generate(n));unique.add(JSON.stringify(p.arrows));
    for(const a of p.arrows){
      assert.ok(a.cells.length>=2);
      for(const [i,c]of a.cells.entries()){
        assert.ok(c.every(Number.isInteger));assert.ok(c[0]>=0&&c[0]<p.width&&c[1]>=0&&c[1]<p.height);
        assert.ok(!occupied.has(c.join(',')),`overlap on level ${n}`);occupied.set(c.join(','),a.id);
        if(i)assert.equal(Math.abs(c[0]-a.cells[i-1][0])+Math.abs(c[1]-a.cells[i-1][1]),1);
      }
    }
    const solution=G.solve(p);assert.equal(solution?.length,p.arrows.length,`unsolved level ${n}`);
    // Independently simulate every cell ahead of the head, rather than trusting
    // the same blocker function that produced the solution.
    for(const id of solution){
      const a=p.arrows[id],head=a.cells.at(-1),neck=a.cells.at(-2),dx=head[0]-neck[0],dy=head[1]-neck[1];
      for(let x=head[0]+dx,y=head[1]+dy;x>=0&&y>=0&&x<p.width&&y<p.height;x+=dx,y+=dy)
        assert.ok(!occupied.has(x+','+y),`illegal exit on level ${n}, arrow ${id}`);
      a.cells.forEach(c=>occupied.delete(c.join(',')));
    }
    assert.equal(occupied.size,0);
    if(n<=10)early+=p.arrows.reduce((s,a)=>s+a.cells.length,0);
    if(n>90){
      late+=p.arrows.reduce((s,a)=>s+a.cells.length,0);
      lateArrows+=p.arrows.length;
      lateFree+=G.available(p,p.arrows.map(a=>a.id)).length;
    }
  }
  assert.equal(unique.size,G.LEVELS);assert.ok(late>early*2);
  assert.ok(lateArrows>=300,'late levels should have a dense field of arrows');
  assert.ok(lateFree/lateArrows<.42,'most arrows should initially be blocked');
});

test('blocking uses the full forward lane, including distant pieces and the arrow itself',()=>{
  const p={width:7,height:5,arrows:[{id:0,cells:[[0,2],[1,2]]},{id:1,cells:[[4,1],[4,2],[4,3]]},{id:2,cells:[[5,2],[6,2]]}]};
  assert.deepEqual(G.blockers(p,[0,1,2],0),[1,2]);
  assert.deepEqual(G.blockers(p,[0,2],0),[2]);
  assert.deepEqual(G.blockers(p,[0],0),[]);
  const self={width:5,height:5,arrows:[{id:0,cells:[[2,1],[2,2],[1,2],[1,1]]}]};
  // Head points up; move the tail onto its forward ray.
  self.arrows[0].cells=[[1,0],[2,0],[2,1],[2,2],[1,2],[1,1]];
  assert.deepEqual(G.blockers(self,[0],0),[0]);assert.equal(G.solve(self),null);
});

test('animation follows every bend, preserves length, and exits in the head direction',()=>{
  const a={id:0,cells:[[0,0],[1,0],[1,1],[2,1]]};
  assert.deepEqual(G.movingCells(a,0),a.cells);
  assert.deepEqual(G.movingCells(a,-.01),a.cells);
  assert.deepEqual(G.movingCells(a,1),[[1,0],[1,1],[2,1],[3,1]]);
  for(let t=0;t<9;t+=.125){
    const pts=G.movingCells(a,t);let length=0;
    for(let i=1;i<pts.length;i++){
      const dx=Math.abs(pts[i][0]-pts[i-1][0]),dy=Math.abs(pts[i][1]-pts[i-1][1]);
      assert.ok(dx===0||dy===0);length+=dx+dy;
    }
    assert.equal(length,3);assert.deepEqual(pts.at(-1),[2+t,1]);
  }
});

test('valid saves resume mid-level, wins and exhausted attempts without losing achievements',()=>{
  const p=G.generate(9),all=p.arrows.map(a=>a.id),removed=G.solve(p).slice(0,4),remaining=all.filter(id=>!removed.includes(id));
  const saved={version:G.VERSION,level:9,remaining,lives:2,hints:3,best:{1:3,2:2},sound:false,grid:true};
  const state=G.restore(saved);assert.deepEqual(state.remaining,remaining);assert.equal(state.lives,2);assert.equal(state.hints,3);assert.deepEqual(state.best,saved.best);assert.equal(state.sound,false);assert.equal(state.grid,true);
  assert.equal(G.restore({...saved,lives:0}).lives,0);
  assert.deepEqual(G.restore({...saved,remaining:[]}).remaining,[]);
});

test('corrupt, obsolete and unreachable saves reset only the active puzzle',()=>{
  for(const saved of [null,[],3,'oops',{level:101},{level:-2},{level:1.5}])assert.equal(G.restore(saved).level,1);
  const p=G.generate(2),all=p.arrows.map(a=>a.id),blocked=all.find(id=>G.blockers(p,all,id).length);
  const base={version:G.VERSION,level:2,remaining:all,lives:3,best:{1:3,bad:3,101:3,2:99}};
  for(const extra of [{remaining:[-1]},{remaining:[0,0]},{lives:-1},{lives:4},{version:-1,remaining:[]},{remaining:all.filter(id=>id!==blocked)}]){
    const restored=G.restore({...base,...extra});assert.deepEqual(restored.remaining,all);assert.equal(restored.lives,3);assert.deepEqual(restored.best,{1:3});
  }
});

test('menu and offline cache include the complete game',()=>{
  const root=path.join(__dirname,'..'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),menu=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const file of ['arrow-escape.html','arrow-escape.js','sand-trucks.html','sand-trucks.js','sand-trucks-ui.js'])assert.ok(sw.includes("'./"+file+"'"));
  assert.ok(menu.includes("file: 'sand-trucks.html'"));assert.ok(menu.includes("read('sandtrucks.v1')"));
});
