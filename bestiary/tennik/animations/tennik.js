(function(root){'use strict';const ATTACK_DURATION=.9,CONTACT=.55,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),v=clamp(o.veil||0),moving=o.state==='walk';return {veil:v,flow:Math.sin((moving?(o.distance||0)*5:(o.time||0)*1.8)+(o.seed||0))*.075,stretch:moving?1+v*.16:1,dart:o.state==='attack'?(a<CONTACT?ease((a-.20)/.35):1-ease((a-CONTACT)/.45)):0,charge:o.state==='attack'&&a<.2?Math.sin(a/.2*Math.PI)*.12:0};}
function transition(value,hidden,dt){const goal=hidden?1:0,step=Math.max(0,dt)/(hidden?.55:.45);return value<goal?Math.min(goal,value+step):Math.max(goal,value-step);}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=col;c.fill()}
// Swept hooked folds form a compact spirit with an irregular trailing silhouette.
function wisp(c,x,y,length,width,angle,bend,light){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(length*.44,0);c.bezierCurveTo(length*.16,-width*.66,-length*.27,-width*.56,-length*.61,-width*.1+bend);c.quadraticCurveTo(-length*.40,-width*.06,-length*.39,width*.14+bend);c.lineTo(-length*.70,width*.35+bend);c.bezierCurveTo(-length*.24,width*.44,-length*.08,width*.64,length*.44,0);c.closePath();const g=c.createLinearGradient(0,-width*.5,0,width*.5);g.addColorStop(0,light);g.addColorStop(.20,'#513586');g.addColorStop(.50,'#251a40');g.addColorStop(1,'#0c1120');c.fillStyle=g;c.fill();c.strokeStyle='#9c70e095';c.lineWidth=.018;c.stroke();
// A single bright ridge gives thickness, leaving the center in deep shadow.
c.beginPath();c.moveTo(length*.39,-.01);c.bezierCurveTo(length*.12,-width*.52,-length*.25,-width*.47,-length*.58,-width*.11+bend);c.strokeStyle='#bc94ef';c.lineWidth=.021;c.stroke();c.restore();}
function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.7,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.translate((target.x-.82)*p.dart-p.charge,target.y*p.dart);
if(o.shadow!==false)oval(c,-.25,.09,1.10,.70,'#11102355');
// Local halo stays delicate: contrast comes from the dark body and luminous edges.
const halo=c.createRadialGradient(-.08,0,.15,-.08,0,1.15);halo.addColorStop(0,'#7650b329');halo.addColorStop(.65,'#7545bf22');halo.addColorStop(1,'#7341b000');oval(c,-.08,0,1.30,1.05,halo);
// The body collapses into a ground pool, while eyes remain readable above it.
const sink=ease(p.veil);c.save();c.globalAlpha*=sink*.65;const pool=c.createRadialGradient(0,0,.05,0,0,1.3);pool.addColorStop(0,'#171427bb');pool.addColorStop(.65,'#29203977');pool.addColorStop(1,'#29203900');oval(c,-.2,.07,1.3+sink*.2,.42,pool);c.restore();
c.save();c.globalAlpha*=1-sink*.91;c.translate(-sink*.16,sink*.07);c.scale(1+sink*.24,1-sink*.70);
wisp(c,-.42,-.42,1.65,.53,.28,p.flow*1.5,'#7962a8');wisp(c,-.60,.34,1.85,.50,-.22,-p.flow*1.8,'#8064b4');wisp(c,-.58,.05,2.10,.52,.07,p.flow,'#634b96');
const core=c.createRadialGradient(.1,-.24,.02,.06,0,.85);core.addColorStop(0,'#41305a');core.addColorStop(.45,'#201a33');core.addColorStop(1,'#090e19');oval(c,.05,0,.78,.61,core);
wisp(c,-.08,-.27,1.68,.72,.13,p.flow*.6,'#9974ce');wisp(c,-.25,.29,1.63,.58,-.20,-p.flow,'#7156af');
// Off-center raised crest curls into a long pointed tip.
wisp(c,.02,-.09,1.62,.56,-.08,p.flow*.7-.14,'#b292df');
// The forward face is a single dark hollow under the crest, without a mouth.
c.beginPath();c.moveTo(.79,0);c.bezierCurveTo(.75,-.38,.38,-.49,.30,-.21);c.quadraticCurveTo(.37,0,.30,.23);c.bezierCurveTo(.45,.47,.76,.35,.79,0);c.closePath();c.fillStyle='#101020';c.fill();
for(const side of [-1,1]){const x=.59,y=side*.19;const glow=c.createRadialGradient(x,y,.01,x,y,.19);glow.addColorStop(0,'#d0abffb0');glow.addColorStop(1,'#a273ff00');oval(c,x,y,.19,.15,glow);c.beginPath();c.moveTo(x-.09,y-side*.045);c.quadraticCurveTo(x+.045,y-side*.09,x+.095,y);c.quadraticCurveTo(x+.015,y+side*.043,x-.09,y-side*.045);c.fillStyle=o.reveal>0?'#ffffff':'#dfcaff';c.fill();oval(c,x+.025,y,.022,.026,'#fff9ff');}
// Sparse drifting fragments reinforce motion without turning into extra limbs.
for(let i=0;i<3;i++){const q=((o.time||0)*.65+i*.31)%1;c.globalAlpha*=(1-q)*.5;c.beginPath();c.moveTo(-1.03-q*.44,(i-1)*.37+p.flow);c.lineTo(-1.14-q*.44,(i-1)*.37-.045+p.flow);c.lineTo(-1.10-q*.44,(i-1)*.37+.028+p.flow);c.closePath();c.fillStyle='#a47fe2';c.fill();}
c.restore();
// On emergence, the eyes appear before the folded body rises out of the pool.
if(p.veil>0){c.save();c.globalAlpha*=Math.min(1,p.veil*3);for(const side of [-1,1]){const x=.56,y=side*.10+.07;oval(c,x,y,.057,.023,o.reveal>0?'#f3e9ff':'#c2a0ef');}c.restore();}
c.restore();}

root.Tennik={draw,pose,transition,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
