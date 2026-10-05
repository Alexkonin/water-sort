const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(file){
  const html=fs.readFileSync(file,'utf8');
  const sec=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
  const G={foes:[]},c=vm.createContext({G,Ugolek:{},HAND_MAPS:24});
  vm.runInContext((file==='tower-defense.html'?sec('const balanceLevel =','/* Здоровье врагов.'):sec('const lvlRamp =','/* Здоровье врагов.'))+sec('function eyes(','/* Карточка — публичный договор')+sec('function arrangeSquads(','function startWave(){'),c);
  return {G,c,run:code=>vm.runInContext(code,c)};
}
for(const file of ['tower-defense.html','tower-diorama.html']){
 test(file+': all levels preserve counts, HP scale, valid routes, unique leaders and early waves',()=>{
  const h=setup(file);
  h.run(`for(let L=0;L<${file==='tower-defense.html'?1000:120};L++)for(let W=0;W<waveCount(L);W++){
    const groups=waveGroups(L,W),q=waveQueue(groups,2,L,W,3);
    if(q.length!==groups.reduce((s,g)=>s+g.n,0))throw Error('count');
    for(const g of groups)if(q.filter(f=>f.type===g.type).length!==g.n)throw Error('type count');
    for(let i=0;i<q.length;i++)if(q[i].scale!==2||q[i].at<0||!Number.isFinite(q[i].at)||(i&&q[i].at<q[i-1].at))throw Error('queue');
    if(L===0&&W<2&&q.some(f=>f.squad&&f.type!=='grunt'))throw Error('early complex squad');
    const ids=new Set(q.filter(f=>f.squad).map(f=>f.squad));
    if(ids.size>Math.ceil(q.length/3))throw Error('too many squads');
    for(const id of ids){const members=q.filter(f=>f.squad===id),lead=members.filter(f=>f.squadLead);
      if(lead.length!==1||members.length<2||members.length>5)throw Error('membership');
      if(members.some(f=>f.pi!==lead[0].pi||f.pi<0||f.pi>=3))throw Error('route');
      if(members.some(f=>f!==lead[0]&&f.squadRole!=='raider'&&(f.at<=lead[0].at||f.at-lead[0].at>4)))throw Error('escort timing');
    }
  }`);
  assert.ok(h.run("waveQueue(waveGroups(39,6),1,39,6,2).filter(f=>f.squadLead).length")>1);
  assert.ok(h.run("waveQueue(waveGroups(64,10),1,64,10,3).some(f=>f.squad&&f.type==='drummer')"));
  assert.ok(h.run("waveQueue(waveGroups(119,13),1,119,13,3).filter(f=>f.squadLead).length")>3);
 });
 test(file+': escort stays in healing range for 30 seconds, with real heal aura',()=>{
  const h=setup(file);
  const lead={type:'golem',squad:'x',squadLead:true,pi:0,d:1,sp:.7,slow:0,hp:100,hpMax:260,buff:{sp:1}};
  const dew={type:'dew',squad:'x',pi:0,d:.5,sp:1.1,slow:0,hp:80,hpMax:80,buff:{sp:1}};
  h.G.foes=[lead,dew];
  for(let i=0;i<1800;i++){
    for(const f of h.G.foes){f.pos={x:f.d,y:0};f.buff.heal=0;}
    h.run('TRAITS.heal.tick(G.foes[1],FOES.dew.traits.heal)');
    assert.equal(lead.buff.heal,.02);
    h.c.prepareSquadMovement(h.G.foes);
    for(const f of h.G.foes)f.d+=f.marchSpeed/60;
    assert.ok(lead.d-dew.d>0&&lead.d-dew.d<1.2);
  }
 });
 test(file+': slow breaks formation; death, siege, different route release escort',()=>{
  const h=setup(file);
  const leader=()=>({squad:'x',squadLead:true,pi:0,d:1,sp:.7,slow:0,buff:{sp:1}});
  const escort=()=>({squad:'x',pi:0,d:.5,sp:1.1,slow:0,buff:{sp:1}});
  for(const patch of [{dead:true},{siege:true},{pi:1},{buff:{sp:1,hold:true}}]){
    const a=Object.assign(leader(),patch),b=escort();h.c.prepareSquadMovement([a,b]);assert.equal(b.marchSpeed,1.1);
  }
  const a=leader(),b=escort();b.slow=.8;
  for(let i=0;i<600;i++){h.c.prepareSquadMovement([a,b]);a.d+=a.marchSpeed/60;b.d+=b.marchSpeed/60;assert.ok(b.marchSpeed<=.22000001);}
  assert.ok(a.d-b.d>1.5);
  const x=leader(),y=escort();h.c.prepareSquadMovement([x,y]);const speeds=[x.marchSpeed,y.marchSpeed];h.c.prepareSquadMovement([y,x]);assert.deepEqual([x.marchSpeed,y.marchSpeed],speeds);
 });
}
for(const file of ['tower-defense.html','tower-diorama.html']){
  function mob(type,d,extra={}){return {type,d,pi:0,pos:{x:d,y:0},sp:type==='dew'?1.1:.7,slow:0,hp:100,hpMax:100,buff:{sp:1},...extra};}
  test(file+': healer selects wounded heavy locally, stays loyal, replaces dead target, rejects other roads',()=>{
    const h=setup(file),dew=mob('dew',1),a=mob('golem',1.5,{hp:20}),b=mob('tank',2,{hp:30}),other=mob('golem',1.2,{pi:1,hp:1});
    const live=[dew,a,b,other];h.c.chooseSupportTargets(live,.1);assert.equal(dew.supportTarget,a);
    b.hp=1;h.c.chooseSupportTargets(live,.1);assert.equal(dew.supportTarget,a,'cooldown');
    b.hp=19;h.c.chooseSupportTargets(live,1.5);assert.equal(dew.supportTarget,a,'hysteresis');
    a.dead=true;h.c.chooseSupportTargets(live,.1);assert.equal(dew.supportTarget,b);
    b.siege=true;h.c.chooseSupportTargets(live,.1);assert.equal(dew.supportTarget,null);
    b.siege=false;b.hidden=true;h.c.chooseSupportTargets(live,2);assert.equal(dew.supportTarget,null);
    b.hidden=false;b.d=10;b.pos.x=10;h.c.chooseSupportTargets(live,2);assert.equal(dew.supportTarget,null);
  });
  test(file+': drummer prefers a nearby concentration, support waits briefly behind hero blocker',()=>{
    const h=setup(file),drum=mob('drummer',1),a=mob('tank',1.2),b=mob('golem',2.8);
    const live=[drum,a,b,mob('grunt',3),mob('grunt',3.1),mob('grunt',3.2)];
    h.c.chooseSupportTargets(live,.1);assert.equal(drum.supportTarget,b);
    const lead=mob('golem',1,{heroTarget:true}),dew=mob('dew',.4,{supportTarget:lead}),fast=mob('runner',.3,{sp:2.6,squad:'x',squadRole:'raider'});
    for(let i=0;i<120;i++)h.c.prepareSquadMovement([lead,dew,fast],1/60);
    assert.equal(dew.marchSpeed,0);assert.equal(fast.marchSpeed,2.6);
    for(let i=0;i<70;i++)h.c.prepareSquadMovement([lead,dew,fast],1/60);
    assert.equal(dew.marchSpeed,1.1,'finite waiting');
    lead.heroTarget=false;h.c.prepareSquadMovement([lead,dew],.1);assert.ok(dew.marchSpeed>0);assert.equal(dew.supportWait,0);
  });
  test(file+': fast echelon catches the leader at the planned distance and never inherits escort speed',()=>{
    const h=setup(file);h.run(`
      const queue=waveQueue(waveGroups(119,13),1,119,13,3,[{len:18},{len:24},{len:30}]);
      for(const fast of queue.filter(f=>f.squadRole==='raider')){
        const leader=queue.find(f=>f.squad===fast.squad&&f.squadLead);
        const supports=queue.filter(f=>f.squad===fast.squad&&!f.squadLead&&f.squadRole!=='raider');
        const speed=Math.min(FOES[leader.type].sp,...supports.map(f=>FOES[f.type].sp));
        const distance=(fast.at-leader.at)/(1/speed-1/FOES[fast.type].sp);
        if(distance<4||distance>10)throw Error('meeting outside approach');
        if(fast.pi!==leader.pi||fast.at<=leader.at)throw Error('incorrect route/timing');
      }
      if(!queue.some(f=>f.squadRole==='raider'))throw Error('no echelon');
    `);
  });
  test(file+': production update wires decisions before movement; real queued units move finitely',()=>{
    const h=setup(file),html=fs.readFileSync(file,'utf8');
    const begin=html.indexOf('  const live = G.foes.filter'),end=html.indexOf('      // тяжёлая поступь',begin);
    const block=html.slice(begin,end)+'\n}}}';
    Object.assign(h.c,{foePos:f=>({x:f.d,y:0}),Gulen:{expire(){}},Semyannitsa:{flight:()=>false},updateSmoulder(){},updateSporeGrowth(){},DobrynyaCombat:{enemy:()=>false}});
    h.run('function march(dt){'+block);
    const lead=mob('tank',1,{squad:'x',squadLead:true}),dew=mob('dew',.5,{squad:'x'});
    h.G.foes=[lead,dew];h.c.march(.1);
    assert.ok(Number.isFinite(lead.d)&&lead.d>1);assert.ok(Number.isFinite(dew.d)&&dew.d>.5);
    assert.equal(dew.supportTarget,lead);
  });
}

