const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../sand-yard.js');
function advance(s,seconds){for(let i=0;i<seconds*60;i++)G.step(s,1/60);}
function conservation(s){assert.equal(s.collected+s.grains.filter(c=>c>=0).length,s.grains.length+s.added);const cars=[...s.apron,...s.trucks];const ids=cars.map(c=>c.id);assert.equal(new Set(ids).size,ids.length);assert.ok(ids.every(id=>id<s.nextId));const cells=s.apron.flatMap(c=>c.cells);assert.ok(cells.length<=G.PARKING_SIZE);assert.equal(new Set(cells.map(p=>p.join(','))).size,cells.length);assert.ok(cells.every(([x,y])=>x>=0&&x<G.PARKING_WIDTH&&y>=0&&y<G.PARKING_HEIGHT));assert.ok(G.parkingSolution(s.apron));}
function planDelivery(s){s.cycle=G.trafficProfile(s.level).pattern.indexOf('delivery')+1;return s;}
function deliveryCargo(s){const p=G.trafficProfile(s.level);return p.wagons*p.cargo;}
function clearYard(s){while(s.apron.length){if(s.trucks.length===G.ROAD_LIMIT)G.recall(s);assert.ok(G.dispatchTruck(s,G.available(s)[0].id));}G.recall(s);}
test('the shared lot mixes directions, simple exits and genuine blocking chains',()=>{
 for(let seed=1;seed<=12;seed++){
  const s=G.create(1,seed),free=G.available(s);assert.ok(free.length>=2&&free.length<=5);assert.ok(new Set(s.apron.map(c=>G.direction(c).join())).size>=3);
  const blocked=s.apron.find(c=>G.blockers(s,c).length),before=G.snapshot(s);assert.ok(blocked);assert.equal(G.dispatchTruck(s,blocked.id),false);assert.deepEqual(G.snapshot(s),before);
  assert.ok(G.dispatchTruck(s,free[0].id));conservation(s);
 }
});
test('garages use reachable free space without requiring their whole old lane to be empty',()=>{
 const s=G.create(1,123);s.apron=[{id:0,color:1,cells:[[1,0],[0,0]],capacity:168,type:'short'}];
 const old=JSON.parse(JSON.stringify(s.apron[0]));assert.ok(G.garageView(s,s.garages[0]).canOpen);assert.ok(G.openGarage(s,0));
 assert.equal(s.apron.length,4);assert.deepEqual(s.apron[0],old);assert.ok(G.available(s).some(c=>c.id===0));conservation(s);
});
function checkEntry(car,previous,garage){
 const occupied=new Set(previous.flatMap(c=>c.cells.map(p=>p.join())));assert.ok(car.entry.length>1);assert.deepEqual(car.entry.at(-1),car.cells);
 assert.ok(car.entry[0].every(([x,y])=>x>=G.PARKING_WIDTH&&[garage*2,garage*2+1].includes(y)));
 for(let i=0;i<car.entry.length;i++){
  const body=car.entry[i];assert.equal(body.length,car.cells.length);assert.ok(body.every(([x,y])=>y>=0&&y<6&&x>=0&&x<9&&!occupied.has([x,y].join())));
  if(!i)continue;const a=car.entry[i-1],da=G.direction({cells:a}),db=G.direction({cells:body});
  if(da.join()!==db.join()){
   const sweep=[...a,...body],xs=sweep.map(p=>p[0]),ys=sweep.map(p=>p[1]);
   for(let y=Math.min(...ys);y<=Math.max(...ys);y++)for(let x=Math.min(...xs);x<=Math.max(...xs);x++)assert.ok(x>=0&&x<6&&y>=0&&y<6&&!occupied.has([x,y].join()));
  }else assert.equal(Math.abs(a.at(-1)[0]-body.at(-1)[0])+Math.abs(a.at(-1)[1]-body.at(-1)[1]),1);
 }
}
test('repeated parties enter the shared lot along collision-free routes and retain simple moves',()=>{
 const s=G.create();s.completedTrucks=4;const layouts=new Set(),colors=new Set(),directions=new Set();
 for(let batch=0;batch<18;batch++){
  clearYard(s);advance(s,G.GARAGE_REFILL+.1);while(s.phase!=='road')advance(s,1);
  const g=s.garages[batch%3];assert.ok(G.openGarage(s,g.id));assert.equal(s.apron.length,3);const previous=[];
  for(const car of s.apron){checkEntry(car,previous,g.id);previous.push(car);directions.add(G.direction(car).join());}
  assert.ok(G.available(s).length>=1);assert.deepEqual(G.parkingBays(s).map(b=>b.cells),s.apron.map(c=>c.cells));
  layouts.add(JSON.stringify(s.apron.map(c=>c.cells)));colors.add(s.apron.map(c=>c.color).join());conservation(s);
 }
 assert.ok(layouts.size>6);assert.ok(colors.size>6);assert.ok(directions.size>=3);
});
test('new parties preserve existing easy exits when open parking space is available',()=>{
 for(let seed=1;seed<=12;seed++){
  const s=G.create(1,seed);s.apron=[{id:0,color:1,cells:[[1,5],[0,5]],capacity:168,type:'short'}];const old=s.apron[0];
  assert.ok(G.openGarage(s,0));assert.ok(G.available(s).some(c=>c.id===old.id));const previous=[old];
  for(const car of s.apron.slice(1)){checkEntry(car,previous,0);previous.push(car);}conservation(s);
 }
});
test('undo restores fixed bays, colors, batches and refill time without rerolling',()=>{
 const s=G.create();clearYard(s);const before=G.snapshot(s);
 G.openGarage(s,0);const after=G.snapshot(s);advance(s,2);G.undo(s);assert.deepEqual(G.snapshot(s),before);
 G.openGarage(s,0);assert.deepEqual(G.snapshot(s),after);assert.equal(G.openGarage(s,0),false);conservation(s);
});
test('garage releases lock during railway phases and refill; serviced cars leave the yard',()=>{
 const s=G.create();clearYard(s);assert.equal(s.trucks.length,0);assert.equal(s.apron.length,0);
 s.phase='closing';assert.equal(G.openGarage(s,0),false);s.phase='rail';assert.equal(G.openGarage(s,0),false);s.phase='road';
 s.garages[0].refill=1;assert.equal(G.openGarage(s,0),false);advance(s,1.1);assert.ok(G.openGarage(s,0));
 assert.equal(G.openGarage(s,55),false);conservation(s);
});
test('partially occupied lots stay solvable after any available garage refills',()=>{
 for(let level=1;level<=5;level++){
  const s=G.create(level);s.completedTrucks=4;let refills=0;
  for(let turn=0;turn<60;turn++){
   for(const g of s.garages){g.refill=0;if(G.garageView(s,g).canOpen){assert.ok(G.openGarage(s,g.id));refills++;conservation(s);}}
   const free=G.available(s);assert.ok(free.length);G.dispatchTruck(s,free[(turn+level)%free.length].id);G.recall(s);conservation(s);
  }
  assert.ok(refills>5);
 }
});
test('closure is timed, independent of dispatch count; an unprepared train departs empty',()=>{
 const s=G.create();for(let i=0;i<6;i++){G.dispatchTruck(s,G.available(s)[0].id);G.recall(s);}
 assert.equal(s.phase,'road');assert.equal(s.roadRemaining,G.ROAD_SECONDS);
 advance(s,G.ROAD_SECONDS-.1);assert.equal(s.phase,'road');advance(s,.1);
 assert.equal(s.phase,'rail');assert.equal(s.roadRemaining,0);assert.deepEqual(s.train.wagons,[]);assert.equal(s.staged.length,0);
 const collected=s.collected;advance(s,10);assert.equal(s.phase,'road');assert.equal(s.cycle,2);assert.equal(s.collected,collected);assert.ok(s.roadRemaining>20);conservation(s);
});
test('preparation is available before zero, freezes on closure, and departure waits for clearance',()=>{
 const s=G.create();G.couple(s,1);G.couple(s,2);advance(s,29.5);G.dispatchTruck(s,0);advance(s,.6);
 assert.equal(s.phase,'closing');assert.equal(G.couple(s,2),false);assert.equal(G.uncouple(s),false);assert.equal(G.dispatchTruck(s,1),false);assert.equal(s.train,null);
 advance(s,7);assert.equal(s.phase,'rail');assert.equal(s.trucks.length,0);assert.deepEqual(s.train.wagons.map(w=>w.color),[1,2]);assert.equal(s.staged.length,0);assert.equal(G.couple(s,2),false);conservation(s);
});
test('preparation permits duplicate colors, enforces capacity, and supports removing last wagon',()=>{
 const s=G.create();assert.equal(G.couple(s,7),false);assert.equal(G.couple(s,-1),false);assert.equal(G.couple(s,1.2),false);assert.ok(G.couple(s,1));assert.ok(G.couple(s,1));assert.ok(G.couple(s,2));assert.equal(G.couple(s,2),false);G.uncouple(s);assert.deepEqual(s.staged.map(w=>w.color),[1,1]);advance(s,G.ROAD_SECONDS);assert.equal(G.recall(s,'train'),false);assert.equal(G.couple(s,2),false);
});
test('train physically travels twice as fast as trucks',()=>{
 const road=G.create();G.dispatchTruck(road,0);const truckStart=road.trucks[0].p;advance(road,.5);const truckDistance=road.trucks[0].p-truckStart;
 const rail=G.create();G.couple(rail,1);advance(rail,G.ROAD_SECONDS);const trainStart=rail.train.p;advance(rail,.5);const trainDistance=rail.train.p-trainStart;
 assert.ok(Math.abs(trainDistance-truckDistance*2)<1e-8);assert.equal(G.TRAIN_SPEED,G.TRUCK_SPEED*2);
});
for(const level of [1,3])test(`automatic train makes exactly ${level===1?2:3} laps, preserving cargo until departure`,()=>{
 const s=G.create(level);G.couple(s,1);G.couple(s,2);advance(s,G.ROAD_SECONDS);const expected=G.LEVELS[level-1].laps;let lastLap=1,changes=0,previous=[0,0];
 for(let i=0;i<1400&&s.train;i++){G.step(s,1/60);if(s.train){assert.equal(s.phase,'rail');if(s.train.lap!==lastLap){changes++;lastLap=s.train.lap;}s.train.wagons.forEach((w,j)=>{assert.ok(w.loaded<=w.capacity&&w.loaded>=previous[j]);previous[j]=w.loaded;});}else assert.equal(changes,expected-1);}
 assert.equal(s.train,null);assert.equal(s.phase,'road');assert.ok(s.roadRemaining>G.ROAD_SECONDS-.1);assert.equal(s.cycle,2);assert.ok(G.dispatchTruck(s,G.available(s)[0].id));conservation(s);
});
test('undo restores the countdown, consist, phase and moving trucks',()=>{
 const s=G.create();advance(s,10);const before=G.snapshot(s);G.couple(s,1);advance(s,5);G.undo(s);assert.deepEqual(G.snapshot(s),before);
 advance(s,19.5);G.dispatchTruck(s,0);advance(s,.6);const closing=G.snapshot(s);G.recall(s);assert.equal(s.phase,'rail');G.undo(s);assert.deepEqual(G.snapshot(s),closing);
});
test('empty trips repeat without input and never remove sand',()=>{
 const s=G.create();advance(s,90);assert.ok(s.cycle>=3);assert.equal(s.collected,0);assert.deepEqual(s.grains,s.art.cells);assert.equal(s.staged.length,0);conservation(s);
});
test('only the selected wagon color is collected',()=>{
 const s=G.create();G.couple(s,2);s.grains.fill(1);s.art.cells.fill(1);advance(s,39);assert.equal(s.collected,0);conservation(s);
});
for(const level of [1,2,3,10,30,50,100])test(`level ${level} clears with prepared trains and timed closures`,()=>{
 const s=G.create(level);let actions=0,trainTrips=0;
 while(!G.won(s)&&actions++<600){
  if(s.phase==='road'){
   const edge=s.grains.slice(-s.art.width),score=c=>edge.filter(v=>v===c).length;
   if(G.nextTrainKind(s)==='collection'){
    const colors=G.COLORS.map((_,color)=>({color,count:G.count(s,color),edge:score(color)})).filter(v=>v.count>0).sort((a,b)=>b.edge-a.edge||b.count-a.count);
    const exposed=colors.filter(c=>c.edge>0),choices=exposed.length?exposed:colors;
    for(let i=0;i<3;i++){const color=choices[i%choices.length].color;if(s.staged[i]?.color!==color)assert.ok(G.setWagon(s,i,color));}
   }
   const cars=G.available(s).sort((a,b)=>score(b.color)-score(a.color));
   const collecting=G.collectingTrucks(s);
   if(collecting.length===G.ROAD_LIMIT&&cars.length&&score(cars[0].color)>0&&collecting.every(t=>score(t.color)===0))G.recall(s);
   if(G.collectingTrucks(s).length<G.ROAD_LIMIT&&cars.length)assert.ok(G.dispatchTruck(s,cars[0].id));for(const g of s.garages)if(G.garageView(s,g).canOpen)G.openGarage(s,g.id);advance(s,3);
  }else if(s.phase==='closing'){advance(s,8);}else{trainTrips++;advance(s,14);}
  conservation(s);
 }
 assert.ok(G.won(s),`remaining: ${s.grains.filter(c=>c>=0).length}; phase: ${s.phase}`);assert.ok(trainTrips>0);
});

