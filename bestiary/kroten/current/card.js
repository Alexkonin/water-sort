/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.mole
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
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
  }
};
