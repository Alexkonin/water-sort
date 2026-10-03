/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.lantern
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
lantern: {
    voice:'lantern',
    name:'Фонарник', about:'ночной мотылёк-дух с бумажным фонарём; на его свет тянутся все, кто идёт рядом',
    hp:34, sp:1.5, armor:0, bounty:20, hit:1, atk:1.4, r:0.28, color:'#ffcf7a',
    from:31, threat:2.2, mix:true, gap:1.6, wave:(L, W, late) => W >= 3 ? (late < 0.6 ? 1 : 2) : 0,
    traits:{ haste:{ r:1.2, k:0.25 } },
    intro:'фонарь подгоняет всех вокруг — сними его первым',
    gait(f){ return { bob: (0.5 + 0.5 * Math.sin(G.t * 5 + f.ph)) * f.r * CELL * 0.5, sq: 0 }; },
    art(c, r, f){
      const fl = Math.sin(G.t * 16 + f.ph), gl = 0.55 + 0.25 * Math.sin(G.t * 3 + f.ph);
      c.fillStyle = 'rgba(225,228,245,.55)';                                                          // крылья
      for (const s of [-1, 1]){ c.beginPath(); c.ellipse(-r * 0.25, s * r * 0.75, r * 0.7, r * 0.42, s * (0.5 + fl * 0.15), 0, 7); c.fill(); }
      fur(c, r * 0.6, 14, r * 0.22, '#7d84a8', 0.1, f.ph);
      c.fillStyle = grad(c, 'lantern', r, () => { const g = c.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.05, 0, 0, r * 0.7);
        g.addColorStop(0, '#c3c8e2'); g.addColorStop(1, '#5e6488'); return g; });
      c.beginPath(); c.ellipse(-r * 0.1, 0, r * 0.65, r * 0.55, 0, 0, 7); c.fill();
      roundEyes(c, r * 0.25, r * 0.22, r * 0.14);
      // фонарь впереди на верёвочке: круглый, тёплый, дышит
      c.strokeStyle = '#3a3040'; c.lineWidth = Math.max(1, r * 0.06); c.beginPath(); c.moveTo(r * 0.45, 0); c.lineTo(r * 0.85, 0); c.stroke();
      const g = c.createRadialGradient(r * 1.15, 0, 0, r * 1.15, 0, r * 0.75);
      g.addColorStop(0, 'rgba(255,200,90,' + gl + ')'); g.addColorStop(1, 'rgba(255,170,60,0)');
      c.fillStyle = g; c.beginPath(); c.arc(r * 1.15, 0, r * 0.75, 0, 7); c.fill();
      c.fillStyle = '#ffd98a'; c.beginPath(); c.ellipse(r * 1.15, 0, r * 0.32, r * 0.38, 0, 0, 7); c.fill();
      c.strokeStyle = '#a8522a'; c.lineWidth = Math.max(1, r * 0.07);
      c.beginPath(); c.ellipse(r * 1.15, 0, r * 0.32, r * 0.38, 0, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(r * 0.95, 0); c.lineTo(r * 1.35, 0); c.stroke();                       // ребро фонаря
    }
  }
};
