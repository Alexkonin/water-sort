const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../arrow-escape.js'),T=require('../sand-trucks.js');
function advance(s,seconds){for(let t=0;t<seconds;t+=.04)T.step(s,.04);}
function ready(s){if(s.sandDirty||s.active.some(c=>c.phase==='depart'||c.loaded>=s.puzzle.arrows[c.id].capacity||!s.grains.includes(s.puzzle.arrows[c.id].color)))return false;const colors=new Set(T.frontier(s.puzzle.art,s.grains).map(i=>s.grains[i]));return!s.active.some(c=>colors.has(s.puzzle.arrows[c.id].color));}
// The conservative certificate waits for settled sand before every dispatch.
// This bounds the search, not the expected duration of a human playthrough.
// Tick certificates record actual departure starts from the former serialized
// traffic, preserving a winning strategy while players may now start together.
const SOLVE_LIMIT=1800;
function solve(level,random=false){const s=T.create(level);let time=0,frame=0,next=0,seed=level*137,first=null;while(!T.won(s)&&!s.jammed&&time<SOLVE_LIMIT){
 if(random){const free=G.available(s.puzzle,s.remaining);seed=(Math.imul(seed,1664525)+1013904223)>>>0;if(free.length)T.dispatch(s,free[Math.floor(seed/2**32*free.length)]);}
 else if(s.puzzle.releaseTicks){while(next<s.puzzle.solution.length&&s.puzzle.releaseTicks[next]===frame){assert.equal(T.dispatch(s,s.puzzle.solution[next]),'ok',`level ${level}, tick ${frame}`);next++;}}
 else if(s.puzzle.releaseFrames){while(next<s.puzzle.solution.length&&s.puzzle.releaseFrames[next]===frame){assert.equal(T.dispatch(s,s.puzzle.solution[next]),'ok');next++;}}
 else if(next<s.puzzle.solution.length&&ready(s)){if(T.dispatch(s,s.puzzle.solution[next])==='ok')next++;}
 const dt=s.puzzle.releaseTicks?T.PHYSICS_DT:.04,events=T.step(s,dt);time+=dt;frame++;if(first===null&&events.length)first=time;
 assert.ok(T.workingCount(s)<=s.puzzle.limit);for(const c of s.active.filter(c=>c.phase==='road')){const at=T.carPose(s.puzzle,c);assert.equal(at.y,T.ART.y+T.ART.height+42);assert.equal(at.angle,90);}
 }return{s,time,first};}
