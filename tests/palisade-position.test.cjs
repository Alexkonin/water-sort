const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
for(const file of ['tower-defense.html','tower-diorama.html']){
  const html=fs.readFileSync(require('node:path').join(__dirname,'..',file),'utf8');
  const section=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
  const G={castle:{palisade:20},foes:[],reached:0};
  const c=vm.createContext({G,console,DioramaMaps:require('../tower-diorama-maps.js'),clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),FOES:{dummy:{atk:1,tr:[]}},TRAITS:{}});
  vm.runInContext(section('const COLS =','/* ============ башни')+section('function mulberry32(','let terrain =')+section('function buildPath(','/* ============ состояние')+section('const SIEGE_SLOTS','/* ============ бой'),c);
  test(file+': barriers occupy adjacent road cells and deduplicate shared approaches on every map',()=>{
    for(const map of vm.runInContext('MAPS',c)){
      G.paths=c.buildPaths(map);G.path=G.paths[0];
      const frames=c.palisadeFrames(),gate=G.path.pts.at(-1);
      assert.equal(new Set(frames.map(({b})=>b.x+','+b.y)).size,frames.length);
      for(const {b} of frames){
        assert.equal(Math.abs(b.x-gate.x)+Math.abs(b.y-gate.y),1);
        assert.ok(G.paths.some(p=>p.cellKey.has(Math.floor(b.x)+','+Math.floor(b.y))));
      }
    }
  });
  test(file+': enemies face their own approach and leave the destroyed barrier for the castle',()=>{
    G.paths=[c.buildPath([[0,2],[4,2]]),c.buildPath([[4,0],[4,2]])];G.path=G.paths[0];G.castle.palisade=20;G.foes=[];
    const f={type:'dummy',pi:1,d:.35,lunge:0};G.foes.push(f);c.startSiege(f);
    assert.equal(f.palisadeTarget,true);assert.equal(c.siegeFrame(f).b.y,1.5);
    assert.equal(c.siegeFrame(f).h,Math.PI/2);
    const movement=section('    // Разбитая преграда','    // осада: мороз');
    vm.runInContext('function stepBarrier(){for(const f of G.foes){'+movement+'}}',c);
    G.castle.palisade=0;c.stepBarrier();assert.equal(f.siege,false);assert.equal(f.palisadeTarget,false);
    f.d=G.paths[1].len;c.startSiege(f);assert.equal(f.palisadeTarget,false);
    assert.equal(c.siegeFrame(f).b.y,2.5);
  });
}
