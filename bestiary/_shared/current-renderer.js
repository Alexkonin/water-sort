/* Exact game-art snapshot; source SHA-256: 90376548bc3c0a20d7b0a43378fab7e9f76d58b77fb511028723d530ecb922c7. Viewer adapter below is preview-only. */
(function(){
let G={t:0,foes:[],fx:[]};let CELL=40;const gradCache=new Map();const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function plural(n,a,b,c){n=Math.abs(n)%100;return n>=11&&n<=19?c:n%10===1?a:n%10>=2&&n%10<=4?b:c;}
function rr(c, x, y, w, h, r){
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else {
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
}
function poly(c, pts){
  c.beginPath();
  pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
  c.closePath();
}
const octagon = (cx, cy, r) => { const k = r * 0.414;
  return [[cx-k,cy-r],[cx+k,cy-r],[cx+r,cy-k],[cx+r,cy+k],[cx+k,cy+r],[cx-k,cy+r],[cx-r,cy+k],[cx-r,cy-k]]; };
const hexagon = (cx, cy, r) => { const p = []; for (let i = 0; i < 6; i++){ const a = i * Math.PI / 3 + Math.PI / 6; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
// мягкая тень на земле: эллипс с радиальным спадом
function softShadow(c, x, y, rx, ry, a){
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(0.55, 'rgba(0,0,0,' + a * 0.55 + ')');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.translate(x, y); c.scale(rx, ry);
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore();
}
function gloss(c, x, y, rx, ry, a){
  c.fillStyle = 'rgba(255,255,255,' + (a || 0.5) + ')';
  c.beginPath(); c.ellipse(x, y, rx, ry, -0.5, 0, 7); c.fill();
}
function grad(c, key, r, make){
  const k = key + ':' + Math.round(r * 4);
  let g = gradCache.get(k);
  if (!g){ g = make(); gradCache.set(k, g); }
  return g;
}

function eyes(c, fx, dy, r){
  for (const s of [-1, 1]){
    c.fillStyle = '#1a1028'; c.beginPath(); c.arc(fx, s * dy, r, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(fx + r * 0.3, s * dy - r * 0.3, r * 0.35, 0, 7); c.fill();
  }
}
// ноги: пары коротких палок, качаются в противофазе по фазе шага
function legs(c, r, ph, n, len, col, w, spread){
  c.strokeStyle = col; c.lineWidth = Math.max(1, r * w); c.lineCap = 'round';
  for (let i = 0; i < n; i++){
    const x = -r * 0.5 + i * (r / Math.max(1, n - 1)), k = Math.sin((ph + i / n) * 6.283) * 0.45;
    for (const s of [-1, 1]){
      c.beginPath(); c.moveTo(x, s * r * spread); c.lineTo(x + k * r * 0.6, s * r * (spread + len)); c.stroke();
    }
  }
}

// пушистая кромка: короткие иголки по кругу, детерминированно от фазы
function fur(c, r, n, len, col, w, seed){
  c.strokeStyle = col; c.lineWidth = Math.max(1, r * w); c.lineCap = 'round';
  for (let i = 0; i < n; i++){
    const a = (i / n) * 6.283 + seed, k = 0.75 + 0.5 * ((i * 7919 % 17) / 17);
    c.beginPath();
    c.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
    c.lineTo(Math.cos(a) * (r + len * k), Math.sin(a) * (r + len * k));
    c.stroke();
  }
}
// круглые глаза «как нарисованы от руки»: белок, зрачок, блик
function roundEyes(c, fx, dy, r, pupil){
  for (const s of [-1, 1]){
    c.fillStyle = '#f4f1e8'; c.beginPath(); c.ellipse(fx, s * dy, r, r * 1.05, 0, 0, 7); c.fill();
    c.fillStyle = pupil || '#1b1526'; c.beginPath(); c.arc(fx + r * 0.18, s * dy, r * 0.42, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(fx + r * 0.05, s * dy - r * 0.35, r * 0.16, 0, 7); c.fill();
  }
}

/* Боссы: один тип в правилах, четыре облика на экране — меняется каждые три карты.
   Все духи-хранители: лес, маска, река, гроза. */
const BOSS_SKINS = [
  { name:'Хозяин леса',  color:'#6d9e4a' },
  { name:'Белая маска',  color:'#e8e2d4' },
  { name:'Речной змей',  color:'#4aa8c8' },
  { name:'Громовой бык', color:'#b08cf0' }
];
const bossSkin = L => Math.floor(L / 3) % BOSS_SKINS.length;

const BOSS_ART = [
  function forestLord(c,r,f){
    const attack=f.siege?ForestLord.attackProgress(f.atk,f.attackAfter||0):null;let target;
    if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
    ForestLord.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
  },
  function whiteMask(c,r,f){
    const attack=f.siege?WhiteMask.attackProgress(f.atk,f.attackAfter||0):null;let target;
    if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
    WhiteMask.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
  },
  function riverSerpent(c,r,f){
    const attack=f.siege?RiverSerpent.attackProgress(f.atk,f.attackAfter||0):null;let target;
    if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
    RiverSerpent.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
  },
  function thunderOx(c,r,f){
    const attack=f.siege?ThunderBull.attackProgress(f.atk,f.attackAfter||0):null;let target;
    if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
    ThunderBull.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
  }
];

// фаза шага: по пройденному пути, множитель — из карточки (частый шаг у бегунов)
function stepPhase(f){ return f.d * (FOES[f.type].step || 1.8); }

// живые враги на дороге в R клетках от f, кроме него самого. Позиции берутся
// из f.pos — они считаются один раз за шаг мира, до особенностей, чтобы аура
// с двадцатью носителями на двухстах врагах не пересчитывала ломаную каждому.
function nearFoes(f, R){
  const out = [];
  for (const o of G.foes){
    if (o === f || o.dead || o.siege || !o.pos) continue;
    if (Math.hypot(o.pos.x - f.pos.x, o.pos.y - f.pos.y) <= R) out.push(o);
  }
  return out;
}
const KIND_NAME = { shot:'пушка', frost:'мороз', chain:'молния', splash:'мортира' };
const fmtN = v => String(Math.round(v * 10) / 10).replace('.', ',');

/* ---- особенности ----
   У каждой — набор крючков; движок дёргает те, что есть:
     init(f, p)              при появлении
     tick(f, p, dt)          каждый шаг мира, пока враг идёт по дороге (не на осаде);
                             идёт ДО движения, поэтому может ставить бафы соседям
     hurt(f, p, dmg, kind)   → урон до вычета брони (kind: ball | ice | chain | splash)
     slow(f, p, k)           → сила замедления морозом (0 — не мёрзнет)
     death(f, p, pos)        при гибели
     hidden(f, p)            → true, если башни его сейчас не видят
     siege(f, p)             дошёл до ворот: сбросить всё, что прячет или двигает
     under / over(f, p, c, r, cell)  рисунок под телом и поверх него, в локальных
                             координатах; under может вернуть true — тело не рисуется
     about(p)                строка для книги
   Бафы f.buff сбрасываются каждый шаг и заново собираются аурами соседей:
   sp — множитель скорости, armor — прибавка к броне, heal — доля здоровья в
   секунду, hold — этим шагом не двигать (сам прыгает). Ауры не складываются —
   берётся сильнейшая: два фонаря рядом не делают толпу вдвое быстрее. */
const TRAITS = {
  maturation:{
    about:p=>'за '+p.seconds+' с вырастает в Дождевика; его потомство тоже растёт, без ограничения поколений',
    init(f){f.growthAge=0;}
  },
  dryWood:{
    about:p=>'молния ×'+String(p.mult).replace('.',',')+' до брони; тление '+fmtN(p.dps*p.duration)+' урона за '+fmtN(p.duration)+' с, без накопления',
    hurt(f,p,dmg,kind){if(kind==='chain'){f.smoulder=p.duration;f.smoulderDps=p.dps;return dmg*p.mult;}return dmg;}
  },

  mistCover:{
    about:p=>'туман в '+fmtN(p.r)+' кл.: точность снарядов по соседям ×'+String(p.accuracy).replace('.',',')+'; молния и взрыв без штрафа; ауры не складываются',
    under(f,p,c,r,cell){if(!f.siege&&!f.hidden&&!f.buff?.hold)Tumannik.drawAura(c,{radius:p.r*cell,time:G.t});}
  },
  tinyTarget:{
    about:()=> 'маленькая цель: пушка/баллиста 35%, стрелы/мороз 80%, молния и взрыв без промахов; мороз повышает точность, у ворот 100%',
    accuracy(f,p,kind){
      if(f.siege)return 1;
      const base=({ball:.35,heavy:.35,arrow:.80,ice:.80})[kind]??1;
      return base+(1-base)*Math.max(0,Math.min(1,f.slow||0));
    }
  },
  noSlow: {
    about: () => 'не мёрзнет: мороз его не замедляет',
    slow: () => 0
  },
  // при гибели из него выходят p.n существ типа p.type — с того же места, чуть
  // позади, чтобы у ворот они ещё сделали шаг под огнём
  split: {
    about: p => 'при гибели рассыпается на ' + p.n + ' ' + plural(p.n, ...FOES[p.type].acc),
    death(f, p){
      for (let i = 0; i < p.n; i++) spawn(p.type, f.scale, { pi: f.pi, d: Math.max(0, f.d - 0.35 - i * 0.12) });
    }
  },
  // свет фонаря: соседи в p.r клетках идут на p.k быстрее
  haste: {
    about: p => 'свет Светлячка: враги рядом идут на ' + Math.round(p.k * 100) + '% быстрее',
    tick(f, p){ for (const o of nearFoes(f, p.r)) o.buff.sp = Math.max(o.buff.sp, 1 + p.k); },
    under(f, p, c, r, cell){
      const R = p.r * cell, g = c.createRadialGradient(0, 0, R * 0.25, 0, 0, R);
      g.addColorStop(0, 'rgba(255,190,80,.17)'); g.addColorStop(1, 'rgba(255,190,80,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill();
    }
  },
  // роса: соседи в p.r клетках лечатся на p.k здоровья в секунду (сам — нет)
  heal: {
    about: p => 'роса: лечит врагов рядом на ' + Math.round(p.k * 100) + '% здоровья в секунду',
    tick(f,p){
      f.healTargets=[];if(f.dead||f.siege)return;
      for(const o of nearFoes(f,p.r))if(o.hp<o.hpMax){o.buff.heal=Math.max(o.buff.heal,p.k);f.healTargets.push(o);}
    },
    under(f,p,c,r,cell){
      if(f.siege||f.dead||!f.pos)return;
      const here=foePos(f),h=foeHeading(f);
      for(const other of f.healTargets||[]){
        if(other.dead||other.siege||other.hp>=other.hpMax)continue;
        const q=foePos(other),dx=(q.x-here.x)*cell,dy=(q.y-here.y)*cell;
        if(Math.hypot(dx,dy)>p.r*cell)continue;
        Rosnik.drawHeal(c,{time:G.t,seed:f.ph,target:{x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)},size:cell*.045});
      }
    }
  },
  // барабан: соседи в p.r клетках получают +p.armor к броне
  drum: {
    about:p=>'барабан: +3 брони рядом; каждые 3 с +20% здоровья на 4 с',
    init(f){f.drumT=3;f.drumAfter=0;},
    tick(f,p,dt){
      if(f.dead||f.siege)return;
      const allies=nearFoes(f,p.r);
      for(const o of allies)o.buff.armor=Math.max(o.buff.armor,p.armor);
      f.drumAfter=Math.max(0,(f.drumAfter||0)-dt);f.drumT=(f.drumT??3)-dt;
      if(f.drumT<=0){f.drumT=3+(f.drumT%3);f.drumAfter=.44;f.drumPulseAt=G.t;for(const o of allies)Gulen.boost(o,G.t,.2,4);}
    },
    under(f,p,c,r,cell){
      if(f.siege||f.drumPulseAt==null)return;
      const t=(G.t-f.drumPulseAt)/.8;if(t<0||t>1)return;
      c.strokeStyle='rgba(200,230,160,'+(.5*(1-t))+')';c.lineWidth=Math.max(1,cell*.035);c.beginPath();c.arc(0,0,p.r*cell*t,0,7);c.stroke();
    }
  },

  // норы: p.over секунд на поверхности, p.under под землёй — там его не достать.
  // Снаряд, летевший в нырнувшего, гаснет: пушка по нему честно промахивается
  burrow: {
    about: p => 'ныряет под землю на ' + fmtN(p.under) + ' с из каждых ' + fmtN(p.over + p.under) + ': под землёй его не достать',
    init(f,p){f.burrowT=p.over;f.under=false;f.dirtT=0;f.emergeT=0;},
    tick(f,p,dt){
      f.emergeT=Math.max(0,(f.emergeT||0)-dt);f.burrowT-=dt;
      while(f.burrowT<=0){f.under=!f.under;f.burrowT+=f.under?p.under:p.over;f.emergeT=f.under?0:Math.max(0,.45-(p.over-f.burrowT));}
      if(f.under&&(f.dirtT-=dt)<=0){f.dirtT=.22;G.fx.push({kind:'dust',x:f.pos.x,y:f.pos.y,t:0,life:.45,parts:parts(3,.4,(f.d*733)|0)});}
    },
    hidden:f=>f.under,
    siege(f){f.under=false;f.emergeT=0;},
    under(f,p,c,r){if(!f.under)return false;Kroten.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,state:'underground',shadow:false});return true;}
  },
  // уязвимости и стойкости по видам урона: { shot:0.5, splash:2 }
  weak: {
    about: p => Object.entries(p).map(([k, v]) => KIND_NAME[k] + ' ×' + fmtN(v)).join(', '),
    hurt: (f, p, dmg, kind) => dmg * (p[kind] !== undefined ? p[kind] : 1)
  },
  // прыжок: раз в p.every секунд перелетает p.dist клеток за p.air секунд.
  // Мортира стреляет с упреждением по РОВНОМУ ходу — и по прыгуну мажет
  leap: {
    about: p => 'каждые ' + fmtN(p.every) + ' с прыгает на ' + fmtN(p.dist) + ' клетки вперёд; мортира по нему промахивается',
    init(f, p){ f.leapT = p.every * 0.6; f.air = 0; f.airMax = p.air; f.landT=0; },
    tick(f, p, dt){
      f.landT=Math.max(0,(f.landT||0)-dt);
      if (f.air > 0){
        f.air -= dt;
        const k = 1 - Math.max(0, f.air) / p.air;
        f.d = f.leapFrom + (f.leapTo - f.leapFrom) * k;
        f.buff.hold = true;
        if (f.air <= 0){
          f.d = f.leapTo; f.landT=.18;
          const q = foePos(f);
          G.fx.push({ kind:'dust', x: q.x, y: q.y + f.r * 0.5, t: 0, life: 0.4, parts: parts(4, 0.5, (f.d * 733) | 0) });
        }
        return;
      }
      f.leapT -= dt * (1 - f.slow);                     // замёрзший прыгает реже
      if (f.leapT > 0) return;
      f.leapT = p.every; f.air = p.air; f.leapFrom = f.d;
      f.leapTo = Math.min(G.paths[f.pi].len, f.d + p.dist);
      f.buff.hold = true;
    },
    siege(f){ f.air = 0; f.landT=0; }
  },
  // сеятель: раз в p.every секунд выпускает позади себя p.type, не больше p.max
  spawner: {
    about:p=>'каждые '+fmtN(p.every)+' с выпускает '+FOES[p.type].acc[0]+', не больше '+p.max+' за жизнь',
    init(f,p){f.seedT=p.every;f.seeded=0;},
    tick(f,p,dt){
      if(f.dead||f.siege||f.seeded>=p.max)return;
      f.seedT-=dt*(1-f.slow);if(f.seedT>0)return;
      f.seedT=p.every;f.seeded++;f.lastSeedAt=G.t;
      const child=spawn(p.type,f.scale,{pi:f.pi,d:f.d});
      child.seedBornAt=G.t;child.seedFrom=f.d;child.seedTo=Math.max(0,f.d-f.r-.40);child.buff.hold=true;
    }
  },
  // скорлупа: пока здоровья больше p.at, броня из карточки; треснул — броня
  // p.armor и скорость в p.sp раз. Толстый и медленный становится голым и быстрым
  crack: {
    about: p => 'скорлупа держит, пока цел; ниже половины здоровья трескается — броня спадает, зато бежит в ' + fmtN(p.sp) + ' раза быстрее',
    init(f){ f.cracked = false; },
    tick(f, p){
      if (f.cracked || f.hp > f.hpMax * p.at) return;
      f.cracked = true; f.crackAt=G.t; f.armor = p.armor; f.sp *= p.sp;
      G.fx.push({ kind:'puff', x: f.pos.x, y: f.pos.y, t: 0, life: 0.5, color:'#4e3218', parts: parts(8, 1.1, (f.d * 991) | 0) });
    },

  },
  // тень: башни не видят его, пока в p.r клетках идёт кто-то другой
  veil: {
    about:()=> 'рядом с другим существом скрыт и быстрее на 20%; один — видим',
    init(f){f.veiled=false;f.veilBlend=0;f.revealT=0;},
    tick(f,p,dt){
      const before=f.veiled;
      f.veiled=!f.siege&&!f.dead&&nearFoes(f,p.r).some(o=>o.type!==f.type&&!o.under);
      if(before&&!f.veiled)f.revealT=.45;else f.revealT=Math.max(0,(f.revealT||0)-dt);
      f.veilBlend=Tennik.transition(f.veilBlend||0,f.veiled,dt);
      if(f.veiled)f.buff.sp=Math.max(f.buff.sp,1.2);
    },
    hidden:f=>f.veiled,
    siege(f){f.veiled=false;f.veilBlend=0;f.revealT=0;}
  }
};

const FOES = {
  // Уголёк: собственный маскот, вид сверху; бережёт огонь в коротких лапках.
  grunt: {
    voice:'ember',
    name:'Уголёк', about:'маленький угольный дух с тёплой трещинкой; бережно несёт огонёк в ладонях',
    hp:36, sp:1.35, armor:0, bounty:8, hit:1, atk:1.6, r:0.30, color:'#45413a',
    gap:0.62, wave:(L, W) => 4 + Math.round(W * 0.6 + L * 0.2),
    attackAnim:{ duration:Ugolek.ATTACK_DURATION, contact:Ugolek.CONTACT },
    art(c,r,f){
      const attack=f.siege?Ugolek.attackProgress(f.atk,f.attackAfter||0):null;
      Ugolek.draw(c,{size:r*2.8,time:G.t,distance:f.d,seed:f.ph,shadow:false,
        state:f.siege?(attack===null?'idle':'attack'):'walk',attack:attack===null?0:attack});
    }
  },
  // Вихрёк: лист на крошечном смерче
  runner: {
    voice:'leaf',
    name:'Вихрёк', about:'сухой лист, подхваченный крошечным смерчем; быстрый, но хлипкий',
    hp:26, sp:2.60, armor:0, bounty:7, hit:1, atk:1.2, r:0.26, color:'#a8d84a',
    gap:0.42, wave:(L, W) => (W >= 2 || L >= 1) ? 2 + Math.round(W * 0.35 + L * 0.15) : 0,
    attackAnim:{duration:.8,contact:.5},
    art(c,r,f){
      const attack=f.siege?Vihrek.attackProgress(f.atk,f.attackAfter||0):null;
      const target=undefined;
      c.save();c.rotate(Math.PI/2);
      Vihrek.draw(c,{size:r*3.2,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,
        state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
      c.restore();
    }
  },
  // Камнеспин: замшелый валун на коротких лапах
  tank: {
    voice:'stone',
    name:'Камнеспин', about:'валун, поросший мхом, на коротких лапах; слабые удары о него гаснут',
    hp:95, sp:0.95, armor:5, bounty:15, hit:2, atk:2.2, r:0.34, color:'#8b8472',
    gap:1.15, wave:(L, W, late) => (W >= 4 || L >= 2) ? 1 + Math.round(late * (1 + L * 0.22)) : 0,
    intro:'в броне — слабые удары гаснут, бей пушкой и мортирой',
    attackAnim:{duration:1,contact:.6},
    art(c,r,f){
      const attack=f.siege?Kamnespin.attackProgress(f.atk,f.attackAfter||0):null;
      const target=undefined;
      Kamnespin.draw(c,{size:r*2.8,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,
        state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },
  // Пушинка: семечко-одуванчик с личиком, летит роем
  swarm: {
    name:'Пушинка', about:'семечко одуванчика с личиком; одна ничего не стоит, но они не ходят по одной',
    acc:['пушинку', 'пушинки', 'пушинок'],
    hp:14, sp:1.90, armor:0, bounty:4, hit:1, atk:1.3, r:0.20, color:'#e8e0c8',
    gap:0.25, wave:(L, W, late) => (W >= 5 || L >= 3) ? 5 + Math.round(late * (4 + L * 0.5)) : 0,
    traits:{tinyTarget:{}},
    intro:'маленькая цель: пушка попадает в 35% случаев; молния — без промахов',
    attackAnim:{duration:.8,contact:.52},
    art(c,r,f){
      const attack=f.siege?Pushinka.attackProgress(f.atk,f.attackAfter||0):null;
      const target=undefined;
      Pushinka.draw(c,{size:r*3*(f.seedBornAt==null?1:.35+.65*Math.min(1,Math.max(0,(G.t-f.seedBornAt)/.65))),time:G.t,distance:f.d,seed:f.ph,shadow:false,target,evade:f.evade||0,
        state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },
  // Туманник: полупрозрачный дух в маске, стелется над землёй. Не мёрзнет —
  // мороз против него пуст, нужны пушка и молния
  ghost: {
    voice:'mist',
    name:'Туманник', about:'клок тумана в белой маске; стелется над дорогой и не чувствует холода',
    hp:30, sp:2.00, armor:0, bounty:9, hit:1, atk:1.2, r:0.28, color:'#cfd8e8',
    from:8, gap:0.5, wave:(L, W, late) => W >= 3 ? 3 + Math.round(late * (3 + L * 0.3)) : 0,
    traits:{noSlow:{},mistCover:{r:1.4,accuracy:.65}},
    intro:'прикрывает соседей туманом: точность снарядов ×0,65; молния и взрыв надёжны; мороз не замедляет',
    attackAnim:{duration:.9,contact:.55},
    art(c,r,f){
      const attack=f.siege?Tumannik.attackProgress(f.atk,f.attackAfter||0):null;
      const target=undefined;
      Tumannik.draw(c,{size:r*3.2,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,
        state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },
  /* Древень: ходячий пень, вид СВЕРХУ — как и всё поле. Первая версия рисовала
     мшистую шапку «над» стволом, но силуэт разворачивается по ходу движения, и
     при ходьбе влево шапка оказывалась под пнём. Сверху же у пня нет верха и низа:
     годовые кольца, мох по кромке, светящееся дупло в середине, корни во все стороны.
     Броня 9; сухая древесина уязвима к молнии и тлению. */
  golem: {
    voice:'wood',
    name:'Древень', about:'старый пень, который решил дойти до замка; в дупле тлеет огонёк',
    hp:260, sp:0.70, armor:9, bounty:30, hit:3, atk:2.6, r:0.40, color:'#a8825a',
    from:14, gap:2.5, wave:(L, W, late) => W >= 5 ? 1 + Math.round(late * (1 + L * 0.15)) : 0,
    traits:{dryWood:{mult:1.75,duration:2.5,dps:2}},
    intro:'броня 9; молния наносит ×1,75 урона до брони и поджигает кору на 2,5 с',
    step:2, dust:true,
    attackAnim:{duration:1.2,contact:.6},
    art(c,r,f){
      const attack=f.siege?Dreven.attackProgress(f.atk,f.attackAfter||0):null;
      let target;
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;
        target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Dreven.draw(c,{viewHeading:f.viewHeading||0,size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,burning:f.smoulder||0,
        state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },

  /* ---- поздние существа: по одному новому на каждую дюжину карт ----
     Все с 25-й карты и дальше: первые двадцать четыре выверены прогонами, и их
     волны не тронуты. Золото за голову — угроза по курсу того, кого существо
     замещает (bounty/hp: уголёк 0,22, вихрёк 0,27, камнеспин 0,16, туманник 0,3,
     древень 0,12): первая версия платила вдвое меньше, доход проседал, и к шестой
     волне у игрока стояло 27 башен вместо 40 — уровни рушились не от повадок,
     а от бедности.
     Носителей аур (фонарь, роса, барабан) не больше двух на волну, и угроза у них
     выше всех: их сила не в своём здоровье, а в чужом — барабан рядом с восемью
     древнями делает каждого на треть крепче, и тело в 150 здоровья этого не
     отражает. При трёх-четырёх на волну 90-я карта проваливалась при любом
     наклоне. Каждое следующее вводит одну новую повадку и один новый ответ:
     мортира по дождевику, снять фонарь первым, ждать крота на поверхности.
     Числа в группах скромные — пара-тройка на волну: поздние волны и так по
     полторы сотни голов, и новое существо должно менять расклад повадкой, а не
     поголовьем. */

  // Дождевик: гриб на ножках; при гибели рассыпается спорами
  puffball: {
    voice:'spores',
    name:'Дождевик', about:'гриб-дождевик на коротких ножках; тронешь — лопнет, и разбегутся споры',
    acc:['дождевика', 'дождевика', 'дождевиков'],
    hp:60, sp:1.0, armor:0, bounty:16, hit:1, atk:1.8, r:0.34, color:'#e6dcc2',
    from:24, threat:1.2, gap:0.8, wave:(L, W, late) => W >= 3 ? 1 + Math.round(late * (1 + (L - 24) * 0.02)) : 0,
    traits:{ split:{ type:'spore', n:4 } },
    intro:'при гибели рассыпается спорами — добивай его там, где стоит мортира',
    step:1.6,
    attackAnim:{duration:.9,contact:.58},
    art(c,r,f){
      const attack=f.siege?Dozhdevik.attackProgress(f.atk,f.attackAfter||0):null;
      let target;
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;
        target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Dozhdevik.draw(c,{size:r*2.7,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,
        state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },
  // Спорка: то, на что рассыпается дождевик. В волнах сама не ходит
  spore: {
    name:'Спорка', about:'крошечная спора дождевика; одна — пустяк, четыре — уже толпа',
    acc:['спорку', 'спорки', 'спорок'],
    hp:8, sp:2.4, armor:0, bounty:2, hit:1, atk:1.0, r:0.16, color:'#c9d98a',
    from:24, origin:'выходит из дождевика', wave:null,
    traits:{maturation:{seconds:8}},
    intro:'через 8 с вырастает в Дождевика; уничтожай до созревания',
    attackAnim:{duration:.65,contact:.5},
    art(c,r,f){
      const attack=f.siege?Dozhdevik.sporeAttackProgress(f.atk,f.attackAfter||0):null;
      let target;
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;
        target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Dozhdevik.drawSpore(c,{size:r*2.7,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,attack,
        growth:Math.max(0,Math.min(1,((f.growthAge||0)-6)/2)),
        state:f.siege?(attack===null?'idle':'attack'):'walk',birth:f.bornAt==null?null:Math.max(0,G.t-f.bornAt)});
    }
  },
  // Светлячок: лесной жук; светящиеся сегменты брюшка ускоряют соседей
  lantern: {
    voice:'lantern',
    name:'Светлячок', about:'лесной дух с листовыми надкрыльями и янтарным брюшком; парит над дорогой и ускоряет соседей своим светом',
    hp:34, sp:1.5, armor:0, bounty:20, hit:1, atk:1.4, r:0.28, color:'#ffcf7a',
    from:31, threat:2.2, mix:true, gap:1.6, wave:(L, W, late) => W >= 3 ? (late < 0.6 ? 1 : 2) : 0,
    traits:{ haste:{ r:1.2, k:0.25 } },
    intro:'Светлячок ускоряет соседей своим свечением — сними его первым',
    attackAnim:{duration:.9,contact:.6},
    art(c,r,f){
      const attack=f.siege?Svetlyachok.attackProgress(f.atk,f.attackAfter||0):null;
      let target;
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;
        target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Svetlyachok.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,
        state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },
  // Росник: капля росы, в которой кто-то живёт; лечит соседей
  dew: {
    voice:'dew',
    name:'Росник', about:'капля росы, в которой живёт кто-то маленький и добрый; лечит всех, кто идёт рядом',
    hp:80, sp:1.1, armor:0, bounty:42, hit:1, atk:1.8, r:0.32, color:'#8fd8c8',
    from:39, threat:2.4, mix:true, gap:1.8, wave:(L, W, late) => W >= 3 ? (late < 0.6 ? 1 : 2) : 0,
    traits:{ heal:{ r:1.2, k:0.02 } },
    intro:'лечит соседей — добивай его первым',
    attackAnim:{duration:1,contact:.6},
    art(c,r,f){
      const attack=f.siege?Rosnik.attackProgress(f.atk,f.attackAfter||0):null;
      let target;
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;
        target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Rosnik.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,
        state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },
  // Кротень: подземный дух; больше под землёй, чем над ней
  mole: {
    name:'Кротень', about:'подслеповатый подземный дух с розовым носом; под землёй ему спокойнее, чем наверху',
    hp:120, sp:1.05, armor:2, bounty:38, hit:1, atk:1.6, r:0.33, color:'#5a4634',
    from:47, threat:2.0, gap:1.0, wave:(L, W, late) => W >= 3 ? 1 + Math.round(late * (1 + (L - 47) * 0.02)) : 0,
    traits:{ burrow:{ over:3.0, under:2.0 } },
    intro:'уходит под землю — там его не достать; лови на поверхности',
    step:2.4,
    attackAnim:{duration:.9,contact:.6},
    art(c,r,f){
      const attack=f.siege?Kroten.attackProgress(f.atk,f.attackAfter||0):null;
      let state=f.siege?(attack===null?'idle':'attack'):'walk',progress=0,target;
      if(!f.siege&&f.emergeT>0){state='emerge';progress=1-f.emergeT/.45;}
      else if(!f.siege&&f.burrowT<=.5){state='dig';progress=1-f.burrowT/.5;}
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;
        target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Kroten.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,state,progress,attack});
    }
  },
  // Соломенник: сноп соломы, который встал и пошёл. Пули вязнут, взрыв разносит
  straw: {
    name:'Соломенник', about:'сноп соломы, который однажды встал и пошёл; подпоясан верёвкой, глаза-угольки',
    hp:110, sp:1.2, armor:0, bounty:39, hit:1, atk:1.5, r:0.32, color:'#d9b95a',
    from:55, threat:1.6, gap:0.7, wave:(L, W, late) => W >= 2 ? 2 + Math.round(late * (1.5 + (L - 55) * 0.02)) : 0,
    traits:{ weak:{ shot:0.5, splash:2 } },
    intro:'пули вязнут в соломе, зато мортира разносит его в клочья',
    step:2.0,
    attackAnim:{duration:.9,contact:.6},
    art(c,r,f){
      const attack=f.siege?Solomennik.attackProgress(f.atk,f.attackAfter||0):null;
      let target;
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;
        target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Solomennik.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },
  // Гулень: толстый лесной дух с полым бревном; под его гул соседи держат удар
  drummer: {
    voice:'drum',
    name:'Гулень', about:'толстый лесной дух с полым бревном вместо барабана; под его гул соседи не чувствуют ударов',
    hp:150, sp:0.9, armor:3, bounty:58, hit:2, atk:2.2, r:0.36, color:'#6f8f5a',
    from:64, threat:2.4, mix:true, gap:2.0, wave:(L, W, late) => W >= 4 ? (late < 0.6 ? 1 : 2) : 0,
    traits:{ drum:{ r:1.4, armor:3 } },
    intro:'бьёт в барабан, и соседи под гул держат удар — глуши его мортирой',
    step:1.7, dust:true,
    attackAnim:{duration:1.1,contact:.6},
    art(c,r,f){
      const attack=f.siege?Gulen.attackProgress(f.atk,f.attackAfter||0):Gulen.attackProgress(f.drumT??3,f.drumAfter||0);
      let target;
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Gulen.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },
  // Скакунок: зелёный дух-кузнечик; сидит, сидит — и вдруг уже далеко
  leaper: {
    name:'Скакунок', about:'зелёный дух-кузнечик: сидит, сидит — и вдруг уже далеко впереди',
    hp:55, sp:1.3, armor:0, bounty:24, hit:1, atk:1.2, r:0.27, color:'#8fcf6a',
    from:74, threat:1.6, gap:0.5, wave:(L, W, late) => W >= 2 ? 2 + Math.round(late * (2 + (L - 74) * 0.02)) : 0,
    traits:{ leap:{ every:2.4, dist:1.5, air:0.3 } },
    intro:'прыгает на полторы клетки разом — мортира с упреждением по нему мажет',
    step:3,
    attackAnim:{duration:.8,contact:.6},
    art(c,r,f){
      const attack=f.siege?Skakunok.attackProgress(f.atk,f.attackAfter||0):null;
      let state=f.siege?(attack===null?'idle':'attack'):'walk',progress=0,target;
      if(!f.siege){if(f.air>0){state='air';progress=1-f.air/f.airMax;}else if(f.landT>0){state='land';progress=1-f.landT/.18;}else if(f.leapT<.22){state='crouch';progress=1-f.leapT/.22;}}
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Skakunok.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,state,progress,attack});
    }
  },
  // Семянница: старый одуванчик с лицом; куда ни пойдёт — сеет пушинок
  seedmother: {
    name:'Семянница', about:'старый одуванчик с лицом; куда ни пойдёт — сеет за собой пушинок',
    hp:220, sp:0.75, armor:2, bounty:48, hit:2, atk:2.4, r:0.40, color:'#e8e8d0',
    from:85, threat:2.0, gap:2.0, wave:(L, W, late) => W >= 5 ? 1 + Math.round(late * (0.5 + (L - 85) * 0.02)) : 0,
    traits:{ spawner:{ type:'swarm', every:2.2, max:8 } },
    intro:'на ходу выпускает пушинок — чем дольше живёт, тем больше их',
    step:1.5, dust:true,
    art(c,r,f){Semyannitsa.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,state:f.siege?'idle':'walk',release:f.lastSeedAt==null?0:Math.max(0,1-(G.t-f.lastSeedAt)/.65)});}

  },
  // Желудник: жёлудь в толстой скорлупе; треснет — побежит
  acorn: {
    name:'Желудник', about:'жёлудь-крепыш в толстой скорлупе; пока цел — неспешен, треснет — побежит',
    hp:200, sp:0.85, armor:14, bounty:34, hit:2, atk:2.2, r:0.36, color:'#9a6a3a',
    from:97, threat:1.4, gap:1.2, wave:(L, W, late) => W >= 4 ? 1 + Math.round(late * (1.5 + (L - 97) * 0.02)) : 0,
    traits:{ crack:{ at:0.5, armor:0, sp:1.7 } },
    intro:'скорлупу берёт только мортира; треснувший теряет броню, но бежит',
    step:2.0, dust:true,
    attackAnim:{duration:1,contact:.6},
    art(c,r,f){
      const attack=f.siege?Zheludnik.attackProgress(f.atk,f.attackAfter||0):null;
      let target;
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Zheludnik.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,cracked:f.cracked,crackAge:f.crackAt==null?-1:G.t-f.crackAt,state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },
  // Тенник: тень без хозяина; в толпе её не видно
  shade: {
    name:'Тенник', about:'тень без хозяина; в толпе её не разглядеть, а одна она робеет',
    hp:60, sp:1.6, armor:0, bounty:36, hit:1, atk:1.3, r:0.28, color:'#4a3a66',
    from:109, threat:2.0, gap:0.5, wave:(L, W, late) => W >= 3 ? 2 + Math.round(late * (2 + (L - 109) * 0.02)) : 0,
    traits:{ veil:{ r:0.9 } },
    intro:'прячется за спинами — башни не видят его, пока рядом кто-то ещё',
    attackAnim:{duration:.9,contact:.55},
    art(c,r,f){
      const attack=f.siege?Tennik.attackProgress(f.atk,f.attackAfter||0):null;let target;
      if(f.siege){const gate=siegeFrame().b,q=foePos(f),h=foeHeading(f),dx=(gate.x-q.x)*CELL,dy=(gate.y-q.y)*CELL;target={x:dx*Math.cos(h)+dy*Math.sin(h),y:-dx*Math.sin(h)+dy*Math.cos(h)};}
      Tennik.draw(c,{size:r*3,time:G.t,distance:f.d,seed:f.ph,shadow:false,target,veil:f.veilBlend||0,reveal:f.revealT||0,state:f.siege?(attack===null?'idle':'attack'):'walk',attack});
    }
  },

  /* Босс: один тип в правилах, четыре облика на экране — меняется каждые три
     карты (skins, BOSS_ART). Числа у всех одинаковые: облик не должен ломать
     выверенный баланс. У ворот бьёт как уголёк — по одному, — но живёт долго;
     его цена набирается временем, а не силой удара. При трёх за две секунды
     дошедший босс на поздней карте был автоматическим проигрышем.
     Когда босс был вдвое крепче и снимал 5 жизней разом, вся сложность поздних
     карт сводилась к нему одному: симуляция теряла ровно 10 жизней и на 5-м
     уровне, и на 12-м — звёзды перестали различать карты.
     Боссов в финале не больше трёх: их здоровье и так растёт с уровнем, а четыре
     по 7000 HP в финале второй дюжины были стеной — симуляция теряла там по
     13–16 прочности при чистых предыдущих волнах. */
  boss: {
    voice:'guardian',
    name:'Хранитель', about:'дух-хранитель этих мест; в финале карты выходит сам, а с 5-й — ещё и в середине',
    hp:430, sp:0.80, armor:6, bounty:70, hit:1, atk:2.0, r:0.44, color:'#ee3550',
    skins: BOSS_SKINS,
    gap:2.2, wave:(L, W, late, nW, final) => final ? { n: 1 + Math.min(2, Math.floor(L / 4)), gap: 2.2 }
                                          : (L >= 5 && W === Math.floor(nW / 2)) ? { n: 1, gap: 1 } : 0,
    step:1.5, dust:true,
    gait(f){ if((f.skin||0)<=3)return {bob:0,sq:0}; const ph = (f.d * 1.5) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.12, sq: 0 }; },
    art(c, r, f){ BOSS_ART[f.skin || 0](c, r, f); }
  }
};
const FOE_ORDER = Object.keys(FOES);
// список особенностей карточки — один раз, а не Object.entries на каждое попадание
for (const k of FOE_ORDER) FOES[k].tr = Object.entries(FOES[k].traits || {});


window.BestiaryCurrent={draw(c,type,size,time=0,heading=0,skin=0){const b=FOES[type];if(!b)throw Error('Unknown creature '+type);G.t=time;CELL=size/1.15;const r=size*.27,f={type,skin,viewHeading:heading,r:b.r,d:time*b.sp,ph:1.7,air:0,airMax:1,cracked:false};const gait=b.gait?b.gait(f):{};c.save();c.rotate(heading+(gait.roll||0));c.translate(0,-(gait.bob||0)*.4);c.scale(1+(gait.sq||0),1-(gait.sq||0));b.art(c,r,f);c.restore();}};
})();