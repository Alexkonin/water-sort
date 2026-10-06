(function(){
  'use strict';
  const G=Mahjong,KEY='mahjong.v1',$=s=>document.querySelector(s),board=$('#board');
  let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
  let state=G.restore(saved),selected=null,hinted=[],busy=false,page=0,zoomed=false;
  const sfx=GameAudio.create({enabled:()=>state.sound}),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const names=['Один круг','Два круга','Три круга','Четыре круга','Пять кругов','Шесть кругов','Один бамбук','Два бамбука','Три бамбука','Четыре бамбука','Пять бамбуков','Шесть бамбуков','Восток','Юг','Запад','Север','Красный дракон','Зелёный дракон','Семь кругов','Восемь кругов','Девять кругов','Семь бамбуков','Восемь бамбуков','Девять бамбуков',...Array.from({length:9},(_,i)=>(i+1)+' символов'),'Белый дракон','Слива','Орхидея','Хризантема','Цветок бамбука','Весна','Лето','Осень','Зима'];
  function save(){const {version,level,actions,completed,sound,helpSeen}=state;try{localStorage.setItem(KEY,JSON.stringify({version,level,actions,completed,sound,helpSeen}));}catch{}}
  function tell(text,stuck=false){$('#status').textContent=text;$('#status').classList.toggle('stuck',stuck);}
  const face=MahjongArt.face;
  function size(){
    const view=$('#viewport'),tiles=state.puzzle.tiles;
    const w=(Math.max(...tiles.map(t=>t.x))+1)*52+26,h=(Math.max(...tiles.map(t=>t.y))+1)*70+36;
    const widthScale=Math.max(.1,(view.clientWidth-24)/w),fit=Math.min(widthScale,(view.clientHeight-24)/h,1.2);
    const scale=zoomed?Math.max(.85,fit):Math.max(.1,fit);
    $('#boardSize').style.width=w*scale+'px';$('#boardSize').style.height=h*scale+'px';
    board.style.width=w+'px';board.style.height=h+'px';board.style.transform=`scale(${scale})`;
    $('#zoom').textContent=zoomed?'Всё поле':'Крупнее';$('#zoom').setAttribute('aria-pressed',String(zoomed));
  }

  function render(){
    const focusId=board.contains(document.activeElement)?Number(document.activeElement.dataset.id):null;
    board.replaceChildren();
    for(const tile of state.tiles){
      const el=document.createElement('button'),free=G.isFree(tile,state.tiles);
      el.className='tile'+(free?'':' blocked')+(selected===tile.id?' selected':'')+(hinted.includes(tile.id)?' hinted':'');
      el.dataset.id=tile.id;el.style.cssText=`left:${tile.x*52+18-tile.z*3}px;top:${tile.y*70+24-tile.z*5}px;width:50px;height:67px;z-index:${tile.z*100+Math.round(tile.y*2)};`;
      el.setAttribute('aria-label',`${names[tile.type]}, ряд ${tile.y+1}, место ${tile.x+1}, слой ${tile.z+1}, ${free?'свободна':'заблокирована'}`);
      el.setAttribute('aria-disabled',String(!free||busy));el.setAttribute('aria-pressed',String(selected===tile.id));el.tabIndex=free?0:-1;
      el.innerHTML=face(tile.type);el.onclick=()=>tap(tile.id);board.append(el);
    }
    if(focusId!==null)(board.querySelector(`[data-id="${focusId}"]`)||board.querySelector('[tabindex="0"]'))?.focus({preventScroll:true});
    const available=G.pairs(state.tiles),removed=state.puzzle.tiles.length-state.tiles.length;
    $('#levelLabel').textContent='Уровень '+state.level;$('#layoutName').textContent=state.puzzle.name;
    $('#count').textContent=`Убрано ${removed} / ${state.puzzle.tiles.length}`;$('#pairs').textContent='Доступно пар: '+available.length;
    $('#progress').style.width=removed/state.puzzle.tiles.length*100+'%';$('.progress-track').setAttribute('aria-valuenow',Math.round(removed/state.puzzle.tiles.length*100));
    $('#undo').disabled=busy||!state.actions.length;$('#shuffle').disabled=busy||!state.tiles.length||state.actions.length>=920;$('#hint').disabled=busy||!available.length;
    $('#restart').disabled=busy;$('#levels').disabled=busy;
    $('#sound').setAttribute('aria-pressed',String(state.sound));$('#sound').setAttribute('aria-label',state.sound?'Выключить звук':'Включить звук');$('#sound use').setAttribute('href','icons.svg?v=60#'+(state.sound?'sound':'muted'));
    if(!state.tiles.length)tell('Поле очищено. Можно выбрать следующую раскладку.');
    else if(!available.length)tell('Свободных пар нет. Отмени ход или перемешай плитки.',true);
    else tell('Найди две одинаковые плитки со свободным краем.');
    size();
  }
  function commit(action){
    const next=G.apply(state.tiles,state.puzzle,action);if(!next)return false;
    // Bound malformed histories; shuffle controls reserve room for all remaining pairs.
    if(state.actions.length>=1000){tell('Начни уровень заново: достигнут предел истории.',true);return false;}
    state.tiles=next;state.actions.push(action);selected=null;hinted=[];save();return true;
  }
  async function tap(id){
    if(busy)return;
    const tile=state.tiles.find(t=>t.id===id);if(!G.isFree(tile,state.tiles)){sfx.play('nope');tell('Сначала освободи верх и один из боков этой плитки.');return;}
    hinted=[];
    if(selected===id){selected=null;render();return;}
    if(selected!==null){
      const pair=[selected,id],next=G.remove(state.tiles,pair);
      if(next){
        busy=true;
        const nodes=pair.map(i=>board.querySelector(`[data-id="${i}"]`));
        if(!commit({kind:'pair',ids:pair})){busy=false;return;}
        sfx.play('plop');nodes.forEach(el=>el?.classList.add('removing'));
        $('#undo').disabled=$('#shuffle').disabled=$('#hint').disabled=$('#restart').disabled=$('#levels').disabled=true;
        if(!reduced.matches)await new Promise(resolve=>setTimeout(resolve,180));
        busy=false;render();if(!state.tiles.length)win();return;
      }
      selected=id;sfx.play('tap');render();tell('Рисунки разные. Найди пару для выбранной плитки.');return;
    }
    selected=id;sfx.play('tap');render();tell(tile.type>=34?(tile.type<38?'Выбери любой другой свободный цветок.':'Выбери любой другой свободный сезон.'):'Теперь выбери такую же свободную плитку.');
  }
  function win(){
    if(!state.completed.includes(state.level))state.completed.push(state.level);save();sfx.play('win');
    $('#winText').textContent=`Раскладка ${state.level} собрана. Пройдено ${state.completed.length} из ${G.LEVELS}.`;
    $('#next').textContent=state.level===G.LEVELS?'Выбрать раскладку':'Следующая раскладка';
    $('#winDialog').showModal();
  }
  function start(level){
    state={...state,version:G.VERSION,level,puzzle:G.generate(level),actions:[]};state.tiles=state.puzzle.tiles;selected=null;hinted=[];
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());save();render();$('#viewport').scrollTop=0;$('#viewport').scrollLeft=0;
  }
  function renderLevels(){
    $('#completed').textContent=`Пройдено ${state.completed.length} из ${G.LEVELS}`;$('#levelGrid').replaceChildren();
    for(let n=page*25+1;n<=Math.min((page+1)*25,G.LEVELS);n++){
      const btn=document.createElement('button');btn.textContent=n;btn.className=(state.completed.includes(n)?'done ':'')+(state.level===n?'current':'');
      btn.setAttribute('aria-label',`Уровень ${n}${state.completed.includes(n)?', пройден':''}`);if(state.level===n)btn.setAttribute('aria-current','true');
      btn.onclick=()=>{if(state.level===n){$('#levelsDialog').close();return;}start(n);};$('#levelGrid').append(btn);
    }
    $('#pageLabel').textContent=`${page*25+1}–${Math.min((page+1)*25,G.LEVELS)} из ${G.LEVELS}`;
    $('#prevPage').disabled=page===0;$('#nextPage').disabled=(page+1)*25>=G.LEVELS;
  }
  function levels(){
    page=Math.floor((state.level-1)/25);renderLevels();$('#levelNumber').value='';
    $('#levelsDialog').showModal();$('#levelGrid .current')?.focus();
  }
  $('#sound').onclick=()=>{state.sound=!state.sound;sfx.sync();if(state.sound)sfx.play('tap');save();render();};
  $('#zoom').onclick=()=>{zoomed=!zoomed;size();};
  $('#undo').onclick=()=>{if(busy||!state.actions.length)return;state.actions.pop();state.tiles=G.replay(state.puzzle,state.actions);selected=null;hinted=[];sfx.play('tap');save();render();};
  $('#shuffle').onclick=()=>{if(busy||!state.tiles.length)return;const before=state.tiles.map(t=>t.id).sort((a,b)=>a-b).join();if(commit({kind:'shuffle',seed:Math.floor(Math.random()*4294967296)})){sfx.play('unlock');render();tell(before===state.tiles.map(t=>t.id).sort((a,b)=>a-b).join()?'Рисунки перемешаны. У этой позиции есть решение.':'Тупик устранён: плитки перестроены в решаемую раскладку.');}};
  $('#hint').onclick=()=>{if(busy)return;const pair=G.pairs(state.tiles)[0];if(!pair)return;selected=null;hinted=pair;sfx.play('tap');render();tell('Эти две плитки свободны — их можно убрать.');};
  $('#levelJump').onsubmit=e=>{
    e.preventDefault();const level=Number($('#levelNumber').value);
    if(!Number.isInteger(level)||level<1||level>G.LEVELS)return;
    if(level===state.level){$('#levelsDialog').close();return;}start(level);
  };
  $('#prevPage').onclick=()=>{if(page>0){page--;renderLevels();}};
  $('#nextPage').onclick=()=>{if((page+1)*25<G.LEVELS){page++;renderLevels();}};
  $('#levels').onclick=levels;$('#help').onclick=()=>$('#helpDialog').showModal();
  $('#restart').onclick=()=>$('#restartDialog').showModal();$('#confirmRestart').onclick=()=>start(state.level);
  $('#next').onclick=()=>{if(state.level<G.LEVELS)start(state.level+1);else{$('#winDialog').close();levels();}};
  document.querySelectorAll('[data-close]').forEach(btn=>btn.onclick=()=>btn.closest('dialog').close());
  $('#helpDialog').addEventListener('close',()=>{state.helpSeen=true;save();});
  document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||document.querySelector('dialog[open]'))return;const key=e.key.toLowerCase();if(key==='z'||key==='я'){e.preventDefault();$('#undo').click();}if(key==='h'||key==='р'){e.preventDefault();$('#hint').click();}});
  new ResizeObserver(size).observe($('#viewport'));addEventListener('pagehide',save);
  render();save();if(!state.tiles.length)win();else if(!state.helpSeen)$('#helpDialog').showModal();
  if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).catch(()=>{}));
})();
