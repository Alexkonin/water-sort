// Run: node --test tests/sound.test.cjs
// Exercise scheduling, mute and cleanup; real waveform rendering is checked in-browser.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../sound.js'),'utf8');
class Param{
  constructor(value=0){this.value=value;this.events=[];}
  add(kind,value,time){assert(Number.isFinite(value));assert(Number.isFinite(time)&&time>=0);this.events.push({kind,value,time});this.value=value;}
  setValueAtTime(v,t){this.add('set',v,t);}
  linearRampToValueAtTime(v,t){this.add('linear',v,t);}
  exponentialRampToValueAtTime(v,t){assert(v>0);this.add('exponential',v,t);}
  cancelAndHoldAtTime(t){this.events=this.events.filter(e=>e.time<t);}
}
class Node{
  constructor(ctx,kind){this.ctx=ctx;this.kind=kind;this.connections=[];this.gain=new Param();this.frequency=new Param();this.Q=new Param();this.delayTime=new Param();for(const k of ['threshold','knee','ratio','attack','release'])this[k]=new Param();ctx.nodes.push(this);}
  connect(n){this.connections.push(n);return n;}
  disconnect(){this.connections=[];this.disconnected=true;}
  start(t){this.startTime=t;this.ctx.started.push(this);}
  stop(t){this.endTime=t;}
}
function setup({muted=false,unsupported=false}={}){
  const contexts=[],listeners={};
  class Context{
    constructor(){this.currentTime=0;this.sampleRate=8000;this.state='running';this.nodes=[];this.started=[];this.destination={};contexts.push(this);}
    createGain(){return new Node(this,'gain');}
    createBiquadFilter(){return new Node(this,'filter');}
    createDynamicsCompressor(){return new Node(this,'compressor');}
    createDelay(){return new Node(this,'delay');}
    createOscillator(){return new Node(this,'oscillator');}
    createBufferSource(){return new Node(this,'noise');}
    createBuffer(ch,len){return {getChannelData:()=>new Float32Array(len)};}
    resume(){this.state='running';return Promise.resolve();}
    suspend(){this.state='suspended';return Promise.resolve();}
    advance(t){this.currentTime=t;for(const n of this.started)if(!n.ended&&n.endTime<=t){n.ended=true;n.onended?.();}}
  }
  const document={hidden:false,addEventListener:(name,cb)=>listeners[name]=cb};
  const sandbox={document,Float32Array,Math,setTimeout:()=>0,clearTimeout(){},addEventListener:(name,cb)=>listeners[name]=cb};
  if(!unsupported)sandbox.AudioContext=Context;
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  let on=!muted;
  const sfx=sandbox.GameAudio.create({enabled:()=>on,random:()=>.5});
  return {sfx,contexts,document,listeners,setEnabled(v){on=v;sfx.sync();},get ac(){return contexts[0];}};
}
test('muted, hidden or unsupported audio never allocates a context or breaks gameplay',()=>{
  for(const options of [{muted:true},{unsupported:true}]){
    const h=setup(options);assert.equal(h.sfx.play('tap'),false);h.sfx.stop();assert.equal(h.contexts.length,0);
  }
  const h=setup();h.document.hidden=true;assert.equal(h.sfx.play('wave'),false);assert.equal(h.contexts.length,0);
});
test('combat bursts and parallel pours have bounded density',()=>{
  const h=setup();let shots=0,kills=0;
  for(let i=0;i<200;i++){shots+=Number(h.sfx.play('shot',{kind:['shot','frost','chain','splash'][i%4]}));kills+=Number(h.sfx.play('kill'));}
  assert.equal(shots,4);assert.equal(kills,1);assert(h.ac.started.length<20);
  assert.equal(h.sfx.play('flow',{duration:1}),true);assert.equal(h.sfx.play('flow',{duration:1}),true);assert.equal(h.sfx.play('flow',{duration:1}),false);
  h.ac.advance(2);assert.equal(h.sfx.play('flow',{duration:1}),true);
});
test('mute cancels both current water and all queued notes; re-enable starts fresh',()=>{
  const h=setup();h.sfx.play('flow',{duration:3});h.sfx.play('win',{delay:1});
  const before=h.ac.started.length;h.setEnabled(false);
  for(const n of h.ac.started)assert(n.endTime<=.025);
  assert.equal(h.sfx.play('tap'),false);assert.equal(h.ac.started.length,before);
  h.ac.advance(.1);assert(h.ac.started.every(n=>n.disconnected));
  h.setEnabled(true);assert.equal(h.sfx.play('tap'),true);assert(h.ac.started.length>before);
});
test('hiding the page stops tails and blocks background events; next gesture resumes',()=>{
  const h=setup();h.sfx.play('win');h.document.hidden=true;h.listeners.visibilitychange();
  assert(h.ac.started.every(n=>n.endTime<.03));assert.equal(h.sfx.play('boom'),false);
  h.ac.advance(.1);h.ac.state='suspended';h.document.hidden=false;h.listeners.visibilitychange();h.listeners.pointerdown();
  assert.equal(h.ac.state,'running');assert.equal(h.sfx.play('tap'),true);
});
test('finished and cancelled sources disconnect; repeated play does not exhaust the voice limit',()=>{
  const h=setup();
  for(let i=0;i<100;i++){
    assert.equal(h.sfx.play('win'),true);h.ac.advance((i+1)*2);
    assert(h.ac.started.every(n=>n.disconnected));
  }
  assert.equal(h.sfx.play('flow',{duration:Infinity}),true);h.sfx.stop();h.ac.advance(201);
  assert(h.ac.started.every(n=>n.disconnected));
});
test('all effects schedule finite non-negative envelopes, including invalid flow durations',()=>{
  for(const name of ['tap','nope','build','sell','wave','win','lose','complete','unlock','plop','kill','boom','leak','flow']){
    const h=setup();assert.equal(h.sfx.play(name,{duration:-5}),true);assert(h.ac.started.length>0);
    for(const n of h.ac.started){assert(n.endTime>n.startTime);assert(n.endTime<4);}
  }
});