test('deliveries repeat beyond two trips with a gradual campaign schedule and larger consists',()=>{
 let lastFrequency=0,lastCargo=0;
 for(let level=1;level<=100;level++){
  const s=G.create(level),p=G.trafficProfile(level),frequency=p.pattern.filter(k=>k==='delivery').length/p.pattern.length;
  assert.ok(frequency>=lastFrequency&&frequency<=.5);assert.ok(deliveryCargo(s)>=lastCargo);lastFrequency=frequency;lastCargo=deliveryCargo(s);
  for(let cycle=1;cycle<=p.pattern.length*8;cycle++){s.cycle=cycle;s.deliveryRuns=20;assert.equal(G.nextTrainKind(s),p.pattern[(cycle-1)%p.pattern.length]);}
  assert.equal(G.deliveryManifest(s).length,p.wagons);assert.ok(G.deliveryManifest(s).every(w=>w.loaded===p.cargo&&w.capacity===p.cargo&&G.LEVELS[level-1].palette.includes(w.color)));
 }
 for(const [level,pattern,wagons,cargo]of [[1,'CCCD',1,64],[10,'CCCD',1,64],[11,'CCD',2,80],[30,'CCD',2,80],[31,'CCDCD',3,96],[60,'CCDCD',3,96],[61,'CD',4,112],[100,'CD',4,112]]){
  const p=G.trafficProfile(level);assert.equal(p.pattern.map(k=>k==='delivery'?'D':'C').join(''),pattern);assert.equal(p.wagons,wagons);assert.equal(p.cargo,cargo);
 }
 const s=G.create(61);s.deliveryRuns=2;planDelivery(s);assert.equal(G.couple(s,G.LEVELS[60].palette[0]),false);
 const manifest=G.deliveryManifest(s);advance(s,30);assert.equal(s.train.kind,'delivery');assert.deepEqual(s.train.wagons,manifest);advance(s,5);
 assert.equal(s.deliveryRuns,3);assert.equal(G.nextTrainKind(s),'collection');s.cycle=6;advance(s,30);assert.equal(s.train.kind,'delivery');advance(s,5);assert.equal(s.deliveryRuns,4);conservation(s);
});
test('delivery fills empty cells with its own cargo and conserves all sand',()=>{
 const s=G.create();planDelivery(s);s.grains.fill(-1,0,512);s.collected=512;const before=s.grains.filter(c=>c>=0).length;const counts=G.COLORS.map((_,c)=>G.count(s,c));const manifest=G.deliveryManifest(s);advance(s,G.ROAD_SECONDS);advance(s,5);
 assert.equal(s.train,null);assert.equal(s.added,deliveryCargo(s));assert.equal(s.collected,512);assert.equal(s.grains.filter(c=>c>=0).length,before+s.added);
 for(let c=0;c<G.COLORS.length;c++)assert.equal(G.count(s,c),counts[c]+manifest.filter(w=>w.color===c).reduce((n,w)=>n+w.loaded,0));conservation(s);
});
for(const level of [11,31,61])test(`level ${level} unloads every wagon of its larger regular delivery`,()=>{
 const s=G.create(level);planDelivery(s);s.grains.fill(-1,0,512);s.collected=512;
 const manifest=G.deliveryManifest(s),cargo=manifest.reduce((n,w)=>n+w.loaded,0);advance(s,30);
 assert.deepEqual(s.train.wagons,manifest);advance(s,5);assert.equal(s.train,null);assert.equal(s.added,cargo);assert.equal(s.deliveryRuns,1);conservation(s);
});
test('delivery load eases near completion, remains visible before departure and stays fixed during the trip',()=>{
 for(const remaining of [0,1,9,10,100,1000]){
  const s=G.create(100);s.grains.fill(-1,0,s.grains.length-remaining);s.collected=s.grains.length-remaining;planDelivery(s);
  const manifest=G.deliveryManifest(s);assert.equal(manifest.length,4);assert.equal(manifest.reduce((n,w)=>n+w.loaded,0),Math.floor(remaining*.1));assert.ok(manifest.every(w=>w.capacity===112&&w.loaded<=w.capacity));
  if(remaining===1000){s.roadRemaining=.05;advance(s,.1);assert.deepEqual(s.train.wagons,manifest);advance(s,5);assert.equal(s.added,100);assert.equal(s.deliveryRuns,1);conservation(s);}
 }
});
test('a full picture is never overwritten; undelivered cargo leaves without blocking the next phase',()=>{
 const s=G.create();planDelivery(s);const original=s.grains.slice();advance(s,35);assert.equal(s.added,0);assert.deepEqual(s.grains,original);assert.equal(s.phase,'road');assert.equal(s.cycle,5);conservation(s);
});
test('delivery never inserts more grains than the available capacity',()=>{
 const s=G.create();planDelivery(s);s.grains.fill(-1,20,30);s.collected=10;advance(s,35);assert.equal(s.added,10);assert.equal(s.grains.filter(c=>c<0).length,0);assert.equal(s.phase,'road');conservation(s);
});
test('undo rewinds a completed delivery, its colors, timer and added sand',()=>{
 const s=G.create();planDelivery(s);s.roadRemaining=.1;s.grains.fill(-1,0,512);s.collected=512;G.dispatchTruck(s,0);const before=G.snapshot(s);G.recall(s);advance(s,5);assert.ok(s.added>0);assert.equal(s.deliveryRuns,1);G.undo(s);assert.deepEqual(G.snapshot(s),before);conservation(s);
});
test('a cleared picture wins before a future delivery, but cannot win while cargo is arriving',()=>{
 const early=G.create();planDelivery(early);early.grains.fill(-1);early.collected=early.grains.length;assert.ok(G.won(early));advance(early,35);assert.equal(early.deliveryRuns,0);
 const s=G.create();planDelivery(s);advance(s,30);s.grains.fill(-1);s.collected=s.grains.length;assert.equal(G.won(s),false);advance(s,1);assert.ok(s.added>0);assert.equal(G.won(s),false);conservation(s);
});

