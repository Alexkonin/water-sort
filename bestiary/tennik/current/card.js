/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.shade
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
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
  }
};
