/* Rules and deterministic levels shared by the browser and the catalog checks. */
(function(root){
  'use strict';
  const VERSION=2, LEVELS=100, LIVES=3;
  const DIRS=[[1,0],[0,1],[-1,0],[0,-1]];
  const key=p=>p[0]+','+p[1];
  const inside=(p,w,h)=>p[0]>=0&&p[1]>=0&&p[0]<w&&p[1]<h;
  function direction(arrow){
    const head=arrow.cells.at(-1), neck=arrow.cells.at(-2);
    return [head[0]-neck[0],head[1]-neck[1]];
  }
  function ray(arrow,w,h){
    const [dx,dy]=direction(arrow), head=arrow.cells.at(-1), cells=[];
    for(let p=[head[0]+dx,head[1]+dy];inside(p,w,h);p=[p[0]+dx,p[1]+dy])cells.push(p);
    return cells;
  }
  function blockers(puzzle,remaining,id){
    const arrow=puzzle.arrows.find(a=>a.id===id);
    if(!arrow||!remaining.includes(id))return [];
    const occupied=new Map();
    for(const a of puzzle.arrows)if(remaining.includes(a.id))for(const p of a.cells)occupied.set(key(p),a.id);
    return [...new Set(ray(arrow,puzzle.width,puzzle.height).map(p=>occupied.get(key(p))).filter(x=>x!==undefined))];
  }
  function available(puzzle,remaining){return remaining.filter(id=>!blockers(puzzle,remaining,id).length);}
  function solve(puzzle,remaining=puzzle.arrows.map(a=>a.id)){
    const pending=remaining.slice(), order=[];
    while(pending.length){
      const id=pending.find(id=>!blockers(puzzle,pending,id).length);
      if(id===undefined)return null;
      pending.splice(pending.indexOf(id),1);order.push(id);
    }
    return order;
  }
  function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
  function inShape(x,y,w,h,shape){
    const nx=(x-(w-1)/2)/(w/2), ny=(y-(h-1)/2)/(h/2);
    if(shape==='diamond')return Math.abs(nx)+Math.abs(ny)<1.12;
    if(shape==='circle')return nx*nx+ny*ny<1;
    if(shape==='leaf')return (nx+.28*ny)**2+(ny*.83)**2<.8;
    if(shape==='heart'){
      const a=nx*1.2,b=-ny*1.2+.1;
      return (a*a+b*b-1)**3-a*a*b*b*b<0;
    }
    return true;
  }
  function candidate(level,variant){
    const tier=level<4?0:level<13?1:level<31?2:level<61?3:4;
    const width=[7,9,11,15,17][tier],height=[9,11,13,19,21][tier];
    const shapes=['rectangle','leaf','diamond','circle','heart'];
    const shape=level<6?'rectangle':shapes[Math.floor((level-6)/3)%shapes.length];
    const random=rng(level*7919+1103+variant*104729),mask=[];
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(inShape(x,y,width,height,shape))mask.push([x,y]);
    const allowed=new Set(mask.map(key)),occupied=new Set(),lanes=new Map(),arrows=[];
    // Build the removal sequence backwards. Every newly placed arrow can exit
    // past all previously placed ones; later additions may block it. Reversing
    // construction therefore always yields a legal complete solution.
    for(let attempt=0;attempt<mask.length*110&&occupied.size<mask.length*.94;attempt++){
      const head=mask[Math.floor(random()*mask.length)];
      if(occupied.has(key(head)))continue;
      const dir=DIRS[Math.floor(random()*4)],neck=[head[0]-dir[0],head[1]-dir[1]];
      if(!allowed.has(key(neck))||occupied.has(key(neck)))continue;
      const line=ray({cells:[neck,head]},width,height),exit=new Set(line.map(key));
      if(line.some(p=>occupied.has(key(p))))continue;
      const backward=[head,neck],used=new Set(backward.map(key));
      const target=3+Math.floor(random()*([5,7,9,11,14][tier]));
      let last=[-dir[0],-dir[1]];
      while(backward.length<target){
        const p=backward.at(-1),choices=DIRS.filter(d=>{
          const q=[p[0]+d[0],p[1]+d[1]],k=key(q);
          return allowed.has(k)&&!occupied.has(k)&&!used.has(k)&&!exit.has(k);
        });
        if(!choices.length)break;
        // Crossing an earlier arrow's open exit lane creates an actual
        // dependency, rather than merely filling another empty cell.
        const weights=choices.map(d=>{
          const q=[p[0]+d[0],p[1]+d[1]];
          return (1+Math.min(4,lanes.get(key(q))||0)*4)*(d[0]===last[0]&&d[1]===last[1]?1.45:1);
        });
        let pick=random()*weights.reduce((sum,weight)=>sum+weight,0),index=0;
        while(index<weights.length-1&&pick>=weights[index])pick-=weights[index++];
        const d=choices[index];
        const next=[p[0]+d[0],p[1]+d[1]];
        backward.push(next);used.add(key(next));last=d;
      }
      const cells=backward.reverse();cells.forEach(p=>occupied.add(key(p)));
      arrows.push({id:arrows.length,cells});
      for(const p of line){const k=key(p);lanes.set(k,(lanes.get(k)||0)+1);}
    }
    return {level,width,height,shape,arrows};
  }
  function difficulty(puzzle){
    const occupied=new Map();
    for(const arrow of puzzle.arrows)for(const cell of arrow.cells)occupied.set(key(cell),arrow.id);
    let blocked=0,dependencies=0;
    for(const arrow of puzzle.arrows){
      const other=new Set(ray(arrow,puzzle.width,puzzle.height).map(cell=>occupied.get(key(cell))).filter(id=>id!==undefined&&id!==arrow.id));
      if(other.size)blocked++;
      dependencies+=other.size;
    }
    const free=puzzle.arrows.length-blocked;
    const cells=puzzle.arrows.reduce((sum,a)=>sum+a.cells.length,0);
    const area=puzzle.width*puzzle.height;
    return blocked*5+dependencies*2+puzzle.arrows.length*1.5+cells/area*15-free*5;
  }
  function generate(number){
    const level=Math.max(1,Math.min(LEVELS,Math.floor(Number(number)||1)));
    // Keep the opening levels approachable, then choose the most entangled
    // solvable layout from several reproducible candidates.
    const variants=level<4?1:level<13?6:level<31?12:20;
    let best=null,bestScore=-Infinity;
    for(let variant=0;variant<variants;variant++){
      const puzzle=candidate(level,variant),score=difficulty(puzzle);
      if(score>bestScore){best=puzzle;bestScore=score;}
    }
    return best;
  }
  // A fixed-length piece of the tail→head polyline followed by a straight exit
  // ray gives the snake-like motion, including a reversible collision bounce.
  function movingCells(arrow,distance){
    distance=Math.max(0,Number.isFinite(distance)?distance:0);
    const cells=arrow.cells,len=cells.length-1,[dx,dy]=direction(arrow),head=cells.at(-1);
    const at=t=>{
      if(t>=len)return [head[0]+dx*(t-len),head[1]+dy*(t-len)];
      const i=Math.floor(t),f=t-i,a=cells[i],b=cells[i+1];
      return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
    };
    const out=[at(distance)];
    for(let i=Math.floor(distance)+1;i<distance+len&&i<=len;i++)out.push(cells[i]);
    out.push(at(distance+len));return out;
  }
  function restore(saved={}){
    if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};
    const level=Number.isInteger(saved.level)&&saved.level>=1&&saved.level<=LEVELS?saved.level:1;
    const puzzle=generate(level),ids=puzzle.arrows.map(a=>a.id),best={};
    for(const [n,stars] of Object.entries(saved.best&&typeof saved.best==='object'?saved.best:{}))
      if(Number.isInteger(+n)&&+n>=1&&+n<=LEVELS&&Number.isInteger(stars)&&stars>=1&&stars<=LIVES)best[n]=stars;
    let remaining=ids,lives=LIVES,hints=0;
    const candidate=saved.remaining;
    if(saved.version===VERSION&&Array.isArray(candidate)&&new Set(candidate).size===candidate.length&&candidate.every(id=>ids.includes(id))&&Number.isInteger(saved.lives)&&saved.lives>=0&&saved.lives<=LIVES){
      // Validate reachability, not just IDs: removed pieces must admit a legal
      // removal order with the saved pieces still blocking their exit lanes.
      const pending=ids.slice(),removed=ids.filter(id=>!candidate.includes(id));
      while(removed.length){
        const i=removed.findIndex(id=>!blockers(puzzle,pending,id).length);
        if(i<0)break;
        const [id]=removed.splice(i,1);pending.splice(pending.indexOf(id),1);
      }
      if(!removed.length){remaining=candidate.slice();lives=saved.lives;hints=Number.isInteger(saved.hints)&&saved.hints>=0?saved.hints:0;}
    }
    return {level,puzzle,remaining,lives,hints,best,sound:saved.sound!==false,grid:saved.grid===true,helpSeen:saved.helpSeen===true};
  }
  const api={VERSION,LEVELS,LIVES,generate,direction,ray,blockers,available,solve,movingCells,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ArrowEscape=api;
})(globalThis);
