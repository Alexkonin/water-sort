const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Q=require('../tower-diorama-geometry.js');
const D=require('../tower-diorama-maps.js');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

function placementGame(){
  const html=read('tower-diorama.html');
  const section=(from,to)=>html.slice(html.indexOf(from),html.indexOf(to,html.indexOf(from)));
  const els=new Map(), hints=[];
  const el=id=>{if(!els.has(id))els.set(id,{textContent:'',classList:{remove(){}},setAttribute(){},addEventListener(){}});return els.get(id);};
  let pointer;
  const c=vm.createContext({DioramaMaps:D,DioramaGeometry:Q,document:{querySelector:el},
    localStorage:{getItem:()=>null},sfx:{stop(){}},clearUndo(){},closeAll(){},layout(){},
    refreshHud(){},refreshPalette(){},refreshSel(){},sndNope(){},sndBuild(){},sndTap(){},
    showHint:t=>hints.push(t),setUndo(){},selectCastle(){},
    cv:{getBoundingClientRect:()=>({left:0,top:0,width:Q.width*40,height:Q.height*40}),
      addEventListener:(name,fn)=>{if(name==='pointerdown')pointer=fn;}}});
  vm.runInContext(section('function mulberry32(a){','let terrain ='),c);
  vm.runInContext(section('const COLS =','/* ============ canvas'),c);
  vm.runInContext(section('function startLevel(i){','/* ============ волны'),c);
  vm.runInContext(section('function cellAt(ev){',"$('#btnUp').addEventListener"),c);
  const run=code=>vm.runInContext(code,c);
  return {run,hints,tap(x,y){const p=Q.project(x+.5,y+.5,0,40);pointer({clientX:p.x,clientY:p.y,preventDefault(){}});}};
}

test('environment footprints preserve every route and enough construction space on all maps',()=>{
  const h=placementGame();
  const maps=h.run('MAPS.map(m=>({blocked:[...DioramaMaps.occupancy(m).keys()],road:[...new Set(buildPaths(m).flatMap(p=>[...p.cellKey]))]}))');
  assert.equal(maps.length,120);
  for(const [i,m] of maps.entries()){
    assert.ok(m.blocked.every(k=>!m.road.includes(k)),`obstacle covers a route on map ${i}`);
    assert.ok(117-new Set([...m.blocked,...m.road]).size>=30,`not enough tower sites on map ${i}`);
  }
  assert.ok(maps[0].blocked.includes('0,5'),'visible west boulder is occupied');
  assert.ok(maps[0].blocked.includes('3,4'),'central stones are occupied');
  assert.ok(!maps[0].blocked.includes('2,3'),'open clearing remains buildable');
});

test('real placement rejects every obstacle without charging, permits clearings, and resets per level',()=>{
  const h=placementGame();h.run("startLevel(0);G.armed='gun'");
  const gold=h.run('G.gold');
  for(const key of h.run('[...G.blocked]')){
    const [x,y]=key.split(',').map(Number);h.tap(x,y);
    assert.equal(h.run('G.towers.length'),0,key);
    assert.equal(h.run('G.gold'),gold,key);
    assert.match(h.hints.at(-1),/здесь нельзя строить/);
  }
  h.tap(0,2);assert.equal(h.run('G.gold'),gold,'road cannot be built on');
  h.tap(2,3);assert.equal(h.run('G.towers.length'),1);
  assert.equal(h.run('G.gold'),gold-55);
  assert.equal(h.run('cellFree(2,3)'),false,'occupied tower cell cannot be reused');
  h.run('startLevel(1)');assert.equal(h.run('G.blocked.size'),0,'first-map footprints do not leak to other maps');
  h.run('startLevel(4)');assert.equal(h.run('G.blocked.has("1,6")'),true,'existing map rocks remain physical');
  h.run('startLevel(0)');assert.equal(h.run('cellFree(2,3)'),true);
  assert.equal(h.run('cellFree(0,5)'),false,'restart restores environment occupancy');
});

