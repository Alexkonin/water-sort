/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.seedmother
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
seedmother: {
    name:'Семянница', about:'старый одуванчик с лицом; куда ни пойдёт — сеет за собой пушинок',
    hp:220, sp:0.75, armor:2, bounty:48, hit:2, atk:2.4, r:0.40, color:'#e8e8d0',
    from:85, threat:2.0, gap:2.0, wave:(L, W, late) => W >= 5 ? 1 + Math.round(late * (0.5 + (L - 85) * 0.02)) : 0,
    traits:{ spawner:{ type:'swarm', every:2.2, max:8 } },
    intro:'на ходу выпускает пушинок — чем дольше живёт, тем больше их',
    step:1.5, dust:true,
    gait(f){ const ph = (f.d * 1.5) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.08, sq: 0, roll: Math.sin(ph * 6.283) * 0.05 }; },
    art(c, r, f){
      legs(c, r, stepPhase(f), 2, 0.35, '#6a8a3a', 0.16, 0.5);                                         // корешки
      const n = 24;
      c.strokeStyle = 'rgba(250,248,240,.55)'; c.lineWidth = Math.max(1, r * 0.04);                   // пух: тонкие лучи с точками на концах
      for (let i = 0; i < n; i++){ const a = i / n * 6.283 + f.ph, k = 1.05 + 0.15 * Math.sin(i * 2.3 + G.t * 1.5); c.beginPath(); c.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); c.lineTo(Math.cos(a) * r * k, Math.sin(a) * r * k); c.stroke(); }
      c.fillStyle = 'rgba(250,248,240,.85)';
      for (let i = 0; i < n; i++){ const a = i / n * 6.283 + f.ph, k = 1.05 + 0.15 * Math.sin(i * 2.3 + G.t * 1.5); c.beginPath(); c.arc(Math.cos(a) * r * k, Math.sin(a) * r * k, r * 0.07, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(250,248,240,.35)'; c.beginPath(); c.arc(0, 0, r * 0.85, 0, 7); c.fill();
      c.fillStyle = grad(c, 'seedmother', r, () => { const g = c.createRadialGradient(-r * 0.15, -r * 0.2, r * 0.05, 0, 0, r * 0.5);
        g.addColorStop(0, '#eef0c0'); g.addColorStop(1, '#a8ad6a'); return g; });
      c.beginPath(); c.arc(0, 0, r * 0.48, 0, 7); c.fill();
      roundEyes(c, r * 0.18, r * 0.2, r * 0.13, '#3a3a22');
      c.strokeStyle = '#5a5a30'; c.lineWidth = Math.max(1, r * 0.04); c.beginPath(); c.arc(r * 0.22, 0, r * 0.13, -0.7, 0.7); c.stroke();   // улыбка
    }
  }
};
