/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.puffball
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
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
  }
};
