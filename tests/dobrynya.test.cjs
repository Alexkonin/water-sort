const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){const G={gold:1000,path:{pts:[{x:3.5,y:.5}]},roadKey:new Set(['0,0','1,0','2,0','3,0','1,1','1,2']),foes:[],fx:[],waveRunning:true};const elements=new Map(),$=key=>{if(!elements.has(key))elements.set(key,{firstChild:{},setAttribute(){}});return elements.get(key)};let damage=0;const c=vm.createContext({G,$,Math,FOES:{grunt:{hit:1,atk:1.6},runner:{hit:1,atk:1.6},drummer:{hit:1,atk:1.6},swarm:{hit:1,atk:1.6}},foePos:f=>f.pos,dmgFoe(f,n){f.hp-=n;damage+=n;if(f.hp<=0)f.dead=true},showHint(){},sndNope(){},sndBuild(){},clearUndo(){},refreshHud(){},refreshSel(){},refreshPalette(){}});vm.runInContext(fs.readFileSync('heroes/dobrynya/combat.js','utf8')+';globalThis.heroAPI=DobrynyaCombat',c);return {G,A:c.heroAPI,damage:()=>damage,foe(type='grunt',x=2.7){const f={type,pos:{x,y:.5},r:.3,hp:500,slow:0,buff:{hold:false},scale:1};G.foes.push(f);return f}}}
test('hire once, exactly 3 tiers, insufficient gold and cap',()=>{const {G,A}=setup();G.gold=79;A.select();assert.equal(G.hero,undefined);G.gold=400;A.select();const h=G.hero;assert.equal(G.gold,320);A.select();assert.equal(G.gold,320);assert.ok(A.upgrade(h));assert.equal(h.hp,190);assert.ok(A.upgrade(h));assert.equal(G.gold,40);assert.equal(h.hp,280);assert.equal(h.lvl,3);assert.equal(A.upgrade(h),false);assert.equal(G.gold,40)});
test('BFS follows branch, movement never leaves road, command releases enemies',()=>{const {G,A,foe}=setup();A.select();const f=foe();f.heroTarget=true;A.move(1,2);assert.equal(f.heroTarget,false);assert.equal(G.hero.route.at(-1).y,2.5);for(let i=0;i<102;i++){A.update(.02);assert.ok(G.roadKey.has(Math.floor(G.hero.x)+','+Math.floor(G.hero.y)))}assert.equal(G.hero.x,1.5);assert.equal(G.hero.y,2.5);A.move(20,20);assert.equal(G.hero.route.length,0)});
test('melee hits passing types, damage occurs once at contact and rechecks range',()=>{const {G,A,foe,damage}=setup();A.select();const f=foe('runner');A.update(.01);assert.equal(damage(),0);A.update(.35);assert.equal(damage(),18);A.update(.3);assert.equal(damage(),18);A.update(.5);A.update(.01);f.pos.x=0;A.update(.4);assert.equal(damage(),18)});
test('ground enemies engage, runners pass, capacity 3 and hidden foes pass',()=>{const {G,A,foe}=setup();A.select();for(let i=0;i<3;i++)assert.equal(A.enemy(foe(),.01),true);assert.equal(A.enemy(foe(),.01),false);assert.equal(A.enemy(foe('runner'),.01),false);const hidden=foe();hidden.hidden=true;assert.equal(A.enemy(hidden,.01),false);});
test('all engaged enemies are within melee reach; block and defeat release attackers',()=>{const {G,A,foe,damage}=setup();A.select();const f=foe('grunt',2.57);assert.ok(A.enemy(f,.01));A.update(.01);A.update(.35);assert.equal(damage(),18);G.hero.anim=0;G.hero.aim=Math.PI;const before=G.hero.hp;A.enemy(f,.6);assert.ok(G.hero.hp<before);assert.ok(before-G.hero.hp<8);const old=G.hero;A.upgrade(old);old.hp=1;A.enemy(f,2);assert.equal(G.hero,null);assert.equal(G.selected,null);assert.equal(f.heroTarget,false);A.update(100);assert.equal(G.hero,null);assert.equal(A.upgrade(old),false);const gold=G.gold;A.select();assert.notEqual(G.hero,old);assert.equal(G.gold,gold-80);assert.equal(G.hero.lvl,1);assert.equal(G.hero.hp,120);assert.equal(G.hero.x,3.5)});
test('moving or hidden/dead targets cannot be damaged; hero heals outside waves',()=>{const {G,A,foe,damage}=setup();A.select();const f=foe();A.update(.01);f.hidden=true;A.update(.5);assert.equal(damage(),0);f.hidden=false;A.move(0,0);A.update(.2);assert.equal(A.enemy(f,.2),false);assert.equal(damage(),0);G.hero.route=[];G.hero.hp=30;G.waveRunning=false;A.update(.5);assert.equal(G.hero.hp,34)});
test('outside clicks clear hero selection, map and hire clicks preserve it',()=>{const html=fs.readFileSync('tower-defense.html','utf8');const from=html.indexOf('// Bubble after button actions:');const code=html.slice(from,html.indexOf("$('#btnUndo')",from));let listener;const hero={type:'hero'},G={hero,selected:hero};const c=vm.createContext({G,document:{addEventListener(_,fn){listener=fn}},cv:{contains:t=>t==='map'},$:()=>({contains:t=>t==='hire'}),refreshSel(){},refreshPalette(){}});vm.runInContext(code,c);listener({target:'map'});assert.equal(G.selected,hero);listener({target:'hire'});assert.equal(G.selected,hero);listener({target:'outside'});assert.equal(G.selected,null);G.selected={type:'castle'};listener({target:'outside'});assert.equal(G.selected.type,'castle');G.selected=hero;listener({target:'upgrade'});assert.equal(G.selected,null)});
test('squad leader engages while escorts and raiders pass; hero can still hit them',()=>{
  const {G,A,foe,damage}=setup();A.select();
  const lead=foe();Object.assign(lead,{squad:'x',squadLead:true});
  const support=foe('drummer');Object.assign(support,{squad:'x'});
  const raider=foe();Object.assign(raider,{squad:'x',squadRole:'raider'});
  assert.equal(A.enemy(support,.01),false);assert.equal(A.enemy(raider,.01),false);assert.equal(A.enemy(lead,.01),true);
  lead.dead=true;raider.dead=true;A.update(.01);A.update(.35);assert.equal(damage(),18);
  const reassigned=foe();reassigned.supportTarget=support;assert.equal(A.enemy(reassigned,.01),false);
  A.move(1,2);assert.equal(lead.heroTarget,false);
});

