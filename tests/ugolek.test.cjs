const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {Ugolek}=require('../bestiary/ugolek/animations/ugolek.js');
const html=fs.readFileSync(path.join(__dirname,'../tower-defense.html'),'utf8');
const section=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
function setup(type='grunt',slow=0){
  const hits=[],G={t:0,foes:[],paths:[{len:10}],reached:0,fx:[]};
  const c=vm.createContext({Ugolek,G,Math,damageCastle:n=>hits.push({t:G.t,n}),flash(){},sndLeak(){},parts(){return []},foePos(){return {x:0,y:0}},siegeFrame(){return {b:{x:1,y:0}}}});
  vm.runInContext(section('function eyes(','/* Карточка — публичный договор'),c);
  vm.runInContext(section('function startSiege(f){','/* ============ бой'),c);
  vm.runInContext('function step(dt){for(const f of G.foes.filter(f=>!f.dead)){'+section('    // осада: мороз','  // башни')+'}',c);
  const b=vm.runInContext('FOES.'+type,c),f={type,pi:0,slow,d:10,lunge:0,dead:false};G.foes.push(f);c.startSiege(f);
  return {c,G,f,b,hits,step(dt){G.t+=dt;c.step(dt)}};
}
for(const slow of [0,.45,.65])test('siege timing and damage unchanged at slow='+slow,()=>{
  const h=setup('grunt',slow),expected=[];let timer=h.b.atk*.6;
  for(let i=0;i<1200;i++){const dt=i%7===0?.05:.016;timer-=dt*(1-slow);h.step(dt);if(timer<=0){expected.push(h.G.t);timer=h.b.atk;}}
  assert.deepEqual(h.hits.map(x=>x.t),expected);assert.ok(h.hits.every(x=>x.n===1));assert.equal(h.f.lunge,0);
});
test('wind-up precedes first unchanged contact; recovery starts at exact visual contact',()=>{
  const h=setup();let windup=false;
  while(!h.hits.length){h.step(.01);const p=Ugolek.attackProgress(h.f.atk,h.f.attackAfter);if(!h.hits.length&&p!==null){windup=true;assert.ok(p<Ugolek.CONTACT);}}
  assert.ok(windup);assert.ok(Math.abs(h.hits[0].t-.96)<.011);
  assert.ok(Math.abs(Ugolek.attackProgress(h.f.atk,h.f.attackAfter)-Ugolek.CONTACT)<1e-12);
  assert.equal(Ugolek.pose({state:'attack',attack:Ugolek.CONTACT}).flash,1);
  h.step(.2);assert.ok(Ugolek.attackProgress(h.f.atk,h.f.attackAfter)>Ugolek.CONTACT);
  h.step(.2);assert.equal(Ugolek.attackProgress(h.f.atk,h.f.attackAfter),null);
});
test('death during anticipation cancels contact and damage',()=>{
  const h=setup();for(let i=0;i<8;i++)h.step(.1);assert.ok(Ugolek.attackProgress(h.f.atk,0)!==null);
  h.f.dead=true;for(let i=0;i<30;i++)h.step(.1);assert.equal(h.hits.length,0);
});
test('other creatures retain their existing lunge and damage',()=>{
  const h=setup('tank');while(!h.hits.length)h.step(.02);assert.equal(h.f.lunge,1);assert.equal(h.hits[0].n,2);assert.equal(h.f.attackAfter,0);
});
test('step phase follows travelled distance, independent of rendering time',()=>{
  const a=Ugolek.pose({state:'walk',distance:3,seed:1,time:0}),b=Ugolek.pose({state:'walk',distance:3,seed:1,time:40});
  assert.equal(a.step,b.step);assert.equal(a.lean,b.lean);
});
test('the new renderer is installed for offline play',()=>{
  const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
  assert.match(sw,/'\.\/bestiary\/ugolek\/animations\/ugolek\.js'/);
  assert.match(html,/<script src="bestiary\/ugolek\/animations\/ugolek\.js\?v=74"><\/script>/);
});
