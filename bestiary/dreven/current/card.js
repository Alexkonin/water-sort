/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.golem
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
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
  }
};