test('delivery runs right to left with its locomotive ahead and wagons behind, then clears the track',()=>{
 const collection=G.create();G.couple(collection,1);advance(collection,G.ROAD_SECONDS);
 const delivery=G.create();planDelivery(delivery);delivery.grains.fill(-1,0,512);delivery.collected=512;advance(delivery,G.ROAD_SECONDS);
 const left=collection.train.p,right=delivery.train.p;
 assert.equal(G.trainDirection(collection.train),1);assert.equal(G.trainDirection(delivery.train),-1);
 assert.ok(left<0&&right>1);assert.ok(G.wagonPosition(delivery.train,1)>G.wagonPosition(delivery.train,0));
 advance(collection,.5);advance(delivery,.5);
 assert.ok(collection.train.p>left);assert.ok(delivery.train.p<right);
 assert.ok(Math.abs(collection.train.p-left-(right-delivery.train.p))<1e-8);
 assert.ok(delivery.events.every(e=>e.kind!=='delivery'||e.x>.8));
 let previous=delivery.train.p;
 while(delivery.train){G.step(delivery,1/60);if(delivery.train){assert.ok(delivery.train.p<previous);previous=delivery.train.p;}}
 assert.equal(delivery.phase,'road');assert.equal(delivery.cycle,5);assert.equal(delivery.added,deliveryCargo(delivery));conservation(delivery);
});