test('hit provokes passing, flying, escort and siege enemies at the full attack range',()=>{
  for(const props of [{type:'runner'},{type:'swarm'},{type:'drummer',squad:'x'},{type:'grunt',supportTarget:{}},{type:'grunt',siege:true}]){
    const {G,A,foe}=setup();A.select();const f=foe(props.type,2.52);Object.assign(f,props);
    assert.equal(A.enemy(f,.01),false);A.update(.01);A.update(.35);
    assert.equal(f.heroTarget,true);assert.equal(A.enemy(f,.01),true);
    const hp=G.hero.hp;A.enemy(f,.6);assert.ok(G.hero.hp<hp);
    A.move(0,0);assert.equal(f.heroTarget,false);assert.equal(f.heroProvoked,false);assert.equal(A.enemy(f,.1),false);
  }
});
test('hit engages even with three opponents; killed or out-of-range foes do not engage',()=>{
  const {G,A,foe}=setup();A.select();for(let i=0;i<3;i++)assert.equal(A.enemy(foe('grunt',2.6),.01),true);
  const f=foe('runner',2.9);A.update(.01);A.update(.35);assert.equal(A.enemy(f,.01),true);
  f.pos.x=0;assert.equal(A.enemy(f,.01),false);assert.equal(f.heroProvoked,false);
  const dead=foe('runner',3);dead.hp=1;A.update(.4);A.update(1);A.update(.35);assert.equal(dead.dead,true);assert.equal(A.enemy(dead,.01),false);
});
