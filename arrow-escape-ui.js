(function(){
  'use strict';
  const G=ArrowEscape, KEY='arrowescape.v1', $=s=>document.querySelector(s), NS='http://www.w3.org/2000/svg';
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
  let state=G.restore(saved),busy=false,epoch=0,frame=0,hintId=null,page=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), sfx=GameAudio.create({enabled:()=>state.sound});
  const board=$('#board'), groups=new Map();
  function svg(tag,attrs={}){const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({version:G.VERSION,level:state.level,remaining:state.remaining,lives:state.lives,hints:state.hints,best:state.best,sound:state.sound,grid:state.grid,helpSeen:state.helpSeen}));}catch{}}
  function tell(message,error=false){$('#status').textContent=message;$('#status').classList.toggle('error',error);}
  function path(points){return points.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');}
  function paintArrow(group,arrow,distance=0){
    const points=G.movingCells(arrow,distance),head=points.at(-1),[dx,dy]=G.direction(arrow);
    // Hide the rounded shaft cap inside the triangle, even with the thicker
    // highlighted stroke. Trim across vertices: in motion the final segment
    // can be shorter than the inset, so merely shifting its end would backtrack.
    const shaft=points.slice();let inset=.25;
    while(shaft.length>1&&inset>0){
      const end=shaft.pop(),prev=shaft.at(-1),length=Math.hypot(end[0]-prev[0],end[1]-prev[1]);
      if(length<=inset)inset-=length;
      else{shaft.push([end[0]+(prev[0]-end[0])*inset/length,end[1]+(prev[1]-end[1])*inset/length]);break;}
    }
    group.querySelector('.body').setAttribute('d',path(shaft));
    group.querySelector('.hit').setAttribute('d',path(points));
    const base=[head[0]-dx*.43,head[1]-dy*.43];
    group.querySelector('.head').setAttribute('d',path([[head[0]+dx*.09,head[1]+dy*.09],[base[0]-dy*.24,base[1]+dx*.24],[base[0]+dy*.24,base[1]-dx*.24]])+'Z');
  }
  function clearHint(){hintId=null;groups.forEach(el=>el.classList.remove('hinted'));board.querySelector('.guide-ray')?.remove();}
  function build(){
    cancelAnimationFrame(frame);epoch++;busy=false;hintId=null;groups.clear();board.replaceChildren();
    const p=state.puzzle;board.setAttribute('viewBox',`-1 -1 ${p.width+1} ${p.height+1}`);
    const dots=svg('g',{id:'dots','aria-hidden':'true',fill:'#8e9d7755'});
    for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)dots.append(svg('circle',{cx:x,cy:y,r:.035}));
    board.append(dots);
    for(const arrow of p.arrows){
      if(!state.remaining.includes(arrow.id))continue;
      const [dx,dy]=G.direction(arrow),dir=dx===1?'вправо':dx===-1?'влево':dy===1?'вниз':'вверх';
      const group=svg('g',{class:'arrow',tabindex:'0',role:'button','aria-label':`Стрелка ${arrow.id+1}, ${dir}`,'data-id':arrow.id});
      group.append(svg('path',{class:'body','pointer-events':'none'}),svg('path',{class:'head','pointer-events':'none'}),svg('path',{class:'hit'}));
      group.addEventListener('click',()=>tap(arrow.id));
      group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tap(arrow.id);}});
      board.append(group);groups.set(arrow.id,group);paintArrow(group,arrow);
    }
    update();sizeBoard();
  }
  function update(){
    const total=state.puzzle.arrows.length,removed=total-state.remaining.length,percent=Math.round(removed/total*100);
    $('#levelLabel').textContent='Уровень '+state.level;
    $('#count').textContent=`${removed} / ${total}`;$('#count').setAttribute('aria-label',`Убрано ${removed} стрелок из ${total}`);
    $('#progress').style.width=percent+'%';$('.progress-track').setAttribute('aria-valuenow',percent);
    $('#lives').replaceChildren();
    for(let i=0;i<G.LIVES;i++){
      const drop=svg('svg',{viewBox:'0 0 24 28','aria-hidden':'true',class:i<state.lives?'':'spent'});
      drop.append(svg('path',{d:'M12 3C10 7 4 13 4 18a8 8 0 0 0 16 0c0-5-6-11-8-15Z'}));$('#lives').append(drop);
    }
    $('#lives').setAttribute('aria-label',`Осталось попыток: ${state.lives}`);
    $('#grid').setAttribute('aria-pressed',state.grid);$('#dots')?.setAttribute('visibility',state.grid?'visible':'hidden');
    $('#sound').setAttribute('aria-pressed',state.sound);$('#sound').setAttribute('aria-label',state.sound?'Выключить звук':'Включить звук');
    $('#sound use').setAttribute('href','icons.svg?v=51#'+(state.sound?'sound':'muted'));
    $('#hint').disabled=busy||!state.lives||!state.remaining.length;
    $('#help').disabled=busy;$('#levelButton').disabled=busy;
    board.dataset.busy=String(busy);
    for(const el of groups.values())el.setAttribute('aria-disabled',String(busy||!state.lives));
  }
  function sizeBoard(){
    const viewport=$('#viewport'), p=state.puzzle,ratio=(p.width+1)/(p.height+1);
    const width=Math.max(40,Math.min(viewport.clientWidth-20,(viewport.clientHeight-20)*ratio));
    board.style.width=width+'px';board.style.height=width/ratio+'px';
  }
  function animate(arrow,success,done){
    const token=epoch,group=groups.get(arrow.id),[dx,dy]=G.direction(arrow),head=arrow.cells.at(-1),p=state.puzzle;
    const toEdge=dx>0?p.width-head[0]:dx<0?head[0]+1:dy>0?p.height-head[1]:head[1]+1;
    const travel=arrow.cells.length+toEdge+2,duration=reduced.matches?0:success?Math.min(800,300+travel*12):330;
    const start=performance.now();
    function tick(now){
      if(token!==epoch)return;
      // The first rAF timestamp can precede performance.now() within a frame.
      const t=duration?Math.max(0,Math.min(1,(now-start)/duration)):1;
      const distance=success?travel*(t*t*(3-2*t)):.32*Math.sin(t*Math.PI);
      paintArrow(group,arrow,distance);
      if(t<1)frame=requestAnimationFrame(tick);else done();
    }
    frame=requestAnimationFrame(tick);
  }
  function tap(id){
    if(busy||!state.lives||!state.remaining.includes(id)||document.querySelector('dialog[open]'))return;
    clearHint();busy=true;
    const arrow=state.puzzle.arrows.find(a=>a.id===id),group=groups.get(id),blocked=G.blockers(state.puzzle,state.remaining,id);
    const hadFocus=document.activeElement===group;
    if(blocked.length){
      state.lives--;group.classList.add('blocked');sfx.play('nope');save();update();
      tell(state.lives?'Путь занят. Сначала убери стрелку, которая мешает.':'Попытки закончились. Можно попробовать ещё раз.',true);
      animate(arrow,false,()=>{group.classList.remove('blocked');busy=false;update();if(!state.lives)result(false);});
    }else{
      // Commit at the tap, so leaving during an animation preserves the move.
      state.remaining=state.remaining.filter(n=>n!==id);
      if(!state.remaining.length)state.best[state.level]=Math.max(state.best[state.level]||0,state.lives);
      group.classList.add('departing');sfx.play('tap');save();update();
      animate(arrow,true,()=>{
        group.remove();groups.delete(id);busy=false;update();
        if(!state.remaining.length){sfx.play('win');tell('Все стрелки на свободе!');result(true);}
        else{tell('Путь открыт. Найди следующую свободную стрелку.');if(hadFocus)groups.values().next().value?.focus({preventScroll:true});}
      });
    }
  }
  function loadLevel(level){
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());sfx.stop();
    state.level=level;state.puzzle=G.generate(level);state.remaining=state.puzzle.arrows.map(a=>a.id);state.lives=G.LIVES;state.hints=0;
    build();save();tell('Нажми на стрелку, перед которой свободно.');
  }
  function openDialog(id){
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    $(id).showModal();
    // The browser otherwise focuses the primary button when a result appears,
    // leaving a visible focus ring after touch play. Keep keyboard focus in the
    // dialog; Tab still moves to the button and shows its focus indicator.
    if(id==='#resultDialog')$('#resultTitle').focus({preventScroll:true});
  }
  function result(won){
    $('#resultTitle').textContent=won?'Путь свободен!':'Попробуем ещё раз?';
    $('#resultIcon use').setAttribute('href','icons.svg?v=51#'+(won?'sprout':'restart'));
    $('#stars').textContent=won?'★'.repeat(state.lives)+'☆'.repeat(G.LIVES-state.lives):'';
    $('#stars').setAttribute('aria-label',won?`Звёзд: ${state.lives} из ${G.LIVES}`:'');
    $('#resultText').textContent=won?(state.level===G.LEVELS?'Последний уровень пройден. Можно вернуться к любимым задачам и собрать все звёзды.':state.lives===G.LIVES?'Ни одного столкновения. Следующий узор уже ждёт.':'Все стрелки выбрались. За прохождение без столкновений — три звезды.'):'Некоторые пути ещё перекрыты. Начни заново и освобождай их по очереди — подсказки всегда рядом.';
    $('#resultPrimary').textContent=won&&state.level<G.LEVELS?'Следующий уровень':won?'Пройти ещё раз':'Попробовать снова';
    $('#resultPrimary').onclick=()=>loadLevel(won&&state.level<G.LEVELS?state.level+1:state.level);
    openDialog('#resultDialog');
  }
  function renderLevels(){
    const grid=$('#levelGrid');grid.replaceChildren();
    for(let n=page*25+1;n<=Math.min(G.LEVELS,(page+1)*25);n++){
      const btn=document.createElement('button'),stars=state.best[n]||0;
      btn.className=(n===state.level?'current ':'')+(stars?'done':'');
      btn.setAttribute('aria-label',`Уровень ${n}${stars?', звёзд: '+stars:''}`);if(n===state.level)btn.setAttribute('aria-current','true');
      btn.append(document.createTextNode(n));const small=document.createElement('small');small.textContent=stars?'★'.repeat(stars):'';small.setAttribute('aria-hidden','true');btn.append(small);
      btn.onclick=()=>{if(n===state.level){$('#levelsDialog').close();if(!state.remaining.length||!state.lives)result(!state.remaining.length);}else loadLevel(n);};grid.append(btn);
    }
    $('#pageLabel').textContent=`${page*25+1}–${Math.min(G.LEVELS,(page+1)*25)} из ${G.LEVELS}`;
    $('#prevPage').disabled=page===0;$('#nextPage').disabled=(page+1)*25>=G.LEVELS;
    $('#completed').textContent=`Пройдено ${Object.keys(state.best).length} из ${G.LEVELS} · звёзд ${Object.values(state.best).reduce((a,b)=>a+b,0)} / ${G.LEVELS*G.LIVES}`;
  }
  function levels(){page=Math.floor((state.level-1)/25);renderLevels();openDialog('#levelsDialog');}
  $('#levelButton').onclick=levels;$('#resultSecondary').onclick=levels;
  $('#prevPage').onclick=()=>{page--;renderLevels();};$('#nextPage').onclick=()=>{page++;renderLevels();};
  $('#help').onclick=()=>{state.helpSeen=true;save();openDialog('#helpDialog');};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  $('#sound').onclick=()=>{state.sound=!state.sound;sfx.sync();update();save();};
  $('#grid').onclick=()=>{state.grid=!state.grid;update();save();};
  $('#restart').onclick=()=>loadLevel(state.level);
  $('#hint').onclick=()=>{
    if(busy||!state.lives)return;
    const free=G.available(state.puzzle,state.remaining);if(!free.length)return;
    clearHint();hintId=free[0];state.hints++;groups.get(hintId).classList.add('hinted');
    const arrow=state.puzzle.arrows.find(a=>a.id===hintId),head=arrow.cells.at(-1),dir=G.direction(arrow),length=Math.max(state.puzzle.width,state.puzzle.height);
    const guide=svg('path',{class:'guide-ray',d:path([head,[head[0]+dir[0]*length,head[1]+dir[1]*length]])});board.insertBefore(guide,board.firstChild);
    tell('Золотая стрелка может выйти. Нажми на неё.');sfx.play('unlock');save();
  };
  new ResizeObserver(sizeBoard).observe($('#viewport'));
  addEventListener('pagehide',save);
  // If a completed or exhausted board is restored, present its action again.
  $('#resultDialog').addEventListener('cancel',e=>e.preventDefault());
  build();save();
  if(!state.remaining.length||!state.lives)result(!state.remaining.length);
  if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).catch(()=>{}));
})();
