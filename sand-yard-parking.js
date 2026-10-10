/* Shared traffic puzzle and collision-free garage entry routes. */
(function(root){
'use strict';
const P=typeof module!=='undefined'&&module.exports?require('./arrow-escape.js'):root.ArrowEscape;
const W=6,H=6,DIRS=[[-1,0],[0,-1],[1,0],[0,1]],key=([x,y])=>x+','+y;
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function cells(p,length){const [x,y,d]=p,[dx,dy]=DIRS[d];return Array.from({length},(_,i)=>[x-dx*(length-1-i),y-dy*(length-1-i)]);}
function puzzle(cars){return{width:W,height:H,arrows:cars};}
function free(cars){return P.available(puzzle(cars),cars.map(c=>c.id));}
function solve(cars){return P.solve(puzzle(cars));}
function depth(cars){const p=puzzle(cars),memo=new Map();function visit(id){if(memo.has(id))return memo.get(id);const value=1+Math.max(0,...P.blockers(p,cars.map(c=>c.id),id).map(visit));memo.set(id,value);return value;}return Math.max(0,...cars.map(c=>visit(c.id)));}
function occupied(cars){return new Set(cars.flatMap(c=>c.cells.map(key)));}
function inside([x,y]){return x>=0&&x<W&&y>=0&&y<H;}
function initial(lengths,seed){
 const random=rng(seed);let best=null,bestScore=-Infinity;
 for(let attempt=0;attempt<28;attempt++){
  const cars=[],used=new Set();
  for(const length of lengths){
   const choices=[];
   for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(let d=0;d<4;d++){
    const body=cells([x,y,d],length),car={id:cars.length,cells:body};
    if(body.every(p=>inside(p)&&!used.has(key(p)))&&P.ray(car,W,H).every(p=>!used.has(key(p))))choices.push(car);
   }
   if(!choices.length)break;
   const car=choices[Math.floor(random()*choices.length)];cars.push(car);car.cells.forEach(p=>used.add(key(p)));
  }
  if(cars.length!==lengths.length)continue;
  const easy=free(cars).length,dirs=new Set(cars.map(c=>P.direction(c).join())).size,chain=depth(cars);
  // A few immediate exits, several dependencies, and short readable chains.
  const score=-Math.abs(easy-4)*9+dirs*4-Math.max(0,chain-4)*12;
  if(score>bestScore){best=cars;bestScore=score;}
 }
 if(!best){ // Packed horizontal rows are a guaranteed solvable fallback.
  best=[];let x=0,y=0;for(const length of lengths){if(x+length>W){x=0;y++;}best.push({id:best.length,cells:cells([x,y,0],length)});x+=length;}
 }
 const order=solve(best);return order.map((id,i)=>({id:i,cells:best.find(c=>c.id===id).cells}));
}
function reachable(cars,garage,length){
 const used=occupied(cars),rows=[garage*2,garage*2+1],queue=[],seen=new Set(),out=[];
 const valid=p=>cells(p,length).every(q=>inside(q)?!used.has(key(q)):p[2]===0&&rows.includes(p[1])&&q[0]>=W&&q[0]<W+length);
 const add=(pose,path)=>{const k=pose.join();if(seen.has(k)||!valid(pose))return;seen.add(k);queue.push({pose,path:[...path,pose]});};
 rows.forEach(y=>add([W,y,0],[]));
 for(let index=0;index<queue.length;index++){
  const {pose,path}=queue[index],[x,y,d]=pose,[dx,dy]=DIRS[d],body=cells(pose,length);
  if(body.every(inside)){
   out.push({cells:body,entry:path.map(p=>cells(p,length))});
   for(const nd of [(d+1)%4,(d+3)%4]){
    const next=[x,y,nd],sweep=[...body,...cells(next,length)],xs=sweep.map(p=>p[0]),ys=sweep.map(p=>p[1]);let clear=true;
    for(let sy=Math.min(...ys);sy<=Math.max(...ys);sy++)for(let sx=Math.min(...xs);sx<=Math.max(...xs);sx++)if(!inside([sx,sy])||used.has(key([sx,sy])))clear=false;
    if(clear)add(next,path);
   }
  }
  add([x+dx,y+dy,d],path);add([x-dx,y-dy,d],path);
 }
 return out;
}
function plan(cars,garage,lengths,seed){
 if(lengths.reduce((n,l)=>n+l,0)>W*H-cars.reduce((n,c)=>n+c.cells.length,0))return null;
 const used=occupied(cars);if([garage*2,garage*2+1].every(y=>used.has(key([W-1,y]))))return null;
 const random=rng(seed),oldFree=new Set(free(cars)),nextId=Math.max(-1,...cars.map(c=>c.id))+1;
 function straightFallback(){
  const batch=[];
  for(let i=0;i<lengths.length;i++){
   const choices=reachable([...cars,...batch],garage,lengths[i]).filter(c=>P.direction(c).join()==='-1,0'&&c.cells.every(([,y])=>y===garage*2||y===garage*2+1));
   choices.sort((a,b)=>a.cells.at(-1)[0]-b.cells.at(-1)[0]||a.cells.at(-1)[1]-b.cells.at(-1)[1]);
   const choice=choices.find(c=>solve([...cars,...batch,{...c,id:nextId+i}]));if(!choice)return null;
   batch.push({...choice,id:nextId+i});
  }
  return batch;
 }
 function score(batch){
  const all=[...cars,...batch],available=free(all),easy=batch.filter(c=>available.includes(c.id)).length;
  const newlyBlocked=[...oldFree].filter(id=>!available.includes(id)).length;
  const dirs=new Set(batch.map(c=>P.direction(c).join())).size;
  return -newlyBlocked*150-Math.abs(easy-Math.min(2,batch.length))*15+dirs*5-batch.reduce((n,c)=>n+c.entry.length,0)*.8;
 }
 let beam=[{batch:[],score:0}];
 for(let i=0;i<lengths.length;i++){
  const next=[];
  for(const candidate of beam){
   const all=[...cars,...candidate.batch],choices=reachable(all,garage,lengths[i]);
   for(const choice of choices){
    const car={...choice,id:nextId+i},batch=[...candidate.batch,car];
    if(!solve([...cars,...batch]))continue;
    next.push({batch,score:score(batch)+random()*4});
   }
  }
  if(!next.length)return straightFallback();
  next.sort((a,b)=>b.score-a.score);beam=next.slice(0,4);
 }
 const viable=beam.filter(p=>p.batch.some(c=>free([...cars,...p.batch]).includes(c.id)));
 return (viable[0]||beam[0]).batch;
}
const api={initial,plan,reachable};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SandYardParking=api;
})(globalThis);
