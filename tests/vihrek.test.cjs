const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),scope=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'bestiary/vihrek/animations/vihrek.js'),'utf8'),scope);
const Vihrek=scope.Vihrek;
test('both seasons occur and animation cannot change the chosen palette or caller state',()=>{
 const variants=new Set();
 for(let i=0;i<100;i++)variants.add(Vihrek.season(i*6.283/100));
 assert.deepEqual([...variants].sort(),['autumn','green']);
 const gradients=[];let balance=0;
 const c=new Proxy({}, {set(o,k,v){o[k]=v;return true},get(o,k){if(k==='save')return()=>balance++;if(k==='restore')return()=>balance--;if(k.startsWith('create'))return()=>({addColorStop(at,color){gradients.push(color)}});return o[k]||(()=>{})}});
 for(const seed of [.7,1.7,2.7]){
  const color=Vihrek.palettes[Vihrek.season(seed)].mid;
  for(const time of [0,1,5.3,100]){
   gradients.length=0;const options=Object.freeze({time,seed,size:32,state:'walk'});
   Vihrek.draw(c,options);assert.ok(gradients.includes(color));assert.equal(balance,0);
   Vihrek.drawDiorama(c,Object.freeze({...options,height:32,heading:Math.PI*1.5}));assert.equal(balance,0);
  }
 }
});
test('every current-renderer consumer loads the leaf renderer and its relative file exists',()=>{
 function visit(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())visit(p);else if(p.endsWith('.html')){const s=fs.readFileSync(p,'utf8');if(!s.includes('_shared/current-renderer.js'))continue;const match=s.match(/<script src="([^"]*vihrek\/animations\/vihrek.js)[^"]*"><\/script>/);assert.ok(match,p);assert.ok(fs.existsSync(path.resolve(dir,match[1])),p);assert.ok(s.indexOf(match[0])<s.indexOf('_shared/current-renderer.js'),p)}}}
 visit(path.join(root,'bestiary'));
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');assert.ok(sw.includes("'./bestiary/vihrek/animations/vihrek.js'"));
});
test('gust motion follows distance, pauses with travel and hovers when idle',()=>{
 const start={state:'walk',distance:1.2,seed:.7,time:0};
 assert.deepEqual(Vihrek.pose(start),Vihrek.pose({...start,time:100}));
 assert.notDeepEqual(Vihrek.pose(start),Vihrek.pose({...start,distance:1.8}));
 assert.notDeepEqual(Vihrek.pose({...start,state:'idle'}),Vihrek.pose({...start,state:'idle',time:1}));
 for(let distance=0;distance<50;distance+=.1){const p=Vihrek.pose({...start,distance});assert.ok(Math.abs(p.surge)<.1);assert.ok(Math.abs(p.drift)<=.1);assert.ok(p.stretch>=.88&&p.stretch<=1.12);}
});
test('gust reaches the target exactly at siege contact and finishes recovery',()=>{
 assert.equal(Vihrek.attackPose(Vihrek.RELEASE-.001).flight,null);
 assert.equal(Vihrek.attackPose(Vihrek.RELEASE).flight,0);
 assert.equal(Vihrek.attackPose(Vihrek.CONTACT).flight,1);
 assert.equal(Vihrek.attackPose(Vihrek.CONTACT).impact,1);
 assert.equal(Vihrek.attackProgress(0,0),Vihrek.CONTACT);
 assert.equal(Vihrek.attackProgress(1.2,.4),Vihrek.CONTACT);
 assert.equal(Vihrek.attackPose(1).coil,0);assert.equal(Vihrek.attackPose(1).impact,0);
});
