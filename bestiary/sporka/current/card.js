/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.spore
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
spore: {
    name:'Спорка', about:'крошечная спора дождевика; одна — пустяк, четыре — уже толпа',
    acc:['спорку', 'спорки', 'спорок'],
    hp:8, sp:2.4, armor:0, bounty:2, hit:1, atk:1.0, r:0.16, color:'#c9d98a',
    from:24, origin:'выходит из дождевика', wave:null,
    gait(f){ return { bob: (0.5 + 0.5 * Math.sin(G.t * 12 + f.ph)) * f.r * CELL * 0.4, sq: 0 }; },
    art(c, r, f){
      c.strokeStyle = 'rgba(200,220,140,.5)'; c.lineWidth = Math.max(1, r * 0.25); c.lineCap = 'round';
      c.beginPath(); c.moveTo(-r * 0.6, 0); c.quadraticCurveTo(-r * 1.4, Math.sin(G.t * 10 + f.ph) * r * 0.5, -r * 2.0, 0); c.stroke();   // хвостик
      c.fillStyle = grad(c, 'spore', r, () => { const g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        g.addColorStop(0, '#eef5c8'); g.addColorStop(1, '#8fa650'); return g; });
      c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
      roundEyes(c, r * 0.35, r * 0.35, r * 0.22);
    }
  }
};
