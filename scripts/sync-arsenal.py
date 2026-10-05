from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1]; src=(root/'tower-defense.html').read_text(); base=root/'arsenal'
def section(a,b):
 s=src.index(a); return src[s:src.index(b,s)]
renderer='''/* Snapshot of tower-defense.html, 2026-10-04. Refresh with scripts/sync-arsenal.py. */
window.ArsenalCurrent = (() => {
let CELL=100; const G={t:0,castle:{lvl:1,aim:-.5,flash:0},lives:20};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
'''+section('const TOWERS =','/* ============ враги')+section('function rr(', 'function gloss(')+section('function drawCastle(', 'function drawCastleLive(')+section('function platform(', 'function buildSprites(')+section('function towerStats(t){','const upCost =')+'''
return {GunDesign,TeslaDesign,MortarDesign,FrostDesign,TOWERS,TOWER_TIERS,CASTLE_TIERS,towerStats,draw(c,type,lvl,s,time,aim,hp,palisadeHealth=hp,palisadeHeading=0){
if(type==='castle')s*=.82;CELL=s;G.t=time; c.save();
if(type==='castle'){G.castle={lvl,aim,flash:0,palisade:CASTLE_TIERS[lvl].palisadeHp*palisadeHealth};G.lives=CASTLE_TIERS[lvl].hp*hp;drawCastle(c,s*.35,0);if(lvl>=2)drawPalisade(c,-s*.65,0,palisadeHeading);}
else {const t={type,lvl,x:0,aim,cool:0,flash:0,recoil:0};TOWER_ART[type].body(c,s,lvl);TOWER_ART[type].live(c,s,t);}
c.restore();}};
})();
'''
(base/'_shared/current-renderer.js').write_text(renderer)
catalog=base/'catalog.json'
if catalog.exists():
 data=json.loads(catalog.read_text()); data['sourceSHA256']=hashlib.sha256(src.encode()).hexdigest();catalog.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Arsenal renderer refreshed; editorial cards unchanged.')
