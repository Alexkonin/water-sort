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
  function forestLord(c, r, f){                                                                    // рогатый хранитель леса
    const p = 0.5 + 0.5 * Math.sin(G.t * 2 + f.ph);
    let g = c.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.7);
    g.addColorStop(0, 'rgba(120,200,110,' + (0.14 + p * 0.1) + ')'); g.addColorStop(1, 'rgba(120,200,110,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.7, 0, 7); c.fill();
    legs(c, r, stepPhase(f), 2, 0.4, '#3c5c2c', 0.2, 0.5);
    c.fillStyle = '#e4d9bd';                                                                        // налитые ветвистые рога
    for (const s of [-1, 1]){
      c.beginPath();
      c.moveTo(r * 0.3, s * r * 0.3);
      c.quadraticCurveTo(r * 1.0, s * r * 0.85, r * 1.5, s * r * 0.5);                               // основная ветвь
      c.lineTo(r * 1.52, s * r * 0.78);
      c.quadraticCurveTo(r * 1.05, s * r * 1.18, r * 0.9, s * r * 1.5);                              // отросток вверх
      c.lineTo(r * 0.62, s * r * 1.42);
      c.quadraticCurveTo(r * 0.78, s * r * 0.95, r * 0.3, s * r * 0.62);
      c.closePath(); c.fill();
      c.beginPath();                                                                                 // второй отросток
      c.moveTo(r * 1.15, s * r * 0.72); c.lineTo(r * 1.72, s * r * 1.0); c.lineTo(r * 1.5, s * r * 1.12);
      c.closePath(); c.fill();
    }
    c.fillStyle = grad(c, 'bossF', r, () => { const g = c.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.15);
      g.addColorStop(0, '#a8d88a'); g.addColorStop(0.5, '#6d9e4a'); g.addColorStop(1, '#27411c'); return g; });
    c.beginPath(); c.ellipse(0, 0, r * 1.1, r * 0.98, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(60,110,50,.5)';                                                             // мох на спине
    for (const [dx, dy, rr2] of [[-0.5, -0.4, 0.3], [-0.1, -0.55, 0.22], [-0.7, 0.15, 0.24]]) { c.beginPath(); c.arc(dx * r, dy * r, rr2 * r, 0, 7); c.fill(); }
    gloss(c, -r * 0.4, -r * 0.45, r * 0.32, r * 0.14, 0.25);
    c.fillStyle = 'rgba(232,226,200,.9)';                                                           // бледная морда
    c.beginPath(); c.ellipse(r * 0.62, 0, r * 0.46, r * 0.42, 0, 0, 7); c.fill();
    roundEyes(c, r * 0.6, r * 0.24, r * 0.16, '#2a1f10');
    c.fillStyle = 'rgba(60,48,28,.7)'; c.beginPath(); c.ellipse(r * 0.98, 0, r * 0.11, r * 0.07, 0, 0, 7); c.fill();
  },
  function whiteMask(c, r, f){                                                                     // высокий дух в белой маске
    const sway = Math.sin(G.t * 2.2 + f.ph) * 0.06;
    c.rotate(sway);
    c.strokeStyle = 'rgba(20,18,30,.75)'; c.lineWidth = Math.max(1.5, r * 0.1); c.lineCap = 'round';  // длинные тонкие руки
    for (const s of [-1, 1]){
      c.beginPath(); c.moveTo(-r * 0.2, s * r * 0.5);
      c.quadraticCurveTo(r * 0.5, s * r * (1.1 + sway * 2), r * 0.95, s * r * 0.75); c.stroke();
    }
    c.fillStyle = grad(c, 'bossM', r, () => { const g = c.createLinearGradient(0, -r, 0, r * 1.2);
      g.addColorStop(0, '#5a5366'); g.addColorStop(0.5, '#2e2a3c'); g.addColorStop(1, '#141220'); return g; });
    c.beginPath();                                                                                  // тёмный текучий балахон
    c.moveTo(r * 0.75, 0); c.quadraticCurveTo(r * 0.7, -r * 0.95, -r * 0.2, -r * 0.85);
    c.quadraticCurveTo(-r * 1.15, -r * 0.5, -r * 1.1, 0);
    c.quadraticCurveTo(-r * 1.15, r * 0.5, -r * 0.2, r * 0.85);
    c.quadraticCurveTo(r * 0.7, r * 0.95, r * 0.75, 0); c.closePath(); c.fill();
    c.fillStyle = '#efe9db'; c.beginPath(); c.ellipse(r * 0.6, 0, r * 0.46, r * 0.56, 0, 0, 7); c.fill();  // маска
    c.strokeStyle = 'rgba(120,100,80,.5)'; c.lineWidth = Math.max(1, r * 0.03); c.stroke();
    c.fillStyle = '#2b2333';                                                                        // прорези и метки
    for (const s of [-1, 1]){ c.beginPath(); c.ellipse(r * 0.68, s * r * 0.2, r * 0.09, r * 0.13, 0, 0, 7); c.fill(); }
    c.fillStyle = '#b05a4a';
    for (const s of [-1, 1]){ c.fillRect(r * 0.42, s * r * 0.3 - r * 0.02, r * 0.16, r * 0.05); }
    c.fillStyle = 'rgba(40,32,48,.9)'; c.beginPath(); c.ellipse(r * 0.75, 0, r * 0.06, r * 0.16, 0, 0, 7); c.fill();
  },
  function riverSerpent(c, r, f){                                                                  // текучий речной змей
    const w = Math.sin(G.t * 4 + f.ph);
    c.strokeStyle = grad(c, 'bossR', r, () => { const g = c.createLinearGradient(-r * 2, 0, r, 0);
      g.addColorStop(0, 'rgba(74,168,200,.2)'); g.addColorStop(0.6, '#4aa8c8'); g.addColorStop(1, '#bfe9f5'); return g; });
    c.lineWidth = r * 0.75; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(r * 0.7, 0);                                                            // тело волной
    for (let i = 1; i <= 5; i++){ const x = r * (0.7 - i * 0.52), y = Math.sin(w * 1.2 + i * 0.9) * r * 0.42 * (i / 5); c.lineTo(x, y); }
    c.stroke();
    c.lineWidth = r * 0.3; c.strokeStyle = 'rgba(220,245,255,.45)';                                 // светлый гребень
    c.beginPath(); c.moveTo(r * 0.6, -r * 0.1);
    for (let i = 1; i <= 5; i++){ const x = r * (0.6 - i * 0.52), y = Math.sin(w * 1.2 + i * 0.9) * r * 0.42 * (i / 5) - r * 0.12; c.lineTo(x, y); }
    c.stroke();
    c.fillStyle = '#7fd0e8'; c.beginPath(); c.ellipse(r * 0.85, 0, r * 0.55, r * 0.42, 0, 0, 7); c.fill();   // голова
    c.strokeStyle = '#bfe9f5'; c.lineWidth = Math.max(1, r * 0.05);                                 // усы
    for (const s of [-1, 1]){ c.beginPath(); c.moveTo(r * 1.2, s * r * 0.12); c.quadraticCurveTo(r * 1.8, s * r * (0.3 + w * 0.15), r * 2.0, s * r * 0.05); c.stroke(); }
    c.fillStyle = '#e8f7ff';                                                                        // рожки-плавники
    for (const s of [-1, 1]){ c.beginPath(); c.moveTo(r * 0.7, s * r * 0.3); c.lineTo(r * 0.55, s * r * 0.85); c.lineTo(r * 0.95, s * r * 0.45); c.closePath(); c.fill(); }
    roundEyes(c, r * 1.0, r * 0.22, r * 0.14, '#123b4a');
  },
  function thunderOx(c, r, f){                                                                     // бык-гроза в туче
    const p = 0.5 + 0.5 * Math.sin(G.t * 9 + f.ph), bolt = Math.sin(G.t * 7 + f.ph) > 0.75;
    let g = c.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.8);
    g.addColorStop(0, 'rgba(176,140,240,' + (0.22 + p * 0.16) + ')'); g.addColorStop(1, 'rgba(120,90,200,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.8, 0, 7); c.fill();
    legs(c, r, stepPhase(f), 2, 0.38, '#3a2a58', 0.22, 0.5);
    c.fillStyle = '#f4ecff';                                                                        // тяжёлые изогнутые рога
    for (const s of [-1, 1]){
      c.beginPath();
      c.moveTo(r * 0.35, s * r * 0.35);
      c.quadraticCurveTo(r * 1.35, s * r * 0.7, r * 1.45, s * r * 1.5);                              // внешняя дуга
      c.lineTo(r * 1.12, s * r * 1.45);
      c.quadraticCurveTo(r * 1.05, s * r * 0.95, r * 0.4, s * r * 0.68);                             // внутренняя дуга
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(120,95,175,.35)';                                                          // тень на роге
      c.beginPath(); c.moveTo(r * 0.4, s * r * 0.55); c.quadraticCurveTo(r * 1.08, s * r * 0.9, r * 1.16, s * r * 1.42);
      c.lineTo(r * 1.12, s * r * 1.45); c.quadraticCurveTo(r * 1.05, s * r * 0.95, r * 0.4, s * r * 0.68); c.closePath(); c.fill();
      c.fillStyle = '#f4ecff';
    }
    c.fillStyle = grad(c, 'bossT', r, () => { const g = c.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.15);
      g.addColorStop(0, '#d9c6ff'); g.addColorStop(0.45, '#8f6fd8'); g.addColorStop(1, '#2b1d4a'); return g; });
    c.beginPath();                                                                                  // туловище-туча
    for (let i = 0; i < 7; i++){ const a = i / 7 * 6.283, rr2 = r * (0.95 + 0.18 * Math.sin(i * 2.3 + G.t)); c.lineTo(Math.cos(a) * rr2 * 1.05, Math.sin(a) * rr2 * 0.9); }
    c.closePath(); c.fill();
    gloss(c, -r * 0.4, -r * 0.5, r * 0.3, r * 0.13, 0.3);
    if (bolt){                                                                                      // разряды из тучи
      c.strokeStyle = '#fff6a0'; c.lineWidth = Math.max(1.5, r * 0.07); c.lineCap = 'round';
      for (const s of [-1, 1]){
        c.beginPath(); c.moveTo(-r * 0.3, s * r * 0.6); c.lineTo(-r * 0.55, s * r * 1.0); c.lineTo(-r * 0.3, s * r * 1.0); c.lineTo(-r * 0.6, s * r * 1.45); c.stroke();
      }
    }
    roundEyes(c, r * 0.6, r * 0.32, r * 0.17, '#2a1a4a');
    c.fillStyle = '#2a1a4a'; c.beginPath(); c.ellipse(r * 0.95, 0, r * 0.12, r * 0.2, 0, 0, 7); c.fill();  // морда
    c.fillStyle = 'rgba(255,255,255,.5)';
    for (const s of [-1, 1]){ c.beginPath(); c.arc(r * 0.98, s * r * 0.08, r * 0.045, 0, 7); c.fill(); }
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
    about: p => 'свет фонаря: враги рядом идут на ' + Math.round(p.k * 100) + '% быстрее',
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
    tick(f, p){ for (const o of nearFoes(f, p.r)) o.buff.heal = Math.max(o.buff.heal, p.k); },
    under(f, p, c, r, cell){
      const R = p.r * cell;
      c.strokeStyle = 'rgba(170,245,225,.28)'; c.lineWidth = Math.max(1, cell * 0.03);
      c.beginPath(); c.arc(0, 0, R, 0, 7); c.stroke();
      for (let i = 0; i < 4; i++){
        const t = (G.t * 0.5 + f.ph + i / 4) % 1, a = i * 1.57 + f.ph;
        c.fillStyle = 'rgba(190,255,235,' + (0.6 * (1 - t)) + ')';
        c.beginPath(); c.arc(Math.cos(a) * R * t, Math.sin(a) * R * t, cell * 0.04, 0, 7); c.fill();
      }
    }
  },
  // барабан: соседи в p.r клетках получают +p.armor к броне
  drum: {
    about: p => 'барабан: враги рядом получают +' + p.armor + ' к броне',
    tick(f, p){ for (const o of nearFoes(f, p.r)) o.buff.armor = Math.max(o.buff.armor, p.armor); },
    under(f, p, c, r, cell){
      const R = p.r * cell;
      for (const k of [0, 0.5]){
        const t = (G.t * 1.3 + f.ph + k) % 1;
        c.strokeStyle = 'rgba(200,230,160,' + (0.35 * (1 - t)) + ')'; c.lineWidth = Math.max(1, cell * 0.05 * (1 - t));
        c.beginPath(); c.arc(0, 0, R * (0.2 + t * 0.8), 0, 7); c.stroke();
      }
    }
  },
  // норы: p.over секунд на поверхности, p.under под землёй — там его не достать.
  // Снаряд, летевший в нырнувшего, гаснет: пушка по нему честно промахивается
  burrow: {
    about: p => 'ныряет под землю на ' + fmtN(p.under) + ' с из каждых ' + fmtN(p.over + p.under) + ': под землёй его не достать',
    init(f, p){ f.burrowT = p.over; f.under = false; f.dirtT = 0; },
    tick(f, p, dt){
      f.burrowT -= dt;
      if (f.under && (f.dirtT -= dt) <= 0){
        f.dirtT = 0.22;
        G.fx.push({ kind:'dust', x: f.pos.x, y: f.pos.y, t: 0, life: 0.45, parts: parts(3, 0.4, (f.d * 733) | 0) });
      }
      if (f.burrowT > 0) return;
      f.under = !f.under; f.burrowT = f.under ? p.under : p.over;
      G.fx.push({ kind:'puff', x: f.pos.x, y: f.pos.y, t: 0, life: 0.5, color:'#6b5238', parts: parts(8, 1.0, (f.d * 733) | 0) });
    },
    hidden: f => f.under,
    siege(f){ f.under = false; },
    under(f, p, c, r){
      if (!f.under) return false;
      // земляной холмик ползёт по дороге: тела не видно, но где он — понятно
      c.fillStyle = '#4e3a28'; c.beginPath(); c.ellipse(0, 0, r * 1.15, r * 0.85, 0, 0, 7); c.fill();
      c.fillStyle = '#6e563d'; c.beginPath(); c.ellipse(-r * 0.15, -r * 0.15, r * 0.75, r * 0.5, 0, 0, 7); c.fill();
      c.fillStyle = '#8a7055'; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.3, r * 0.3, r * 0.18, 0, 0, 7); c.fill();
      c.fillStyle = '#3a2a1c';
      for (const [dx, dy] of [[0.5, 0.3], [-0.6, 0.4], [0.2, -0.5]]) { c.beginPath(); c.arc(dx * r, dy * r, r * 0.09, 0, 7); c.fill(); }
      return true;
    }
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
    init(f, p){ f.leapT = p.every * 0.6; f.air = 0; f.airMax = p.air; },
    tick(f, p, dt){
      if (f.air > 0){
        f.air -= dt;
        const k = 1 - Math.max(0, f.air) / p.air;
        f.d = f.leapFrom + (f.leapTo - f.leapFrom) * k;
        f.buff.hold = true;
        if (f.air <= 0){
          f.d = f.leapTo;
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
    siege(f){ f.air = 0; }
  },
  // сеятель: раз в p.every секунд выпускает позади себя p.type, не больше p.max
  spawner: {
    about: p => 'каждые ' + fmtN(p.every) + ' с выпускает ' + FOES[p.type].acc[0] + ', не больше ' + p.max + ' за жизнь',
    init(f, p){ f.seedT = p.every; f.seeded = 0; },
    tick(f, p, dt){
      if (f.seeded >= p.max) return;
      f.seedT -= dt * (1 - f.slow);
      if (f.seedT > 0) return;
      f.seedT = p.every; f.seeded++;
      const c = spawn(p.type, f.scale, { pi: f.pi, d: Math.max(0, f.d - f.r - 0.15) });
      G.fx.push({ kind:'puff', x: c.pos.x, y: c.pos.y, t: 0, life: 0.4, color: FOES[p.type].color, parts: parts(4, 0.5, (f.d * 577) | 0) });
    }
  },
  // скорлупа: пока здоровья больше p.at, броня из карточки; треснул — броня
  // p.armor и скорость в p.sp раз. Толстый и медленный становится голым и быстрым
  crack: {
    about: p => 'скорлупа держит, пока цел; ниже половины здоровья трескается — броня спадает, зато бежит в ' + fmtN(p.sp) + ' раза быстрее',
    init(f){ f.cracked = false; },
    tick(f, p){
      if (f.cracked || f.hp > f.hpMax * p.at) return;
      f.cracked = true; f.armor = p.armor; f.sp *= p.sp;
      G.fx.push({ kind:'puff', x: f.pos.x, y: f.pos.y, t: 0, life: 0.5, color:'#4e3218', parts: parts(8, 1.1, (f.d * 991) | 0) });
    },
    over(f, p, c, r){
      if (!f.cracked) return;
      c.fillStyle = 'rgba(240,215,170,.6)';                                                           // из трещины видно светлое ядро
      c.beginPath(); c.moveTo(r * 0.55, r * 0.05); c.lineTo(r * 0.3, -r * 0.4); c.lineTo(-r * 0.1, -r * 0.1); c.closePath(); c.fill();
      c.strokeStyle = '#2a1a0c'; c.lineWidth = Math.max(1, r * 0.07); c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath(); c.moveTo(r * 0.95, -r * 0.2); c.lineTo(r * 0.55, r * 0.05); c.lineTo(r * 0.3, -r * 0.4); c.lineTo(-r * 0.1, -r * 0.1); c.lineTo(-r * 0.3, -r * 0.55); c.stroke();
      c.beginPath(); c.moveTo(r * 0.45, r * 0.65); c.lineTo(r * 0.15, r * 0.25); c.lineTo(-r * 0.25, r * 0.45); c.stroke();
    }
  },
  // тень: башни не видят его, пока в p.r клетках идёт кто-то другой
  veil: {
    about: () => 'тень: башни не видят его, пока рядом идёт другой враг',
    init(f){ f.veiled = false; },
    tick(f, p){ f.veiled = nearFoes(f, p.r).some(o => o.type !== f.type); },
    hidden: f => f.veiled,
    siege(f){ f.veiled = false; },
    under(f, p, c){ if (f.veiled) c.globalAlpha = 0.3; return false; },
    over(f, p, c){ c.globalAlpha = 1; }
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
    gait(f){ return { bob: (0.5 + 0.5 * Math.sin(G.t * 14 + f.ph)) * f.r * CELL * 0.35, sq: 0 }; },
    art(c, r, f){
      const bob = Math.sin(G.t * 6 + f.ph);
      c.strokeStyle = 'rgba(245,240,220,.7)'; c.lineWidth = Math.max(1, r * 0.09); c.lineCap = 'round';
      for (let i = 0; i < 9; i++){                                                                    // зонтик
        const a = -2.4 + i * 0.6 + bob * 0.08;
        c.beginPath(); c.moveTo(-r * 0.15, 0); c.lineTo(-r * 0.15 + Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15); c.stroke();
      }
      c.fillStyle = 'rgba(250,246,230,.35)'; c.beginPath(); c.arc(-r * 0.35, 0, r * 0.75, 0, 7); c.fill();
      c.fillStyle = grad(c, 'swarm', r, () => { const g = c.createRadialGradient(-r * 0.1, -r * 0.2, r * 0.05, r * 0.3, 0, r * 0.8);
        g.addColorStop(0, '#fff6d8'); g.addColorStop(0.6, '#d9c48a'); g.addColorStop(1, '#8a723c'); return g; });
      c.beginPath(); c.ellipse(r * 0.4, 0, r * 0.62, r * 0.4, 0, 0, 7); c.fill();                     // семечко
      roundEyes(c, r * 0.6, r * 0.17, r * 0.15);
    }
  },
  // Туманник: полупрозрачный дух в маске, стелется над землёй. Не мёрзнет —
  // мороз против него пуст, нужны пушка и молния
  ghost: {
    voice:'mist',
    name:'Туманник', about:'клок тумана в белой маске; стелется над дорогой и не чувствует холода',
    hp:30, sp:2.00, armor:0, bounty:9, hit:1, atk:1.2, r:0.28, color:'#cfd8e8',
    from:8, gap:0.5, wave:(L, W, late) => W >= 3 ? 3 + Math.round(late * (3 + L * 0.3)) : 0,
    traits:{ noSlow:{} },
    intro:'не мёрзнет — мороз против него пуст, нужны пушка и молния',
    gait(f){ return { bob: (0.5 + 0.5 * Math.sin(G.t * 2 + f.ph)) * f.r * CELL * 0.5, sq: 0 }; },
    art(c, r, f){
      const w = Math.sin(G.t * 3 + f.ph);
      c.globalAlpha = 0.66;
      let g = c.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r * 1.5);
      g.addColorStop(0, 'rgba(225,235,250,.55)'); g.addColorStop(1, 'rgba(180,200,235,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.5, 0, 7); c.fill();
      c.fillStyle = grad(c, 'ghost', r, () => { const g = c.createLinearGradient(0, -r, 0, r);
        g.addColorStop(0, '#f2f6ff'); g.addColorStop(0.6, '#c3d2e8'); g.addColorStop(1, '#7f92b5'); return g; });
      c.beginPath();                                                                                  // тело клубами тумана
      c.moveTo(r * 0.85, 0); c.quadraticCurveTo(r * 0.8, -r * 0.85, 0, -r * 0.8);
      for (let i = 0; i < 3; i++){ const x = -r * (0.5 + i * 0.5), y = -r * 0.5 + i * r * 0.1 + Math.sin(w * 2 + i) * r * 0.18; c.quadraticCurveTo(x, y, x - r * 0.35, y + r * 0.45); }
      c.quadraticCurveTo(-r * 1.2, r * 0.6, 0, r * 0.8);
      c.quadraticCurveTo(r * 0.8, r * 0.85, r * 0.85, 0); c.closePath(); c.fill();
      c.globalAlpha = 1;
      c.fillStyle = '#efe9db'; c.beginPath(); c.ellipse(r * 0.5, 0, r * 0.36, r * 0.44, 0, 0, 7); c.fill();   // маска
      c.fillStyle = '#39415a';
      for (const s of [-1, 1]){ c.beginPath(); c.ellipse(r * 0.56, s * r * 0.16, r * 0.075, r * 0.11, 0, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(90,110,150,.7)'; c.beginPath(); c.ellipse(r * 0.62, 0, r * 0.05, r * 0.1, 0, 0, 7); c.fill();
    }
  },
  /* Древень: ходячий пень, вид СВЕРХУ — как и всё поле. Первая версия рисовала
     мшистую шапку «над» стволом, но силуэт разворачивается по ходу движения, и
     при ходьбе влево шапка оказывалась под пнём. Сверху же у пня нет верха и низа:
     годовые кольца, мох по кромке, светящееся дупло в середине, корни во все стороны.
     В броне 9: пушка первого уровня (13) оставляет ему 4 за попадание, молния (8) —
     единицу; его берут мортира и прокачка. */
  golem: {
    voice:'wood',
    name:'Древень', about:'старый пень, который решил дойти до замка; в дупле тлеет огонёк',
    hp:260, sp:0.70, armor:9, bounty:30, hit:3, atk:2.6, r:0.40, color:'#a8825a',
    from:14, gap:2.5, wave:(L, W, late) => W >= 5 ? 1 + Math.round(late * (1 + L * 0.15)) : 0,
    intro:'в броне 9 — пробьёт только мортира или прокачанная пушка',
    step:2, dust:true,
    gait(f){ const ph = (f.d * 2) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.1, sq: 0 }; },
    art(c, r, f){
      const glow = 0.5 + 0.5 * Math.sin(G.t * 2.5 + f.ph);
      // корни-лапы торчат по кругу и переступают
      c.strokeStyle = '#4a3520'; c.lineWidth = Math.max(1, r * 0.2); c.lineCap = 'round';
      for (let i = 0; i < 6; i++){
        const a = i / 6 * 6.283 + 0.5, k = 1 + Math.sin(stepPhase(f) * 6.283 + i) * 0.14;
        c.beginPath(); c.moveTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
        c.lineTo(Math.cos(a) * r * 1.15 * k, Math.sin(a) * r * 1.15 * k); c.stroke();
      }
      c.fillStyle = grad(c, 'golem', r, () => { const g = c.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
        g.addColorStop(0, '#d8b98c'); g.addColorStop(0.55, '#9a7648'); g.addColorStop(1, '#4a3520'); return g; });
      c.beginPath();                                                                                  // спил, слегка неровный
      for (let i = 0; i < 11; i++){ const a = i / 11 * 6.283, rr2 = r * (0.95 + 0.07 * Math.sin(i * 2.7)); c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(70,48,26,.45)'; c.lineWidth = Math.max(1, r * 0.05);                      // годовые кольца
      for (const k of [0.78, 0.58, 0.4]) { c.beginPath(); c.ellipse(-r * 0.04, r * 0.02, r * k, r * k * 0.94, 0, 0, 7); c.stroke(); }
      c.fillStyle = 'rgba(95,150,70,.8)';                                                             // мох по кромке
      for (let i = 0; i < 7; i++){
        const a = i / 7 * 6.283 + 1.1, d = r * 0.82;
        c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, r * (0.16 + 0.07 * Math.sin(i * 3.3)), 0, 7); c.fill();
      }
      c.fillStyle = 'rgba(255,150,40,' + (0.28 + glow * 0.3) + ')';                                   // дупло светится
      c.beginPath(); c.arc(-r * 0.04, r * 0.02, r * 0.45, 0, 7); c.fill();
      c.fillStyle = '#2a1a0c'; c.beginPath(); c.ellipse(-r * 0.04, r * 0.02, r * 0.26, r * 0.24, 0, 0, 7); c.fill();
      c.fillStyle = '#ffb347'; c.beginPath(); c.arc(-r * 0.04, r * 0.02, r * 0.13, 0, 7); c.fill();
      roundEyes(c, r * 0.5, r * 0.34, r * 0.16, '#2c1d0e');
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
    gait(f){ const ph = (f.d * 1.6) % 1; return { bob: Math.sin(ph * Math.PI) * f.r * CELL * 0.25, sq: -Math.sin(ph * 6.283) * 0.07 }; },
    art(c, r, f){
      legs(c, r, stepPhase(f), 2, 0.4, '#8a7d62', 0.14, 0.5);
      c.fillStyle = grad(c, 'puffball', r, () => { const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
        g.addColorStop(0, '#fbf4e2'); g.addColorStop(0.6, '#e0d3b4'); g.addColorStop(1, '#9c8c68'); return g; });
      c.beginPath(); c.ellipse(0, 0, r * 0.95, r * 0.88, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(120,100,70,.35)';                                                           // веснушки-чешуйки
      for (const [dx, dy, k] of [[-0.45, -0.35, 0.11], [0.1, -0.55, 0.09], [-0.15, 0.1, 0.1], [-0.6, 0.3, 0.08], [0.3, 0.4, 0.09], [0.45, -0.15, 0.07]]) { c.beginPath(); c.arc(dx * r, dy * r, k * r, 0, 7); c.fill(); }
      const t = (G.t * 0.7 + f.ph) % 1;                                                               // спора-другая всё время выпархивает
      c.fillStyle = 'rgba(200,215,140,' + (0.7 * (1 - t)) + ')';
      c.beginPath(); c.arc(-r * 0.2 - t * r * 0.8, -r * 0.1 + Math.sin(t * 9) * r * 0.15, r * 0.08, 0, 7); c.fill();
      roundEyes(c, r * 0.45, r * 0.28, r * 0.17);
    }
  },
  // Спорка: то, на что рассыпается дождевик. В волнах сама не ходит
  spore: {
    name:'Спорка', about:'крошечная спора дождевика; одна — пустяк, четыре — уже толпа',
    acc:['спорку', 'спорки', 'спорок'],
    hp:8, sp:2.4, armor:0, bounty:2, hit:1, atk:1.0, r:0.16, color:'#c9d98a',
    from:24, origin:'выходит из дождевика', wave:null,
    gait(f){ return { bob: (0.5 + 0.5 * Math.sin(G.t * 12 + f.ph)) * f.r * CELL * 0.4, sq: 0 }; },
    art(c, r, f){
      c.strokeStyle = 'rgba(200,220,140,.5)'; c.lineWidth = Math.max(1, r * 0.25); c.lineCap = 'round';
      c.beginPath(); c.moveTo(-r * 0.6, 0); c.quadraticCurveTo(-r * 1.4, Math.sin(G.t * 10 + f.ph) * r * 0.5, -r * 2.0, 0); c.stroke();   // хвостик
      c.fillStyle = grad(c, 'spore', r, () => { const g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        g.addColorStop(0, '#eef5c8'); g.addColorStop(1, '#8fa650'); return g; });
      c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
      roundEyes(c, r * 0.35, r * 0.35, r * 0.22);
    }
  },
  // Фонарник: ночной мотылёк с бумажным фонарём; на свет тянутся остальные
  lantern: {
    voice:'lantern',
    name:'Фонарник', about:'ночной мотылёк-дух с бумажным фонарём; на его свет тянутся все, кто идёт рядом',
    hp:34, sp:1.5, armor:0, bounty:20, hit:1, atk:1.4, r:0.28, color:'#ffcf7a',
    from:31, threat:2.2, mix:true, gap:1.6, wave:(L, W, late) => W >= 3 ? (late < 0.6 ? 1 : 2) : 0,
    traits:{ haste:{ r:1.2, k:0.25 } },
    intro:'фонарь подгоняет всех вокруг — сними его первым',
    gait(f){ return { bob: (0.5 + 0.5 * Math.sin(G.t * 5 + f.ph)) * f.r * CELL * 0.5, sq: 0 }; },
    art(c, r, f){
      const fl = Math.sin(G.t * 16 + f.ph), gl = 0.55 + 0.25 * Math.sin(G.t * 3 + f.ph);
      c.fillStyle = 'rgba(225,228,245,.55)';                                                          // крылья
      for (const s of [-1, 1]){ c.beginPath(); c.ellipse(-r * 0.25, s * r * 0.75, r * 0.7, r * 0.42, s * (0.5 + fl * 0.15), 0, 7); c.fill(); }
      fur(c, r * 0.6, 14, r * 0.22, '#7d84a8', 0.1, f.ph);
      c.fillStyle = grad(c, 'lantern', r, () => { const g = c.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.05, 0, 0, r * 0.7);
        g.addColorStop(0, '#c3c8e2'); g.addColorStop(1, '#5e6488'); return g; });
      c.beginPath(); c.ellipse(-r * 0.1, 0, r * 0.65, r * 0.55, 0, 0, 7); c.fill();
      roundEyes(c, r * 0.25, r * 0.22, r * 0.14);
      // фонарь впереди на верёвочке: круглый, тёплый, дышит
      c.strokeStyle = '#3a3040'; c.lineWidth = Math.max(1, r * 0.06); c.beginPath(); c.moveTo(r * 0.45, 0); c.lineTo(r * 0.85, 0); c.stroke();
      const g = c.createRadialGradient(r * 1.15, 0, 0, r * 1.15, 0, r * 0.75);
      g.addColorStop(0, 'rgba(255,200,90,' + gl + ')'); g.addColorStop(1, 'rgba(255,170,60,0)');
      c.fillStyle = g; c.beginPath(); c.arc(r * 1.15, 0, r * 0.75, 0, 7); c.fill();
      c.fillStyle = '#ffd98a'; c.beginPath(); c.ellipse(r * 1.15, 0, r * 0.32, r * 0.38, 0, 0, 7); c.fill();
      c.strokeStyle = '#a8522a'; c.lineWidth = Math.max(1, r * 0.07);
      c.beginPath(); c.ellipse(r * 1.15, 0, r * 0.32, r * 0.38, 0, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(r * 0.95, 0); c.lineTo(r * 1.35, 0); c.stroke();                       // ребро фонаря
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
    gait(f){ const ph = (f.d * 1.8) % 1; return { bob: Math.sin(ph * Math.PI) * f.r * CELL * 0.3, sq: -Math.sin(ph * 6.283) * 0.1 }; },
    art(c, r, f){
      // капля: круглая спереди, хвостик назад; полупрозрачная, с бликом
      c.fillStyle = grad(c, 'dew', r, () => { const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.1);
        g.addColorStop(0, 'rgba(225,255,245,.95)'); g.addColorStop(0.5, 'rgba(130,215,195,.9)'); g.addColorStop(1, 'rgba(40,130,120,.9)'); return g; });
      c.beginPath(); c.moveTo(r * 0.95, 0); c.quadraticCurveTo(r * 0.9, -r * 0.95, -r * 0.2, -r * 0.8); c.quadraticCurveTo(-r * 1.1, -r * 0.5, -r * 1.35, 0);
      c.quadraticCurveTo(-r * 1.1, r * 0.5, -r * 0.2, r * 0.8); c.quadraticCurveTo(r * 0.9, r * 0.95, r * 0.95, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-r * 0.15, -r * 0.42, r * 0.32, r * 0.14, -0.3, 0, 7); c.fill();   // блик
      c.fillStyle = '#7fb85a';                                                                        // листок на спине
      c.beginPath(); c.moveTo(-r * 0.6, r * 0.1); c.quadraticCurveTo(-r * 1.2, r * 0.6, -r * 1.7, r * 0.35); c.quadraticCurveTo(-r * 1.2, r * 0.2, -r * 0.6, r * 0.1); c.fill();
      roundEyes(c, r * 0.4, r * 0.26, r * 0.17, '#1f3a3a');
      for (let i = 0; i < 3; i++){                                                                    // капельки-искры — то, что лечит
        const t = (G.t * 0.8 + f.ph + i / 3) % 1, a = i * 2.1 + f.ph;
        c.fillStyle = 'rgba(200,255,240,' + (0.8 * (1 - t)) + ')';
        c.beginPath(); c.arc(Math.cos(a) * r * (0.9 + t * 0.6), Math.sin(a) * r * (0.9 + t * 0.6), r * 0.09, 0, 7); c.fill();
      }
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
    gait(f){ const ph = (f.d * 2.4) % 1; return { bob: 0, sq: Math.sin(ph * 6.283) * 0.05 }; },
    art(c, r, f){
      c.fillStyle = '#d8b9a0';                                                                        // лапы-лопаты гребут
      for (const s of [-1, 1]){ const k = Math.sin(stepPhase(f) * 6.283 + (s > 0 ? 0 : 3.14)) * 0.2; c.beginPath(); c.ellipse(r * (0.35 + k), s * r * 0.75, r * 0.3, r * 0.2, s * 0.6, 0, 7); c.fill(); }
      fur(c, r * 0.75, 18, r * 0.22, '#3a2c20', 0.08, f.ph);
      c.fillStyle = grad(c, 'mole', r, () => { const g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
        g.addColorStop(0, '#7a6350'); g.addColorStop(0.6, '#4e3c2c'); g.addColorStop(1, '#2a1f16'); return g; });
      c.beginPath(); c.ellipse(-r * 0.1, 0, r * 1.05, r * 0.8, 0, 0, 7); c.fill();
      c.fillStyle = '#f2a0b0'; c.beginPath(); c.arc(r * 1.0, 0, r * 0.2, 0, 7); c.fill();            // нос
      c.fillStyle = '#ffd0da'; c.beginPath(); c.arc(r * 0.95, -r * 0.06, r * 0.07, 0, 7); c.fill();
      c.strokeStyle = 'rgba(240,230,220,.6)'; c.lineWidth = Math.max(1, r * 0.05);                    // усы
      for (const s of [-1, 1]) for (const k of [0.1, 0.35]){ c.beginPath(); c.moveTo(r * 0.85, s * r * k); c.lineTo(r * 1.3, s * r * (k + 0.35)); c.stroke(); }
      roundEyes(c, r * 0.5, r * 0.3, r * 0.1, '#111');                                                 // подслеповатые глазки
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
    gait(f){ const ph = (f.d * 2.0) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.15, sq: 0, roll: Math.sin(ph * 6.283) * 0.12 }; },
    art(c, r, f){
      fur(c, r * 0.55, 26, r * 0.7, '#b8912e', 0.09, f.ph);                                            // солома: два слоя иголок
      fur(c, r * 0.55, 20, r * 0.62, '#e8c65a', 0.06, f.ph + 0.13);
      c.fillStyle = grad(c, 'straw', r, () => { const g = c.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.05, 0, 0, r * 0.8);
        g.addColorStop(0, '#f1d67e'); g.addColorStop(1, '#a67c25'); return g; });
      c.beginPath(); c.arc(0, 0, r * 0.7, 0, 7); c.fill();
      c.strokeStyle = '#7a4a22'; c.lineWidth = Math.max(1, r * 0.12);                                 // верёвка-пояс
      c.beginPath(); c.ellipse(-r * 0.05, 0, r * 0.62, r * 0.7, 0, 0, 7); c.stroke();
      c.strokeStyle = '#8f5a2a'; c.lineWidth = Math.max(1, r * 0.07); c.lineCap = 'round';              // концы верёвки
      c.beginPath(); c.moveTo(-r * 0.6, r * 0.2); c.lineTo(-r * 1.0, r * 0.55); c.moveTo(-r * 0.6, r * 0.2); c.lineTo(-r * 0.95, -r * 0.05); c.stroke();
      c.fillStyle = '#2b2118'; for (const s of [-1, 1]){ c.beginPath(); c.arc(r * 0.4, s * r * 0.24, r * 0.09, 0, 7); c.fill(); }   // глаза-угольки
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
    gait(f){ const ph = (f.d * 1.7) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.1, sq: 0, roll: Math.sin(ph * 6.283) * 0.06 }; },
    art(c, r, f){
      legs(c, r, stepPhase(f), 2, 0.35, '#3f5a30', 0.22, 0.55);
      c.fillStyle = grad(c, 'drummer', r, () => { const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
        g.addColorStop(0, '#a9c48a'); g.addColorStop(0.55, '#6f8f5a'); g.addColorStop(1, '#32482a'); return g; });
      c.beginPath(); c.ellipse(-r * 0.15, 0, r * 0.85, r * 0.9, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(230,240,200,.5)'; c.beginPath(); c.ellipse(-r * 0.25, 0, r * 0.45, r * 0.55, 0, 0, 7); c.fill();   // светлое брюхо
      roundEyes(c, r * 0.35, r * 0.3, r * 0.15);
      c.fillStyle = '#7a5a3a'; rr(c, r * 0.55, -r * 0.7, r * 0.5, r * 1.4, r * 0.2); c.fill();         // бревно-барабан поперёк
      c.fillStyle = '#a67c52'; for (const s of [-1, 1]){ c.beginPath(); c.ellipse(r * 0.8, s * r * 0.7, r * 0.22, r * 0.12, 0, 0, 7); c.fill(); }   // торцы
      const beat = (G.t * 4 + f.ph) % 2;                                                              // лапы бьют по очереди
      c.strokeStyle = '#3f5a30'; c.lineWidth = Math.max(1, r * 0.18); c.lineCap = 'round';
      for (const s of [-1, 1]){ const up = ((beat < 1) === (s < 0)) ? 0.18 : 0; c.beginPath(); c.moveTo(r * 0.3, s * r * 0.45); c.lineTo(r * (0.75 - up), s * r * 0.35); c.stroke(); }
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
    gait(f){
      if (f.air > 0){ const k = 1 - f.air / f.airMax; return { bob: Math.sin(k * Math.PI) * f.r * CELL * 1.6, sq: 0.15 }; }
      const ph = (f.d * 3) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.08, sq: 0 };
    },
    art(c, r, f){
      const jump = f.air > 0;
      c.strokeStyle = '#5a8f3a'; c.lineWidth = Math.max(1, r * 0.14); c.lineCap = 'round'; c.lineJoin = 'round';   // задние ноги: сложены углом, в прыжке вытянуты
      for (const s of [-1, 1]){ c.beginPath(); c.moveTo(-r * 0.3, s * r * 0.4); if (jump){ c.lineTo(-r * 1.2, s * r * 0.6); c.lineTo(-r * 1.9, s * r * 0.5); } else { c.lineTo(-r * 0.9, s * r * 0.95); c.lineTo(-r * 0.2, s * r * 1.05); } c.stroke(); }
      c.lineWidth = Math.max(1, r * 0.09);                                                            // передние
      for (const s of [-1, 1]){ c.beginPath(); c.moveTo(r * 0.3, s * r * 0.35); c.lineTo(r * 0.7, s * r * 0.7); c.stroke(); }
      c.fillStyle = grad(c, 'leaper', r, () => { const g = c.createLinearGradient(0, -r, 0, r);
        g.addColorStop(0, '#c6ec9a'); g.addColorStop(0.5, '#8fcf6a'); g.addColorStop(1, '#4f8a34'); return g; });
      c.beginPath(); c.ellipse(0, 0, r * 1.05, r * 0.6, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(60,110,40,.5)'; c.lineWidth = Math.max(1, r * 0.05); c.beginPath(); c.moveTo(-r * 0.9, 0); c.lineTo(r * 0.6, 0); c.stroke();   // спинка
      roundEyes(c, r * 0.55, r * 0.42, r * 0.2);
      c.strokeStyle = '#5a8f3a'; c.lineWidth = Math.max(1, r * 0.05);                                 // усики
      for (const s of [-1, 1]){ c.beginPath(); c.moveTo(r * 0.8, s * r * 0.2); c.quadraticCurveTo(r * 1.3, s * r * 0.3, r * 1.5, s * r * 0.7); c.stroke(); }
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
    gait(f){ const ph = (f.d * 1.5) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.08, sq: 0, roll: Math.sin(ph * 6.283) * 0.05 }; },
    art(c, r, f){
      legs(c, r, stepPhase(f), 2, 0.35, '#6a8a3a', 0.16, 0.5);                                         // корешки
      const n = 24;
      c.strokeStyle = 'rgba(250,248,240,.55)'; c.lineWidth = Math.max(1, r * 0.04);                   // пух: тонкие лучи с точками на концах
      for (let i = 0; i < n; i++){ const a = i / n * 6.283 + f.ph, k = 1.05 + 0.15 * Math.sin(i * 2.3 + G.t * 1.5); c.beginPath(); c.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); c.lineTo(Math.cos(a) * r * k, Math.sin(a) * r * k); c.stroke(); }
      c.fillStyle = 'rgba(250,248,240,.85)';
      for (let i = 0; i < n; i++){ const a = i / n * 6.283 + f.ph, k = 1.05 + 0.15 * Math.sin(i * 2.3 + G.t * 1.5); c.beginPath(); c.arc(Math.cos(a) * r * k, Math.sin(a) * r * k, r * 0.07, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(250,248,240,.35)'; c.beginPath(); c.arc(0, 0, r * 0.85, 0, 7); c.fill();
      c.fillStyle = grad(c, 'seedmother', r, () => { const g = c.createRadialGradient(-r * 0.15, -r * 0.2, r * 0.05, 0, 0, r * 0.5);
        g.addColorStop(0, '#eef0c0'); g.addColorStop(1, '#a8ad6a'); return g; });
      c.beginPath(); c.arc(0, 0, r * 0.48, 0, 7); c.fill();
      roundEyes(c, r * 0.18, r * 0.2, r * 0.13, '#3a3a22');
      c.strokeStyle = '#5a5a30'; c.lineWidth = Math.max(1, r * 0.04); c.beginPath(); c.arc(r * 0.22, 0, r * 0.13, -0.7, 0.7); c.stroke();   // улыбка
    }
  },
  // Желудник: жёлудь в толстой скорлупе; треснет — побежит
  acorn: {
    name:'Желудник', about:'жёлудь-крепыш в толстой скорлупе; пока цел — неспешен, треснет — побежит',
    hp:200, sp:0.85, armor:14, bounty:34, hit:2, atk:2.2, r:0.36, color:'#9a6a3a',
    from:97, threat:1.4, gap:1.2, wave:(L, W, late) => W >= 4 ? 1 + Math.round(late * (1.5 + (L - 97) * 0.02)) : 0,
    traits:{ crack:{ at:0.5, armor:0, sp:1.7 } },
    intro:'скорлупу берёт только мортира; треснувший теряет броню, но бежит',
    step:2.0, dust:true,
    gait(f){ const ph = (f.d * 2.0) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * (f.cracked ? 0.2 : 0.06), sq: 0, roll: Math.sin(ph * 6.283) * 0.08 }; },
    art(c, r, f){
      legs(c, r, stepPhase(f), 2, 0.32, '#4a3018', 0.2, 0.55);
      c.fillStyle = grad(c, 'acorn', r, () => { const g = c.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.1, 0, 0, r);
        g.addColorStop(0, '#d8a86a'); g.addColorStop(0.6, '#9a6a3a'); g.addColorStop(1, '#4e3218'); return g; });
      c.beginPath(); c.ellipse(0.1 * r, 0, r * 1.0, r * 0.82, 0, 0, 7); c.fill();                    // гладкий орех
      c.fillStyle = grad(c, 'acorncap', r, () => { const g = c.createRadialGradient(-r * 0.5, -r * 0.3, r * 0.1, -r * 0.4, 0, r * 0.9);
        g.addColorStop(0, '#8a6a48'); g.addColorStop(1, '#3e2a14'); return g; });
      c.beginPath(); c.ellipse(-r * 0.45, 0, r * 0.62, r * 0.86, 0, 0, 7); c.fill();                  // шапочка сзади
      c.fillStyle = 'rgba(255,230,190,.25)';                                                          // крапинки шапочки
      for (let i = 0; i < 10; i++){ const a = i * 2.4, d = r * (0.2 + (i % 3) * 0.18); c.beginPath(); c.arc(-r * 0.45 + Math.cos(a) * d * 0.7, Math.sin(a) * d, r * 0.07, 0, 7); c.fill(); }
      c.strokeStyle = '#3e2a14'; c.lineWidth = Math.max(1, r * 0.14); c.lineCap = 'round';             // черешок
      c.beginPath(); c.moveTo(-r * 1.0, 0); c.lineTo(-r * 1.3, 0); c.stroke();
      roundEyes(c, r * 0.5, r * 0.28, r * 0.14, '#2a1a0c');
    }
  },
  // Тенник: тень без хозяина; в толпе её не видно
  shade: {
    name:'Тенник', about:'тень без хозяина; в толпе её не разглядеть, а одна она робеет',
    hp:60, sp:1.6, armor:0, bounty:36, hit:1, atk:1.3, r:0.28, color:'#4a3a66',
    from:109, threat:2.0, gap:0.5, wave:(L, W, late) => W >= 3 ? 2 + Math.round(late * (2 + (L - 109) * 0.02)) : 0,
    traits:{ veil:{ r:0.9 } },
    intro:'прячется за спинами — башни не видят его, пока рядом кто-то ещё',
    gait(f){ return { bob: (0.5 + 0.5 * Math.sin(G.t * 2.5 + f.ph)) * f.r * CELL * 0.4, sq: 0 }; },
    art(c, r, f){
      const w = Math.sin(G.t * 3 + f.ph);
      let g = c.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.5); g.addColorStop(0, 'rgba(60,40,90,.5)'); g.addColorStop(1, 'rgba(60,40,90,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.5, 0, 7); c.fill();
      c.fillStyle = grad(c, 'shade', r, () => { const g = c.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.05, 0, 0, r);
        g.addColorStop(0, '#6a5590'); g.addColorStop(0.6, '#3b2b55'); g.addColorStop(1, '#1e1430'); return g; });
      c.beginPath();                                                                                  // клубящийся край
      for (let i = 0; i < 12; i++){ const a = i / 12 * 6.283, k = 0.85 + 0.15 * Math.sin(i * 2.9 + w * 2); c.lineTo(Math.cos(a) * r * k, Math.sin(a) * r * k); }
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(40,25,60,.6)'; c.lineWidth = Math.max(1, r * 0.1); c.lineCap = 'round';     // шлейф
      c.beginPath(); c.moveTo(-r * 0.8, 0); c.quadraticCurveTo(-r * 1.4, w * r * 0.4, -r * 1.9, 0); c.stroke();
      c.fillStyle = '#e8e0ff';                                                                        // глаза — два бледных огонька без белков
      for (const s of [-1, 1]){ c.beginPath(); c.ellipse(r * 0.4, s * r * 0.3, r * 0.14, r * 0.1, 0, 0, 7); c.fill(); }
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
    gait(f){ const ph = (f.d * 1.5) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.12, sq: 0 }; },
    art(c, r, f){ BOSS_ART[f.skin || 0](c, r, f); }
  }
};
const FOE_ORDER = Object.keys(FOES);
// список особенностей карточки — один раз, а не Object.entries на каждое попадание
for (const k of FOE_ORDER) FOES[k].tr = Object.entries(FOES[k].traits || {});


window.BestiaryCurrent={draw(c,type,size,time=0,heading=0,skin=0){const b=FOES[type];if(!b)throw Error('Unknown creature '+type);G.t=time;CELL=size/1.15;const r=size*.27,f={type,skin,r:b.r,d:time*b.sp,ph:1.7,air:0,airMax:1,cracked:false};const gait=b.gait?b.gait(f):{};c.save();c.rotate(heading+(gait.roll||0));c.translate(0,-(gait.bob||0)*.4);c.scale(1+(gait.sq||0),1-(gait.sq||0));b.art(c,r,f);c.restore();}};
})();