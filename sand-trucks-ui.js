(function(){
  'use strict';
  const G=ArrowEscape,T=SandTrucks,$=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg',KEY='sandtrucks.v1';
  let levelPage=0;
  let saved;try{saved=JSON.parse(localStorage.getItem(KEY));}catch{}
  let state=T.restore(saved),last=0,saveClock=0,particles=[],groups=new Map(),labels=new Map(),canvas,sandArt,particleLayer,presented=false;
  if(saved&&saved.version!==T.VERSION)try{localStorage.setItem('sandtrucks.backup.v'+saved.version,JSON.stringify(saved));}catch{}
  const scene=$('#scene'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),audio=GameAudio.create({enabled:()=>state.sound}),sandAudio=SandTruckAudio.create({enabled:()=>state.sound});
  function svg(tag,attrs={}){const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}
  function rect(g,x,y,w,h,fill,r=2,attrs={}){const el=svg('rect',{x,y,width:w,height:h,rx:r,fill,...attrs});g.append(el);return el;}
  function path(g,d,attrs={}){const el=svg('path',{d,...attrs});g.append(el);return el;}
  function text(g,x,y,value,attrs={}){const el=svg('text',{x,y,...attrs});el.textContent=value;g.append(el);return el;}
  function tell(message){$('#status').textContent=message;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(T.snapshot(state)));}catch{}}
  // Enlarge the parking drawing without changing certified simulation paths.
  function parkingPose(at,amount=1){const scale=1+.08*amount;return{...at,x:210+(at.x-210)*scale,y:588+(at.y-588)*scale,scale};}
  function displayPose(a,car){
    const at=car?T.carPose(state.puzzle,car):T.parked(a);
    const amount=!car||car.phase==='queued'?1:car.phase==='depart'?Math.max(0,1-car.distance/T.departure(a).length):0;
    return parkingPose(at,amount);
  }
  function transform(group,at){group.setAttribute('transform',`translate(${at.x} ${at.y}) rotate(${at.angle}) scale(${at.scale||1})`);}
  function drawArt(dt=0){sandArt.draw(state.puzzle.art,state.grains,state.motion,dt);}
  function layoutArt(){
    if(!canvas)return;
    const matrix=scene.getScreenCTM();if(!matrix)return;
    const bounds=scene.parentElement.getBoundingClientRect(),origin=new DOMPoint(T.ART.x,T.ART.y).matrixTransform(matrix);
    canvas.style.left=`${origin.x-bounds.left}px`;canvas.style.top=`${origin.y-bounds.top}px`;
    canvas.style.width=`${T.ART.width*matrix.a}px`;canvas.style.height=`${T.ART.height*matrix.d}px`;
  }
  function update(){
    $('#sound').setAttribute('aria-pressed',String(state.sound));$('#sound').setAttribute('aria-label',state.sound?'Выключить звук':'Включить звук');$('#sound use').setAttribute('href','icons.svg?v=63#'+(state.sound?'sound':'muted'));
    const percent=Math.round(state.grains.filter(c=>c<0).length/state.grains.length*100);
    $('#roadCount').textContent=`${T.workingCount(state)} / ${T.slotLimit(state)}`;$('#roadCount').setAttribute('aria-label',`В работе ${T.workingCount(state)} из ${T.slotLimit(state)}`);
    canvas.setAttribute('aria-label',`${state.puzzle.art.title}. Собрано ${percent}% песка.`);
  }
  function build(){
    particles=[];groups.clear();labels.clear();presented=false;scene.replaceChildren();document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    rect(scene,T.ART.x-4,T.ART.y-4,T.ART.width+8,T.ART.height+8,'#e7e1c6',7);rect(scene,T.ART.x-1,T.ART.y-1,T.ART.width+2,T.ART.height+2,'#95a795',3);
    // Safari can paint a canvas inside foreignObject outside the SVG scale,
    // covering the road. Keep it in HTML and match the actual scene transform.
    canvas?.remove();canvas=document.createElement('canvas');canvas.id='sand';canvas.width=T.ART.width*2;canvas.height=T.ART.height*2;canvas.setAttribute('role','img');scene.parentElement.append(canvas);layoutArt();sandArt=SandTruckSandArt.create(canvas,T.COLORS);
    // The only visible road is the straight horizontal collection lane.
    rect(scene,-100,327,620,55,'#1c3036',0);path(scene,'M-100 327H520 M-100 382H520',{stroke:'#a9beb4','stroke-width':2});path(scene,'M-100 354H520',{stroke:'#d9dfc277','stroke-width':2,'stroke-dasharray':'11 14'});
    rect(scene,347,315,53,20,'#35564e',6);text(scene,374,329,'',{'text-anchor':'middle',id:'roadCount',class:'road-count'});
    rect(scene,22,405,376,373,'#b9c2a90b',10);
    for(let y=0;y<state.puzzle.height;y++)for(let x=0;x<state.puzzle.width;x++){const at=parkingPose({x:T.PARK.x+x*T.PARK.cell,y:T.PARK.y+y*T.PARK.cell});scene.append(svg('circle',{cx:at.x,cy:at.y,r:.9,fill:'#d2d9b724'}));}
    for(const a of state.puzzle.arrows){
      const moving=state.active.some(c=>c.id===a.id);if(!moving&&!state.remaining.includes(a.id))continue;
      const[dx,dy]=G.direction(a),dir=dx>0?'вправо':dx<0?'влево':dy>0?'вниз':'вверх';
      const group=svg('g',{class:'truck'+(moving?' moving':''),'data-id':a.id,role:'button',tabindex:moving?-1:0,'aria-label':`${T.NAMES[a.color]}, самосвал ${a.id+1}, вместимость ${a.capacity}, кабина ${dir}`});group.append(SandTruckArt.create(a,T.PARK.cell));transform(group,displayPose(a));group.onclick=()=>tap(a.id);group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tap(a.id);}};

      scene.append(group);groups.set(a.id,group);labels.set(a.id,text(scene,0,0,'',{class:'car-load','text-anchor':'middle','aria-hidden':'true'}));
    }
    particleLayer=svg('g',{'pointer-events':'none','aria-hidden':'true'});scene.append(particleLayer);
    $('#level').textContent=`Уровень ${state.puzzle.level} ▾`;
    $('#level').setAttribute('aria-label',`Выбрать уровень. Сейчас ${state.puzzle.level}: ${state.puzzle.art.title}`);
    drawArt();paintCars();update();save();tell(`Выбирай цвет снизу. В работе до ${T.slotLimit(state)} машин — оставляй место для другого цвета.`);if(T.won(state))win();else if(state.jammed)jam();
  }
  function tap(id){
    if(document.querySelector('dialog[open]'))return;const result=T.dispatch(state,id);
    if(result==='blocked'){audio.play('nope');tell('Путь перед кабиной занят. Сначала выпусти перекрывающую машину.');const g=groups.get(id);g.classList.add('blocked');setTimeout(()=>g.classList.remove('blocked'),450);return;}
    if(result==='full'){tell(`Все места в работе заняты (${T.slotLimit(state)}/${T.slotLimit(state)}). Дождись заполнения кузова.`);return;}
    if(result!=='ok')return;audio.play('tap');tell(state.active.find(c=>c.id===id)?.phase==='queued'?'Самосвал выбран и выедет следом. Место в работе зарезервировано.':'Самосвал выезжает. Он соберёт свой цвет с нижнего края.');if(document.activeElement===groups.get(id))document.activeElement.blur();drawArt();paintCars();update();save();
  }
  function paintCars(dt=0){
    for(const[id,group]of groups){
      const car=state.active.find(c=>c.id===id),a=state.puzzle.arrows[id],label=labels.get(id);
      if(!car&&!state.remaining.includes(id)){group.remove();label.remove();groups.delete(id);labels.delete(id);continue;}
      const hidden=car?.phase==='waiting',at=displayPose(a,car);transform(group,at);group.style.display=hidden?'none':'';label.style.display=hidden?'none':'';group.classList.toggle('moving',!!car);group.classList.toggle('queued',car?.phase==='queued');group.setAttribute('tabindex',car?-1:0);group.setAttribute('aria-disabled',!!car);
      SandTruckArt.update(group.firstElementChild,at.angle,car?car.loaded/a.capacity:0,reduced.matches?0:dt);
      if(car){label.textContent=(car.phase==='depart'||car.phase==='queued')?'':`${car.loaded}/${a.capacity}`;label.setAttribute('x',at.x);label.setAttribute('y',at.y+24);group.setAttribute('aria-label',`${T.NAMES[a.color]}, ${car.phase==='queued'?'выбран, ожидает выезда':car.phase==='depart'?'выезжает':car.phase==='waiting'?'ожидает въезда':'на нижней дороге'}, груз ${car.loaded} из ${a.capacity}`);}
      else{label.textContent='';label.setAttribute('x',at.x);label.setAttribute('y',at.y+3);}
    }
  }
  function paintParticles(dt,events){
    if(!reduced.matches)for(const e of events){
      if(particles.length>=120)break;const car=state.active.find(c=>c.id===e.id);if(!car||car.phase!=='road')continue;
      const pos=T.tilePosition(state.puzzle.art,e.index),target=T.carPose(state.puzzle,car),duration=.22+(e.index%5)*.008;
      const spread=((e.index*17)%11-5)*.7,el=svg('circle',{r:.6+(e.index%3)*.15,fill:T.COLORS[e.color]});
      particleLayer.append(el);particles.push({...pos,id:e.id,el,t:0,duration,vx:(target.x+T.roadSpeed(state)*duration-12+spread-pos.x)/duration,gravity:2*(target.y-pos.y)/(duration*duration)});
    }
    particles=particles.filter(e=>{e.t+=dt;const car=state.active.find(c=>c.id===e.id);if(e.t>=e.duration||!car||car.phase!=='road'){e.el.remove();return false;}e.el.setAttribute('cx',e.x+e.vx*e.t);e.el.setAttribute('cy',e.y+.5*e.gravity*e.t*e.t);return true;});
  }
  function openDialog(id){sandAudio.stop();document.querySelectorAll('dialog[open]').forEach(d=>d.close());$(id).showModal();}
  function win(){
    if(presented)return;presented=true;T.complete(state);save();audio.play('win');$('#winText').textContent=`«${state.puzzle.art.title}»: ${state.puzzle.arrows.length} самосвалов собрали весь песок.`;
    const art=state.puzzle.art,c=$('#finishedArt');c.width=art.width;c.height=art.height;const context=c.getContext('2d');art.cells.forEach((color,i)=>{context.fillStyle=T.COLORS[color];context.fillRect(i%art.width,Math.floor(i/art.width),1,1);});
    $('#next').textContent=state.puzzle.level===T.LEVELS?'Начать с первой картины':'Следующая картина →';openDialog('#winDialog');
  }
  function jam(){const colors=[...new Set(T.frontier(state.puzzle.art,state.grains).map(i=>T.NAMES[state.grains[i]]))];$('#jamText').textContent=`Все места в работе заняты, а цвета этих машин закрыты. Снизу сейчас: ${colors.join(', ')}. ${state.extraSlot?'Верни последний выезд и выбери другой цвет.':'Можно один раз за попытку добавить место для машины или вернуть последний выезд.'}`;$('#jamExtra').hidden=state.extraSlot||!state.remaining.length;$('#jamUndo').disabled=!state.history.length;save();openDialog('#jamDialog');}
  function rewind(){const r=T.undo(state);if(!r)return;audio.stop();sandAudio.stop();state=r;build();tell('Машина вернулась на парковку, песок восстановлен. Выбери другой цвет.');}
  function tick(now){
    const dt=Math.min(.05,Math.max(0,(now-(last||now))/1000));last=now;
    if(!document.querySelector('dialog[open]')&&!document.hidden){
      const before=state.active.map(c=>c.id+':'+c.phase).join('|'),working=T.workingCount(state),events=T.step(state,dt);paintCars(dt);paintParticles(dt,events);
      if(events.length||events.moved||sandArt.moving)drawArt(dt);if(events.length||before!==state.active.map(c=>c.id+':'+c.phase).join('|'))update();
      sandAudio.step(events.length,dt);if(T.workingCount(state)<working){tell('Кузов заполнен — можно выбрать следующий самосвал.');audio.play('complete');save();}
      saveClock+=dt;if(saveClock>=1){saveClock=0;if(state.active.length||state.sandMoving)save();}if(state.jammed)jam();else if(T.won(state))win();
    }requestAnimationFrame(tick);
  }
  function load(level){audio.stop();sandAudio.stop();state=T.create(level,state.sound,state.completed);build();}
  function levels(page=Math.floor((state.puzzle.level-1)/10)){levelPage=Math.max(0,Math.min(Math.ceil(T.LEVELS/10)-1,page));const first=levelPage*10+1,last=Math.min(T.LEVELS,first+9);$('#levelsTitle').textContent=`Картины · ${T.LEVELS}`;$('#levelsRange').textContent=`${first}–${last} из ${T.LEVELS}`;$('#levelsPrev').disabled=levelPage===0;$('#levelsNext').disabled=last===T.LEVELS;const grid=$('#levels');grid.replaceChildren();const unlocked=Math.min(T.LEVELS,Math.max(0,...state.completed)+1);for(let n=first;n<=last;n++){const p=T.generate(n),b=document.createElement('button');b.disabled=n>unlocked;b.className=state.completed.includes(n)?'done':'';b.innerHTML=`<strong>${String(n).padStart(2,'0')}</strong><span>${p.art.title}</span><i>${state.completed.includes(n)?'✓':n>unlocked?'◇':'→'}</i>`;b.onclick=()=>load(n);grid.append(b);}openDialog('#levelsDialog');}

  $('#sound').onclick=()=>{state.sound=!state.sound;sandAudio.stop();audio.sync();if(state.sound){sandAudio.unlock();audio.play('tap');}update();save();};
  $('#restart').onclick=()=>load(state.puzzle.level);$('#jamUndo').onclick=rewind;$('#jamExtra').onclick=()=>{if(!T.addSlot(state))return;$('#jamDialog').close();audio.play('complete');update();save();tell('Добавлено одно место до конца попытки. Выбери самосвал нужного цвета на парковке.');};$('#jamRestart').onclick=()=>load(state.puzzle.level);$('#level').onclick=()=>levels();$('#levelsPrev').onclick=()=>levels(levelPage-1);$('#levelsNext').onclick=()=>levels(levelPage+1);
  $('#next').onclick=()=>load(state.puzzle.level%T.LEVELS+1);$('#again').onclick=()=>load(state.puzzle.level);document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());for(const id of['#winDialog','#jamDialog'])$(id).addEventListener('cancel',e=>e.preventDefault());
  new ResizeObserver(layoutArt).observe(scene);addEventListener('resize',layoutArt);
  addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});build();requestAnimationFrame(tick);
  if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).catch(()=>{}));
})();
