/* Current game card. Source: tower-defense.html / FOES.grunt
SHA-256: f6351607e03252b40420b43fdebf399f00a754e99b5c8da5358b7bb2877a5401
Renderer: ../animations/ugolek.js. Requires game context and Ugolek. */
const CARD_SNAPSHOT = {
grunt: {
    voice:'ember',
    name:'Уголёк', about:'маленький угольный дух с тёплой трещинкой; бережно несёт огонёк в ладонях',
    hp:36, sp:1.35, armor:0, bounty:8, hit:1, atk:1.6, r:0.30, color:'#6b6070',
    gap:0.62, wave:(L, W) => 4 + Math.round(W * 0.6 + L * 0.2),
    attackAnim:{ duration:Ugolek.ATTACK_DURATION, contact:Ugolek.CONTACT },
    art(c,r,f){
      const attack=f.siege?Ugolek.attackProgress(f.atk,f.attackAfter||0):null;
      Ugolek.draw(c,{size:r*2.8,time:G.t,distance:f.d,seed:f.ph,shadow:false,
        state:f.siege?(attack===null?'idle':'attack'):'walk',attack:attack===null?0:attack});
    }
  }
};
