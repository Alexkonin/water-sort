/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.dew
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
dew: {
    voice:'dew',
    name:'Росник', about:'капля росы, в которой живёт кто-то маленький и добрый; лечит всех, кто идёт рядом',
    hp:80, sp:1.1, armor:0, bounty:42, hit:1, atk:1.8, r:0.32, color:'#8fd8c8',
    from:39, threat:2.4, mix:true, gap:1.8, wave:(L, W, late) => W >= 3 ? (late < 0.6 ? 1 : 2) : 0,
    traits:{ heal:{ r:1.2, k:0.02 } },
    intro:'лечит соседей — добивай его первым',
    gait(f){ const ph = (f.d * 1.8) % 1; return { bob: Math.sin(ph * Math.PI) * f.r * CELL * 0.3, sq: -Math.sin(ph * 6.283) * 0.1 }; },
    art(c, r, f){
      // капля: круглая спереди, хвостик назад; полупрозрачная, с бликом
      c.fillStyle = grad(c, 'dew', r, () => { const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.1);
        g.addColorStop(0, 'rgba(225,255,245,.95)'); g.addColorStop(0.5, 'rgba(130,215,195,.9)'); g.addColorStop(1, 'rgba(40,130,120,.9)'); return g; });
      c.beginPath(); c.moveTo(r * 0.95, 0); c.quadraticCurveTo(r * 0.9, -r * 0.95, -r * 0.2, -r * 0.8); c.quadraticCurveTo(-r * 1.1, -r * 0.5, -r * 1.35, 0);
      c.quadraticCurveTo(-r * 1.1, r * 0.5, -r * 0.2, r * 0.8); c.quadraticCurveTo(r * 0.9, r * 0.95, r * 0.95, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-r * 0.15, -r * 0.42, r * 0.32, r * 0.14, -0.3, 0, 7); c.fill();   // блик
      c.fillStyle = '#7fb85a';                                                                        // листок на спине
      c.beginPath(); c.moveTo(-r * 0.6, r * 0.1); c.quadraticCurveTo(-r * 1.2, r * 0.6, -r * 1.7, r * 0.35); c.quadraticCurveTo(-r * 1.2, r * 0.2, -r * 0.6, r * 0.1); c.fill();
      roundEyes(c, r * 0.4, r * 0.26, r * 0.17, '#1f3a3a');
      for (let i = 0; i < 3; i++){                                                                    // капельки-искры — то, что лечит
        const t = (G.t * 0.8 + f.ph + i / 3) % 1, a = i * 2.1 + f.ph;
        c.fillStyle = 'rgba(200,255,240,' + (0.8 * (1 - t)) + ')';
        c.beginPath(); c.arc(Math.cos(a) * r * (0.9 + t * 0.6), Math.sin(a) * r * (0.9 + t * 0.6), r * 0.09, 0, 7); c.fill();
      }
    }
  }
};
