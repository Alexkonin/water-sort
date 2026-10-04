const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {Pushinka:P}=require('../bestiary/pushinka/animations/pushinka.js');
const html=fs.readFileSync(path.join(__dirname,'../tower-defense.html'),'utf8'),slice=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
function harness(roll){const G={t:0,gold:0,fx:[]},math=Object.create(Math);math.random=()=>roll;const c=vm.createContext({Math:math,G,Ugolek:{},Pushinka:P,foePos:()=>({x:1,y:1}),parts:()=>[],sndKill(){},flash(){}});vm.runInContext(slice('function eyes(','/* Карточка — публичный договор'),c);vm.runInContext(slice('function dmgFoe(','function towerStats('),c);return {c,G,foe(type='swarm',extra={}){return {type,r:.2,hp:100,armor:0,buff:{armor:0},slow:0,bounty:4,hit:0,...extra}}}}
test('heavy shells miss tiny flying targets without damage, hit flash or reward',()=>{const h=harness(.6),f=h.foe();assert.equal(h.c.dmgFoe(f,50,'ball'),0);assert.equal(f.hp,100);assert.equal(f.hit,0);assert.equal(h.G.gold,0);assert.equal(f.evade,.22);assert.equal(h.G.fx[0].kind,'miss')});
test('accuracy distinguishes arrows, heavy ballista and frost from lightning and blast',()=>{for(const [kind,accuracyKind,hit] of [['ball','ball',false],['ball','heavy',false],['ball','arrow',true],['ice','ice',true],['chain','chain',true],['splash','splash',true]]){const h=harness(.6),f=h.foe();assert.equal(h.c.dmgFoe(f,10,kind,accuracyKind)>0,hit)}});
test('lightning and area never roll misses; frost and siege make physical hits reliable',()=>{
 for(const kind of ['chain','splash']){const h=harness(.999),f=h.foe();assert.equal(h.c.dmgFoe(f,10,kind),10)}
 const h=harness(.6);assert.equal(h.c.dmgFoe(h.foe('swarm',{slow:.45}),10,'ball'),10);assert.equal(h.c.dmgFoe(h.foe('swarm',{siege:true}),10,'ball'),20);
 assert.equal(h.c.dmgFoe(h.foe('tank',{armor:5}),10,'ball'),5);
});
test('arrow accuracy remains separate from existing physical damage resistance',()=>{const h=harness(0),a=h.foe('straw'),b=h.foe('straw');assert.equal(h.c.dmgFoe(a,20,'ball','arrow'),h.c.dmgFoe(b,20,'ball'))});
test('seed dart contacts at siege deadline; canopy folds and reopens',()=>{assert.equal(P.pose({state:'attack',attack:P.CONTACT}).dart,1);assert.equal(P.pose({state:'attack',attack:1}).fold,0);assert.equal(P.attackProgress(0),P.CONTACT);assert.deepEqual(P.pose({state:'walk',distance:1,time:0}),P.pose({state:'walk',distance:1,time:40}))});
test('a missed frost impact applies neither damage nor slow; a hit applies both',()=>{
 for(const roll of [.9,.1]){const h=harness(roll),f=h.foe(),s={kind:'ice',x:1,y:1,target:f,sp:11,dmg:10,slow:.45,slowT:2};h.G.foes=[f];h.G.shots=[s];vm.runInContext('function stepShots(dt){'+slice('  // снаряды\n','  // замок: тряска')+'}',h.c);h.c.stepShots(.02);assert.equal(f.hp,roll>.8?100:90);assert.equal(f.slow,roll>.8?0:.45);assert.equal(s.done,true)}
});
test('rendering all attack phases does not mutate caller state or unbalance canvas',()=>{
 let depth=0;const c=new Proxy({},{set(o,k,v){o[k]=v;return true},get(o,k){if(k==='save')return()=>depth++;if(k==='restore')return()=>depth--;if(k.startsWith('create'))return()=>({addColorStop(){}});return o[k]||(()=>{})}});
 for(const a of [0,.2,.4,.52,.7,1]){P.draw(c,Object.freeze({state:'attack',attack:a,size:24,evade:.1,target:Object.freeze({x:30,y:10})}));assert.equal(depth,0)}
});
test('new renderer is loaded by every bestiary consumer and precached for offline play',()=>{
 const root=path.join(__dirname,'..');function visit(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())visit(p);else if(p.endsWith('.html')){const s=fs.readFileSync(p,'utf8');if(!s.includes('_shared/current-renderer.js'))continue;const m=s.match(/<script src="([^"]*pushinka\/animations\/pushinka.js)[^"]*"><\/script>/);assert.ok(m,p);assert.ok(fs.existsSync(path.resolve(dir,m[1])),p)}}}visit(path.join(root,'bestiary'));
 assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes("'./bestiary/pushinka/animations/pushinka.js'"));
});