test('projected cell centers map back to every logical cell at desktop and phone sizes',()=>{
  for(const cell of [19,34,58])for(let y=0;y<13;y++)for(let x=0;x<9;x++){
    const p=Q.project(x+.5,y+.5,0,cell);
    assert.deepEqual(Q.cellAt(p.x,p.y,Q.width*cell,Q.height*cell),{x,y});
  }
  assert.ok(Q.cellAt(0,0,390,500).x<0);
  assert.ok(Q.cellAt(0,0,390,500).y<0);
  assert.equal(Q.cellAt(390,500,390,500).y,13);
});
test('standing sprites use all eight correct views including wraparound',()=>{
  for(let i=0;i<8;i++)assert.equal(Q.direction(i*Math.PI/4),i);
  assert.equal(Q.direction(-Math.PI/2),6);
  assert.equal(Q.direction(2*Math.PI),0);
  assert.equal(Q.direction(-.01),0);
});
test('height projects upward while range and ground distance keep a single projection',()=>{
  const foot=Q.project(4,6,0,40),head=Q.project(4,6,1,40);
  assert.equal(foot.x,head.x);assert.equal(foot.y-head.y,40);
  const m=Q.muzzle(2,3,Math.PI/2,'gun',1);
  assert.ok(Math.abs(m.x-2)<1e-9);assert.ok(m.y>3);assert.ok(m.z>0);
  assert.ok(Q.muzzle(2,3,0,'mortar').z>m.z);
});
test('diorama loads and writes its own save without touching classic progress',()=>{
  const classic={stars:{0:3,4:2},seen:{tank:true},sound:false};
  const data=new Map([['towerdef.v1',JSON.stringify(classic)]]);
  for(const file of ['tower-diorama.html','tower-defense.html']){
    const html=read(file),key=html.match(/const SAVE_KEY\s*= '([^']+)'/)[1];
    const start=html.indexOf('const save ='),end=html.indexOf('loadSave();',start)+'loadSave();'.length;
    const context=vm.createContext({SAVE_KEY:key,localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}});
    vm.runInContext(html.slice(start,end),context);
    if(file==='tower-diorama.html'){
      assert.equal(vm.runInContext('Object.keys(save.stars).length',context),0);
      vm.runInContext('save.stars[1]=3;writeSave()',context);
      assert.deepEqual(JSON.parse(data.get('towerdef.v1')),classic);
      assert.equal(JSON.parse(data.get('towerdiorama.v1')).stars[1],3);
    }else assert.equal(vm.runInContext('save.stars[4]',context),2);
  }
});
test('diorama is preserved for a separate project but excluded from the collection and precache',()=>{
  const menu=read('index.html'),sw=read('sw.js');
  assert.ok(menu.includes("file: 'tower-defense.html'"));
  assert.ok(!menu.includes("file: 'tower-diorama.html'"));
  assert.ok(!sw.includes("'./tower-diorama.html'"));
  assert.ok(fs.existsSync(path.join(root,'tower-diorama.html')));
  for(const f of ['tower-diorama-maps.js','tower-diorama-geometry.js','tower-diorama-renderer.js','tower-diorama.css','bestiary/ugolek/art/diorama-v01/atlas.png','diorama-art/buildings-v01.png','diorama-art/v02/first-trail.png','diorama-art/v02/cannon-turns.png']){assert.ok(fs.existsSync(path.join(root,f)));assert.ok(!sw.includes("'./"+f+"'"));}
});

test('the visual tour pauses and restores a battle without inserting entities or changing resources',()=>{
  const els=new Map();
  const $=id=>{if(!els.has(id))els.set(id,{handlers:[],textContent:'',setAttribute(){},addEventListener(name,fn,capture){this.handlers.push({name,fn,capture});}});return els.get(id);};
  const game={paused:false,over:false,gold:135,wave:2,towers:[{type:'gun',lvl:2}],foes:[{type:'grunt',hp:36}],shots:[],fx:[]};
  const original=JSON.stringify(game);
  const c=vm.createContext({DioramaMaps:D,DioramaGeometry:Q,Image:class{},matchMedia:()=>({matches:false}),
    document:{querySelector:$},$ ,G:game,performance:{now:()=>1000},
    draw(){},drawPortrait(){},buildTerrain(){},refreshSoundButton(){},startLevel(){},firstUnfinished:()=>0,
    requestAnimationFrame(){},save:{stars:{0:3}},navigator:{},setTimeout(){}});
  vm.runInContext(read('tower-diorama-renderer.js'),c);
  const click=id=>$(id).handlers.filter(h=>h.name==='click').forEach(h=>h.fn());
  click('#btnTour');assert.equal(game.paused,true);
  assert.equal($('#btnTour').textContent,'Вернуться к игре');
  click('#btnTour');assert.equal(JSON.stringify(game),original);
  click('#btnTour');click('#btnGo');assert.equal(JSON.stringify(game),original);
  game.paused=true;click('#btnTour');click('#btnTour');assert.equal(game.paused,true,'a previous pause is retained');
});
