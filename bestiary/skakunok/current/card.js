/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.leaper
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
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
  }
};
