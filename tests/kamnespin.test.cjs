const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {Kamnespin:K}=require('../bestiary/kamnespin/animations/kamnespin.js');
test('one foot swings while three support the stone, independently of frame time',()=>{
 for(let d=0;d<5;d+=.007){const p=K.pose({state:'walk',distance:d,seed:1});assert.ok(p.feet.filter(f=>f.lift>1e-8).length<=1);assert.ok(p.feet.every(f=>Math.abs(f.x)<=.151));}
 assert.deepEqual(K.pose({state:'walk',distance:2,time:0}),K.pose({state:'walk',distance:2,time:50}));
 assert.ok(K.pose({state:'idle',distance:2}).feet.every(f=>f.lift===0&&f.x===0));
});
test('head is tucked before ram contact, body recovers, drawing preserves caller',()=>{
 assert.equal(K.pose({state:'attack',attack:.6}).ram,1);assert.equal(K.pose({state:'attack',attack:.6}).tuck,1);
 assert.equal(K.pose({state:'attack',attack:1}).ram,0);assert.equal(K.pose({state:'attack',attack:1}).tuck,0);
 let depth=0;const c=new Proxy({},{set(o,k,v){o[k]=v;return true},get(o,k){if(k==='save')return()=>depth++;if(k==='restore')return()=>depth--;if(k.startsWith('create'))return()=>({addColorStop(){}});return o[k]||(()=>{})}});
 for(const a of [0,.3,.5,.6,.75,1]){K.draw(c,Object.freeze({size:32,state:'attack',attack:a,target:Object.freeze({x:30,y:12})}));assert.equal(depth,0)}
});
test('real siege damage timing remains unchanged with and without frost; death cancels',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../tower-defense.html'),'utf8');const slice=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
 for(const slow of [0,.45,.65]){
 const G={t:0,foes:[],paths:[{len:10}],fx:[],reached:0},hits=[];
 const ctx=vm.createContext({G,Ugolek:{ATTACK_DURATION:.72,CONTACT:.46},Kamnespin:K,Math,damageCastle:n=>hits.push({t:G.t,n}),flash(){},sndLeak(){},parts(){return []},foePos(){return {x:0,y:0}},siegeFrame(){return {b:{x:1,y:0}}}});
 vm.runInContext(slice('function eyes(','/* Карточка — публичный договор'),ctx);vm.runInContext(slice('function startSiege(f){','/* ============ бой'),ctx);vm.runInContext('function step(dt){for(const f of G.foes.filter(f=>!f.dead)){'+slice('    // осада: мороз','  // башни')+'}',ctx);
 const f={type:'tank',pi:0,slow,d:10,lunge:0,dead:false};G.foes.push(f);ctx.startSiege(f);const expected=[];let timer=2.2*.6;
 for(let i=0;i<700;i++){G.t+=.02;timer-=.02*(1-slow);ctx.step(.02);if(timer<=0){expected.push(G.t);timer=2.2}}
 assert.deepEqual(hits.map(h=>h.t),expected);assert.ok(hits.every(h=>h.n===2));assert.equal(f.lunge,0);
 const before=hits.length;f.dead=true;for(let i=0;i<300;i++)ctx.step(.02);assert.equal(hits.length,before);
 }
});
