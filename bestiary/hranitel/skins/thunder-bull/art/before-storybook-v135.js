(function(root){'use strict';
const ATTACK_DURATION=1.5,CONTACT=.64,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',phase=(o.distance||0)*6+(o.seed||0);return {phase,roll:o.state==='walk'?Math.sin(phase)*.025:0,ram:active?(a<CONTACT?ease((a-.36)/.28):1-ease((a-CONTACT)/.36)):0,brace:active&&a<.36?Math.sin(a/.36*Math.PI)*.16:0,impact:active&&a>=CONTACT?1-clamp((a-CONTACT)/.24):0,charge:active?Math.sin(Math.min(a/CONTACT,1)*Math.PI/2):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function stroke(c,pts,col,w){c.beginPath();pts.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function cloud(c,x,y,r,t){const g=c.createRadialGradient(x-r*.3,y-r*.4,0,x,y,r);g.addColorStop(0,'#9392b3');g.addColorStop(.42,'#646783');g.addColorStop(1,'#303548');oval(c,x,y,r,r*.82,g);for(let j=0;j<3;j++){const a=j*2.1+t*.18;oval(c,x+Math.cos(a)*r*.45,y+Math.sin(a)*r*.35,r*.45,r*.36,j===0?'#8588a499':'#555d7899');}}
function draw(c,o={}){const r=(o.size||120)/3,p=pose(o),t=o.time||0,target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2.5,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
c.translate((target.x-1.44)*p.ram-p.brace,target.y*p.ram);c.rotate(p.roll);
if(o.shadow!==false)oval(c,-.15,.1,1.35,1.02,'#21213944');
// Four short weight-bearing legs: a staggered heavy step, tucked under the cloud mantle.
for(let i=0;i<4;i++){const front=i<2,s=i%2?1:-1,step=o.state==='walk'?Math.sin(p.phase+i*Math.PI*.5)*.13:0,x=(front?.4:-.74)+step,y=s*.68;stroke(c,[[x-.1,y*.65],[x,y]],'#262b3c',.25);oval(c,x,y,.23,.17,'#585b65');stroke(c,[[x+.18,y],[x-.03,y]],'#232634',.025);cloud(c,x-.14,y,.19,t+i);}
// Attached tail dissolves into a storm wisp.
c.beginPath();c.moveTo(-.85,0);c.bezierCurveTo(-1.36,-.07,-1.23,.30+Math.sin(t*1.8)*.1,-1.63,.23);c.strokeStyle='#333a50';c.lineWidth=.07;c.stroke();cloud(c,-1.64,.23,.21,t);
oval(c,-.27,0,.96,.64,'#292f43');oval(c,.07,0,.76,.72,'#3b4059');
// Broad, irregular cloud banks cover the shoulders and back, rather than a circular puffball.
for(let i=0;i<25;i++){const a=i*2.399,d=.16+(i%5)*.13,x=-.24+Math.cos(a)*d*1.25,y=Math.sin(a)*d*.91;cloud(c,x+Math.sin(t*.8+i)*.025,y,.20+(i%4)*.035,t+i);}
// Slow internal electrical pulses remain readable without strobing.
const light=.35+.25*Math.sin(t*2+(o.seed||0))+.4*p.charge;c.save();c.globalAlpha*=light;
const bolt=[[-.99,.04],[-.72,-.08],[-.58,.06],[-.29,-.15],[-.12,.01],[.12,-.12],[.35,.02]];
stroke(c,bolt,'#8f8dff88',.095);stroke(c,bolt,'#d5dcff',.023);stroke(c,[[-.28,-.15],[-.43,-.36],[-.28,-.49]],'#bebfff',.018);stroke(c,[[-.60,.04],[-.47,.31],[-.59,.44]],'#bebfff',.018);c.restore();
// Long stern bovine face, seen from above.
oval(c,.68,0,.48,.32,'#272e41');oval(c,.82,0,.35,.25,'#41485c');oval(c,1.10,0,.21,.22,'#535767');oval(c,1.19,-.085,.048,.027,'#202333');oval(c,1.19,.085,.048,.027,'#202333');
for(const s of [-1,1]){oval(c,.70,s*.22,.11,.046,'#7a8fff66',-s*.3);oval(c,.72,s*.22,.075,.024,'#e0ebff',-s*.3);
// Ivory horns sweep sideways and curve forward, clear above the cloud silhouette.
c.beginPath();c.moveTo(.42,s*.24);c.bezierCurveTo(.03,s*.60,.09,s*1.08,.68,s*1.23);c.quadraticCurveTo(1.02,s*1.28,1.44,s*1.04);c.bezierCurveTo(.92,s*1.13,.62,s*.89,.62,s*.57);c.lineTo(.67,s*.30);c.closePath();const h=c.createLinearGradient(.3,0,1.1,s*1.2);h.addColorStop(0,'#a5a1a1');h.addColorStop(.45,'#eee4cc');h.addColorStop(1,'#fff4da');c.fillStyle=h;c.fill();c.strokeStyle='#7d7c89';c.lineWidth=.018;c.stroke();
for(let j=0;j<4;j++){const x=.34+j*.075,y=s*(.55+j*.10);stroke(c,[[x-.08,y],[x+.06,y+s*.065]],'#9d97a55a',.018);}}
cloud(c,.35,0,.25,t);
if(p.impact>0){c.save();c.globalAlpha*=p.impact;const reach=.25+(1-p.impact)*.65;c.beginPath();c.ellipse(1.44,0,reach*.5,1.02+reach,0,0,7);c.strokeStyle='#bfcaff';c.lineWidth=.033;c.stroke();for(const s of [-1,1])stroke(c,[[1.44,s*1.04],[1.22,s*.74],[1.56,s*.43],[1.31,s*.2],[1.44,0]],'#e6efff',.04);c.restore();}
c.restore();}
root.ThunderBullBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