for(const file of ['tower-defense.html','tower-diorama.html']){
 test(file+': ordinary grunts group from first wave; later waves have diverse formations and rising share',()=>{
  const h=setup(file);
  const data=h.run(`[0,20,119].map(L=>{const q=waveQueue(waveGroups(L,6),1,L,6,3);return {share:q.filter(f=>f.squad).length/q.length,types:[...new Set(q.filter(f=>f.squad).map(f=>f.type))]}})`);
  assert.ok(data[0].share>=.2);assert.ok(data[1].share>=.4);assert.ok(data[2].share>=.6);
  assert.ok(data[2].types.includes('grunt'));assert.ok(data[2].types.length>=6);
  assert.ok(h.run("waveQueue(waveGroups(0,0),1,0,0,1).filter(f=>f.squad&&f.type==='grunt').length")>=3);
 });
 test(file+': line slots stay distinct for 30 seconds and nearest survivor takes command',()=>{
  const h=setup(file);
  const members=Array.from({length:4},(_,i)=>({type:'grunt',squad:'line',squadRole:'line',squadLead:i===0,squadSlot:i,pi:0,d:3-i*.7,sp:1.35,slow:0,buff:{sp:1}}));
  for(let t=0;t<1800;t++){h.c.prepareSquadMovement(members,1/60);for(const f of members)f.d+=f.marchSpeed/60;}
  for(let i=1;i<members.length;i++)assert.ok(Math.abs(members[i-1].d-members[i].d-.7)<.01);
  members[0].dead=true;const positions=members.map(f=>f.d);
  h.c.prepareSquadMovement(members,1/60);
  assert.equal(members[1].squadLead,true);assert.equal(members[1].squadSlot,0);
  assert.deepEqual(members.map(f=>f.d),positions,'promotion never teleports');
  assert.equal(members.filter(f=>!f.dead&&f.squadLead).length,1);
  for(let i=0;i<120;i++){h.c.prepareSquadMovement(members.slice(1).reverse(),1/60);for(const f of members.slice(1))f.d+=f.marchSpeed/60;}
  for(let i=2;i<members.length;i++)assert.ok(members[i-1].d-members[i].d>.5);
 });
}
for(const file of ['tower-defense.html','tower-diorama.html'])test(file+': production spawn preserves formation slots and mixed roles',()=>{
  const h=setup(file),html=fs.readFileSync(file,'utf8'),start=html.indexOf('function spawn(type, scale, opts){');
  Object.assign(h.G,{spawnIdx:0,paths:[{}],lv:0});
  Object.assign(h.c,{foePos:f=>({x:f.d,y:0}),sndFoe(){},save:{seen:{}},writeSave(){},showHint(){}});
  h.run(html.slice(start,html.indexOf('/* ============ осада',start)));
  h.run(`const plan=waveQueue(waveGroups(0,0),1,0,0,1);for(const q of plan)spawn(q.type,q.scale,q);`);
  const group=h.G.foes.filter(f=>f.squad);
  assert.equal(group.length,3);assert.deepEqual(group.map(f=>f.squadSlot),[0,1,2]);
  assert.ok(group.every(f=>f.pi===0&&f.squadRole==='line'));
  assert.equal(group.filter(f=>f.squadLead).length,1);
});
