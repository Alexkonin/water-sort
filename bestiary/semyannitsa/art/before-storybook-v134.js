(function(root){'use strict';
const clamp=x=>Math.max(0,Math.min(1,x));
function flight(f,now){if(f.seedBornAt==null||f.seedLanded||f.dead||f.siege)return false;const p=now>=f.seedBornAt+.65?1:clamp((now-f.seedBornAt)/.65),k=p*p*(3-2*p);f.d=f.seedFrom+(f.seedTo-f.seedFrom)*k;if(p>=1)f.seedLanded=true;return p<1;}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function draw(c,o={}){const r=(o.size||90)/3,ph=(o.distance||0)*7+(o.seed||0),step=o.state==='walk'?Math.sin(ph):0,release=o.release||0;c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);if(o.shadow!==false)oval(c,-.1,.1,1.12,.9,'#25282044');
for(const s of [-1,1]){oval(c,-.30+step*s*.12,s*.63,.35,.21,'#685334');for(let j=0;j<3;j++){c.beginPath();c.moveTo(-.45+step*s*.12,s*.65+j*.07);c.lineTo(-.11+step*s*.12,s*.65+j*.07);c.strokeStyle='#a28a58';c.lineWidth=.04;c.stroke();}}
c.rotate(step*.055);const core=c.createRadialGradient(-.2,-.2,.02,0,0,.94);core.addColorStop(0,'#b39961');core.addColorStop(1,'#4c432b');oval(c,0,0,.8,.71,core);
for(let i=0;i<11;i++){const a=i*6.283/11;c.save();c.rotate(a);c.beginPath();c.moveTo(.37,-.18);c.quadraticCurveTo(.85,-.43,1.02,-.12);c.quadraticCurveTo(.72,.14,.43,.20);c.closePath();c.fillStyle=['#6a7045','#8d8956','#5c6140'][i%3];c.fill();c.strokeStyle='#b2a36c';c.lineWidth=.015;c.stroke();c.beginPath();c.moveTo(.44,0);c.lineTo(.92,-.12);c.stroke();c.restore();}
for(const s of [-1,1]){oval(c,.64,s*.24,.13,.08,'#2e2c21');oval(c,.69,s*.24,.037,.029,'#dbb564');}
// An asymmetric soft crown, with exposed seed sockets on its forward side.
for(let i=0;i<7;i++){const a=i*2.4,x=.29+Math.cos(a)*.25,y=Math.sin(a)*.32;oval(c,x,y,.11,.09,'#aa8347');oval(c,x,y,.065,.049,'#4d3825');}
c.save();c.translate(-.19,0);c.rotate(-step*.08+Math.sin((o.time||0)*1.8)*.018-release*.08);
for(let i=0;i<14;i++){const a=i*2.399,d=.19+(i%4)*.15,x=-.13+Math.cos(a)*d,y=Math.sin(a)*d;const g=c.createRadialGradient(x-.10,y-.10,.01,x,y,.41);g.addColorStop(0,'#fff5df');g.addColorStop(.6,'#e3dce0');g.addColorStop(1,'#a5a0b680');oval(c,x,y,.38,.26,g,-.35);}
c.lineCap='round';for(let i=0;i<110;i++){const a=i*2.399,d=.16+(i%7)*.09,x=-.15+Math.cos(a)*d,y=Math.sin(a)*d*.92;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-.13,y-.13,x-.32,y-.20,x-.36-(i%4)*.045,y-.12+Math.sin(i)*.14);c.strokeStyle=i%3?'#fff5e5b0':'#c6bbd28a';c.lineWidth=.010+(i%3)*.003;c.stroke();}c.restore();
for(let i=0;i<4;i++)oval(c,.27+i*.095,-.38+i*.20,.095,.035,'#b88a45',-.45);c.restore();}
root.SemyannitsaBefore={draw,flight};
})(typeof module==='object'?module.exports:window);