test('all 100 dense parking lots have many cars, real blockers, and a certified straight exit order',()=>{
 const arts=new Set();for(let n=1;n<=T.LEVELS;n++){const p=T.generate(n),occupied=new Set(),pending=p.arrows.map(a=>a.id);arts.add(JSON.stringify(p.art.cells));assert.deepEqual(p,T.generate(n));assert.ok(p.arrows.length>=40);assert.equal(p.width,12);assert.equal(p.height,12);assert.ok(G.available(p,pending).length<p.arrows.length*.6);
 for(const a of p.arrows){assert.ok(a.capacity>0);const dir=G.direction(a);for(let i=0;i<a.cells.length;i++){const c=a.cells[i];assert.ok(c[0]>=0&&c[1]>=0&&c[0]<p.width&&c[1]<p.height);assert.ok(!occupied.has(c.join(',')));occupied.add(c.join(','));if(i)assert.deepEqual([c[0]-a.cells[i-1][0],c[1]-a.cells[i-1][1]],dir);}}
 for(const id of p.solution){assert.deepEqual(G.blockers(p,pending,id),[]);pending.splice(pending.indexOf(id),1);}assert.equal(pending.length,0);
 for(let color=0;color<6;color++)assert.equal(p.arrows.filter(a=>a.color===color).reduce((n,a)=>n+a.capacity,0),p.art.cells.filter(c=>c===color).length);
 }assert.equal(T.LEVELS,100);assert.equal(arts.size,100);
});
test('new campaign certificates and late-level progress cover all 100 pictures',()=>{
 for(let n=11;n<=100;n++){const p=T.generate(n);const releases=p.releaseTicks||p.releaseFrames;assert.equal(releases.length,p.arrows.length);assert.ok(releases.every((f,i)=>Number.isInteger(f)&&f>=0&&(!i||f>=releases[i-1])));}
 const completed=Array.from({length:99},(_,i)=>i+1),s=T.create(100,false,completed),r=T.restore(T.snapshot(s));
 assert.equal(r.puzzle.level,100);assert.deepEqual(r.completed,completed);assert.equal(r.sound,false);
 const old=T.create(10,true,Array.from({length:9},(_,i)=>i+1));assert.equal(T.restore(T.snapshot(old)).puzzle.level,10);assert.deepEqual(T.restore(T.snapshot(old)).completed,old.completed);
});
test('pickup sees only the bottom row and takes the nearest matching grain beside the truck',()=>{
 const art={width:3,height:3},grains=[1,1,1,1,1,1,0,1,0],row=6,at=T.tilePosition(art,row);at.y=T.ART.y+T.ART.height+42;
 assert.deepEqual(T.frontier(art,grains),[6,7,8]);assert.deepEqual(T.nearest(art,grains,1,at,10),[]);assert.deepEqual(T.nearest(art,grains,0,at,10),[6]);
 assert.deepEqual(T.nearest(art,grains,1,{x:T.tilePosition(art,7).x,y:at.y},10),[7]);assert.deepEqual(T.nearest(art,grains,1,{x:at.x,y:T.ART.y-10},10),[]);
});
test('a pickup removes one grain, then gravity moves individual particles rather than teleporting a column',()=>{
 const art={width:2,height:3},grains=[0,3,1,4,2,5];assert.equal(T.take(art,grains,4),true);assert.deepEqual(grains,[0,3,1,4,-1,5]);assert.equal(T.take(art,grains,0),false);
 const single=Array(30).fill(-1),field={width:5,height:6},motion=T.Sand.create(30);single[2]=3;assert.equal(T.fall(field,single,0,motion),1);assert.equal(single[2],3);assert.ok(motion.offset[2]>0&&motion.offset[2]<1);for(let tick=1;tick<12;tick++)T.fall(field,single,tick,motion);assert.equal(single.filter(c=>c>=0).length,1);assert.ok(single.indexOf(3)>2);
});
test('unsupported walls avalanche sideways into a stable heap and preserve every color',()=>{
 const art={width:40,height:30},grains=Array.from({length:1200},(_,i)=>i%40>=20?Math.floor(i/40)%3:-1),counts=[0,1,2].map(c=>grains.filter(v=>v===c).length);
 const motion=T.Sand.create(grains.length);let tick=0;while(T.canFall(art,grains)&&tick<3000)T.fall(art,grains,tick++,motion);
 assert.ok(tick>0&&tick<3000);assert.equal(T.canFall(art,grains),false);assert.deepEqual([0,1,2].map(c=>grains.filter(v=>v===c).length),counts);
 const heights=Array.from({length:40},(_,x)=>Array.from({length:30},(_,y)=>grains[y*40+x]).filter(c=>c>=0).length);
 for(let x=1;x<40;x++)assert.ok(Math.abs(heights[x]-heights[x-1])<=1,'no vertical sand cliff');assert.ok(Math.max(...heights)-Math.min(...heights)>5,'sand forms a slope, not a flat liquid');assert.ok(heights[10]>0,'grains crossed into the neighbouring empty region');
});
test('free fall accelerates continuously and a collapsing stack stays in contact',()=>{
 const art={width:1,height:30},grains=Array(30).fill(-1),motion=T.Sand.create(30);grains[0]=1;
 T.fall(art,grains,0,motion);const first=motion.offset[0];T.fall(art,grains,1,motion);
 assert.ok(first>0&&motion.offset[0]-first>first,'acceleration rather than a fixed cell jump');
 const stack=Array.from({length:30},(_,i)=>i<8?i%3:-1),m=T.Sand.create(30);
 for(let tick=0;tick<180;tick++){
  T.fall(art,stack,tick,m);const positions=stack.flatMap((c,i)=>c<0?[]:[i+m.offset[i]]);
  assert.equal(positions.length,8);for(let i=1;i<positions.length;i++)assert.ok(Math.abs(positions[i]-positions[i-1]-1)<1e-6,'no air stripes or overlapping grains inside a falling stack');
 }
 assert.equal(stack[29],1);assert.equal(T.canFall(art,stack),false);
});
test('mid-fall motion survives saving and resumes identically',()=>{
 const art={width:5,height:15},grains=Array(75).fill(-1),motion=T.Sand.create(75);grains[2]=4;
 for(let t=0;t<5;t++)T.fall(art,grains,t,motion);
 const other=grains.slice(),restored=T.Sand.restore(grains.length,T.Sand.snapshot(motion),other);
 for(let t=5;t<90;t++){T.fall(art,grains,t,motion);T.fall(art,other,t,restored);}
 assert.deepEqual(other,grains);assert.deepEqual(restored,motion);
});
test('a grain just short of a cell boundary never hangs above empty space',()=>{
 const art={width:3,height:6},grains=Array(18).fill(-1),motion=T.Sand.create(18);grains[1]=2;motion.offset[1]=1-Number.EPSILON;
 T.fall(art,grains,0,motion);assert.equal(grains[1],-1);assert.equal(grains[4],2);
});
test('a tall exposed wall collapses promptly into a shallow stable sand slope',()=>{
 const art={width:96,height:80},grains=Array.from({length:7680},(_,i)=>i%96>54&&Math.floor(i/96)>20?Math.floor(i/96/10)%3:-1),motion=T.Sand.create(grains.length);
 const counts=[0,1,2].map(c=>grains.filter(v=>v===c).length);
 const heights=()=>Array.from({length:96},(_,x)=>{let y=0;while(y<80&&grains[y*96+x]<0)y++;return 80-y;});
 let moving=1,tick=0;for(;tick<720&&moving;tick++){
  moving=T.fall(art,grains,tick,motion);
  if(tick===119){const hs=heights();assert.ok(Math.max(...hs.slice(1).map((v,i)=>Math.abs(v-hs[i])))<=10,'the initial 59-cell cliff has already broken up after one second');}
 }
 assert.ok(tick<720,'settles in under six simulated seconds');assert.equal(T.canFall(art,grains),false);
 const hs=heights(),rise=(hs[80]-hs[24])*T.ART.height/art.height,run=56*T.ART.width/art.width,angle=Math.atan2(rise,run)*180/Math.PI;
 assert.ok(angle>=29&&angle<=36,`stable repose angle: ${angle}`);
 assert.deepEqual([0,1,2].map(c=>grains.filter(v=>v===c).length),counts);
 assert.ok(Math.max(...hs.slice(1).map((v,i)=>Math.abs(v-hs[i])))<=1,'no spikes or vertical walls remain');
});
test('every picture completes with simultaneous traffic, moving trucks and falling sand',()=>{
 for(let n=1;n<=T.LEVELS;n++){const{s,time}=solve(n);assert.ok(T.won(s),`level ${n}: ${time}s, jam=${s.jammed}`);assert.equal(s.delivered.reduce((n,c)=>n+c.loaded,0),s.puzzle.art.cells.length);assert.ok(time<SOLVE_LIMIT);}
 assert.ok(solve(1).first<3,'first truck gives quick feedback');
});
test('fixed physics steps give the same grains and truck load at different display frame rates',()=>{
 const a=T.create(1),b=T.create(1);T.dispatch(a,0);T.dispatch(b,0);for(let n=0;n<100;n++)T.step(a,.04);for(let n=0;n<240;n++)T.step(b,1/60);
 assert.deepEqual(a.grains,b.grains);assert.deepEqual(a.active,b.active);assert.deepEqual(a.delivered,b.delivered);assert.equal(a.sandTick,b.sandTick);assert.deepEqual(a.motion,b.motion);
});
test('rapid selections start together and merge onto the road with a gap',()=>{
 const s=T.create(1),free=G.available(s.puzzle,s.remaining),blocked=s.remaining.find(id=>!free.includes(id));assert.equal(T.dispatch(s,blocked),'blocked');
 const ids=s.puzzle.solution.slice(0,s.puzzle.limit);for(const id of ids)assert.equal(T.dispatch(s,id),'ok');
 assert.ok(s.active.every(c=>c.phase==='depart'));assert.equal(T.workingCount(s),s.puzzle.limit);
 assert.equal(T.dispatch(s,G.available(s.puzzle,s.remaining)[0]),'full');assert.equal(T.dispatch(s,ids[1]),'missing');
 T.step(s,T.PHYSICS_DT);assert.ok(s.active.every(c=>c.phase==='depart'&&c.distance>0));
 const restored=T.restore(T.snapshot(s));assert.deepEqual(restored.active,s.active);assert.equal(T.undo(restored).active.length,s.puzzle.limit-1);
 const entered=new Set();for(let i=0;i<1200;i++){
  T.step(s,.04);const road=s.active.filter(c=>c.phase==='road').sort((a,b)=>b.distance-a.distance);
  for(const car of road)entered.add(car.id);
  for(let j=1;j<road.length;j++)assert.ok(road[j-1].distance-road[j].distance>=T.ROAD_GAP-1e-8);
  if(entered.size===ids.length)break;
 }
 assert.equal(entered.size,ids.length);assert.ok(!s.active.some(c=>['depart','queued'].includes(c.phase)));
});
test('old queued saves resume all selected trucks without waiting for another departure',()=>{
 const s=T.create(1);for(const id of s.puzzle.solution.slice(0,s.puzzle.limit))T.dispatch(s,id);
 for(const c of s.active.slice(1))c.phase='queued';
 const r=T.restore(T.snapshot(s));T.step(r,T.PHYSICS_DT);
 assert.equal(r.active.length,s.active.length);assert.ok(r.active.every(c=>c.phase==='depart'&&c.distance>0));
});
test('a full truck releases its slot before leaving the road, including after save and undo',()=>{
 const s=T.create(1);for(const id of s.puzzle.solution.slice(0,s.puzzle.limit))assert.equal(T.dispatch(s,id),'ok');
 let full;for(let i=0;i<15000&&!full&&!s.jammed;i++){T.step(s,.04);full=s.active.find(c=>c.loaded===s.puzzle.arrows[c.id].capacity);}
 assert.ok(full,'a truck fills during collection');assert.equal(full.phase,'road');assert.ok(full.distance<T.ROAD.length);assert.equal(T.workingCount(s),s.puzzle.limit-1);
 const id=G.available(s.puzzle,s.remaining)[0];assert.equal(T.dispatch(s,id),'ok');assert.equal(s.active.length,s.puzzle.limit+1);assert.equal(T.workingCount(s),s.puzzle.limit);
 const restored=T.restore(T.snapshot(s));assert.deepEqual(restored.active,s.active);assert.equal(T.workingCount(restored),s.puzzle.limit);
 const undone=T.undo(restored);assert.equal(T.workingCount(undone),s.puzzle.limit-1);assert.ok(undone.remaining.includes(id));assert.ok(undone.active.some(c=>c.id===full.id));
 advance(restored,8);assert.ok(restored.delivered.some(c=>c.id===full.id));
});
test('unfilled trucks return beyond the screen and reenter from the left in FIFO order with a gap',()=>{
 const s=T.create(1);s.puzzle.limit=4;s.grains.fill(2);s.grains[0]=3;s.active=[0,1,2].map(id=>({id,phase:'waiting',distance:0,loaded:0,credit:0}));s.queue=[2,0,1];
 // All three wait for the buried grain, independent of campaign truck colors.
 for(const c of s.active)s.puzzle.arrows[c.id].color=3;
 T.step(s,.04);assert.equal(s.active.find(c=>c.phase==='road').id,2);assert.deepEqual(s.queue,[0,1]);advance(s,2);const road=s.active.filter(c=>c.phase==='road').sort((a,b)=>b.distance-a.distance);assert.deepEqual(road.map(c=>c.id),[2,0,1]);for(let i=1;i<road.length;i++)assert.ok(road[i-1].distance-road[i].distance>=T.ROAD_GAP);
 const c=road[0];c.distance=T.ROAD.length-1;T.step(s,.04);assert.equal(c.phase,'waiting');assert.equal(s.queue.at(-1),c.id);assert.equal(T.carPose(s.puzzle,c).x,-80);assert.equal(c.loaded,0);
});
test('an empty parking lot triples road movement, preserves entry gaps and restores speed from saves',()=>{
 const s=T.create(1);s.grains.fill(-1);s.remaining=[];
 const ids=s.puzzle.solution.slice(-3);s.delivered=s.puzzle.arrows.filter(a=>!ids.includes(a.id)).map(a=>({id:a.id,loaded:a.capacity}));
 s.active=ids.map((id,i)=>({id,phase:i?'waiting':'road',distance:0,loaded:s.puzzle.arrows[id].capacity,credit:0}));s.queue=ids.slice(1);
 assert.equal(T.roadSpeed(s),T.SPEED*3);T.step(s,T.PHYSICS_DT);assert.ok(Math.abs(s.active[0].distance-T.SPEED*3*T.PHYSICS_DT)<1e-9);
 const r=T.restore(T.snapshot(s));assert.deepEqual(r.active,s.active);assert.equal(T.roadSpeed(r),T.SPEED*3);
 for(let n=0;n<400&&!T.won(r);n++){T.step(r,T.PHYSICS_DT);const cars=r.active.filter(c=>c.phase==='road').sort((a,b)=>b.distance-a.distance);for(let i=1;i<cars.length;i++)assert.ok(cars[i-1].distance-cars[i].distance>=T.ROAD_GAP);}
 assert.ok(T.won(r));assert.deepEqual(r.delivered.slice(-3).map(c=>c.id),ids);
 const normal=T.create(1);T.dispatch(normal,normal.puzzle.solution[0]);normal.active[0].phase='road';T.step(normal,T.PHYSICS_DT);assert.ok(Math.abs(normal.active[0].distance-T.SPEED*T.PHYSICS_DT)<1e-9);
 normal.remaining=[];normal.active.push({id:1,phase:'queued',distance:0,loaded:0,credit:0});assert.equal(T.roadSpeed(normal),T.SPEED);
 normal.active.pop();assert.equal(T.roadSpeed(normal),T.SPEED*3);assert.equal(T.roadSpeed(T.undo(normal)),T.SPEED);
});
test('wrong color choices cause a visible jam instead of an endless silent stall',()=>{
 const runs=Array.from({length:10},(_,i)=>solve(i+1,true));assert.ok(runs.some(r=>r.s.jammed));for(const r of runs)assert.ok(r.s.jammed||T.won(r.s));
});
test('undo restores the released truck and the original uncollapsed picture',()=>{
 const s=T.create(1),before=T.snapshot(s);T.dispatch(s,0);advance(s,3);assert.ok(s.grains.some(c=>c<0));const r=T.undo(s);assert.deepEqual(r.grains,before.grains);assert.deepEqual(r.remaining,before.remaining);assert.deepEqual(r.active,[]);assert.equal(r.jammed,false);
});
test('saves resume collapsed columns, moving loads and offscreen queue; impossible states reset',()=>{
 const s=T.create(1,false);T.dispatch(s,0);while(s.active.some(c=>c.phase==='depart'))T.step(s,T.PHYSICS_DT);assert.equal(s.active[0].phase,'waiting');assert.deepEqual(T.restore(T.snapshot(s)).queue,s.queue);advance(s,3);const data=JSON.parse(JSON.stringify(T.snapshot(s))),r=T.restore(data);assert.deepEqual(r.grains,s.grains);assert.deepEqual(r.remaining,s.remaining);assert.deepEqual(r.active,s.active);assert.deepEqual(r.motion,s.motion);assert.deepEqual(r.queue,s.queue);assert.equal(r.sound,false);assert.ok(T.undo(r));
 const wrongGrains=data.grains.slice();wrongGrains[wrongGrains.findIndex(c=>c>=0)]=5;
 for(const bad of[{...data,grains:[]},{...data,grains:wrongGrains},{...data,active:[...data.active,...data.active]},{...data,delivered:[{id:0,loaded:999}]},{...data,queue:[-1]}])assert.deepEqual(T.restore(bad).remaining,T.create(1).remaining);
 const old=T.restore({version:3,level:9,sound:false,completed:[1,2]});assert.equal(old.puzzle.level,1);assert.deepEqual(old.completed,[]);assert.equal(old.sound,false);
});
test('the former opening picture restarts with the new art while keeping completed levels',()=>{
 const s=T.create(1,false,[1,2,3,4]),saved=T.snapshot(s),w=s.puzzle.art.width;
 // Original 48 × 40 picture: a 16 × 16 yellow square over a flat sea.
 saved.grains=saved.grains.map((_,i)=>{const x=Math.floor(i%w/2),y=Math.floor(i/w/2);return y>=28?3:x>=15&&x<31&&y>=4&&y<20?1:2;});
 const restored=T.restore(saved);
 assert.notDeepEqual(saved.grains,s.grains);
 assert.deepEqual(restored.grains,s.grains);
 assert.equal(restored.puzzle.level,1);
 assert.deepEqual(restored.completed,[1,2,3,4]);
 assert.deepEqual(restored.remaining,s.remaining);
});
test('an in-flight save from the former campaign restarts only its current picture',()=>{
 const sample=require('./fixtures/sand-render-level11.json'),completed=Array.from({length:10},(_,i)=>i+1);
 const restored=T.restore({...sample.save,completed}),fresh=T.create(11,false,completed);
 assert.ok(sample.save.active.length>0);
 assert.equal(restored.puzzle.level,11);
 assert.deepEqual(restored.completed,completed);
 assert.deepEqual(restored.grains,fresh.grains);
 assert.deepEqual(restored.remaining,fresh.remaining);
 assert.deepEqual(restored.active,[]);
 assert.equal(restored.jammed,false);
});
test('departure starts in the cabin direction, clears the parking lot and joins the left road entrance',()=>{
 for(let n=1;n<=T.LEVELS;n++)for(const a of T.generate(n).arrows){const path=T.departure(a),start=T.parked(a),first=T.pose(path,0),next=T.pose(path,.1),end=T.pose(path,path.length),dir=G.direction(a);assert.equal(start.x,first.x);assert.equal(start.y,first.y);assert.ok(Math.abs(next.x-start.x-dir[0]*.1)<1e-8);assert.ok(Math.abs(next.y-start.y-dir[1]*.1)<1e-8);assert.equal(end.x,-80);assert.equal(end.y,354);}
});
test('completion records levels without island rewards; game has no bottom controls or drawn access lanes',()=>{
 const {s}=solve(1);assert.equal(T.complete(s),true);assert.equal(T.complete(s),false);assert.deepEqual(s.completed,[1]);assert.ok(T.won(T.restore(T.snapshot(s))));
 const fs=require('fs'),path=require('path'),html=fs.readFileSync(path.join(__dirname,'../sand-trucks.html'),'utf8'),ui=fs.readFileSync(path.join(__dirname,'../sand-trucks-ui.js'),'utf8'),sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');assert.ok(!html.includes('<footer'));assert.ok(!html.includes('art-heading'));assert.ok(!html.includes('id="colors"'));assert.ok(!html.includes('id="percent"'));assert.ok(!ui.includes('onpointerenter'));assert.ok(!ui.includes('preview'));assert.ok(!html.includes('island'));assert.ok(!ui.includes('SandIsland'));assert.ok(!ui.includes('road(T.departure'));assert.ok(!sw.includes('sand-trucks-island'));assert.ok(sw.includes("'./sand-trucks-levels.js'"));
});

test('version four progress survives finer grains and lateral gravity',()=>{
 const data=require('../sand-trucks-levels.js')[0],grains=data.rows.join('').split('').map(Number),w=data.rows[0].length;for(let to=grains.length-w,from=to-w;from>=0;to-=w,from-=w)grains[to]=grains[from];grains[0]=-1;
 const saved={version:4,level:1,remaining:data.arrows.slice(1).map(a=>a.id),grains,active:[{id:0,phase:'road',distance:50,loaded:1,credit:0}],delivered:[],queue:[],sound:false,completed:[]};
 const s=T.restore(saved);assert.equal(s.remaining.length,data.arrows.length-1);assert.equal(s.grains.filter(c=>c<0).length,4);assert.equal(s.active[0].loaded,4);assert.equal(s.sound,false);assert.deepEqual(T.restore(T.snapshot(s)).grains,s.grains);
 for(const malformed of[{...saved,level:1.5},{...saved,active:[null]},{...saved,grains:[]}])assert.doesNotThrow(()=>T.restore(malformed));
});