test('garage forecast guarantees one shown color in each party, including after undo',()=>{
 for(let level=1;level<=5;level++){
  const s=G.create(level);s.completedTrucks=4;clearYard(s);
  for(let batch=0;batch<6;batch++){
   const g=s.garages[batch%3];g.refill=0;const preview=G.garageView(s,g).previewColor;const before=G.snapshot(s);
   assert.ok(G.openGarage(s,g.id));assert.ok(s.apron.some(c=>c.color===preview));const party=JSON.stringify(s.apron);
   G.undo(s);assert.deepEqual(G.snapshot(s),before);assert.equal(G.garageView(s,s.garages[g.id]).previewColor,preview);G.openGarage(s,g.id);assert.equal(JSON.stringify(s.apron),party);clearYard(s);
  }
 }
});
test('garage stocks vary independently in colors and truck types; seeds reproduce whole attempts',()=>{
 const parties=new Set(),models=new Set();let repeatedColors=0;
 const signature=stock=>stock.map(c=>`${c.color}:${c.length}`).sort().join('|');
 for(let seed=1;seed<=48;seed++){
  const s=G.create(1,seed),copy=G.create(1,seed);assert.deepEqual(G.snapshot(s),G.snapshot(copy));
  assert.deepEqual(new Set(s.apron.map(c=>c.color)),new Set(G.LEVELS[0].palette));
  const stocks=s.garages.map(g=>g.stock);assert.equal(new Set(stocks.map(signature)).size,3);
  for(const stock of stocks){
   assert.equal(stock.length,3);assert.ok(stock.every(c=>G.LEVELS[0].palette.includes(c.color)&&[2,3].includes(c.length)));
   parties.add(signature(stock));models.add(stock.map(c=>c.length).join());if(new Set(stock.map(c=>c.color)).size<3)repeatedColors++;
  }
  const before=G.snapshot(s);for(let i=0;i<10;i++)s.garages.forEach(g=>{G.garageView(s,g);G.parkingBays(s);});assert.deepEqual(G.snapshot(s),before);conservation(s);
 }
 assert.ok(parties.size>30);assert.equal(models.size,7);assert.ok(repeatedColors>50);
 assert.notDeepEqual(G.snapshot(G.create(1,1)),G.snapshot(G.create(1,2)));
});
test('new stock uses remaining sand colors without changing a previously promised preview',()=>{
 const s=G.create(1,123),g=s.garages[0],promised=JSON.parse(JSON.stringify(g.stock));clearYard(s);
 s.grains.fill(3);assert.equal(G.garagePreview(s,g),promised[0].color);assert.ok(G.openGarage(s,0));
 assert.deepEqual(s.apron.map(c=>({color:c.color,length:c.cells.length})),promised);
 assert.ok(g.stock.every(c=>c.color===3));assert.equal(G.garagePreview(s,g),3);conservation(s);
});
test('wagon slots can be edited and removed without changing other colors, with complete undo',()=>{
 const s=G.create();assert.equal(G.setWagon(s,2,1),false);assert.ok(G.setWagon(s,0,1));assert.ok(G.setWagon(s,1,2));assert.ok(G.setWagon(s,2,3));
 const before=G.snapshot(s);assert.ok(G.setWagon(s,1,1));assert.deepEqual(s.staged.map(w=>w.color),[1,1,3]);G.undo(s);assert.deepEqual(G.snapshot(s),before);
 assert.ok(G.removeWagon(s,1));assert.deepEqual(s.staged.map(w=>w.color),[1,3]);G.undo(s);assert.deepEqual(G.snapshot(s),before);
 assert.equal(G.setWagon(s,1,2),false);assert.equal(G.setWagon(s,3,1),false);assert.equal(G.removeWagon(s,-1),false);
 planDelivery(s);assert.equal(G.setWagon(s,0,2),false);assert.equal(G.removeWagon(s,0),false);s.cycle=1;advance(s,30);assert.equal(G.setWagon(s,0,2),false);assert.equal(G.removeWagon(s,0),false);conservation(s);
});