test('different weapons share the mix; rejected events do not consume a future slot',()=>{
  const h=setup();
  for(const kind of ['shot','frost','chain','splash'])assert.equal(h.sfx.play('shot',{kind}),true);
  h.ac.advance(.15);assert.equal(h.sfx.play('shot',{kind:'arrow'}),false);
  h.ac.advance(.281);assert.equal(h.sfx.play('shot',{kind:'arrow'}),true);
  assert.equal(h.sfx.play('shot',{kind:'arrow'}),false);
});
test('creature crowds stay sparse, while each voiced type has an audible signature',()=>{
  const signatures=new Set();
  for(const voice of ['ember','leaf','stone','mist','wood','spores','lantern','dew','drum','guardian']){
    const h=setup();assert.equal(h.sfx.play('creature',{voice}),true);
    const signature=h.ac.started.map(n=>n.kind+':'+n.frequency.events.map(e=>e.value).join(',')+':'+(n.endTime-n.startTime).toFixed(3)).join('|');
    signatures.add(signature);
    assert.equal(h.sfx.play('creature',{voice}),false);
    h.ac.advance(1);assert.equal(h.sfx.play('kill',{voice}),true);
    h.setEnabled(false);assert(h.ac.started.filter(n=>!n.ended).every(n=>n.endTime<1.03));
  }
  assert.equal(signatures.size,10);
  const h=setup();assert.equal(h.sfx.play('creature',{voice:'ember'}),true);
  assert.equal(h.sfx.play('creature',{voice:'leaf'}),false);
  h.ac.advance(.7);assert.equal(h.sfx.play('creature',{voice:'leaf'}),true);
});
