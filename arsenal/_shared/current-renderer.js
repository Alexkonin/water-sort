/* Snapshot of tower-defense.html, 2026-10-04. Refresh with scripts/sync-arsenal.py. */
window.ArsenalCurrent = (() => {
let CELL=100; const G={t:0,castle:{lvl:1,aim:-.5,flash:0},lives:20};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TOWERS = {
  gun:    { name:'Пушка',   em:'🔫', cost:55,  range:2.8, rate:1.25, dmg:13, kind:'shot',
            color:'#dfc373', about:'по одному, надёжно' },
  frost:  { name:'Мороз',   em:'❄️', cost:70,  range:2.4, rate:1.00, dmg:4,  kind:'frost',
            slow:0.45, slowT:1.7, color:'#8ad7c3', about:'замедляет на 45%' },
  tesla:  { name:'Молния',  em:'⚡', cost:110, range:2.3, rate:1.00, dmg:8,  kind:'chain',
            chain:3, color:'#d6e7a0', about:'бьёт до трёх сразу' },
  mortar: { name:'Мортира', em:'💥', cost:140, range:4.4, rate:0.55, dmg:30, kind:'splash',
            splash:1.20, color:'#d99a73', about:'взрыв по площади' }
};
const TW_ORDER = ['gun','frost','tesla','mortar'];
/* Числа абсолютны относительно первого разряда, не перемножаются.
   Все пять разрядов доступны на любой карте; ограничение — только золото.
   Специализация растёт отдельно: частота / замедление / цепь / взрыв. */
const UPGRADES = [null,
  { dmg:1,    range:1,    cost:0 },
  { dmg:1.65, range:1.08, cost:0.9 },
  { dmg:2.50, range:1.16, cost:1.7 },
  { dmg:3.70, range:1.22, cost:2.6 },
  { dmg:5.40, range:1.28, cost:3.6 }];
const MAX_TW_LVL = 5;
const TOWER_TIERS = {
  gun: {
    names:['Дозор', 'Калибр', 'Арсенал', 'Бастион', 'Цитадель'],
    rate:[1, 1.08, 1.16, 1.28, 1.40]
  },
  frost: {
    names:['Осколок', 'Кристалл', 'Иней', 'Метель', 'Вечная зима'],
    slow:[0.45, 0.50, 0.55, 0.60, 0.65],
    slowT:[1.7, 1.9, 2.1, 2.3, 2.5]
  },
  tesla: {
    names:['Искра', 'Катушка', 'Разряд', 'Гроза', 'Шторм'],
    chain:[3, 3, 4, 4, 5]
  },
  mortar: {
    names:['Ядро', 'Гром', 'Осадная', 'Вулкан', 'Метеор'],
    splash:[1.20, 1.30, 1.40, 1.55, 1.70]
  }
};
const SELL_BACK = 0.6;

/* Замок развивается на текущей карте, как башни. Цена — за переход в этот
   разряд. Новые стены добавляют только прирост максимальной прочности. */
const CASTLE_TIERS = [null,
  { name:'Застава', hp:20, armor:0,    dmg:0,  rate:0,    range:0,   cost:0 },
  { name:'Каменные стены', hp:28, armor:0.10, dmg:0,  rate:0,    range:0,   cost:80 },
  { name:'Бастион', hp:38, armor:0.20, dmg:0,  rate:0,    range:0,   cost:130 },
  { name:'Лучники', hp:48, armor:0.25, dmg:6,  rate:0.75, range:2.2, cost:190 },
  { name:'Баллиста', hp:60, armor:0.30, dmg:10, rate:1,    range:2.6, cost:270 }
];
const MAX_CASTLE_LVL = CASTLE_TIERS.length - 1;
const castleStats = (castle = G.castle) => CASTLE_TIERS[castle.lvl];

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
function drawCastle(c, cx, cy){
  const s = CELL, lvl = G.castle.lvl, hurt = 1 - clamp(G.lives / castleStats().hp, 0, 1);         // 0 цел, 1 руины
  softShadow(c, cx + s * 0.05, cy + s * 0.34, s * 0.58, s * 0.22, 0.6);
  let g = c.createLinearGradient(cx - s * 0.35, cy - s * 0.3, cx + s * 0.35, cy + s * 0.3);
  g.addColorStop(0, '#c4c4a6'); g.addColorStop(0.5, '#8d9c80'); g.addColorStop(1, '#4d6655');
  c.fillStyle = g; rr(c, cx - s * 0.36, cy - s * 0.14, s * 0.72, s * 0.46, s * 0.05); c.fill();      // стена
  c.fillStyle = '#b1ba98';
  for (let i = -1; i <= 1; i++) if (!(hurt > 0.6 && i === 0)) c.fillRect(cx + i * s * 0.24 - s * 0.07, cy - s * 0.25, s * 0.14, s * 0.13);  // зубцы (средний отбит в руинах)
  if (hurt > 0.3){                                                                                   // трещины по стене
    c.strokeStyle = 'rgba(20,10,35,.75)'; c.lineWidth = Math.max(1, s * 0.03); c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - s * 0.2, cy - s * 0.1); c.lineTo(cx - s * 0.1, cy + s * 0.05); c.lineTo(cx - s * 0.22, cy + s * 0.22); c.stroke();
    if (hurt > 0.6){ c.beginPath(); c.moveTo(cx + s * 0.25, cy - s * 0.12); c.lineTo(cx + s * 0.15, cy + s * 0.08); c.lineTo(cx + s * 0.28, cy + s * 0.25); c.stroke(); }
  }
  c.fillStyle = '#142b25';                                                                          // ворота
  c.beginPath(); c.moveTo(cx - s * 0.1, cy + s * 0.32); c.lineTo(cx - s * 0.1, cy + s * 0.1);
  c.arc(cx, cy + s * 0.1, s * 0.1, Math.PI, 0); c.lineTo(cx + s * 0.1, cy + s * 0.32); c.closePath(); c.fill();
  for (const sx of [-1, 1]){                                                                        // башни
    const tx = cx + sx * s * 0.36;
    g = c.createLinearGradient(tx - s * 0.1, 0, tx + s * 0.1, 0);
    g.addColorStop(0, '#d3d0b2'); g.addColorStop(1, '#637962');
    c.fillStyle = g; rr(c, tx - s * 0.11, cy - s * 0.3, s * 0.22, s * 0.62, s * 0.04); c.fill();
    g = c.createLinearGradient(tx - s * 0.15, 0, tx + s * 0.15, 0);
    g.addColorStop(0, '#d7c16e'); g.addColorStop(1, '#8d7842');
    c.fillStyle = g; poly(c, [[tx - s * 0.16, cy - s * 0.28], [tx + s * 0.16, cy - s * 0.28], [tx, cy - s * 0.54]]); c.fill();
    c.fillStyle = '#ffdc82'; c.fillRect(tx - s * 0.03, cy - s * 0.1, s * 0.06, s * 0.09);           // окно
  }
  if (lvl >= 2){
    c.strokeStyle = lvl >= 3 ? '#e6dfc5' : '#a3ae90'; c.lineWidth = Math.max(1, s * 0.055);
    for (const side of [-1, 1]){
      c.beginPath(); c.moveTo(cx + side * s * 0.24, cy - s * 0.11); c.lineTo(cx + side * s * 0.24, cy + s * 0.28); c.stroke();
    }
    c.strokeStyle = '#ab9abc'; c.lineWidth = Math.max(1, s * 0.025);
    for (const yy of [0.03, 0.18]){ c.beginPath(); c.moveTo(cx - s * 0.3, cy + s * yy); c.lineTo(cx + s * 0.3, cy + s * yy); c.stroke(); }
  }
  if (lvl >= 3){
    c.fillStyle = lvl === 5 ? '#ffda68' : '#77cce5';
    poly(c, [[cx,cy-s*0.23],[cx+s*0.11,cy-s*0.18],[cx+s*0.08,cy-s*0.03],[cx,cy+s*0.03],[cx-s*0.08,cy-s*0.03],[cx-s*0.11,cy-s*0.18]]); c.fill();
    c.strokeStyle = '#4c394f'; c.lineWidth = Math.max(1, s * 0.022); c.stroke();
  }
  if (lvl >= 4){
    c.save(); c.translate(cx, cy - s * 0.3); c.rotate(G.castle.aim);
    const size = lvl === 5 ? 0.22 : 0.15;
    c.strokeStyle = lvl === 5 ? '#ffd878' : '#bb824e'; c.lineWidth = Math.max(1.5, s * 0.055);
    c.beginPath(); c.moveTo(-s * 0.04,-s * size); c.quadraticCurveTo(s * 0.2,0,-s * 0.04,s * size); c.stroke();
    c.strokeStyle = '#f2e5c7'; c.lineWidth = Math.max(1, s * 0.02);
    c.beginPath(); c.moveTo(-s * 0.04,-s * size); c.lineTo(-s * 0.11,0); c.lineTo(-s * 0.04,s * size); c.stroke();
    c.fillStyle = '#675063'; rr(c,-s*0.15,-s*0.04,s*0.39,s*0.08,s*0.02); c.fill();
    if (G.castle.flash > 0) muzzleFlash(c,s*0.2,s*0.23*(G.castle.flash/0.14),'rgba(255,255,230,.9)','rgba(255,210,100,.5)');
    c.restore();
  }
  c.save(); c.translate(cx,cy+s*0.13); studs(c,s*0.8,lvl); c.restore();

}
function platform(c, s, top, side, k){
  const r = s * 0.34 * k;
  softShadow(c, s * 0.03, s * 0.26, r * 1.2, r * 0.5, 0.55);
  c.fillStyle = side; poly(c, octagon(0, s * 0.075, r)); c.fill();
  const g = c.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, top[0]); g.addColorStop(1, top[1]);
  c.fillStyle = g; poly(c, octagon(0, 0, r)); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = Math.max(1, s * 0.025);
  poly(c, octagon(0, 0, r)); c.stroke();
}
function studs(c, s, lvl){
  // при пяти разрядах точки в один ряд не помещаются под постаментом — жмём шаг
  const step = lvl > 3 ? 0.095 : 0.12;
  for (let i = 0; i < lvl; i++){
    const gx = (i - (lvl - 1) / 2) * s * step, gy = s * 0.29;
    c.fillStyle = '#776333'; c.beginPath(); c.arc(gx, gy + s * 0.012, s * 0.036, 0, 7); c.fill();
    c.fillStyle = '#ead184'; c.beginPath(); c.arc(gx, gy, s * 0.036, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(gx - s * 0.012, gy - s * 0.012, s * 0.012, 0, 7); c.fill();
  }
}
function muzzleFlash(c, x, r, inner, mid){
  const g = c.createRadialGradient(x, 0, 0, x, 0, r);
  g.addColorStop(0, inner); g.addColorStop(0.38, mid); g.addColorStop(1, 'rgba(255,140,20,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, 0, r, 0, 7); c.fill();
}

function tierArmor(c, s, lvl, color){
  if (lvl < 4) return;
  c.strokeStyle = lvl === 5 ? '#edda98' : color;
  c.lineWidth = Math.max(1, s * (lvl === 5 ? 0.045 : 0.03));
  poly(c, octagon(0, 0, s * 0.39)); c.stroke();
  for (const side of [-1, 1]){
    c.fillStyle = '#263c32';
    rr(c, side * s * 0.31 - s * 0.045, -s * 0.18, s * 0.09, s * 0.34, s * 0.025); c.fill();
    c.fillStyle = lvl === 5 ? '#edda98' : color;
    c.fillRect(side * s * 0.31 - s * 0.025, -s * 0.1, s * 0.05, s * 0.15);
  }
}
function iceShard(c, s, x, y, h){
  c.fillStyle = '#e9faf0'; poly(c, [[x,y-h],[x-s*0.06,y],[x,y+s*0.025]]); c.fill();
  c.fillStyle = '#7acabd'; poly(c, [[x,y-h],[x+s*0.06,y],[x,y+s*0.025]]); c.fill();
}

// Flat, top-down gun family. Shape communicates rank; no rank-count dots.
const GunDesign = (() => {
  const palettes={
    fortress:{base:'#88937a',edge:'#405645',top:'#c5c9a5',metal:'#637762',light:'#d0d7b3',accent:'#dfc477',dark:'#233c32'},
    woodland:{base:'#946b43',edge:'#4a4330',top:'#c9a477',metal:'#466452',light:'#aabe91',accent:'#d5ae65',dark:'#263e32'},
    precise:{base:'#637c78',edge:'#304e4d',top:'#a1bcb1',metal:'#4a6567',light:'#c4ded1',accent:'#93d8c3',dark:'#203d3e'}
  };
  const names=['Дозор','Калибр','Арсенал','Бастион','Цитадель'];
  function polygon(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
  function shape(c,points,fill,stroke,width=.018){polygon(c,points);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function rect(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.018;c.stroke();}}
  function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.018;c.stroke();}}
  function oct(r,cut=.3){const a=r*(1-cut);return [[-a,-r],[a,-r],[r,-a],[r,a],[a,r],[-a,r],[-r,a],[-r,-a]];}
  function body(c,s,lvl,style='fortress',silhouette=false){
    const p=palettes[style]||palettes.fortress,r=.29+(lvl-1)*.018;
    c.save();c.scale(s,s);
    const base=style==='woodland'?[[-r,-r],[r,-r],[r,r],[-r,r]]:style==='precise'?[[0,-r*1.12],[r,-r*.55],[r,r*.55],[0,r*1.12],[-r,r*.55],[-r,-r*.55]]:oct(r);
    if(silhouette){shape(c,base,'#d5dec7');c.restore();return;}
    c.save();c.translate(.025,.035);shape(c,base,'#112a2560');c.restore();
    shape(c,base,p.base,p.edge,.022);
    c.save();c.scale(.87,.87);shape(c,base,p.top);c.restore();
    if(style==='woodland'){
      c.strokeStyle=p.base;c.lineWidth=.015;
      for(const x of [-.13,0,.13]){c.beginPath();c.moveTo(x,-r*.85);c.lineTo(x,r*.85);c.stroke();}
      for(const y of [-r*.68,r*.68])rect(c,-r*.92,y-.023,r*1.84,.046,.01,p.edge);
    }else if(style==='fortress'){
      c.strokeStyle=p.base;c.lineWidth=.016;
      for(let j=0;j<4;j++){const a=Math.PI/4+j*Math.PI/2;c.beginPath();c.moveTo(Math.cos(a)*r*.7,Math.sin(a)*r*.7);c.lineTo(Math.cos(a)*r*1.1,Math.sin(a)*r*1.1);c.stroke();}
    }else{
      for(const y of [-r*.75,r*.75])rect(c,-.09,y-.012,.18,.024,.008,p.accent);
    }
    // Shared bearing: one simple concentric ring, no perspective tilt.
    circle(c,0,0,.235,p.edge);circle(c,0,0,.207,p.base);
    if(lvl===5){c.save();c.scale(.98,.98);polygon(c,base);c.strokeStyle=p.accent;c.lineWidth=.024;c.stroke();c.restore();}
    c.restore();
  }
  function live(c,s,t,style='fortress',silhouette=false){
    const p=palettes[style]||palettes.fortress,lvl=t.lvl,aim=t.aim??-Math.PI/2;
    const length=.38+(lvl-1)*.025,width=[0,.105,.17,.17,.195,.215][lvl],back=-(t.recoil||0)*.07;
    c.save();c.scale(s,s);c.rotate(aim);
    const lx=-Math.cos(aim)-Math.sin(aim),ly=Math.sin(aim)-Math.cos(aim);
    const fill=silhouette?'#d5dec7':c.createLinearGradient(lx*.24,ly*.24,-lx*.24,-ly*.24);
    if(!silhouette){fill.addColorStop(0,p.light);fill.addColorStop(.5,p.metal);fill.addColorStop(1,p.dark);}
    const edge=silhouette?undefined:p.dark,accent=silhouette?'#d5dec7':p.accent;
    // Each rank has a distinct outline in any direction.
    if(lvl===1){
      if(style==='woodland')rect(c,-.18,-.15,.35,.3,.07,fill,edge);
      else if(style==='precise')shape(c,oct(.17,.48),fill,edge);
      else circle(c,0,0,.164,fill,edge);
    }else if(lvl===2){rect(c,-.205,-.14,.4,.28,.12,fill,edge);}
    else if(lvl===3){
      rect(c,-.105,-.25,.055,.5,.01,fill,edge);
      rect(c,-.21,-.16,.36,.32,.045,fill,edge);
      for(const side of [-1,1])rect(c,-.18,side*.25-.05,.29,.1,.025,fill,edge);
    }else if(lvl===4){shape(c,[[-.27,-.15],[-.15,-.255],[.13,-.255],[.265,-.12],[.265,.12],[.13,.255],[-.15,.255],[-.27,.15]],fill,edge);}
    else{
      shape(c,[[-.29,-.18],[-.2,-.23],[.13,-.23],[.23,-.12],[.23,.12],[.13,.23],[-.2,.23],[-.29,.18]],fill,edge);
      for(const side of [-1,1])shape(c,[[-.19,side*.23],[-.13,side*.32],[.28,side*.32],[.35,side*.24],[.25,side*.19]],fill,edge);
      if(!silhouette)for(const side of [-1,1])rect(c,-.1,side*.273-.012,.32,.024,.009,p.accent);
    }
    // A single barrel throughout; thicker jackets express calibre and rank.
    rect(c,back+.015,-width/2,length-.015,width,.018,fill,edge);
    if(lvl>=2)rect(c,back+.06,-width*.72,.105,width*1.44,.024,fill,edge);
    if(lvl>=4)rect(c,back+length-.075,-width*.67,.075,width*1.34,.012,fill,edge);
    if(!silhouette){
      rect(c,back+length-.03,-width*.48,.03,width*.96,.005,p.dark);
      if(lvl>=2)rect(c,back+.10,-width*.67,.025,width*1.34,.005,accent);
      // Clear rear cap ties the gun to the bearing, without another ornament.
      rect(c,-.12,-.055,.1,.11,.025,p.metal,p.dark);
      if(t.flash>0){const g=c.createRadialGradient(length,0,0,length,0,.30*(t.flash/.07));g.addColorStop(0,'#fff8db');g.addColorStop(.35,'#f3c667b0');g.addColorStop(1,'#f3c66700');c.fillStyle=g;c.beginPath();c.arc(length,0,.30*(t.flash/.07),0,7);c.fill();}
    }
    c.restore();
  }
  return {body,live,names,palettes};
})();

const TOWER_ART = {
  gun: {
    body(c,s,lvl){GunDesign.body(c,s,lvl);},
    live(c,s,t){GunDesign.live(c,s,t);}
  },
  frost: {
    body(c, s, lvl){
      const k = 1 + (lvl - 1) * 0.045, r = s * 0.17 * k, h = s * 0.42 * k, w = s * 0.12 * k;
      platform(c, s, ['#99b9ab', '#446f64'], '#24473e', k);
      tierArmor(c, s, lvl, '#8ad7c3');
      if (lvl >= 2) iceShard(c, s, -s * 0.18, -s * 0.04, s * (lvl >= 4 ? 0.29 : 0.18));
      if (lvl >= 3) iceShard(c, s, s * 0.18, -s * 0.04, s * (lvl >= 4 ? 0.29 : 0.18));
      if (lvl === 5){
        iceShard(c, s, -s * 0.1, -s * 0.18, s * 0.3);
        iceShard(c, s, s * 0.1, -s * 0.18, s * 0.3);
      }
      c.fillStyle = '#37685e'; poly(c, hexagon(0, s * 0.05, r)); c.fill();
      let g = c.createLinearGradient(-r, -r, r, r);
      g.addColorStop(0, '#e1f4e9'); g.addColorStop(1, '#68b6ad');
      c.fillStyle = g; poly(c, hexagon(0, 0, r)); c.fill();
      c.fillStyle = '#e9faf0'; poly(c, [[0, -h], [-w, -s * 0.08], [0, s * 0.02]]); c.fill();          // светлая грань
      c.fillStyle = '#7acabd'; poly(c, [[0, -h], [w, -s * 0.08], [0, s * 0.02]]); c.fill();           // тёмная грань
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(1, s * 0.02);
      c.beginPath(); c.moveTo(-w * 0.4, -h * 0.5); c.lineTo(-w * 0.15, -h * 0.88); c.stroke();
      studs(c, s, lvl);
    },
    live(c, s, t){
      const k = 1 + (t.lvl - 1) * 0.045, p = 0.5 + 0.5 * Math.sin(G.t * 3 + t.x);
      const g = c.createRadialGradient(0, -s * 0.2, 0, 0, -s * 0.2, s * 0.34);
      g.addColorStop(0, 'rgba(153,225,202,' + (0.22 + p * 0.12) + ')'); g.addColorStop(1, 'rgba(153,225,202,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, -s * 0.2, s * 0.34, 0, 7); c.fill();
      if (t.lvl >= 4){
        c.strokeStyle = 'rgba(155,222,193,' + (0.25 + p * 0.2) + ')'; c.lineWidth = Math.max(1, s * 0.025);
        c.beginPath(); c.ellipse(0, -s * 0.09, s * 0.34, s * 0.14, 0, 0, Math.PI * 2); c.stroke();
      }
      const n = t.lvl + 1;
      for (let i = 0; i < n; i++){
        const a = G.t * 1.6 + i * Math.PI * 2 / n;
        c.save(); c.translate(Math.cos(a) * s * 0.27 * k, -s * 0.18 + Math.sin(a) * s * 0.1); c.rotate(a * 2);
        c.fillStyle = '#c8eee0'; poly(c, [[0, -s * 0.055], [s * 0.03, 0], [0, s * 0.055], [-s * 0.03, 0]]); c.fill();
        c.restore();
      }
    }
  },
  tesla: {
    body(c, s, lvl){
      const k = 1 + (lvl - 1) * 0.045, pw = s * 0.1 * k, top = -s * 0.26 * k, coils = 2 + lvl;
      platform(c, s, ['#a39061', '#60563a'], '#353a26', k);
      tierArmor(c, s, lvl, '#d6e7a0');
      if (lvl >= 3) for (const side of [-1, 1]){
        const x = side * s * 0.23, y = -s * (lvl >= 4 ? 0.28 : 0.12);
        c.fillStyle = '#aa7847'; rr(c, x - s * 0.028, y, s * 0.056, -y + s * 0.08, s * 0.02); c.fill();
        c.fillStyle = '#eef3c5'; c.beginPath(); c.arc(x, y, s * (lvl === 5 ? 0.075 : 0.05), 0, 7); c.fill();
      }
      let g = c.createLinearGradient(-pw / 2, 0, pw / 2, 0);
      g.addColorStop(0, '#d9a25a'); g.addColorStop(0.5, '#8a5a24'); g.addColorStop(1, '#46290d');
      c.fillStyle = g; rr(c, -pw / 2, top, pw, s * 0.34 * k, pw * 0.3); c.fill();
      for (let i = 0; i < coils; i++){
        g = c.createLinearGradient(-pw, 0, pw, 0);
        g.addColorStop(0, '#f5c076'); g.addColorStop(1, '#70431a');
        c.fillStyle = g; c.beginPath(); c.ellipse(0, s * 0.02 - i * (s * 0.26 * k) / coils, pw * 1.15, pw * 0.42, 0, 0, 7); c.fill();
      }
      studs(c, s, lvl);
    },
    live(c, s, t){
      const k = 1 + (t.lvl - 1) * 0.045, R = s * 0.13 * k, y = -s * 0.3 * k;
      if (t.lvl >= 4){
        c.strokeStyle = 'rgba(224,237,173,.75)'; c.lineWidth = Math.max(1, s * 0.022);
        for (const side of [-1, 1]){
          c.beginPath(); c.moveTo(side * s * 0.23, -s * 0.28);
          c.lineTo(side * s * 0.14, -s * (0.32 + 0.035 * Math.sin(G.t * 12)));
          c.lineTo(0, y); c.stroke();
        }
      }
      // заряд: свечение нарастает к выстрелу, а в момент выстрела вспыхивает
      const charge = 1 - clamp(t.cool * towerStats(t).rate, 0, 1), p = charge * 0.7 + (t.flash > 0 ? 0.6 : 0);
      let g = c.createRadialGradient(0, y, 0, 0, y, R * (2.4 + p));
      g.addColorStop(0, 'rgba(217,234,156,' + (0.2 + p * 0.35) + ')'); g.addColorStop(1, 'rgba(175,204,109,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, y, R * (2.4 + p), 0, 7); c.fill();
      g = c.createRadialGradient(-R * 0.35, y - R * 0.35, R * 0.1, 0, y, R);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#dbe9a5'); g.addColorStop(1, '#829e49');
      c.fillStyle = g; c.beginPath(); c.arc(0, y, R, 0, 7); c.fill();
      c.strokeStyle = 'rgba(240,246,199,.8)'; c.lineWidth = Math.max(1, s * 0.02);
      for (let i = 0; i < t.lvl; i++){                                                              // разряды
        const a = G.t * 9 + i * 2.1 + t.x, ax = Math.cos(a) * R, ay = y + Math.sin(a) * R;
        c.beginPath(); c.moveTo(ax, ay);
        c.lineTo(ax + Math.cos(a + 0.6) * R * 0.5, ay + Math.sin(a + 0.6) * R * 0.5);
        c.lineTo(ax + Math.cos(a - 0.2) * R * 0.95, ay + Math.sin(a - 0.2) * R * 0.95); c.stroke();
      }
    }
  },
  mortar: {
    body(c, s, lvl){
      const k = 1 + (lvl - 1) * 0.045, w = s * 0.5 * k, h = s * 0.3 * k;
      platform(c, s, ['#a4987c', '#625d46'], '#393b2b', k);
      tierArmor(c, s, lvl, '#d99a73');
      if (lvl >= 2) for (const side of [-1, 1]){
        c.fillStyle = '#b5b297'; rr(c, side * s * 0.29 - s * 0.05, -s * 0.24, s * 0.1, s * 0.43, s * 0.03); c.fill();
        if (lvl >= 3){
          c.fillStyle = lvl === 5 ? '#ebd499' : '#d99a73';
          for (let j = 0; j < (lvl === 5 ? 3 : 2); j++){
            c.beginPath(); c.arc(side * s * 0.29, -s * (0.17 - j * 0.1), s * 0.037, 0, 7); c.fill();
          }
        }
      }
      c.fillStyle = '#2c3327'; rr(c, -w / 2, -h / 2 + s * 0.08, w, h, s * 0.06); c.fill();            // борт
      const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, '#d4ceb2'); g.addColorStop(0.5, '#969273'); g.addColorStop(1, '#515940');
      c.fillStyle = g; rr(c, -w / 2, -h / 2 + s * 0.04, w, h, s * 0.06); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)';
      for (const [rx, ry] of [[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]]){
        c.beginPath(); c.arc(rx * w / 2 * 0.9, s * 0.04 + ry * h / 2 * 0.9, s * 0.022, 0, 7); c.fill();
      }
      studs(c, s, lvl);
    },
    live(c, s, t){
      const k = 1 + (t.lvl - 1) * 0.045, L = s * (0.32 + t.lvl * 0.025), w = s * (0.24 + t.lvl * 0.018);
      c.rotate(t.aim == null ? -Math.PI / 2 : t.aim);
      const back = -(t.recoil || 0) * s * 0.09;
      c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, back - s * 0.04, -w / 2 + s * 0.035, L + s * 0.06, w, w * 0.25); c.fill();  // тень ствола
      const g = c.createLinearGradient(0, -w / 2, 0, w / 2);
      g.addColorStop(0, '#e4dcc0'); g.addColorStop(0.45, '#a39d7d'); g.addColorStop(1, '#3d4732');
      c.fillStyle = g; rr(c, back - s * 0.06, -w / 2, L + s * 0.06, w, w * 0.25); c.fill();
      for (let i = 0; i < t.lvl; i++){ c.fillStyle = i ? '#ead184' : '#eee7cd'; c.fillRect(back + L * 0.18 + i * L * 0.58 / Math.max(1, t.lvl - 1), -w / 2, w * 0.13, w); }
      c.fillStyle = '#19231b'; c.beginPath(); c.ellipse(back + L, 0, w * 0.24, w * 0.5, 0, 0, 7); c.fill();     // жерло
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = Math.max(1, s * 0.02); c.stroke();
      c.fillStyle = '#4a523c'; c.beginPath(); c.ellipse(back + L - w * 0.06, 0, w * 0.13, w * 0.32, 0, 0, 7); c.fill();
      if (t.flash > 0) muzzleFlash(c, L, s * 0.36 * (t.flash / 0.07), 'rgba(255,240,200,.9)', 'rgba(255,150,40,.7)');
    }
  }
};

function towerStats(t){
  const b = TOWERS[t.type], u = UPGRADES[t.lvl], role = TOWER_TIERS[t.type], i = t.lvl - 1;
  return { dmg:b.dmg * u.dmg, range:b.range * u.range,
    rate:b.rate * (role.rate ? role.rate[i] : 1),
    slow:role.slow ? role.slow[i] : b.slow,
    slowT:role.slowT ? role.slowT[i] : b.slowT,
    chain:role.chain ? role.chain[i] : b.chain,
    splash:role.splash ? role.splash[i] : b.splash };
}

return {GunDesign,TOWERS,TOWER_TIERS,CASTLE_TIERS,towerStats,draw(c,type,lvl,s,time,aim,hp){
CELL=s;G.t=time; c.save();
if(type==='castle'){G.castle={lvl,aim,flash:0};G.lives=CASTLE_TIERS[lvl].hp*hp;drawCastle(c,0,0);}
else {const t={type,lvl,x:0,aim,cool:0,flash:0,recoil:0};TOWER_ART[type].body(c,s,lvl);TOWER_ART[type].live(c,s,t);}
c.restore();}};
})();
