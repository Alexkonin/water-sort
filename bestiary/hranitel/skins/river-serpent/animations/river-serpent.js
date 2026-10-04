(function(root){'use strict';
const ATTACK_DURATION=1.5,CONTACT=.64,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack';return {phase:(o.distance||0)*5+(o.seed||0),coil:active?(a<.35?ease(a/.35):1-ease((a-.35)/.4)):0,wave:active?ease((a-.35)/(CONTACT-.35)):0,fade:active?1-ease((a-CONTACT)/(1-CONTACT)):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function draw(c,o={}){const r=(o.size||120)/3,p=pose(o),t=o.time||0,goal=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:3,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
const point=u=>({x:.58-u*2.95-p.coil*Math.sin(u*Math.PI)*.22,y:Math.sin(u*7-p.phase)*.44*u+Math.sin(u*Math.PI*2)*p.coil*.48});
if(o.shadow!==false)oval(c,-.5,.14,1.72,.58,'#122c353d');
// Water silhouette remains visible around the dark body on a sandy road.
for(const side of [-1,1]){c.beginPath();c.moveTo(.38,side*.31);c.bezierCurveTo(-.1,side*(.93+Math.sin(t*2)*.06),-1.1,side*.4,-2.2,side*.8+Math.sin(p.phase)*.2);c.bezierCurveTo(-1.4,side*.17,-.65,side*.25,.38,side*.31);c.fillStyle='#79d5d18a';c.fill();c.strokeStyle='#cbffefb8';c.lineWidth=.024;c.stroke();}
// Tapered, overlapping cross sections build a continuous muscular S-shaped body.
for(let i=48;i>=0;i--){const u=i/48,q=point(u),w=.045+.38*Math.pow(1-u,.65);oval(c,q.x,q.y,w*1.17,w,'#132f3b');oval(c,q.x-.015,q.y-.035,w*.95,w*.84,i%3?'#255363':'#2d6070');}
// Inner current follows the spine, with moving light motes.
c.beginPath();for(let i=0;i<=48;i++){const u=i/48,q=point(u);if(i===0)c.moveTo(q.x,q.y);else c.lineTo(q.x,q.y)}c.strokeStyle='#47c9c47a';c.lineWidth=.13;c.stroke();c.strokeStyle='#a6fff0a0';c.lineWidth=.025;c.stroke();
for(let i=0;i<12;i++){const u=(i/12+t*.10)%1,q=point(u);oval(c,q.x,q.y+Math.sin(i*3+t)*.055,.018+(i%3)*.006,.018,'#d1fff3');}
for(let i=1;i<13;i++){const u=i/15,q=point(u),w=.30*(1-u);for(const s of [-1,1]){c.beginPath();c.moveTo(q.x+.055,q.y+s*w*.35);c.quadraticCurveTo(q.x-.07,q.y+s*w*.7,q.x-.11,q.y+s*w);c.strokeStyle='#669ba96b';c.lineWidth=.016;c.stroke();}}
const tail=point(1);c.beginPath();c.moveTo(tail.x,tail.y);c.bezierCurveTo(tail.x-.48,tail.y+.28,tail.x-.55,tail.y-.42,tail.x-.20,tail.y-.38);c.strokeStyle='#99f5eaa0';c.lineWidth=.07;c.stroke();
// Broad shield-shaped head seen from above, with slanted luminous eyes.
c.save();c.translate(-p.coil*.14,0);c.beginPath();c.moveTo(1.13,0);c.quadraticCurveTo(1.14,-.28,.77,-.40);c.quadraticCurveTo(.25,-.48,.18,0);c.quadraticCurveTo(.25,.48,.77,.40);c.quadraticCurveTo(1.14,.28,1.13,0);const g=c.createLinearGradient(.5,-.4,.6,.4);g.addColorStop(0,'#55818a');g.addColorStop(.4,'#284f60');g.addColorStop(1,'#102d3b');c.fillStyle=g;c.fill();c.strokeStyle='#7bb6b2';c.lineWidth=.028;c.stroke();
for(const side of [-1,1]){oval(c,.80,side*.235,.14,.067,'#3fe8e277',side*.28);oval(c,.82,side*.23,.087,.027,'#d4fff5',side*.28);c.beginPath();c.moveTo(.47,side*.12);c.lineTo(.72,side*.16);c.lineTo(.96,side*.12);c.strokeStyle='#80a8ae';c.lineWidth=.027;c.stroke();}
c.beginPath();c.moveTo(.32,0);c.lineTo(.57,-.12);c.lineTo(.77,0);c.lineTo(.57,.12);c.closePath();c.fillStyle='#416b77';c.fill();c.restore();
// The wave travels to the actual siege target; its crest reaches it at damage contact.
if(o.state==='attack'&&p.wave>0&&p.fade>0){const x=1.1+(goal.x-1.1)*p.wave,y=goal.y*p.wave;c.save();c.globalAlpha*=p.fade;c.translate(x,y);c.rotate(Math.atan2(goal.y,goal.x-1.1));c.beginPath();c.moveTo(-.25,-.65);c.bezierCurveTo(.12,-.40,.18,.40,-.25,.65);c.strokeStyle='#59c6c6a0';c.lineWidth=.25;c.stroke();c.strokeStyle='#ddfff5';c.lineWidth=.05;c.stroke();for(let i=0;i<5;i++)oval(c,-.3-(i%2)*.13,(i-2)*.24,.04,.025,'#baffee');c.restore();}
c.restore();}
root.RiverSerpent={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
