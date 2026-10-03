/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.ghost
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
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
  }
};
