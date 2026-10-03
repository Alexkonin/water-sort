/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.drummer
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
drummer: {
    voice:'drum',
    name:'Гулень', about:'толстый лесной дух с полым бревном вместо барабана; под его гул соседи не чувствуют ударов',
    hp:150, sp:0.9, armor:3, bounty:58, hit:2, atk:2.2, r:0.36, color:'#6f8f5a',
    from:64, threat:2.4, mix:true, gap:2.0, wave:(L, W, late) => W >= 4 ? (late < 0.6 ? 1 : 2) : 0,
    traits:{ drum:{ r:1.4, armor:3 } },
    intro:'бьёт в барабан, и соседи под гул держат удар — глуши его мортирой',
    step:1.7, dust:true,
    gait(f){ const ph = (f.d * 1.7) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.1, sq: 0, roll: Math.sin(ph * 6.283) * 0.06 }; },
    art(c, r, f){
      legs(c, r, stepPhase(f), 2, 0.35, '#3f5a30', 0.22, 0.55);
      c.fillStyle = grad(c, 'drummer', r, () => { const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
        g.addColorStop(0, '#a9c48a'); g.addColorStop(0.55, '#6f8f5a'); g.addColorStop(1, '#32482a'); return g; });
      c.beginPath(); c.ellipse(-r * 0.15, 0, r * 0.85, r * 0.9, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(230,240,200,.5)'; c.beginPath(); c.ellipse(-r * 0.25, 0, r * 0.45, r * 0.55, 0, 0, 7); c.fill();   // светлое брюхо
      roundEyes(c, r * 0.35, r * 0.3, r * 0.15);
      c.fillStyle = '#7a5a3a'; rr(c, r * 0.55, -r * 0.7, r * 0.5, r * 1.4, r * 0.2); c.fill();         // бревно-барабан поперёк
      c.fillStyle = '#a67c52'; for (const s of [-1, 1]){ c.beginPath(); c.ellipse(r * 0.8, s * r * 0.7, r * 0.22, r * 0.12, 0, 0, 7); c.fill(); }   // торцы
      const beat = (G.t * 4 + f.ph) % 2;                                                              // лапы бьют по очереди
      c.strokeStyle = '#3f5a30'; c.lineWidth = Math.max(1, r * 0.18); c.lineCap = 'round';
      for (const s of [-1, 1]){ const up = ((beat < 1) === (s < 0)) ? 0.18 : 0; c.beginPath(); c.moveTo(r * 0.3, s * r * 0.45); c.lineTo(r * (0.75 - up), s * r * 0.35); c.stroke(); }
    }
  }
};
