// Diagnostic bot on the production combat engine, not a proof of optimal play.
// node scripts/audit-towers.cjs 23,24,25,70,120,407,454,711,1000 mixed 1
// TOWER_SOURCE=/absolute/path/to/old.html compares the same policy and RNG seed.
// TOWER_TRACE=1 includes per-wave damage and the final tower layout.
// Policy fortified saves for castle upgrades after losing a quarter of its HP.
// three-star prioritizes area damage and begins strengthening the palisade in wave 5.
// Add --require-three-stars to fail the audit unless every requested level gets 3 stars.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
function createHarness({seed=1,trace=false,source=process.env.TOWER_SOURCE||path.join(root,'tower-defense.html')}={}){
const html=fs.readFileSync(source,'utf8');
let randomState=seed;
const seededMath=Object.create(Math);seededMath.random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
const sec=(a,b)=>{let start=html.indexOf(a),end=html.indexOf(b,start);if(start<0||end<0)throw Error(a);return html.slice(start,end)};
const noop=()=>{},elements=new Map();
const $=id=>{if(!elements.has(id))elements.set(id,{style:{},firstChild:{textContent:''},classList:{remove:noop},setAttribute:noop,addEventListener(event,handler){this[event]=handler;}});return elements.get(id);};
const cv={getBoundingClientRect:()=>({left:0,top:0,width:9,height:13}),addEventListener(event,handler){this[event]=handler;}};
const c=vm.createContext({console,trace,cv,$,Math:seededMath,resetRandom:()=>{randomState=seed;},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),plural:(n,one,few,many)=>many,save:{seen:{},stars:{},goldRemaining:{}},parts:()=>[],sfx:{stop:noop}});
for(const match of html.matchAll(/<script src="(bestiary\/[^?]+)\?/g))Object.assign(c,require(path.join(root,match[1])));
for(const name of ['setUndo','sndTap','showOverlay','sndWin','sndBuild','sndNope','writeSave','showHint','sndKill','sndFoe','sndWave','sndShot','sndBoom','sndLeak','flash','refreshHud','refreshPalette','refreshSel','clearUndo','lockUndo','lockUndoForTower','closeAll','layout'])c[name]=noop;
vm.runInContext(sec('const COLS =','/* ============ сохранение')+sec('function mulberry32(','let terrain =')+sec('function buildPath(','/* ============ canvas')+sec('function eyes(','/* Карточка — публичный договор')+sec('function headingAt(','function meadowPlan(')+sec('function startLevel(','function flash('),c);
if(html.includes('function carriedGold('))vm.runInContext(sec('function carriedGold(','// открыт уровень'),c);
vm.runInContext(fs.readFileSync(path.join(root,'heroes/dobrynya/combat.js'),'utf8'),c);
vm.runInContext(sec('function cellAt(ev){',"$('#palette').addEventListener")+sec("$('#btnUp').addEventListener","$('#btnSell').addEventListener")+sec('function levelWin(){','function levelLose(){'),c);
const finishLevel=c.levelWin;c.levelWin=()=>{finishLevel();vm.runInContext("G.win=true;G.earnedStars=($('#winStars').textContent.match(/★/g)||[]).length",c)};c.levelLose=()=>{vm.runInContext('G.over=true;G.win=false',c)};
vm.runInContext(`
function uiAction(action){
 const t=action.kind==='castle'?G.castle:G.towers.find(t=>t.x===action.x&&t.y===action.y);
 const before=G.gold,cost=action.kind==='build'?TOWERS[action.type].cost:upCost(t);
 if(cost===null||cost!==action.cost||cost>G.gold)throw Error('Illegal purchase: '+JSON.stringify(action));
 if(action.kind==='build'){
  if(!cellFree(action.x,action.y))throw Error('Occupied cell');
  G.selected=null;G.armed=action.type;
  cv.pointerdown({clientX:action.x+.5,clientY:action.y+.5,preventDefault(){}});
 }else{
  if(t.lvl!==action.from)throw Error('Incorrect upgrade tier');
  G.selected=t;$('#btnUp').click();
 }
 if(G.gold!==before-cost)throw Error('Purchase rejected by production input handler');
 if(G.gold<0)throw Error('Negative gold');
}
`,c);
const data=vm.runInContext(`MAPS.map((m,L)=>{const ps=buildPaths(m);return {level:L+1,name:m.name,paths:ps.map(p=>p.len),k:mapFactor(ps),gold:startGold(L),waves:waveCount(L),firstHp:hpScale(L,0,mapFactor(ps)),lastHp:hpScale(L,waveCount(L)-1,mapFactor(ps))}})`,c);


vm.runInContext(`
function runAudit(level,policy,options={}){
 if(policy==='three-star')options={balancedUpgrades:true,typeWeights:{mortar:4,frost:4},castleWave:5,...options};
 resetRandom();startLevel(level-1);G.win=false;G.earnedStars=0;G.t=0;
 const actions=[];const initialGold=G.gold;
 function act(kind,t,cost){const action={tick:Math.round(G.t*60),wave:G.wave,kind,x:t.x,y:t.y,type:t.type,from:t.lvl,cost};uiAction(action);if(trace)actions.push(action);}
 const cells=[];for(let x=0;x<COLS;x++)for(let y=0;y<ROWS;y++)if(cellFree(x,y))cells.push({x,y});
 const samples=G.paths.map(p=>Array.from({length:Math.ceil(p.len*2)},(_,i)=>atDist(p,i/2)));
 const points=samples.flat(),coverCache=new Map();
 function covered(t,st){const key=[t.x,t.y,t.type,t.lvl].join(',');if(!coverCache.has(key))coverCache.set(key,points.flatMap((p,i)=>Math.hypot(p.x-t.x-.5,p.y-t.y-.5)<=st.range?[i]:[]));return coverCache.get(key);}
 function coverage(t,st,existing){return covered(t,st).reduce((s,i)=>s+(existing?1/(1+existing[i]/(options.saturation??50)):1),0)/2/samples.length;}
 function power(t,st){return (options.typeWeights?.[t.type]??1)*(Math.max(1,st.dmg-(level>14?5:level>2?2:0))*st.rate)*(t.type==='mortar'?2.4:t.type==='tesla'?Math.min(st.chain,2.5):t.type==='frost'?3:1);}
 function buy(){
  if(options.hero){
   if(!G.hero&&G.gold>=80){DobrynyaCombat.select();const q=atDist(G.path,G.path.len-(options.heroOffset??1));DobrynyaCombat.move(Math.floor(q.x),Math.floor(q.y));}
   while(G.hero&&G.hero.lvl<3&&G.gold>=DobrynyaCombat.upCost(G.hero))DobrynyaCombat.upgrade(G.hero);
  }
  if(options.castleWave!==undefined&&G.wave>=options.castleWave&&G.castle.lvl<4){
   const cost=upCost(G.castle);if(G.gold<cost)return;
   act('castle',G.castle,cost);
   if(G.castle.lvl<4)return;
  }
  if(G.castle.lvl<5&&G.lives<castleStats().hp*.75&&G.gold>=upCost(G.castle))act('castle',G.castle,upCost(G.castle));
  if(policy==='fortified'&&G.castle.lvl<5&&G.lives<castleStats().hp*.75&&G.gold<upCost(G.castle))return;
  for(let n=0;n<80;n++){
   const existing=points.map(()=>0);for(const o of G.towers){const os=towerStats(o),p=power(o,os);for(const i of covered(o,os))existing[i]+=p;}
   let best=null;
   const candidates=[];
   for(const p of cells){if(!cellFree(p.x,p.y))continue;for(const type of (policy==='gun'?['gun']:['gun','frost','tesla','mortar'])){
    const t={...p,type,lvl:1,cool:0,flash:0,recoil:0};const cost=TOWERS[type].cost;if(cost>G.gold&&!options.saveForBest)continue;const st=towerStats(t);
    const cov=covered(t,st).reduce((s,i)=>s+1/(1+existing[i]/(options.saturation??50)),0);
    let score=power(t,st)*cov/2/samples.length/cost;
    if(type==='frost'&&G.towers.filter(o=>o.type==='frost').length>=Math.max(1,G.towers.length/6))score*=.2;
    const gate=G.path.pts.at(-1);if(options.gateWeight)score*=1+options.gateWeight/(1+Math.hypot(p.x+.5-gate.x,p.y+.5-gate.y));if(!G.towers.length&&Math.hypot(p.x+.5-gate.x,p.y+.5-gate.y)<2.6)score*=3;
    candidates.push({t,cost,score});
   }}
   for(const t of G.towers){if(t.lvl>=5||(upCost(t)>G.gold&&!options.saveForBest))continue;const st=towerStats(t),ns=towerStats({...t,lvl:t.lvl+1});candidates.push({t,cost:upCost(t),upgrade:true,score:(options.upgradeWeight??1)*(power(t,ns)*coverage({...t,lvl:t.lvl+1},ns,options.balancedUpgrades?existing:null)-power(t,st)*coverage(t,st,options.balancedUpgrades?existing:null))/upCost(t)});}
   candidates.sort((a,b)=>b.score-a.score);best=candidates[0];if(!best||best.cost>G.gold)break;act(best.upgrade?'upgrade':'build',best.t,best.cost);
  }
 }
 let ticks=0;buy();
 const waves=[];let damageBefore=0;
 while(!G.over&&ticks<60*2400){if(!G.waveRunning){buy();damageBefore=G.dmgTaken;startWave();}if(ticks%120===0)buy();update(1/60);ticks++;if(!G.waveRunning||G.over)waves.push({wave:G.wave,damage:Number((G.dmgTaken-damageBefore).toFixed(2)),lives:G.lives,gold:G.gold});if(G.foes.length>1500)break;}
 return {level,policy,win:G.win,wave:G.wave,lives:G.lives,damage:G.dmgTaken,seconds:Math.round(G.t),gold:G.gold,towers:G.towers.length,foes:G.foes.length,stars:G.earnedStars,...(trace?{initialGold,actions,castle:{lvl:G.castle.lvl,palisade:G.castle.palisade},paths:G.paths.map(p=>p.len),mapK:G.mapK,waves,layout:G.towers.map(t=>({x:t.x,y:t.y,type:t.type,lvl:t.lvl}))}:{})};
}
// Fixed witness replay: no placement heuristic or additional money.
function runReplay(plan){
 resetRandom();startLevel(plan.level-1);G.win=false;G.earnedStars=0;G.t=0;
 if(G.gold!==plan.initialGold)throw Error('Witness starting budget changed');
 let ticks=0,index=0;const waves=[];
 function apply(){while(index<plan.actions.length&&plan.actions[index].tick<=ticks&&plan.actions[index].wave===G.wave)uiAction(plan.actions[index++]);}
 while(!G.over&&ticks<60*2400){
  apply();if(!G.waveRunning)startWave();apply();
  if(index<plan.actions.length&&plan.actions[index].tick<ticks)throw Error('Witness action missed its wave');
  update(1/60);ticks++;
  if(!G.waveRunning||G.over)waves.push({wave:G.wave,damage:G.dmgTaken,lives:G.lives});
 }
 if(index!==plan.actions.length)throw Error('Witness has unplayed actions');
 return {win:G.win,stars:G.earnedStars,wave:G.wave,damage:G.dmgTaken,lives:G.lives,gold:G.gold,hero:!!G.hero,actions:index,waves};
}
`,c);
return {context:c,maps:data,runAudit:c.runAudit,runReplay:c.runReplay};
}
module.exports={createHarness};
if(require.main===module){
 const seed=Number(process.argv[4]||1),h=createHarness({seed,trace:process.env.TOWER_TRACE==='1'}),data=h.maps;
 console.log(JSON.stringify({seed,maps:data.length,shortGeneratedRoutes:data.filter(m=>m.level>=25&&Math.min(...m.paths)<18).map(m=>m.level),missingBranches:data.filter(m=>m.level>=25&&m.paths.length<(m.level<70?2:3)).map(m=>m.level)}));
 for(const level of (process.argv[2]||'1,12,24,25,70,120').split(',').map(Number)){const result=h.runAudit(level,process.argv[3]||'mixed');console.log(JSON.stringify(result));if(process.argv.includes('--require-three-stars')&&result.stars!==3)process.exitCode=1;}
}
