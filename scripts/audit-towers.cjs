// Diagnostic bot on the production combat engine, not a proof of optimal play.
// node scripts/audit-towers.cjs 23,24,25,70,120,407,454,711,1000 mixed 1
// TOWER_SOURCE=/absolute/path/to/old.html compares the same policy and RNG seed.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(process.env.TOWER_SOURCE||path.join(root,'tower-defense.html'),'utf8');
const seed=Number(process.argv[4]||1);let randomState=seed;
const seededMath=Object.create(Math);seededMath.random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
const sec=(a,b)=>{let start=html.indexOf(a),end=html.indexOf(b,start);if(start<0||end<0)throw Error(a);return html.slice(start,end)};
const noop=()=>{};const c=vm.createContext({console,Math:seededMath,resetRandom:()=>{randomState=seed;},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),save:{seen:{}},parts:()=>[],sfx:{stop:noop},$:()=>({classList:{remove:noop},setAttribute:noop}),});
for(const match of html.matchAll(/<script src="(bestiary\/[^?]+)\?/g))Object.assign(c,require(path.join(root,match[1])));
for(const name of ['writeSave','showHint','sndKill','sndFoe','sndWave','sndShot','sndBoom','sndLeak','flash','refreshHud','refreshPalette','refreshSel','clearUndo','lockUndo','lockUndoForTower','closeAll','layout'])c[name]=noop;
vm.runInContext(sec('const COLS =','/* ============ сохранение')+sec('function mulberry32(','let terrain =')+sec('function buildPath(','/* ============ canvas')+sec('function eyes(','/* Карточка — публичный договор')+sec('function headingAt(','function meadowPlan(')+sec('function startLevel(','function flash('),c);
c.levelWin=()=>{vm.runInContext('G.over=true;G.win=true',c)};c.levelLose=()=>{vm.runInContext('G.over=true;G.win=false',c)};
const data=vm.runInContext(`MAPS.map((m,L)=>{const ps=buildPaths(m);return {level:L+1,name:m.name,paths:ps.map(p=>p.len),k:mapFactor(ps),gold:startGold(L),waves:waveCount(L),firstHp:hpScale(L,0,mapFactor(ps)),lastHp:hpScale(L,waveCount(L)-1,mapFactor(ps))}})`,c);

console.log(JSON.stringify({seed,maps:data.length,shortGeneratedRoutes:data.filter(m=>m.level>=25&&Math.min(...m.paths)<18).map(m=>m.level),missingBranches:data.filter(m=>m.level>=25&&m.paths.length<(m.level<70?2:3)).map(m=>m.level)}));
vm.runInContext(`
function runAudit(level,policy){
 resetRandom();startLevel(level-1);G.win=false;G.t=0;
 const cells=[];for(let x=0;x<COLS;x++)for(let y=0;y<ROWS;y++)if(cellFree(x,y))cells.push({x,y});
 const samples=G.paths.map(p=>Array.from({length:Math.ceil(p.len*2)},(_,i)=>atDist(p,i/2)));
 function coverage(t,st){return samples.reduce((s,ps)=>s+ps.filter(p=>Math.hypot(p.x-t.x-.5,p.y-t.y-.5)<=st.range).length/2,0)/samples.length;}
 function power(t,st){return (Math.max(1,st.dmg-(level>14?5:level>2?2:0))*st.rate)*(t.type==='mortar'?2.4:t.type==='tesla'?Math.min(st.chain,2.5):t.type==='frost'?3:1);}
 function buy(){
  if(G.castle.lvl<5&&G.lives<castleStats().hp*.75&&G.gold>=upCost(G.castle)){let old=castleStats().hp;G.gold-=upCost(G.castle);G.castle.lvl++;G.lives+=castleStats().hp-old;}
  for(let n=0;n<80;n++){
   let best=null;
   const candidates=[];
   for(const p of cells){if(!cellFree(p.x,p.y))continue;for(const type of (policy==='gun'?['gun']:['gun','frost','tesla','mortar'])){
    const t={...p,type,lvl:1,cool:0,flash:0,recoil:0};const cost=TOWERS[type].cost;if(cost>G.gold)continue;const st=towerStats(t);
    let cov=0;for(const ps of samples)for(const q of ps){if(Math.hypot(q.x-p.x-.5,q.y-p.y-.5)>st.range)continue;let existing=0;for(const o of G.towers){const os=towerStats(o);if(Math.hypot(q.x-o.x-.5,q.y-o.y-.5)<=os.range)existing+=power(o,os);}cov+=1/(1+existing/50);}
    let score=power(t,st)*cov/2/samples.length/cost;
    if(type==='frost'&&G.towers.filter(o=>o.type==='frost').length>=Math.max(1,G.towers.length/6))score*=.2;
    const gate=G.path.pts.at(-1);if(!G.towers.length&&Math.hypot(p.x+.5-gate.x,p.y+.5-gate.y)<2.6)score*=3;
    candidates.push({t,cost,score});
   }}
   for(const t of G.towers){if(t.lvl>=5||upCost(t)>G.gold)continue;const st=towerStats(t),ns=towerStats({...t,lvl:t.lvl+1});candidates.push({t,cost:upCost(t),upgrade:true,score:(power(t,ns)*coverage(t,ns)-power(t,st)*coverage(t,st))/upCost(t)});}
   candidates.sort((a,b)=>b.score-a.score);best=candidates[0];if(!best)break;G.gold-=best.cost;if(best.upgrade)best.t.lvl++;else G.towers.push(best.t);
  }
 }
 let ticks=0;buy();
 while(!G.over&&ticks<60*2400){if(!G.waveRunning){buy();startWave();}if(ticks%120===0)buy();update(1/60);ticks++;if(G.foes.length>1500)break;}
 return {level,policy,win:G.win,wave:G.wave,lives:G.lives,damage:G.dmgTaken,seconds:Math.round(G.t),gold:G.gold,towers:G.towers.length,foes:G.foes.length,stars:G.win?(G.dmgTaken===0?3:G.dmgTaken<=4?2:1):0};
}
`,c);
for(const level of (process.argv[2]||'1,12,24,25,70,120').split(',').map(Number)){console.log(JSON.stringify(c.runAudit(level,process.argv[3]||'mixed')));}
