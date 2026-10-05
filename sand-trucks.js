/* Parking exit rules and a single sand-collecting road below the picture. */
(function(root){
  'use strict';
  const G=typeof module!=='undefined'&&module.exports?require('./arrow-escape.js'):root.ArrowEscape;
  const DATA=typeof module!=='undefined'&&module.exports?require('./sand-trucks-levels.js'):root.SandTruckLevels;
  const S=typeof module!=='undefined'&&module.exports?require('./sand-trucks-sand.js'):root.SandTruckSand;
  const VERSION=5,LEVELS=DATA.length;
  const COLORS=['#f5b544','#f4df68','#f1ecd6','#28bfc5','#387fa9','#cd6656'];
  const NAMES=['Охра','Солнце','Сливочный','Бирюза','Синий','Коралловый'];
  const ART={x:16,y:12,width:388,height:300},PARK={x:56,y:434,cell:28};
  const SPEED=145,PICKUP_RADIUS=48,ROAD_GAP=112,PHYSICS_DT=1/120,GRAIN_SCALE=2;
  function generate(number){
    const level=Math.max(1,Math.min(LEVELS,Math.floor(Number(number)||1))),d=DATA[level-1];
    const rows=d.rows.flatMap(row=>Array(GRAIN_SCALE).fill([...row].map(c=>c.repeat(GRAIN_SCALE)).join('')));
    return{level,width:d.width||12,height:d.height||12,limit:d.limit||3,solution:d.solution.slice(),...(d.releaseFrames?{releaseFrames:d.releaseFrames.slice()}:{}),arrows:d.arrows.map(a=>({...a,capacity:a.capacity*GRAIN_SCALE**2,cells:a.cells.map(c=>c.slice())})),art:{width:rows[0].length,height:rows.length,cells:rows.join('').split('').map(Number),title:d.title}};
  }
  function route(vertices,radius=14){
    const points=[vertices[0]];
    for(let i=1;i<vertices.length-1;i++){
      const a=vertices[i-1],b=vertices[i],c=vertices[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]);if(!ab||!bc)continue;
      const r=Math.min(radius,ab/2,bc/2),start=[b[0]+(a[0]-b[0])*r/ab,b[1]+(a[1]-b[1])*r/ab],end=[b[0]+(c[0]-b[0])*r/bc,b[1]+(c[1]-b[1])*r/bc];points.push(start);
      for(let n=1;n<=10;n++){const t=n/10,u=1-t;points.push([u*u*start[0]+2*u*t*b[0]+t*t*end[0],u*u*start[1]+2*u*t*b[1]+t*t*end[1]]);}
    }
    points.push(vertices.at(-1));const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));return{points,lengths,length:lengths.at(-1)};
  }
  const ROAD=route([[-80,354],[500,354]]);
  function pose(path,distance){
    const d=Math.max(0,Math.min(path.length,distance));let i=1;while(i<path.points.length-1&&path.lengths[i]<d)i++;
    const a=path.points[i-1],b=path.points[i],span=path.lengths[i]-path.lengths[i-1],t=span?(d-path.lengths[i-1])/span:0;
    return{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,angle:Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI+90};
  }
  function parked(a){const tail=a.cells[0],head=a.cells.at(-1),[dx,dy]=G.direction(a);return{x:PARK.x+(tail[0]+head[0])/2*PARK.cell,y:PARK.y+(tail[1]+head[1])/2*PARK.cell,angle:Math.atan2(dy,dx)*180/Math.PI+90};}
  function departure(a){
    const at=parked(a),[dx,dy]=G.direction(a),v=[[at.x,at.y]];
    // Clear the entire parking lot in the cabin direction before turning.
    // Access paths exist only in the simulation; the UI draws no access road.
    if(dx<0)v.push([-80,at.y],[-80,354]);
    else if(dx>0)v.push([500,at.y],[500,860],[-80,860],[-80,354]);
    else if(dy>0)v.push([at.x,860],[-80,860],[-80,354]);
    else v.push([at.x,392],[-80,392],[-80,354]);
    return route(v,12);
  }
  function tilePosition(art,index){return{x:ART.x+(index%art.width+.5)*ART.width/art.width,y:ART.y+(Math.floor(index/art.width)+.5)*ART.height/art.height};}
  function frontier(art,grains){const row=(art.height-1)*art.width;return Array.from({length:art.width},(_,x)=>row+x).filter(i=>grains[i]>=0);}
  function nearest(art,grains,color,at,limit=1,radius=PICKUP_RADIUS){
    if(at.y<ART.y+ART.height)return[];
    return frontier(art,grains).filter(i=>grains[i]===color).map(i=>({i,d:Math.abs(tilePosition(art,i).x-at.x)})).filter(a=>a.d<=radius).sort((a,b)=>a.d-b.d||a.i-b.i).slice(0,limit).map(a=>a.i);
  }
  // A pickup opens a hole. Gravity advances independently at a fixed rate;
  // no column is teleported down and grains may avalanche into neighbouring columns.
  function take(art,grains,index){
    if(index<(art.height-1)*art.width||index>=grains.length||grains[index]<0)return false;
    grains[index]=-1;return true;
  }
  function fall(art,grains,tick=0,motion=S.create(grains.length)){return S.step(art,grains,motion,tick,PHYSICS_DT);}
  function canFall(art,grains){return S.canMove(art,grains);}
  function cleanCompleted(value){return Array.isArray(value)?[...new Set(value.filter(n=>Number.isInteger(n)&&n>=1&&n<=LEVELS))].sort((a,b)=>a-b):[];}
  function create(level=1,sound=true,completed=[]){const puzzle=generate(level);return{puzzle,remaining:puzzle.arrows.map(a=>a.id),grains:puzzle.art.cells.slice(),motion:S.create(puzzle.art.cells.length),active:[],delivered:[],queue:[],history:[],sound,completed:cleanCompleted(completed),clock:0,sandTick:0,sandMoving:false,sandDirty:false,jammed:false};}
  function baseSnapshot(s){return{version:VERSION,level:s.puzzle.level,clock:s.clock,sandTick:s.sandTick,motion:S.snapshot(s.motion),remaining:s.remaining.slice(),grains:s.grains.slice(),active:s.active.map(a=>({...a})),delivered:s.delivered.map(a=>({...a})),queue:s.queue.slice(),sound:s.sound,completed:s.completed.slice()};}
  function dispatch(s,id){
    if(s.jammed)return'jam';if(!s.remaining.includes(id))return'missing';
    if(G.blockers(s.puzzle,s.remaining,id).length)return'blocked';
    if(workingCount(s)>=s.puzzle.limit)return'full';
    s.history.push(baseSnapshot(s));if(s.history.length>8)s.history.shift();
    s.remaining=s.remaining.filter(n=>n!==id);s.active.push({id,phase:s.active.some(c=>c.phase==='depart'||c.phase==='queued')?'queued':'depart',distance:0,loaded:0,credit:0});return'ok';
  }
  // Selected trucks reserve a slot; full trucks immediately release theirs.
  function workingCount(s){return s.active.filter(c=>c.loaded<s.puzzle.arrows[c.id].capacity).length;}
  function roadSpeed(s){return SPEED*(!s.remaining.length&&!s.active.some(c=>c.phase==='queued')?3:1);}
  function finishedLoad(s,car){return car.loaded>=s.puzzle.arrows[car.id].capacity||!s.grains.includes(s.puzzle.arrows[car.id].color);}
  function pump(s){
    if(!s.queue.length||s.active.some(c=>c.phase==='road'&&c.distance<ROAD_GAP))return;
    const id=s.queue.shift(),car=s.active.find(c=>c.id===id);if(car){car.phase='road';car.distance=0;car.credit=0;}
  }
  function carPose(puzzle,car){return car.phase==='queued'?parked(puzzle.arrows[car.id]):pose(car.phase==='depart'?departure(puzzle.arrows[car.id]):ROAD,car.distance);}
  function isJammed(s){
    if(workingCount(s)<s.puzzle.limit||s.active.some(c=>c.phase==='depart'||c.phase==='queued'||finishedLoad(s,c)))return false;
    const colors=new Set(frontier(s.puzzle.art,s.grains).map(i=>s.grains[i]));return!s.active.some(c=>colors.has(s.puzzle.arrows[c.id].color))&&!canFall(s.puzzle.art,s.grains);
  }
  function simulateTick(s,events){
    const dt=PHYSICS_DT;if(s.sandDirty){const moved=fall(s.puzzle.art,s.grains,s.sandTick,s.motion);events.moved+=moved;s.sandDirty=moved>0;}s.sandTick++;pump(s);
    // Accept clicks immediately; serialize the physical exits to avoid crossing cars.
    if(!s.active.some(c=>c.phase==='depart')){const next=s.active.find(c=>c.phase==='queued');if(next)next.phase='depart';}
    const speed=roadSpeed(s);
    for(const car of s.active){
      const a=s.puzzle.arrows[car.id];
      if(car.phase==='depart'){
        const length=departure(a).length;car.distance=Math.min(length,car.distance+dt*430);
        if(car.distance===length){car.phase='waiting';car.distance=0;s.queue.push(car.id);}
      }else if(car.phase==='road'){
        car.distance+=dt*speed;car.credit+=dt;
        if(car.credit>=.055){
          const count=Math.min(Math.floor(car.credit*80*GRAIN_SCALE**2),a.capacity-car.loaded);car.credit=0;
          for(let n=0;n<count;n++){const index=nearest(s.puzzle.art,s.grains,a.color,carPose(s.puzzle,car))[0];if(index===undefined)break;take(s.puzzle.art,s.grains,index);S.clear(s.motion,index);s.sandDirty=true;car.loaded++;events.push({id:car.id,index,color:a.color});}
        }
        if(car.distance>=ROAD.length){
          if(finishedLoad(s,car)){car.phase='done';s.delivered.push({id:car.id,loaded:car.loaded});}
          else{car.phase='waiting';car.distance=0;s.queue.push(car.id);}
        }
      }
    }
    s.active=s.active.filter(c=>c.phase!=='done');
  }
  function step(s,seconds){
    const events=[];events.moved=0;if(s.jammed)return events;
    s.clock+=Math.max(0,Math.min(.08,Number(seconds)||0));
    while(s.clock+1e-10>=PHYSICS_DT){s.clock=Math.max(0,s.clock-PHYSICS_DT);simulateTick(s,events);}
    s.sandMoving=events.moved>0||events.length>0;s.jammed=isJammed(s);return events;
  }
  function hint(s){const colors=new Set(frontier(s.puzzle.art,s.grains).map(i=>s.grains[i])),free=G.available(s.puzzle,s.remaining);const id=free.find(id=>colors.has(s.puzzle.arrows[id].color));return id===undefined?null:{id,reason:'color'};}
  function won(s){return!s.remaining.length&&!s.active.length&&s.grains.every(c=>c<0);}
  function complete(s){if(!won(s))return false;const fresh=!s.completed.includes(s.puzzle.level);if(fresh)s.completed.push(s.puzzle.level);s.completed.sort((a,b)=>a-b);s.history=[];return fresh;}
  function snapshot(s){return{...baseSnapshot(s),history:s.history.slice(-8)};}
  function restore(saved,withHistory=true){
    saved=saved&&typeof saved==='object'?saved:{};
    if(saved.version===4){
      const old=DATA[Math.max(0,Math.min(LEVELS-1,Math.floor(Number(saved.level)||1)-1))],w=old.rows[0].length;
      const grains=Array.isArray(saved.grains)?saved.grains.flatMap((c,i)=>i%w===0?Array.from({length:GRAIN_SCALE},()=>saved.grains.slice(i,i+w).flatMap(v=>Array(GRAIN_SCALE).fill(v))).flat():[]):[];
      saved={...saved,version:VERSION,grains,clock:0,sandTick:0,active:Array.isArray(saved.active)?saved.active.map(c=>({...c,loaded:c?.loaded*GRAIN_SCALE**2})):saved.active,delivered:Array.isArray(saved.delivered)?saved.delivered.map(c=>({...c,loaded:c?.loaded*GRAIN_SCALE**2})):saved.delivered,history:[]};
    }
    const current=saved.version===VERSION,s=create(current?saved.level:1,saved.sound!==false,current?saved.completed:[]),p=s.puzzle,ids=s.remaining;
    if(!current)return s;
    if(!Array.isArray(saved.remaining)||new Set(saved.remaining).size!==saved.remaining.length||!saved.remaining.every(id=>ids.includes(id)))return s;
    const pending=ids.slice(),removed=ids.filter(id=>!saved.remaining.includes(id));while(removed.length){const i=removed.findIndex(id=>!G.blockers(p,pending,id).length);if(i<0)return s;const[id]=removed.splice(i,1);pending.splice(pending.indexOf(id),1);}
    if(!Array.isArray(saved.grains)||saved.grains.length!==p.art.cells.length||!saved.grains.every(c=>Number.isInteger(c)&&c>=-1&&c<6))return s;
    // Avalanches move colors between columns. Validate total mass per color
    // against all parked, carried and delivered loads, rather than old columns.
    if(!Array.isArray(saved.active)||saved.active.length>ids.length||!Array.isArray(saved.delivered))return s;
    const used=new Set(saved.remaining);for(const c of [...saved.active,...saved.delivered]){if(!c||!ids.includes(c.id)||used.has(c.id)||!Number.isInteger(c.loaded)||c.loaded<0||c.loaded>p.arrows[c.id].capacity)return s;used.add(c.id);}if(used.size!==ids.length)return s;
    for(const c of saved.active){if(!['queued','depart','road','waiting'].includes(c.phase)||!Number.isFinite(c.distance)||c.distance<0||!Number.isFinite(c.credit)||c.credit<0)return s;
      const max=c.phase==='depart'?departure(p.arrows[c.id]).length:(c.phase==='waiting'||c.phase==='queued')?0:ROAD.length;if(c.distance>max||((c.phase==='depart'||c.phase==='queued')&&c.loaded))return s;}
    if(saved.active.filter(c=>c.phase==='depart').length>1||workingCount({active:saved.active,puzzle:p})>p.limit)return s;
    for(const c of saved.delivered)if(c.loaded!==p.arrows[c.id].capacity&&saved.grains.includes(p.arrows[c.id].color))return s;
    for(let color=0;color<6;color++){const removed=p.art.cells.filter(c=>c===color).length-saved.grains.filter(c=>c===color).length,loaded=[...saved.active,...saved.delivered].filter(c=>p.arrows[c.id].color===color).reduce((n,c)=>n+c.loaded,0);if(removed!==loaded)return s;}
    if(!Array.isArray(saved.queue)||new Set(saved.queue).size!==saved.queue.length||saved.queue.length!==saved.active.filter(c=>c.phase==='waiting').length||!saved.queue.every(id=>saved.active.some(c=>c.id===id&&c.phase==='waiting')))return s;
    Object.assign(s,{clock:Number.isFinite(saved.clock)&&saved.clock>=0&&saved.clock<PHYSICS_DT?saved.clock:0,sandTick:Number.isSafeInteger(saved.sandTick)&&saved.sandTick>=0?saved.sandTick:0,remaining:saved.remaining.slice(),grains:saved.grains.slice(),active:saved.active.map(c=>({...c,credit:c.credit<=.08?c.credit:0})),delivered:saved.delivered.map(c=>({...c})),queue:saved.queue.slice()});
    if(withHistory&&Array.isArray(saved.history))for(const h of saved.history.slice(-8)){if(h?.version!==VERSION||h?.level!==p.level)continue;const r=restore(h,false);if(JSON.stringify(r.grains)===JSON.stringify(h.grains)&&JSON.stringify(r.remaining)===JSON.stringify(h.remaining))s.history.push(baseSnapshot(r));}
    s.motion=S.restore(s.grains.length,saved.motion,s.grains);s.sandDirty=canFall(p.art,s.grains)||S.snapshot(s.motion).length>0;s.jammed=isJammed(s);return s;
  }
  function undo(s){if(!s.history.length)return null;const history=s.history.slice(),last=history.pop(),r=restore(last,false);r.history=history;r.completed=s.completed.slice();r.sound=s.sound;return r;}
  const api={VERSION,LEVELS,COLORS,NAMES,ART,PARK,ROAD,SPEED,ROAD_GAP,PICKUP_RADIUS,PHYSICS_DT,GRAIN_SCALE,Sand:S,route,generate,picture:n=>generate(n).art,pose,parked,departure,tilePosition,frontier,nearest,take,fall,canFall,carPose,create,dispatch,workingCount,roadSpeed,step,hint,won,complete,snapshot,restore,undo,isJammed};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SandTrucks=api;
})(globalThis);
