/* Dobrynya simulation and UI adapter. Classic script; uses Towers world bindings. */
const DobrynyaCombat = (() => {
  'use strict';
  const PRICE=80, TIERS=[null,{hp:120,dmg:18,rate:1,armor:.15,cost:80},{hp:190,dmg:30,rate:1.15,armor:.25,cost:100},{hp:280,dmg:46,rate:1.3,armor:.35,cost:180}];
  const FIGHTERS=new Set(['grunt','tank','golem','puffball','spore','mole','straw','drummer','acorn','boss']);
  const RANGE=.7, HOLD=.65, DURATION=.72, CONTACT=.48, SPEED=2.5;
  const stats=h=>TIERS[h.lvl], upCost=h=>h.lvl<3?TIERS[h.lvl+1].cost:null;
  function home(){const p=G.path.pts.at(-1);return {x:p.x,y:p.y}}
  function select(){if(G.over||G.paused)return; if(!G.hero){if(G.gold<PRICE){showHint('Добрыня: нужно '+PRICE+' золота');sndNope();return}G.gold-=PRICE;clearUndo();G.hero={type:'hero',lvl:1,...home(),hp:TIERS[1].hp,route:[],cool:0,anim:0,aim:Math.PI,distance:0,revive:0,block:0};sndBuild()}
    G.selected=G.hero;G.armed=null;refreshHud();refreshSel();refreshPalette();showHint('Коснись дороги — Добрыня пойдёт туда');}
  // BFS over the union of road cells supports branches and junctions.
  function route(h,x,y){const goal=x+','+y;if(!G.roadKey.has(goal))return null;const start=Math.floor(h.x)+','+Math.floor(h.y),queue=[start],prev=new Map([[start,null]]);for(let i=0;i<queue.length&&!prev.has(goal);i++){const k=queue[i],[a,b]=k.split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=(a+dx)+','+(b+dy);if(G.roadKey.has(n)&&!prev.has(n)){prev.set(n,k);queue.push(n)}}}if(!prev.has(goal))return null;const result=[];for(let k=goal;k!==null;k=prev.get(k)){const [a,b]=k.split(',').map(Number);result.push({x:a+.5,y:b+.5})}return result.reverse();}
  function release(){for(const f of G.foes){f.heroTarget=false;f.heroAtk=0;f.heroAfter=0}}
  function move(x,y){const h=G.hero;if(!h||h.revive>0){showHint('Добрыня восстанавливается у замка');return}const r=route(h,x,y);if(!r){showHint('Выбери место на дороге');return}h.route=r;h.target=null;h.anim=0;release();showHint('Добрыня идёт к отмеченному месту');}
  function near(h,f,range){if(f.dead||f.hidden)return false;const p=foePos(f);return Math.hypot(p.x-h.x,p.y-h.y)<=range+f.r;}
  function update(dt){const h=G.hero;if(!h)return;h.block=Math.max(0,h.block-dt);
    if(h.revive>0){h.revive=Math.max(0,h.revive-dt);if(!h.revive){Object.assign(h,home());h.hp=stats(h).hp;h.cool=0}return}
    if(h.route.length){let travel=SPEED*dt;while(travel>0&&h.route.length){const p=h.route[0],dx=p.x-h.x,dy=p.y-h.y,d=Math.hypot(dx,dy);if(d<1e-6){h.x=p.x;h.y=p.y;h.route.shift();continue}h.aim=Math.atan2(dy,dx);const step=Math.min(d,travel);h.x+=dx/d*step;h.y+=dy/d*step;h.distance+=step;travel-=step;if(step>=d){h.x=p.x;h.y=p.y;h.route.shift()}}return}
    h.cool=Math.max(0,h.cool-dt);
    if(!G.waveRunning)h.hp=Math.min(stats(h).hp,h.hp+8*dt);
    if(h.anim>0){const old=DURATION-h.anim;h.anim=Math.max(0,h.anim-dt);if(old<DURATION*CONTACT&&DURATION-h.anim>=DURATION*CONTACT){if(h.target&&near(h,h.target,RANGE)){dmgFoe(h.target,stats(h).dmg,'melee');const p=foePos(h.target);G.fx.push({kind:'slash',x:p.x,y:p.y,a:h.aim,t:0,life:.22})}}return}
    if(h.cool>0)return;
    let best=null,dist=Infinity;for(const f of G.foes){if(!near(h,f,RANGE))continue;const p=foePos(f),d=Math.hypot(p.x-h.x,p.y-h.y);if(d<dist){dist=d;best=f}}
    if(best){const p=foePos(best);h.aim=Math.atan2(p.y-h.y,p.x-h.x);h.target=best;h.anim=DURATION;h.cool=1/stats(h).rate;}
  }
  function enemy(f,dt){const h=G.hero;const escort=(f.squad&&!f.squadLead)||f.supportTarget;
    // Ведущий связывает героя; сопровождение и быстрый эшелон идут дальше.
    if(escort||!h||h.revive||h.route.length||f.siege||f.hidden||f.buff.hold||!FIGHTERS.has(f.type)||!near(h,f,HOLD)){f.heroTarget=false;f.heroAtk=0;return false}
    if(!f.heroTarget){if(G.foes.filter(q=>q!==f&&q.heroTarget&&!q.dead&&!q.hidden).length>=3)return false;f.heroTarget=true;f.heroAtk=.6;f.heroAfter=0}
    const tick=dt*(1-f.slow);f.heroAfter=Math.max(0,(f.heroAfter||0)-tick);f.heroAtk-=tick;
    if(f.heroAtk<=0){f.heroAtk=FOES[f.type].atk;f.heroAfter=.3;const p=foePos(f),angle=Math.atan2(p.y-h.y,p.x-h.x),front=Math.cos(angle-h.aim)>.5;const blocked=front&&!h.anim;h.hp=Math.max(0,h.hp-FOES[f.type].hit*8*Math.max(1,Math.sqrt(f.scale||1))*(1-stats(h).armor)*(blocked?.45:1));if(blocked)h.block=.25;G.fx.push({kind:'slash',x:(p.x+h.x)/2,y:(p.y+h.y)/2,a:angle,t:0,life:.2});if(h.hp<=0){h.revive=10;h.route=[];h.anim=0;h.target=null;release();showHint('Добрыня ранен. Вернётся у замка через 10 секунд');}}
    return true;
  }
  function upgrade(h){const price=upCost(h);if(price===null||G.gold<price)return false;G.gold-=price;const old=stats(h).hp;h.lvl++;if(!h.revive)h.hp+=stats(h).hp-old;clearUndo();return true}
  function panel(){const h=G.hero,st=stats(h),cost=upCost(h);$('#selName').textContent='Добрыня · '+h.lvl+'/3';$('#selStats').textContent=(h.revive?'Вернётся через '+Math.ceil(h.revive)+' с':'Здоровье '+Math.ceil(h.hp)+'/'+st.hp)+'\nУрон '+st.dmg+' · '+st.rate+' уд/с · броня '+Math.round(st.armor*100)+'%'+(cost===null?'':'\nДалее: '+TIERS[h.lvl+1].hp+' HP · '+TIERS[h.lvl+1].dmg+' урона')+'\nВыбери клетку дороги для перемещения';const b=$('#btnUp');b.disabled=cost===null||G.gold<cost;b.firstChild.textContent=cost===null?'Максимум':'Улучшить';$('#upCost').textContent=cost===null?'3 / 3':cost+' зол.';b.setAttribute('title','Добрыня: '+(cost===null?'максимальный уровень':'следующий уровень за '+cost+' золота'));b.setAttribute('aria-label',cost===null?'Добрыня достиг уровня 3':'Улучшить Добрыню за '+cost+' золота');}
  function hud(){const b=$('#btnHero'),h=G.hero;b.textContent=h?'Добрыня '+h.lvl+'/3'+(h.revive?' · '+Math.ceil(h.revive)+' с':''):'Нанять Добрыню · '+PRICE+' зол.';b.disabled=G.over||(!h&&G.gold<PRICE);}
  function draw(){const h=G.hero;if(!h||h.revive)return;const x=px(h.x),y=py(h.y);if(G.selected===h){ctx.strokeStyle='#ffda7e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,CELL*.56,0,Math.PI*2);ctx.stroke();if(h.route.length){ctx.strokeStyle='#ffda7e88';ctx.beginPath();ctx.moveTo(x,y);for(const p of h.route)ctx.lineTo(px(p.x),py(p.y));ctx.stroke();const end=h.route.at(-1);ctx.strokeRect(px(end.x)-CELL*.25,py(end.y)-CELL*.25,CELL*.5,CELL*.5)}}DobrynyaTopdown.draw(ctx,{x,y,size:CELL,heading:h.aim,time:G.t,distance:h.distance,state:h.route.length?'walk':h.anim?'attack':h.block?'block':'idle',attack:1-h.anim/DURATION});ctx.fillStyle='#202923';ctx.fillRect(x-CELL*.4,y-CELL*.62,CELL*.8,3);ctx.fillStyle='#90d3a0';ctx.fillRect(x-CELL*.4,y-CELL*.62,CELL*.8*h.hp/stats(h).hp,3);}
  return {select,move,route,update,enemy,upgrade,panel,hud,draw,upCost,TIERS,FIGHTERS};
})();
