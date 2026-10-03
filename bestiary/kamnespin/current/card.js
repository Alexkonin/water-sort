/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.tank
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
tank: {
    voice:'stone',
    name:'Камнеспин', about:'валун, поросший мхом, на коротких лапах; слабые удары о него гаснут',
    hp:95, sp:0.95, armor:5, bounty:15, hit:2, atk:2.2, r:0.34, color:'#8b8472',
    gap:1.15, wave:(L, W, late) => (W >= 4 || L >= 2) ? 1 + Math.round(late * (1 + L * 0.22)) : 0,
    intro:'в броне — слабые удары гаснут, бей пушкой и мортирой',
    step:2.2,
    gait(f){ const ph = (f.d * 2.2) % 1; return { bob: 0, sq: 0, roll: Math.sin(ph * 6.283) * 0.09 }; },
    art(c, r, f){
      const W = r * 2.0, H = r * 1.5;
      legs(c, r * 0.9, stepPhase(f), 2, 0.28, '#5f5a4a', 0.2, 0.55);
      c.fillStyle = grad(c, 'tank', r, () => { const g = c.createLinearGradient(-W / 2, -H / 2, W / 2, H / 2);
        g.addColorStop(0, '#cfc7b0'); g.addColorStop(0.45, '#8b8472'); g.addColorStop(1, '#3d3a30'); return g; });
      c.beginPath();                                                                                  // панцирь-валун
      for (let i = 0; i < 9; i++){ const a = i / 9 * 6.283, rr2 = r * (0.95 + 0.12 * Math.sin(i * 3.1)); c.lineTo(Math.cos(a) * rr2 * 1.05, Math.sin(a) * rr2 * 0.82); }
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(90,140,70,.55)';                                                            // мох сверху
      for (const [dx, dy, rr2] of [[-0.45, -0.5, 0.32], [0.05, -0.62, 0.24], [-0.75, -0.2, 0.2], [0.45, -0.45, 0.18]]) { c.beginPath(); c.ellipse(dx * r, dy * r, rr2 * r, rr2 * r * 0.65, 0, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.22)';                                                          // лишайник
      for (const [dx, dy] of [[-0.2, 0.35], [0.4, 0.2], [-0.6, 0.15]]) { c.beginPath(); c.arc(dx * r, dy * r, r * 0.11, 0, 7); c.fill(); }
      c.strokeStyle = 'rgba(30,26,18,.45)'; c.lineWidth = Math.max(1, r * 0.06); c.lineCap = 'round';  // скол
      c.beginPath(); c.moveTo(-r * 0.5, r * 0.1); c.lineTo(-r * 0.15, -r * 0.15); c.stroke();
      c.fillStyle = '#b8ae96'; c.beginPath(); c.ellipse(r * 0.85, r * 0.05, r * 0.42, r * 0.34, 0, 0, 7); c.fill();  // голова
      roundEyes(c, r * 0.95, r * 0.17, r * 0.14, '#2c2a20');
    }
  }
};