test('a blocked garage entrance waits, but a truck at the far left does not close the whole row',()=>{
 const s=G.create();s.apron=[{id:0,color:1,cells:[[1,0],[0,0]],capacity:168,type:'short'},{id:1,color:2,cells:[[5,0],[5,1]],capacity:168,type:'short'}];
 assert.deepEqual(G.garageBlockers(s,s.garages[0]).map(c=>c.id),[1]);assert.equal(G.garageView(s,s.garages[0]).open,false);assert.equal(G.openGarage(s,0),false);
 s.apron.pop();assert.ok(G.garageView(s,s.garages[0]).canOpen);assert.ok(G.openGarage(s,0));assert.ok(s.apron.some(c=>c.id===0));conservation(s);
});
test('delivery grains leave their wagon first and join the picture only after the flight',()=>{
 const s=G.create();planDelivery(s);s.grains.fill(-1,0,512);s.collected=512;advance(s,30);
 while(!s.incoming.length)G.step(s,1/120);
 assert.equal(s.added,0);assert.equal(s.grains.filter(c=>c<0).length,512);
 const first=JSON.parse(JSON.stringify(s.incoming[0]));
 assert.ok(first.originX>=0&&first.originX<=1);assert.ok(first.y>0&&first.y<1);assert.equal(s.grains[first.cell],-1);
 assert.equal(s.train.wagons.reduce((n,w)=>n+w.loaded,0)+s.incoming.length,deliveryCargo(s));
 const saved=G.snapshot(s);assert.deepEqual(saved.incoming,s.incoming);assert.notEqual(saved.incoming,s.incoming);
 let airborne=false,landed=false;
 for(let i=0;i<300;i++){
  G.step(s,1/120);if(s.incoming.length)airborne=true;if(s.added>0)landed=true;
  if(s.train)assert.equal(s.added+s.incoming.length+s.train.wagons.reduce((n,w)=>n+w.loaded,0),deliveryCargo(s));
  conservation(s);
 }
 assert.ok(airborne&&landed);advance(s,3);assert.equal(s.incoming.length,0);assert.equal(s.added,deliveryCargo(s));
});

