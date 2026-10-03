/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.straw
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
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
  }
};
