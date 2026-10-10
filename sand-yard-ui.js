(() => {
'use strict';
const G=SandYard,$=q=>document.querySelector(q),C=G.COLORS;
const canvas=$('#scene'),ctx=canvas.getContext('2d'),sandCanvas=document.createElement('canvas');
sandCanvas.width=840;sandCanvas.height=504;
const sandArt=SandTruckSandArt.create(sandCanvas,C),sandContext=sandCanvas.getContext('2d');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const KEY='sanddepot.v1',NS='http://www.w3.org/2000/svg';
function newGame(level=1){return G.create(level,Math.floor(Math.random()*0x100000000));}
let state=newGame(),last=0,particles=[],wonShown=false,uiKey='',best={},completed=[],selectedWagon=null,sceneHeight=280,hintUntil=0,levelPage=0;
const arrivals=new Map(),gateAnimations=new Map(),roadCars=new Map();
function readSaved(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
try{
 const stored=readSaved(KEY),legacy=readSaved('sandtrucks.v1');
 const progress=G.progress(stored,legacy);best=progress.best;completed=progress.completed;state=newGame(progress.level);
}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,level:state.level,best,completed}));}catch{}}
function svg(tag,attrs={}){const el=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);return el;}
function truckIcon(car){
 const length=car.cells.length*28,el=svg('svg',{viewBox:`${-length/2} -14 ${length} 28`,'aria-hidden':'true'}),rotation=svg('g',{transform:'rotate(90)'});
 rotation.append(SandTruckArt.create(car,28));el.append(rotation);return el;
}
function paintRoadTrucks(dt,y){
 const layer=$('#roadTrucks');
 for(const [id,g]of roadCars)if(!state.trucks.some(t=>t.id===id)){g.remove();roadCars.delete(id);}
 for(const car of state.trucks){
  let g=roadCars.get(car.id);
  if(!g){g=svg('g');g.append(SandTruckArt.create(car,28));layer.append(g);roadCars.set(car.id,g);}
  g.setAttribute('transform',`translate(${26+car.p*408} ${y}) rotate(90) scale(.85)`);
  SandTruckArt.update(g.firstElementChild,90,car.loaded/car.capacity,reducedMotion.matches?0:dt);
 }
}
function icon(kind,color,fill=0){
 const c=C[color],cargo=fill?`<rect x="10" y="10" width="${(kind==='truck'?29:46)*fill}" height="12" rx="2" fill="${c}"/><path d="M12 12h${Math.max(0,(kind==='truck'?25:42)*fill)}" stroke="#fff6"/>`:'';
 return `<svg viewBox="0 0 68 34" aria-hidden="true"><ellipse cx="34" cy="28" rx="29" ry="5" fill="#315c3529"/><g fill="#36534c" stroke="#1e403e" stroke-width=".5"><rect x="9" y="1" width="10" height="5" rx="2"/><rect x="45" y="1" width="10" height="5" rx="2"/><rect x="9" y="27" width="10" height="5" rx="2"/><rect x="45" y="27" width="10" height="5" rx="2"/></g><rect x="5" y="5" width="56" height="23" rx="5" fill="${c}" stroke="#345f4b" stroke-width=".8"/><path d="M9 26H57" stroke="#345c4733" stroke-width="3"/><path d="M10 6H56" stroke="#fff9" stroke-width="1.5"/>${kind==='truck'?'<path d="M45 5V28" stroke="#33584566"/><rect x="49" y="8" width="8" height="16" rx="2" fill="#345f60"/><path d="M50 9V22" stroke="#80bbb6" stroke-width="1.3"/><path d="M59 9V13M59 20V24" stroke="#fff2c4" stroke-width="2"/>':'<path d="M1 16H5M61 16H67" stroke="#64766b" stroke-width="3"/>'}<rect x="9" y="8" width="${kind==='truck'?31:48}" height="16" rx="3" fill="#24443a33" stroke="#fff0bd" stroke-width="1.2"/>${cargo}</svg>`;
}
function message(text){$('#notice').textContent=text;}
function hint(text){$('#parkingHint').textContent=text;hintUntil=state.tick+480;message(text);}
function act(fn,text){if(!fn())return false;if(text)message(text);renderControls(true);return true;}
function closePicker(focus=false){const index=selectedWagon;selectedWagon=null;$('#colorPicker').hidden=true;$('#composition').querySelectorAll('.active').forEach(b=>b.classList.remove('active'));if(focus&&index!==null)$('#composition').children[Math.min(index,2)]?.focus();}
function showPicker(index){
 if(state.phase!=='road'||G.nextTrainKind(state)==='delivery'||G.won(state))return;
 selectedWagon=Math.min(index,state.staged.length);$('#colorPicker').hidden=false;$('#pickerTitle').textContent=`Вагон ${selectedWagon+1} · цвет песка`;
 $('#composition').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===selectedWagon));
 const palette=$('#wagonPalette');palette.replaceChildren();
 for(const color of G.LEVELS[state.level-1].palette){
  const b=document.createElement('button');b.className='color-choice';b.innerHTML=icon('wagon',color,1)+`<span>${G.NAMES[color]}</span>`;b.disabled=!G.count(state,color);b.setAttribute('aria-label',`Выбрать цвет: ${G.NAMES[color]}`);
  b.onclick=()=>{const index=selectedWagon;if(state.staged[index]?.color===color){closePicker(true);return;}if(G.setWagon(state,index,color)){closePicker();renderControls(true);$('#composition').children[index]?.focus();message(`Вагон ${index+1}: ${G.NAMES[color]}.`);}};palette.append(b);
 }
 $('#removeWagon').hidden=selectedWagon>=state.staged.length;palette.querySelector('button:not(:disabled)')?.focus();
}
function clearFeedback(){const parking=$('#parking');parking.querySelectorAll('.hit,.obstacle').forEach(b=>b.classList.remove('hit','obstacle'));}
function cancelAnimations(){for(const animation of [...arrivals.values(),...gateAnimations.values()])animation.cancel();arrivals.clear();gateAnimations.clear();}
function animateBatch(garage,ids){
 if(reducedMotion.matches)return;
 const gate=$('#garages').children[garage.id],parking=$('#parking'),cellW=parking.clientWidth/G.PARKING_WIDTH,cellH=parking.clientHeight/G.PARKING_HEIGHT;
 let delay=100;
  for(const id of ids){
  const car=state.apron.find(c=>c.id===id),button=parking.querySelector(`[data-car="${id}"]`);if(!button||!car.entry)continue;
  const center=body=>[body.reduce((n,p)=>n+p[0]+.5,0)/body.length,body.reduce((n,p)=>n+p[1]+.5,0)/body.length];
  const final=center(car.cells),dir=G.direction(car),finalAngle=Math.atan2(dir[1],dir[0])*180/Math.PI;
  let previous=180;
  const frames=car.entry.map(body=>{
   const c=center(body),head=body.at(-1),neck=body.at(-2);let angle=Math.atan2(head[1]-neck[1],head[0]-neck[0])*180/Math.PI;
   while(angle-previous>180)angle-=360;while(angle-previous<-180)angle+=360;previous=angle;
   return{transform:`translate(${(c[0]-final[0])*cellW}px,${(c[1]-final[1])*cellH}px) rotate(${angle-finalAngle}deg)`};
  });
  const duration=Math.max(550,Math.min(1500,frames.length*115)),animation=button.animate(frames,{duration,delay,fill:'backwards',easing:'linear'});
  arrivals.set(id,animation);button.disabled=true;animation.onfinish=()=>{arrivals.delete(id);renderControls(true);};delay+=duration+80;
 }
 gate.classList.add('releasing');
 const opening=gate.querySelector('.shutter').animate([{transform:'translateX(0)'},{transform:'translateX(100%)',offset:.06},{transform:'translateX(100%)',offset:.94},{transform:'translateX(0)'}],{duration:delay+150,easing:'ease-in-out'});
 gateAnimations.set(garage.id,opening);opening.onfinish=()=>{gate.classList.remove('releasing');gateAnimations.delete(garage.id);};
}
function animateDeparture(button,car){
 if(reducedMotion.matches)return;
 const ghost=button.cloneNode(true);ghost.classList.add('departing');ghost.removeAttribute('data-car');ghost.setAttribute('aria-hidden','true');ghost.tabIndex=-1;ghost.disabled=true;$('#parking').append(ghost);
 const [dx,dy]=G.direction(car),distance=$('#parking').clientWidth;
 const animation=ghost.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${dx*distance}px,${dy*distance}px)`,opacity:0}],{duration:350,easing:'ease-in'});animation.onfinish=()=>ghost.remove();
}
const lockIcon='<svg viewBox="0 0 20 22" aria-hidden="true"><path d="M5 9V6a5 5 0 0 1 10 0v3M4 9h12v11H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="10" cy="14" r="1.5" fill="currentColor"/></svg>';
function buildGarages(){
 $('#garages').replaceChildren();
 for(const g of state.garages){
  const rule=G.GARAGE_RULES[g.id],b=document.createElement('button');b.className='garage';b.dataset.kind=rule.kind;
  b.innerHTML=`<span class="garage-drive" aria-hidden="true"></span><span class="garage-roof">${['А','Б','В'][g.id]}<span class="garage-rule">${rule.required?'✓ '+rule.required:''}</span><i class="garage-lamp"></i></span><span class="garage-bay"><span class="shutter"></span><span class="garage-preview"></span><span class="garage-lock">${lockIcon}<b></b></span><span class="garage-progress"></span></span><span class="garage-status"></span>`;
  b.onclick=()=>{
   const view=G.garageView(state,g);clearFeedback();
   if(!view.unlocked){const left=view.required-view.completed;hint(`Гараж ${['А','Б','В'][g.id]} · заполни ещё ${left} ${left===1?'самосвал':'самосвала'} до краёв`);return;}
   if(!view.ready){hint(`Гараж ${['А','Б','В'][g.id]} пополняется · ${Math.ceil(g.refill)} с`);return;}
   if(!view.open){G.garageBlockers(state,g).forEach(c=>$('#parking').querySelector(`[data-car="${c.id}"]`)?.classList.add('obstacle'));hint('Освободи въезд или место для трёх машин');return;}
   const firstId=state.nextId;if(act(()=>G.openGarage(state,g.id),'Новая партия в депо.')){animateBatch(g,state.apron.filter(c=>c.id>=firstId).map(c=>c.id));hint('Новая партия занимает свободные места');}
  };$('#garages').append(b);
 }
}
function renderControls(force=false){
 const key=JSON.stringify([state.apron,state.garages.map(g=>[Math.ceil(g.refill),g.batch,G.garageView(state,g).canOpen]),state.staged,state.trucks.map(t=>t.id),state.completedTrucks,state.phase,state.cycle,state.deliveryRuns,state.phase==='road'&&G.nextTrainKind(state)==='delivery'?Math.floor((state.grains.length+state.added-state.collected)*.1):null,state.train?.lap,state.history.length,G.won(state)]);
 if(!force&&key===uiKey)return;uiKey=key;
 if(state.phase!=='road'||G.nextTrainKind(state)==='delivery'||G.won(state))closePicker();
 const canDrive=state.phase==='road'&&G.collectingTrucks(state).length<G.ROAD_LIMIT&&!G.won(state);
 state.garages.forEach((g,i)=>{
  const view=G.garageView(state,g),button=$('#garages').children[i],mode=!view.unlocked?'locked':!view.ready?'refill':!view.open?'blocked':view.canOpen?'ready':'waiting';button.dataset.mode=mode;button.disabled=G.won(state);
  const status=mode==='locked'?`Полных ${view.completed}/${view.required}`:mode==='refill'?`${Math.ceil(g.refill)} с`:mode==='blocked'?'Въезд занят':mode==='ready'?'Выпустить':'Ждём поезд';
  button.querySelector('.garage-status').textContent=status;button.querySelector('.garage-lock b').textContent=`${view.completed}/${view.required}`;
  button.querySelector('.garage-preview').innerHTML=view.ready?`<i style="--preview:${C[view.previewColor]}"></i><span>?</span><span>?</span>`:`<span>↻ ${Math.ceil(g.refill)} с</span>`;
  button.setAttribute('aria-label',`Гараж ${['А','Б','В'][g.id]}. ${view.kind==='road'?'Открывается при свободном проезде':`Разблокируется после ${view.required} полных самосвалов`}. ${status}. ${view.unlocked&&view.ready?`В партии есть самосвал цвета «${G.NAMES[view.previewColor]}», цвета двух других машин скрыты.`:''}`);
 });
 const parking=$('#parking'),existing=new Map([...parking.querySelectorAll('.parking-car[data-car]')].map(b=>[Number(b.dataset.car),b]));
 for(const [id,b] of existing)if(!state.apron.some(c=>c.id===id))b.remove();
 for(const car of state.apron){
  let button=existing.get(car.id);const [dx,dy]=G.direction(car),angle=Math.atan2(dy,dx)*180/Math.PI,dir=dx>0?'вправо':dx<0?'влево':dy>0?'вниз':'вверх';
  const xs=car.cells.map(p=>p[0]),ys=car.cells.map(p=>p[1]);
  if(!button){button=document.createElement('button');button.className='parking-car';button.dataset.car=car.id;button.append(truckIcon(car));parking.append(button);}
  button.style.left=`${Math.min(...xs)/G.PARKING_WIDTH*100}%`;button.style.top=`${Math.min(...ys)/G.PARKING_HEIGHT*100}%`;button.style.width=`${(dx?car.cells.length:1)/G.PARKING_WIDTH*100}%`;button.style.height=`${(dy?car.cells.length:1)/G.PARKING_HEIGHT*100}%`;
  button.style.setProperty('--angle',`${angle}deg`);button.style.setProperty('--length',car.cells.length);button.classList.toggle('vertical',!!dy);button.dataset.direction=dir;button.disabled=!canDrive||arrivals.has(car.id);button.setAttribute('aria-label',`${G.NAMES[car.color]}, ${car.type==='long'?'длинный':'короткий'} самосвал. Вместимость ${car.capacity}. Выезд ${dir}`);
  button.onclick=()=>{
   clearFeedback();const blocking=G.blockers(state,car);
   if(blocking.length){button.classList.add('hit');blocking.forEach(c=>parking.querySelector(`[data-car="${c.id}"]`)?.classList.add('obstacle'));hint(`Путь ${dir} занят — убери выделенные машины`);return;}
   if(G.dispatchTruck(state,car.id)){animateDeparture(button,car);renderControls(true);hint(G.collectingTrucks(state).length===G.ROAD_LIMIT?'Три машины собирают песок · полная освободит место':'Выбирай машины со свободным выездом');}
  };
 }
 const delivery=state.train?state.train.kind==='delivery':G.nextTrainKind(state)==='delivery',wagons=state.train?.wagons||(delivery?G.deliveryManifest(state):state.staged);
 const composition=$('#composition'),slots=delivery?wagons.length:3;
 composition.style.setProperty('--wagon-count',slots);
 while(composition.children.length>slots)composition.lastElementChild.remove();
 for(let i=0;i<slots;i++){
  let b=composition.children[i];if(!b){b=document.createElement('button');b.className='wagon-slot';composition.append(b);}
  const w=wagons[i];b.className='wagon-slot'+(w?' filled':'')+(selectedWagon===i?' active':'');
  b.innerHTML=(w?icon('wagon',w.color,delivery?w.loaded/w.capacity:0):`<span class="empty-wagon">${icon('wagon',2)}<span class="plus">+</span></span>`)+`<span class="wagon-label">${w?G.NAMES[w.color]:'Цвет'}</span><span class="slot-index">${i+1}</span>`+(w?`<span class="cargo-bar" style="--cargo:${C[w.color]};--fill:${100*w.loaded/w.capacity}%"><i></i></span>`:'');
  b.disabled=state.phase!=='road'||delivery||G.won(state);b.setAttribute('aria-label',w?`${delivery?'Груз доставки':'Вагон'} ${i+1}: ${G.NAMES[w.color]}${delivery?'':'. Изменить цвет'}`:`Добавить вагон ${i+1}`);b.onclick=()=>showPicker(i);
 }
 $('.train-dock').dataset.kind=delivery?'delivery':'collection';
 $('#trainTitle').textContent=delivery?'Поезд с песком':'Поезд за песком';
 $('#trainCaption').textContent=delivery?(state.phase==='rail'?'Добавляет песок в картину':`${wagons.length} ${wagons.length===1?'вагон':'вагона'} · песка ${wagons.reduce((n,w)=>n+w.loaded,0)}`):state.phase==='rail'?(wagons.length?'Вагоны собирают свой цвет':'Пустой рейс · подготовь вагоны заранее'):state.phase==='closing'?(wagons.length?'Цвета выбраны · ждём машины':'Без вагонов · пустой рейс'):wagons.length?`${wagons.length} из 3 готовы · поедет сам`:'Выбери цвета вагонов';
 $('#recallTrucks').disabled=!state.trucks.length||G.won(state);$('#undo').disabled=!state.history.length;
}
function renderLive(){
 $('#completedTrucks').textContent=state.completedTrucks;
 if(state.tick>hintUntil){const text=state.phase!=='road'?'Поезд в работе · парковка ждёт':G.collectingTrucks(state).length===G.ROAD_LIMIT?'Все места сбора заняты · ждём заполнения':state.garages.some(g=>G.garageView(state,g).canOpen)?'Проезд свободен · открой гараж':'Машины выезжают вперёд · освободи путь';if($('#parkingHint').textContent!==text)$('#parkingHint').textContent=text;}
 const delivery=state.train?state.train.kind==='delivery':G.nextTrainKind(state)==='delivery',seconds=Math.ceil(Math.max(0,state.roadRemaining-1e-7)),dock=$('.train-dock');
 const time=G.won(state)?'Готово':state.phase==='road'?`00:${String(seconds).padStart(2,'0')}`:state.phase==='closing'?'···':delivery?'← ×2':`${state.train.lap}/${state.train.laps}`;
 $('#railClock').textContent=time;$('#railClock').setAttribute('aria-label',state.phase==='road'?`До ${delivery?'доставки':'перекрытия'} ${seconds} секунд`:delivery?'Идёт доставка песка':`Круг ${state.train?.lap||0}`);
 $('#trainState').textContent=state.phase==='road'?'до перекрытия':state.phase==='closing'?'ждём машины':delivery?'выгрузка':'круг · скорость ×2';dock.dataset.phase=state.phase;dock.dataset.urgent=String(state.phase==='road'&&seconds<=5);
 if(state.phase==='road'&&!delivery&&!state.staged.length)$('#trainCaption').textContent=seconds<=5?'Нет вагонов — уедет пустым':'Выбери цвета вагонов';
 state.garages.forEach((g,i)=>$('#garages').children[i].style.setProperty('--refill',`${g.refill>0?(1-g.refill/G.GARAGE_REFILL)*100:0}%`));
 const collecting=G.collectingTrucks(state),slots=$('#roadSlots');for(let i=0;i<G.ROAD_LIMIT;i++){let slot=slots.children[i];if(!slot){slot=document.createElement('span');slots.append(slot);}const t=collecting[i];slot.className='road-slot'+(t?' loaded':'');slot.style.setProperty('--cargo',t?C[t.color]:'transparent');slot.style.setProperty('--fill',t?`${100*t.loaded/t.capacity}%`:'0%');slot.title=t?`${G.NAMES[t.color]} · ${Math.floor(100*t.loaded/t.capacity)}% кузова`:'Свободное место';}
 $('#truckCount').textContent=`Машины ${collecting.length}/${G.ROAD_LIMIT}`;$('.road-status').classList.toggle('full',G.collectingTrucks(state).length===G.ROAD_LIMIT);
 const wagons=state.train?.wagons; if(wagons)wagons.forEach((w,i)=>{const bar=$('#composition').children[i]?.querySelector('.cargo-bar');if(bar)bar.style.setProperty('--fill',`${100*w.loaded/w.capacity}%`);});
}
function rr(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function drawWagon(x,y,w,index){ctx.save();ctx.translate(x,y);for(const dx of [-22,13]){rr(dx,-13,8,5,1,'#294a42');rr(dx,9,8,5,1,'#294a42');}rr(-27,-10,54,21,4,C[w.color],'#527157');rr(-23,-7,46,15,3,'#31564477','#fff0bb');rr(-22,-6,44*w.loaded/w.capacity,13,2,C[w.color]);ctx.font='bold 9px sans-serif';ctx.fillStyle='#fff9db';ctx.textAlign='center';ctx.fillText(String(index+1),0,4);ctx.restore();}
function drawTrain(train,y){
 const direction=G.trainDirection(train),x=26+(train.p+direction*.15)*408;
 if(train.wagons.length){ctx.strokeStyle='#758c71';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(26+G.wagonPosition(train,train.wagons.length-1)*408,y);ctx.stroke();}
 train.wagons.forEach((w,i)=>drawWagon(26+G.wagonPosition(train,i)*408,y,w,i));ctx.save();ctx.translate(x,y);ctx.scale(direction,1);
 rr(-22,-11,42,23,5,train.kind==='delivery'?'#de8765':'#e9c365','#fff2c4');rr(4,-8,10,17,3,'#345e5e');rr(5,-7,2,13,1,'#81b6ad');rr(-17,-7,18,15,3,'#537d62');for(let j=0;j<3;j++)rr(-14+j*5,-5,2,11,1,'#dce0b3');ctx.restore();
}
function draw(dt){
 const h=sceneHeight,artY=20,artH=Math.max(30,h-96),roadY=h-46,railY=h-15;
 ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,460,h);rr(0,0,460,h,0,'#cbd9c3');
 rr(19,artY-7,422,artH+16,10,'#94ae96');rr(22,artY-4,416,artH+9,8,'#f7eccc');rr(26,artY,408,artH,4,'#507b70');
 sandContext.clearRect(0,0,840,504);sandArt.draw(state.art,state.grains,state.motion,dt);ctx.drawImage(sandCanvas,26,artY,408,artH);
 rr(0,roadY-15,460,30,0,'#9eafa0');ctx.setLineDash([10,12]);ctx.strokeStyle='#ebedcf';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,roadY);ctx.lineTo(460,roadY);ctx.stroke();ctx.setLineDash([]);
 for(let x=0;x<460;x+=17)rr(x,railY-13,5,25,1,'#839e79');for(const y of [railY-8,railY+8]){ctx.strokeStyle='#ecedcc';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(460,y);ctx.stroke();ctx.strokeStyle='#6c8975';ctx.lineWidth=1;ctx.stroke();}
 for(const p of particles){p.age+=dt;const t=Math.min(1,p.age/.25),x=26+p.x*408,y=artY+artH+(p.kind==='truck'?roadY-artY-artH:railY-artY-artH)*t*t;
  ctx.fillStyle=C[p.color];ctx.globalAlpha=1-t*.25;ctx.fillRect(x,y,2.5,3);
 }ctx.globalAlpha=1;particles=particles.filter(p=>p.age<.25);
 paintRoadTrucks(dt,roadY);if(state.train)drawTrain(state.train,railY);
 // Direct, upward transfer: each grain leaves a wagon and lands in its reserved cell.
 for(const p of state.incoming){
  const t=Math.min(1,p.age/G.DELIVERY_FLIGHT),sx=26+p.originX*408,sy=railY-5,ex=26+p.x*408,ey=artY+p.y*artH;
  const bend=(p.x-p.originX)*100+(p.cell%3-1)*9;
  const point=u=>[sx+(ex-sx)*u+Math.sin(Math.PI*u)*bend,sy+(ey-sy)*u];
  const [x,y]=point(t),[tx,ty]=point(Math.max(0,t-.11));
  ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(x,y);ctx.lineWidth=2.5;ctx.strokeStyle=C[p.color];ctx.globalAlpha=.4;ctx.stroke();ctx.globalAlpha=1;
  rr(x-1.8,y-1.8,3.6,3.6,1,C[p.color]);
 }
 ctx.save();ctx.translate(12,roadY+12);ctx.rotate(state.phase==='road'?-Math.PI/2:0);rr(-3,-26,6,28,2,'#f8edc2');for(let y=-24;y<0;y+=8)rr(-3,y,6,4,0,'#d97f61');ctx.restore();rr(8,roadY+9,8,8,3,'#5c7a64');
}
function resize(){
 const yard=$('.yard'),status=$('.yard-status'),hintBox=$('#parkingHint');
 const gap=parseFloat(getComputedStyle(yard).gap)||0;
 const allowance=gap*2+(parseFloat(getComputedStyle(hintBox).marginTop)||0)+5;
 const spare=yard.clientHeight-status.offsetHeight-hintBox.offsetHeight-allowance;
 const world=$('.yard-world'),worldGap=parseFloat(getComputedStyle(world).columnGap)||0;
 const size=Math.max(130,Math.floor(Math.min(yard.clientWidth-(parseFloat(getComputedStyle(world).getPropertyValue('--gate-width'))||56)-worldGap,spare)));yard.style.setProperty('--lot-size',`${size}px`);
 const width=canvas.clientWidth,height=canvas.clientHeight;if(width>0&&height>0){sceneHeight=height/width*460;canvas.width=920;canvas.height=Math.round(sceneHeight*2);$('#roadTrucks').setAttribute('viewBox',`0 0 460 ${sceneHeight}`);draw(0);}
}
function load(level){cancelAnimations();closePicker();$('#parking').replaceChildren();state=newGame(level);$('#roadTrucks').replaceChildren();roadCars.clear();particles=[];wonShown=false;uiKey='';$('#victory').hidden=true;$('#levelButton').textContent=`КАРТИНА ${String(state.level).padStart(2,'0')} / ${G.LEVELS.length} ⌄`;$('#levelButton').setAttribute('aria-label',`Выбрать картину. ${state.level}: ${state.art.title}`);canvas.setAttribute('aria-label',`${state.art.title}. Песочная картина, автомобильная дорога и общий железнодорожный путь`);document.querySelectorAll('dialog[open]').forEach(d=>d.close());buildGarages();hint('Выбирай машины со свободным выездом');save();renderControls(true);renderLive();resize();}
$('#undo').onclick=()=>{if(G.undo(state)){cancelAnimations();closePicker();$('#parking').replaceChildren();$('#roadTrucks').replaceChildren();roadCars.clear();wonShown=false;$('#victory').hidden=true;particles=[];buildGarages();hint('Ход отменён');renderControls(true);renderLive();draw(0);}};
$('#recallTrucks').onclick=()=>{if(act(()=>G.recall(state),'Машины ушли на обслуживание.'))hint('Дорога свободна · можно отправлять новые машины');};
const TRAIN_GUIDE_KEY='sanddepot.train-guide.v1';
function showTrainGuide(){
 closePicker();const delivery=state.train?state.train.kind==='delivery':G.nextTrainKind(state)==='delivery';
 $('#trainGuideEyebrow').textContent=delivery?'ПОЕЗД С ПЕСКОМ':'ПОЕЗД ЗА ПЕСКОМ';
 $('#trainGuideTitle').textContent=delivery?'Доставка песка':'Выбери цвета вагонов';
 $('#trainGuidePurpose').innerHTML=delivery?'Этот поезд <b>добавляет песок</b> в свободные клетки картины. Цвета и число вагонов заданы — выбирать их не нужно.':'Каждый вагон забирает из картины <b>только свой цвет</b>. Подготовь до трёх вагонов — одинаковые цвета тоже можно.';
 $('#trainGuideDeparture').innerHTML='Когда таймер дойдёт до нуля, дорога перекроется. Поезд отправится <b>сам, как только уедут машины</b>.';
 $('#trainGuideWarning').textContent=delivery?'Освобождай картину самосвалами до приезда поезда.':'Без вагонов поезд уедет пустым.';
 $('#trainExample').classList.toggle('delivery-example',delivery);
 const exampleColors=delivery?(state.train?.wagons||G.deliveryManifest(state)).map(w=>w.color):G.LEVELS[state.level-1].palette.slice(0,3);
 $('#trainExample').innerHTML=exampleColors.map(c=>`<span><i style="--sand:${C[c]}"></i>${icon('wagon',c,.55)}</span>`).join('');
 $('#startTrainSetup').textContent=state.phase==='road'&&!delivery?(state.staged.length?'К выбору вагонов':'Выбрать первый цвет'):'Понятно';$('#trainGuide').showModal();
}
$('#trainHelp').onclick=showTrainGuide;
$('#closeTrainGuide').onclick=()=>$('#trainGuide').close();
$('#trainGuide').addEventListener('close',()=>{try{localStorage.setItem(TRAIN_GUIDE_KEY,'seen');}catch{}last=0;});
$('#startTrainSetup').onclick=()=>{$('#trainGuide').close();showPicker(Math.min(state.staged.length,2));};
$('#help').onclick=()=>{closePicker();$('#rules').showModal();};$('#next').onclick=()=>load(state.level%G.LEVELS.length+1);
$('#closePicker').onclick=()=>closePicker(true);$('#removeWagon').onclick=()=>{if(G.removeWagon(state,selectedWagon)){closePicker();renderControls(true);}};
function levels(page=Math.floor((state.level-1)/10)){
 closePicker();levelPage=Math.max(0,Math.min(Math.ceil(G.LEVELS.length/10)-1,page));
 const first=levelPage*10,last=Math.min(G.LEVELS.length,first+10);$('#levelsRange').textContent=`${first+1}–${last} из ${G.LEVELS.length}`;
 $('#levelsPrev').disabled=first===0;$('#levelsNext').disabled=last===G.LEVELS.length;
 const grid=$('#levels');grid.replaceChildren();
 for(let i=first;i<last;i++){
  const button=document.createElement('button');button.className='level-card';button.classList.toggle('done',completed.includes(i+1));button.classList.toggle('current',state.level===i+1);
  button.setAttribute('aria-label',`Картина ${i+1}: ${G.LEVELS[i].title}${completed.includes(i+1)?'. Собрана':''}`);
  const preview=document.createElement('canvas'),art=G.picture(i+1);preview.width=art.width;preview.height=art.height;preview.setAttribute('aria-hidden','true');const context=preview.getContext('2d');
  art.cells.forEach((color,index)=>{context.fillStyle=C[color];context.fillRect(index%art.width,Math.floor(index/art.width),1,1);});
  const title=document.createElement('span');title.textContent=`${String(i+1).padStart(2,'0')}. ${art.title}${completed.includes(i+1)?' ✓':''}`;
  button.append(preview,title);button.onclick=()=>load(i+1);grid.append(button);
 }
 if(!$('#levelsDialog').open)$('#levelsDialog').showModal();
}
$('#levelButton').onclick=()=>levels();$('#levelsPrev').onclick=()=>levels(levelPage-1);$('#levelsNext').onclick=()=>levels(levelPage+1);
$('#closeLevels').onclick=()=>$('#levelsDialog').close();$('#restartLevel').onclick=()=>load(state.level);
document.addEventListener('pointerdown',e=>{if(selectedWagon!==null&&!e.target.closest('.train-dock'))closePicker();});
document.addEventListener('keydown',e=>{if(selectedWagon===null)return;if(e.key==='Escape'){e.preventDefault();closePicker(true);}else if(e.key==='Tab'){const focusable=[...$('#colorPicker').querySelectorAll('button:not(:disabled)')].filter(b=>!b.hidden);const index=focusable.indexOf(document.activeElement);if(e.shiftKey&&index<=0){e.preventDefault();focusable.at(-1)?.focus();}else if(!e.shiftKey&&index===focusable.length-1){e.preventDefault();focusable[0]?.focus();}}});
$('#rules').addEventListener('click',e=>{if(e.target===$('#rules')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
function frame(now){
 const dt=last?Math.min(.05,(now-last)/1000):0;last=now;const paused=document.hidden||!!document.querySelector('dialog[open]');
 for(const animation of [...arrivals.values(),...gateAnimations.values()]){if(paused&&animation.playState==='running')animation.pause();else if(!paused&&animation.playState==='paused')animation.play();}
 if(!paused){G.step(state,dt);particles.push(...state.events.filter(p=>p.kind!=='delivery').map(p=>({...p,age:0})));if(particles.length>200)particles=particles.slice(-200);draw(dt);renderControls();renderLive();
  if(G.won(state)&&!wonShown){wonShown=true;closePicker();const previous=best[state.level];best[state.level]=Math.min(Number.isFinite(previous)?previous:Infinity,state.moves);if(!completed.includes(state.level))completed.push(state.level);completed.sort((a,b)=>a-b);save();$('#result').textContent=`${state.moves} отправлений · лучший результат ${best[state.level]}`;$('#next').textContent=state.level===G.LEVELS.length?'К первой картине →':'Следующая картина →';$('#victory').hidden=false;}
 }requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{last=0;});const observer=new ResizeObserver(resize);observer.observe($('.yard'));observer.observe($('.scene-wrap'));load(state.level);let guideSeen=false;try{guideSeen=localStorage.getItem(TRAIN_GUIDE_KEY)==='seen';}catch{}if(!guideSeen)showTrainGuide();requestAnimationFrame(frame);
})();
