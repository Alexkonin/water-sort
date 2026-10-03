/* Reference snapshot, not imported by the game.
Source: tower-defense.html / FOES.boss
SHA-256: 34297dc08aa7fa18195e9893eaaa2eba8eed7442088cd0ef1401352432867103
Requires the original game drawing helpers; see ../../_shared/current-renderer.js.
*/
const CARD_SNAPSHOT = {
boss: {
    voice:'guardian',
    name:'Хранитель', about:'дух-хранитель этих мест; в финале карты выходит сам, а с 5-й — ещё и в середине',
    hp:430, sp:0.80, armor:6, bounty:70, hit:1, atk:2.0, r:0.44, color:'#ee3550',
    skins: BOSS_SKINS,
    gap:2.2, wave:(L, W, late, nW, final) => final ? { n: 1 + Math.min(2, Math.floor(L / 4)), gap: 2.2 }
                                          : (L >= 5 && W === Math.floor(nW / 2)) ? { n: 1, gap: 1 } : 0,
    step:1.5, dust:true,
    gait(f){ const ph = (f.d * 1.5) % 1; return { bob: Math.abs(Math.sin(ph * Math.PI)) * f.r * CELL * 0.12, sq: 0 }; },
    art(c, r, f){ BOSS_ART[f.skin || 0](c, r, f); }
  }
};
