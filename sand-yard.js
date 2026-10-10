/* Unified sand campaign: original pictures and truck fleet, depot transport rules. */
(function(root){
'use strict';
const Sand=typeof module!=='undefined'&&module.exports?require('./sand-trucks-sand.js'):root.SandTruckSand;
const Parking=typeof module!=='undefined'&&module.exports?require('./arrow-escape.js'):root.ArrowEscape;
const YardParking=typeof module!=='undefined'&&module.exports?require('./sand-yard-parking.js'):root.SandYardParking;
const Campaign=typeof module!=='undefined'&&module.exports?require('./sand-trucks.js'):root.SandTrucks;
const COLORS=Campaign.COLORS,NAMES=Campaign.NAMES;
const ROAD_SECONDS=30,ROAD_LIMIT=3,TRUCK_SPEED=.2,TRAIN_SPEED=TRUCK_SPEED*2,DELIVERY_FLIGHT=.45,PARKING_WIDTH=6,PARKING_HEIGHT=6,PARKING_SIZE=36,GARAGE_REFILL=12,BATCH_SIZE=3;
const TRAFFIC=[
 {through:10,pattern:['collection','collection','collection','delivery'],wagons:1,cargo:64},
 {through:30,pattern:['collection','collection','delivery'],wagons:2,cargo:80},
 {through:60,pattern:['collection','collection','delivery','collection','delivery'],wagons:3,cargo:96},
 {through:100,pattern:['collection','delivery'],wagons:4,cargo:112}
];
function trafficProfile(level){return TRAFFIC.find(p=>level<=p.through)||TRAFFIC.at(-1);}
const GARAGE_RULES=[{kind:'road',required:0},{kind:'completed',required:2},{kind:'completed',required:4}];
const LEVELS=Array.from({length:Campaign.LEVELS},(_,i)=>{
 const p=Campaign.generate(i+1),palette=[...new Set(p.art.cells)].sort((a,b)=>a-b);
 return{title:p.art.title,palette,colors:palette.length,laps:i<2?2:3,fleet:p.arrows.map(a=>({color:a.color,capacity:a.capacity,length:a.cells.length}))};
});
function picture(level){return Campaign.picture(level);}
function truckSpec(level,id,length,color){
 const fleet=LEVELS[level-1].fleet,matching=fleet.filter(a=>a.length===length&&a.color===color),pool=matching.length?matching:fleet.filter(a=>a.length===length);
 const source=pool[id%pool.length];
 return{capacity:source.capacity,type:length===3?'long':'short',color};
}
function create(level=1,seed){
 level=Math.max(1,Math.min(LEVELS.length,Math.floor(level)||1));
 const art=picture(level),palette=LEVELS[level-1].palette;
 const garages=Array.from({length:3},(_,id)=>({id,refill:0,batch:0}));
 const s={level,art,grains:art.cells.slice(),motion:Sand.create(art.cells.length),tick:0,clock:0,
  apron:[],garages,nextId:9,rng:seed===undefined?level*7919:seed>>>0,staged:[],trucks:[],train:null,phase:'road',roadRemaining:ROAD_SECONDS,departures:0,cycle:1,moves:0,completedTrucks:0,collected:0,added:0,deliveryRuns:0,incoming:[],events:[],history:[],dirty:false};
 // The opening yard covers every campaign color, distributed across garages.
 const colors=Array.from({length:9},(_,i)=>palette[i%palette.length]);shuffle(s,colors);
 const initialLengths=garages.map(()=>randomLengths(s));
 if(initialLengths.flat().every(n=>n===3))initialLengths[2][2]=2;
 s.apron=YardParking.initial(initialLengths.flat(),Math.floor(random(s)*0x100000000)).map(car=>({...car,...truckSpec(level,car.id,car.cells.length,colors[car.id])}));
 for(const g of garages){g.previous=stockSignature(s.apron.slice(g.id*3,g.id*3+3).map(c=>({length:c.cells.length,color:c.color})));g.stock=generateStock(s,g);}
 return s;
}
function progress(saved,legacy){
 const current=saved&&saved.version===1? saved:null,source=current||legacy||{};
 const clean=value=>Array.isArray(value)?[...new Set(value.filter(n=>Number.isInteger(n)&&n>=1&&n<=LEVELS.length))].sort((a,b)=>a-b):[];
 const best={};if(current?.best&&typeof current.best==='object')for(const [key,value]of Object.entries(current.best))if(Number.isInteger(Number(key))&&Number(key)>=1&&Number(key)<=LEVELS.length&&Number.isFinite(value)&&value>0)best[key]=value;
 return{version:1,level:Number.isInteger(source.level)&&source.level>=1&&source.level<=LEVELS.length?source.level:1,best,completed:clean(source.completed)};
}
function snapshot(s){const data={};for(const k of ['level','grains','tick','clock','apron','garages','nextId','rng','staged','trucks','train','phase','roadRemaining','departures','cycle','moves','completedTrucks','collected','added','deliveryRuns','incoming'])data[k]=JSON.parse(JSON.stringify(s[k]));data.motion=Sand.snapshot(s.motion);return data;}
function remember(s){s.history.push(snapshot(s));if(s.history.length>30)s.history.shift();}
function undo(s){if(!s.history.length)return false;const history=s.history,old=history.pop();Object.assign(s,old,{art:picture(old.level),motion:Sand.restore(old.grains.length,old.motion,old.grains),history,events:[],dirty:true});return true;}
function count(s,color){return s.grains.reduce((n,c)=>n+(c===color),0);}
function parkingPuzzle(cars){return{width:PARKING_WIDTH,height:PARKING_HEIGHT,arrows:cars};}
function direction(car){return Parking.direction(car);}
function exitRay(car){return Parking.ray(car,PARKING_WIDTH,PARKING_HEIGHT);}
function blockers(s,car){const ids=Parking.blockers(parkingPuzzle(s.apron),s.apron.map(c=>c.id),car.id);return ids.map(id=>s.apron.find(c=>c.id===id));}
function parkingSolution(cars){return Parking.solve(parkingPuzzle(cars));}
function garageBlockers(s,g){return s.apron.filter(c=>c.cells.some(([x,y])=>x>=PARKING_WIDTH-3&&Math.floor(y/2)===g.id));}
function unlocked(s,g){return s.completedTrucks>=GARAGE_RULES[g.id].required;}
function parkingBays(s){return s.apron.map(c=>({cells:c.cells}));}
const garagePlans=new WeakMap();
function garagePlan(s,g){
 const key=JSON.stringify([s.apron.map(c=>[c.id,c.cells]),s.garages.map(g=>g.stock.map(c=>c.length)),s.rng]);
 let cached=garagePlans.get(s);if(!cached||cached.key!==key){cached={key,plans:new Map()};garagePlans.set(s,cached);}
 if(!cached.plans.has(g.id))cached.plans.set(g.id,YardParking.plan(s.apron,g.id,g.stock.map(c=>c.length),(s.rng^Math.imul(g.id+1,7919))>>>0));
 return cached.plans.get(g.id);
}
function garagePreview(s,g){return g.stock[0].color;}
function garageView(s,g){
 const rule=GARAGE_RULES[g.id],open=!!garagePlan(s,g),enabled=unlocked(s,g);
 return{id:g.id,kind:rule.kind,required:rule.required,completed:Math.min(s.completedTrucks,rule.required),unlocked:enabled,open,remaining:BATCH_SIZE,previewColor:garagePreview(s,g),refill:g.refill,ready:g.refill<=0,canOpen:enabled&&open&&g.refill<=0&&s.phase==='road'&&!won(s)};
}
function available(s){return s.apron.filter(c=>!blockers(s,c).length);}
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
function shuffle(s,items){for(let i=items.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
function randomLengths(s){
 const lengths=Array.from({length:BATCH_SIZE},()=>random(s)<.5?2:3);
 // Keep both rows useful while allowing seven different model combinations.
 if(lengths.every(n=>n===2))lengths[Math.floor(random(s)*lengths.length)]=3;
 return lengths;
}
function stockSignature(stock){return stock.map(c=>`${c.color}:${c.length}`).sort().join('|');}
function generateStock(s,g){
 const palette=LEVELS[s.level-1].palette,counts=palette.map(color=>count(s,color));
 const useful=palette.filter((_,i)=>counts[i]>0),pool=useful.length?useful:palette;
 const weights=pool.map(color=>Math.sqrt(counts[palette.indexOf(color)]||1)),total=weights.reduce((a,b)=>a+b,0);
 const pick=()=>{let n=random(s)*total;for(let i=0;i<pool.length;i++){n-=weights[i];if(n<0)return pool[i];}return pool.at(-1);};
 const avoid=new Set([g.previous,...s.garages.filter(other=>other!==g&&other.stock).map(other=>stockSignature(other.stock))]);
 let stock;
 for(let attempt=0;attempt<24;attempt++){
  stock=randomLengths(s).map(length=>({length,color:pick()}));
  if(!avoid.has(stockSignature(stock)))break;
 }
 return stock;
}
function openGarage(s,id){
 const g=s.garages.find(g=>g.id===id);if(!g||!garageView(s,g).canOpen)return false;remember(s);
 const stock=g.stock,batch=garagePlan(s,g).map((car,i)=>({...car,id:s.nextId+i}));
 batch.forEach((car,i)=>s.apron.push({...car,...truckSpec(s.level,car.id,car.cells.length,stock[i].color)}));s.nextId+=batch.length;
 g.previous=stockSignature(stock);g.stock=generateStock(s,g);
 g.batch++;g.refill=GARAGE_REFILL;return true;
}
function beginRail(s){if(s.phase==='closing'&&!s.trucks.length)startTrain(s);}
// Loaded trucks finish their visible trip but release a collection slot at once.
function collectingTrucks(s){return s.trucks.filter(t=>t.loaded<t.capacity);}
function dispatchTruck(s,id){
 const collecting=collectingTrucks(s);
 if(s.phase!=='road'||collecting.length>=ROAD_LIMIT||won(s))return false;
 const car=available(s).find(c=>c.id===id);if(!car)return false;remember(s);
 s.apron=s.apron.filter(c=>c.id!==id);
 s.trucks.push({...car,loaded:0,p:-.12-collecting.length*.18,credit:0});s.moves++;s.departures++;
 return true;
}
function nextTrainKind(s){const {pattern}=trafficProfile(s.level);return pattern[(s.cycle-1)%pattern.length];}
function deliveryManifest(s){
 const {wagons,cargo}=trafficProfile(s.level),palette=LEVELS[s.level-1].palette;
 // Ease the final cleanup without cancelling regular trains or changing their
 // size. A shipment can add at most a tenth of the sand still on the board.
 const remaining=s.grains.reduce((n,c)=>n+(c>=0),0),budget=Math.min(wagons*cargo,Math.floor(remaining*.1));
 return Array.from({length:wagons},(_,i)=>({color:palette[(s.level+s.deliveryRuns*wagons+i)%palette.length],loaded:Math.floor(budget/wagons)+(i<budget%wagons?1:0),capacity:cargo}));
}
function setWagon(s,index,color){
 if(s.phase!=='road'||nextTrainKind(s)==='delivery'||!Number.isInteger(index)||index<0||index>Math.min(s.staged.length,2)||!Number.isInteger(color)||!LEVELS[s.level-1].palette.includes(color)||!count(s,color)||won(s)||s.staged[index]?.color===color)return false;
 remember(s);s.staged[index]={color,loaded:0,capacity:360};return true;
}
function removeWagon(s,index){if(s.phase!=='road'||nextTrainKind(s)==='delivery'||!Number.isInteger(index)||index<0||index>=s.staged.length||won(s))return false;remember(s);s.staged.splice(index,1);return true;}
function couple(s,color){return setWagon(s,s.staged.length,color);}
function uncouple(s){if(s.phase!=='road'||nextTrainKind(s)==='delivery'||!s.staged.length)return false;remember(s);s.staged.pop();return true;}
// Automatic departure is never held for an empty consist. Assembly locks at zero.
function startTrain(s){
 const kind=nextTrainKind(s),delivery=kind==='delivery';
 s.train={kind,p:delivery?1.14:-.14,wagons:delivery?deliveryManifest(s):s.staged.map(w=>({...w})),credit:0,lap:1,laps:delivery?1:LEVELS[s.level-1].laps};
 if(delivery)s.deliveryRuns++;else s.staged=[];
 s.phase='rail';s.moves++;
}
function trainDirection(train){return train.kind==='delivery'?-1:1;}
function wagonPosition(train,index){return train.p-trainDirection(train)*index*.18;}
function completeTruck(s,t){if(t.loaded>=t.capacity&&!t.completed){t.completed=true;s.completedTrucks++;}}
function returnTruck(s,t){completeTruck(s,t);s.trucks=s.trucks.filter(a=>a!==t);beginRail(s);}
function finishRail(s){s.train=null;s.phase='road';s.roadRemaining=ROAD_SECONDS;s.departures=0;s.cycle++;}
function recall(s,kind='trucks'){if(kind!=='trucks'||!s.trucks.length||!['road','closing'].includes(s.phase)||won(s))return false;remember(s);for(const t of [...s.trucks])returnTruck(s,t);return true;}
function pickup(s,unit,x,radius,amount){
 if(x<0||x>1||unit.loaded>=unit.capacity)return;
 const w=s.art.width,start=(s.art.height-1)*w,available=[];
 for(let col=0;col<w;col++)if(s.grains[start+col]===unit.color&&Math.abs((col+.5)/w-x)<=radius)available.push(col);
 available.sort((a,b)=>Math.abs((a+.5)/w-x)-Math.abs((b+.5)/w-x));
 for(const col of available.slice(0,Math.min(amount,unit.capacity-unit.loaded))){const i=start+col;s.grains[i]=-1;Sand.clear(s.motion,i);unit.loaded++;s.collected++;s.dirty=true;if(s.events.length<140)s.events.push({x:(col+.5)/w,color:unit.color,kind:unit.id!==undefined?'truck':'train'});}
 if(unit.id!==undefined)completeTruck(s,unit);
}
// Reserve exposed empty cells before launching grains from the moving wagon.
// The board receives them only at the end of the visible flight.
function unload(s,unit,x,radius,amount,wagon){
 if(x<0||x>1||unit.loaded<=0)return;
 const w=s.art.width,reserved=new Set(s.incoming.map(p=>p.cell)),available=[];
 for(let col=0;col<w;col++){
  if(Math.abs((col+.5)/w-x)>radius)continue;
  for(let row=0;row<s.art.height&&s.grains[row*w+col]<0;row++){
   const cell=row*w+col;if(!reserved.has(cell))available.push(cell);
  }
 }
 available.sort((a,b)=>Math.floor(b/w)-Math.floor(a/w)||Math.abs((a%w+.5)/w-x)-Math.abs((b%w+.5)/w-x));
 for(const cell of available.slice(0,Math.min(amount,unit.loaded))){
  unit.loaded--;
  const flight={cell,x:(cell%w+.5)/w,y:(Math.floor(cell/w)+.5)/s.art.height,color:unit.color,originX:x,age:0,wagon};
  s.incoming.push(flight);
  if(s.events.length<140)s.events.push({...flight,kind:'delivery'});
 }
}
function landDeliveries(s,dt){
 const pending=[];
 for(const p of s.incoming){
  p.age+=dt;if(p.age<DELIVERY_FLIGHT){pending.push(p);continue;}
  let cell=p.cell;
  // Falling neighbours can occupy a reserved cell. Use the exposed surface of
  // the same column, or return the grain to its wagon if that column is full.
  if(s.grains[cell]>=0){
   const col=cell%s.art.width;cell=-1;
   for(let row=0;row<s.art.height&&s.grains[row*s.art.width+col]<0;row++)cell=row*s.art.width+col;
  }
  if(cell<0){s.train.wagons[p.wagon].loaded++;continue;}
  s.grains[cell]=p.color;Sand.clear(s.motion,cell);
  const view=Sand.visual(s.motion,s.art,s.grains);view.x[cell]=cell%s.art.width;view.y[cell]=Math.floor(cell/s.art.width);
  s.added++;s.dirty=true;
 }
 s.incoming=pending;
}
function won(s){return !s.incoming.length&&s.collected===s.grains.length+s.added&&!(s.train?.kind==='delivery'&&s.train.wagons.some(w=>w.loaded>0));}
function simulate(s){
 const dt=1/120;
 landDeliveries(s,dt);
 for(const g of s.garages)g.refill=Math.max(0,g.refill-dt);
 if(s.phase==='road'){s.roadRemaining=Math.max(0,s.roadRemaining-dt);if(s.roadRemaining<1e-7){s.roadRemaining=0;s.phase='closing';beginRail(s);}}
 if(s.dirty)s.dirty=Sand.step(s.art,s.grains,s.motion,s.tick,dt)>0;s.tick++;
 for(const t of [...s.trucks]){
  t.p+=dt*TRUCK_SPEED;t.credit+=dt;
  if(t.credit>=.025){t.credit=0;pickup(s,t,t.p,.095,8);}
  if(t.p>1.15){if(s.phase==='closing'||t.loaded>=t.capacity||!count(s,t.color))returnTruck(s,t);else t.p=-.12;}
 }
 if(s.train){const train=s.train;const direction=trainDirection(train);train.p+=direction*dt*TRAIN_SPEED;train.credit+=dt;
  if(train.credit>=.025){train.credit=0;train.wagons.forEach((w,i)=>(train.kind==='delivery'?unload:pickup)(s,w,wagonPosition(train,i),.085,9,i));}
  const tail= train.wagons.length?wagonPosition(train,train.wagons.length-1):train.p+direction*.15;
  if(!s.incoming.length&&(direction>0?tail>1.15:tail<-.15)){if(train.lap<train.laps){train.lap++;train.p=direction>0?-.14:1.14;}else finishRail(s);}
 }
}
function step(s,seconds){s.events=[];if(won(s))return;s.clock+=Math.min(.08,Math.max(0,seconds));while(s.clock>=1/120){s.clock-=1/120;simulate(s);if(won(s))break;}}
const api={COLORS,NAMES,LEVELS,ROAD_SECONDS,ROAD_LIMIT,TRUCK_SPEED,TRAIN_SPEED,DELIVERY_FLIGHT,trafficProfile,PARKING_SIZE,PARKING_WIDTH,PARKING_HEIGHT,GARAGE_REFILL,BATCH_SIZE,GARAGE_RULES,parkingBays,create,picture,progress,snapshot,undo,count,unlocked,garageView,garagePreview,blockers,direction,exitRay,parkingSolution,garageBlockers,openGarage,available,nextTrainKind,deliveryManifest,trainDirection,wagonPosition,dispatchTruck,collectingTrucks,setWagon,removeWagon,couple,uncouple,recall,step,won};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SandYard=api;
})(globalThis);