test('unified campaign retains every original picture, its six-color palette and both truck models',()=>{
 const T=require('../sand-trucks.js');assert.equal(G.LEVELS.length,100);assert.deepEqual(G.COLORS,T.COLORS);assert.deepEqual(G.NAMES,T.NAMES);
 for(let level=1;level<=100;level++){
  const original=T.generate(level),s=G.create(level),meta=G.LEVELS[level-1];assert.deepEqual(s.art,original.art);assert.equal(meta.title,original.art.title);
  assert.deepEqual(meta.palette,[...new Set(original.art.cells)].sort((a,b)=>a-b));assert.deepEqual(new Set(s.apron.map(c=>c.cells.length)),new Set([2,3]));
  for(const car of s.apron){assert.ok(meta.palette.includes(car.color));assert.ok(original.arrows.some(a=>a.cells.length===car.cells.length&&a.capacity===car.capacity));}
  clearYard(s);assert.ok(G.openGarage(s,0));assert.equal(s.apron.length,3);assert.ok(s.apron.every(c=>[2,3].includes(c.cells.length)));conservation(s);
  for(const car of s.apron){assert.ok(meta.palette.includes(car.color));assert.ok(original.arrows.some(a=>a.cells.length===car.cells.length&&a.capacity===car.capacity));}
 }
});
test('palette gaps never create nonexistent wagon or delivery colors',()=>{
 const s=G.create(1);assert.deepEqual(G.LEVELS[0].palette,[1,2,3]);assert.equal(G.couple(s,0),false);assert.equal(G.couple(s,5),false);
 for(const color of G.LEVELS[0].palette)assert.ok(G.couple(s,color));planDelivery(s);
 assert.ok(G.deliveryManifest(s).every(w=>G.LEVELS[0].palette.includes(w.color)));
});
test('unified progress migrates original completed pictures and validates new campaign records',()=>{
 const legacy={version:5,level:75,completed:[1,2,74,74,101,-1,'3']};const migrated=G.progress(null,legacy);
 assert.deepEqual(migrated,{version:1,level:75,completed:[1,2,74],best:{}});assert.equal(legacy.level,75);
 const current=G.progress({version:1,level:100,completed:[100,1],best:{1:12,100:4,101:1,2:-1,3:'5'}},legacy);
 assert.deepEqual(current,{version:1,level:100,completed:[1,100],best:{1:12,100:4}});
 assert.equal(G.progress({version:1,level:101}).level,1);assert.deepEqual(G.progress(null,null),{version:1,level:1,best:{},completed:[]});
});

