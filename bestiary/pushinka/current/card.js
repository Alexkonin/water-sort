/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.swarm
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
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
  }
};
