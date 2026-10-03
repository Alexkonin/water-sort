/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.runner
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
runner: {
    voice:'leaf',
    name:'Вихрёк', about:'сухой лист, подхваченный крошечным смерчем; быстрый, но хлипкий',
    hp:26, sp:2.60, armor:0, bounty:7, hit:1, atk:1.2, r:0.26, color:'#a8d84a',
    gap:0.42, wave:(L, W) => (W >= 2 || L >= 1) ? 2 + Math.round(W * 0.35 + L * 0.15) : 0,
    step:4,
    gait(f){ const ph = (f.d * 4) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.12, sq: 0 }; },
    art(c, r, f){
      const sp = G.t * 9 + f.ph;
      c.strokeStyle = 'rgba(200,230,255,.3)'; c.lineWidth = Math.max(1, r * 0.1); c.lineCap = 'round';
      for (let i = 0; i < 3; i++){                                                                    // завитки смерча
        const y = r * (0.25 + i * 0.28), w = r * (0.9 - i * 0.22);
        c.beginPath(); c.ellipse(-r * 0.15, y - r * 0.35, w, r * 0.16, Math.sin(sp + i) * 0.2, 0, 7); c.stroke();
      }
      c.strokeStyle = 'rgba(168,216,74,.35)'; c.lineWidth = Math.max(1, r * 0.14);                    // шлейф
      c.beginPath(); c.moveTo(-r * 1.0, 0); c.lineTo(-r * 2.0, -r * 0.15); c.stroke();
      c.save(); c.rotate(Math.sin(sp * 0.5) * 0.25);
      c.fillStyle = grad(c, 'runner', r, () => { const g = c.createLinearGradient(-r, -r * 0.6, r, r * 0.6);
        g.addColorStop(0, '#dff5a8'); g.addColorStop(0.5, '#a8d84a'); g.addColorStop(1, '#4e7a1c'); return g; });
      c.beginPath();                                                                                  // лист
      c.moveTo(r * 1.2, 0); c.quadraticCurveTo(r * 0.1, -r * 0.9, -r * 0.95, -r * 0.12);
      c.quadraticCurveTo(r * 0.1, r * 0.9, r * 1.2, 0); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(40,70,15,.45)'; c.lineWidth = Math.max(1, r * 0.06);                      // прожилка
      c.beginPath(); c.moveTo(-r * 0.85, -r * 0.08); c.lineTo(r * 1.1, 0); c.stroke();
      roundEyes(c, r * 0.35, r * 0.2, r * 0.16);
      c.restore();
    }
  }
};