test('old sand addresses lead to one menu entry and every unified dependency is available offline',()=>{
 const fs=require('node:fs'),menu=fs.readFileSync(require.resolve('../index.html'),'utf8'),html=fs.readFileSync(require.resolve('../sand-yard.html'),'utf8'),sw=fs.readFileSync(require.resolve('../sw.js'),'utf8');
 assert.equal([...menu.matchAll(/file: 'sand-(?:yard|trucks)\.html'/g)].length,1);assert.ok(menu.includes("file: 'sand-yard.html'"));
 for(const file of ['sand-trucks.html','arrow-escape.html'])assert.match(fs.readFileSync(require.resolve('../'+file),'utf8'),/location.replace\('sand-yard.html'\)/);
 for(const file of ['sand-yard-parking.js','sand-yard.js','sand-yard-ui.js','sand-yard.css','sand-trucks-levels.js','sand-trucks.js','sand-trucks-art.js','sand-trucks-sand.js','sand-trucks-sand-art.js','sand-trucks-surface.js','arrow-escape.js']){assert.ok(html.includes(file));assert.ok(sw.includes("'./"+file+"'"));}
});

function finishOneTruck(s){
 const id=G.available(s)[0].id;assert.ok(G.dispatchTruck(s,id));const t=s.trucks.at(-1);
 s.grains=s.grains.map(c=>c<0?c:t.color);t.p=.5;t.capacity=1;advance(s,.05);assert.equal(t.loaded,1);return t;
}
test('a full truck immediately frees its collection slot while its visible departure continues',()=>{
 const s=G.create();for(const id of [0,1,2])assert.ok(G.dispatchTruck(s,id));
 assert.equal(G.collectingTrucks(s).length,3);assert.equal(G.dispatchTruck(s,3),false);
 const full=s.trucks[0];s.grains=s.grains.map(c=>c<0?c:full.color);full.p=.5;full.capacity=1;advance(s,.05);
 assert.equal(full.loaded,1);assert.equal(s.completedTrucks,1);assert.ok(s.trucks.includes(full));assert.ok(full.p<1.15);assert.equal(G.collectingTrucks(s).length,2);
 const before=G.snapshot(s);assert.ok(G.dispatchTruck(s,3));assert.equal(s.trucks.length,4);assert.equal(G.collectingTrucks(s).length,3);
 const occupied=G.snapshot(s);assert.equal(G.dispatchTruck(s,5),false);assert.deepEqual(G.snapshot(s),occupied);conservation(s);
 G.undo(s);assert.deepEqual(G.snapshot(s),before);assert.equal(G.collectingTrucks(s).length,2);assert.equal(s.completedTrucks,1);
});
test('closure waits for a departing full truck even though its collection slot is free',()=>{
 const s=G.create(),t=finishOneTruck(s);assert.equal(G.collectingTrucks(s).length,0);s.roadRemaining=.01;advance(s,.05);
 assert.equal(s.phase,'closing');assert.equal(s.train,null);assert.ok(s.trucks.includes(t));assert.equal(G.dispatchTruck(s,1),false);
 advance(s,4);assert.equal(s.trucks.length,0);assert.equal(s.phase,'rail');assert.ok(s.train);assert.equal(s.completedTrucks,1);conservation(s);
});
test('garage locks count only full trucks once; partial recalls and full wagons do not count',()=>{
 const s=G.create();assert.deepEqual(s.garages.map(g=>G.garageView(s,g).unlocked),[true,false,false]);
 assert.ok(G.dispatchTruck(s,0));s.trucks[0].p=.5;s.grains.fill(s.trucks[0].color);advance(s,.05);assert.ok(s.trucks[0].loaded>0);assert.ok(s.trucks[0].loaded<s.trucks[0].capacity);G.recall(s);assert.equal(s.completedTrucks,0);
 const t=finishOneTruck(s);assert.equal(s.completedTrucks,1);advance(s,.2);assert.equal(s.completedTrucks,1);G.recall(s);assert.equal(s.completedTrucks,1);
 finishOneTruck(s);assert.equal(s.completedTrucks,2);assert.ok(G.garageView(s,s.garages[1]).unlocked);assert.equal(G.garageView(s,s.garages[2]).unlocked,false);G.recall(s);
 finishOneTruck(s);G.recall(s);finishOneTruck(s);G.recall(s);assert.equal(s.completedTrucks,4);assert.ok(G.garageView(s,s.garages[2]).unlocked);conservation(s);
 const rail=G.create();G.couple(rail,1);advance(rail,30);rail.train.p=.5;rail.train.wagons[0].capacity=1;rail.grains.fill(1);advance(rail,.05);assert.equal(rail.train.wagons[0].loaded,1);assert.equal(rail.completedTrucks,0);conservation(rail);
});
test('progress locks are permanent thresholds, require empty bays, and undo restores their counter',()=>{
 const s=G.create();clearYard(s);const empty=G.snapshot(s);assert.equal(G.garageView(s,s.garages[1]).open,true);assert.equal(G.openGarage(s,1),false);assert.deepEqual(G.snapshot(s),empty);
 G.openGarage(s,0);finishOneTruck(s);G.recall(s);finishOneTruck(s);G.recall(s);clearYard(s);
 assert.equal(s.completedTrucks,2);const before=G.snapshot(s);assert.ok(G.openGarage(s,1));assert.equal(s.completedTrucks,2);assert.equal(G.garageView(s,s.garages[1]).unlocked,true);assert.equal(G.openGarage(s,1),false);
 G.undo(s);assert.deepEqual(G.snapshot(s),before);assert.ok(G.garageView(s,s.garages[1]).canOpen);
 const reset=G.create();G.openGarage(reset,1);assert.equal(reset.completedTrucks,0);
 const rewind=G.create();const initial=G.snapshot(rewind);finishOneTruck(rewind);assert.equal(rewind.completedTrucks,1);G.undo(rewind);assert.deepEqual(G.snapshot(rewind),initial);assert.equal(G.garageView(rewind,rewind.garages[1]).unlocked,false);
});
