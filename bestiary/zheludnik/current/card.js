/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.acorn
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
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
  }
};
