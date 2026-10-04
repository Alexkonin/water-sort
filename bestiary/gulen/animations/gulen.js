(function(root){'use strict';
const ATTACK_DURATION=1.1,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x));
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function boost(f,now,k=.2,duration=4){if(f.dead)return;const old=f.drumFactor||1,next=1+k;if(next>old){f.hp*=next/old;f.hpMax*=next/old;f.drumFactor=next;}f.drumUntil=Math.max(f.drumUntil||0,now+duration);}
function expire(f,now){if(f.drumFactor&&now>=f.drumUntil){f.hp/=f.drumFactor;f.hpMax/=f.drumFactor;f.drumFactor=0;f.drumUntil=0;}}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=col;c.fill()}
function stroke(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function patch(c,x,y,rx,ry,col,seed=0){c.beginPath();for(let i=0;i<18;i++){const a=i*Math.PI/9,d=1+.09*Math.sin(i*2.3+seed);const u=x+Math.cos(a)*rx*d,v=y+Math.sin(a)*ry*d;i?c.lineTo(u,v):c.moveTo(u,v);}c.closePath();c.fillStyle=col;c.fill();}
function shade(c,x,y,r,light,dark){const g=c.createRadialGradient(x-r*.25,y-r*.3,r*.04,x,y,r);g.addColorStop(0,light);g.addColorStop(1,dark);return g;}
function draw(c,o={}){
const r=(o.size||90)/3,walk=o.state==='walk',ph=(o.distance||0)*8+(o.seed||0),a=o.attack;
const strike=a==null?0:a<.6?clamp((a-.25)/.35):1-clamp((a-.6)/.4),lift=a==null?0:Math.sin(Math.PI*clamp(a/.6)),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.5,y:0};
c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
if(o.state==='attack')c.translate((target.x-1.25)*strike,target.y*strike);
if(o.shadow!==false)oval(c,-.08,.09,1.15,1.03,'#1b271d50');
c.rotate(walk?Math.sin(ph)*.025:0);
// Small root feet peek out behind the heavy back, never radiating like legs.
for(const side of [-1,1]){const x=-.61+(walk?Math.sin(ph)*side*.10:0),y=side*.57;patch(c,x,y,.39,.25,'#3c3828',side);for(let j=0;j<3;j++)stroke(c,x-.19,y+(j-1)*.09,x+.14,y+(j-1)*.08,'#766044',.06);}
// Arms are lower than the back and curve around its sides to cradle the log.
for(const side of [-1,1]){const reach=side===-1?lift:0;c.beginPath();c.moveTo(-.29,side*.61);c.bezierCurveTo(-.12,side*1.03,.42-reach*.12,side*1.05,.79-reach*.17,side*(.78+reach*.12));c.strokeStyle='#302f22';c.lineWidth=.42;c.stroke();c.strokeStyle=shade(c,.1,side*.75,.72,'#697349','#373d2b');c.lineWidth=.34;c.stroke();for(let j=0;j<3;j++)stroke(c,.02,side*(.87+j*.04),.43-reach*.1,side*(.91+j*.025),'#7c714f',.025);}
// One broad pear-shaped back, narrow at the rear, with a low forward brow.
c.beginPath();c.moveTo(-1.02,0);c.bezierCurveTo(-1.05,-.56,-.59,-.88,-.08,-.85);c.bezierCurveTo(.48,-.83,.66,-.44,.59,0);c.bezierCurveTo(.66,.44,.48,.83,-.08,.85);c.bezierCurveTo(-.59,.88,-1.05,.56,-1.02,0);c.closePath();c.fillStyle=shade(c,-.28,-.09,1.07,'#8a9160','#29372a');c.fill();
// Split bark ridges follow the spine, with small irregular moss islands.
for(let k=0;k<5;k++){const y=(k-2)*.27;c.beginPath();c.moveTo(-.89,y*.52);c.bezierCurveTo(-.60,y-.09,-.18,y+.07,.30,y*.85);c.strokeStyle='#3b3829';c.lineWidth=.09;c.stroke();c.strokeStyle='#817556';c.lineWidth=.035;c.stroke();}
for(let i=0;i<19;i++){const t=i*2.399,d=.16+(i%6)*.105,x=-.25+Math.cos(t)*d,y=Math.sin(t)*d*.97;patch(c,x,y,.13+(i%3)*.045,.11+(i%4)*.014,['#78864c','#657540','#8a9156'][i%3],i);for(let j=0;j<4;j++)oval(c,x+Math.sin(i+j*4)*.09,y+Math.cos(j*3)*.065,.012,.009,'#bdba7b70');}
// Eyes are narrow glints beneath a projecting brow, not round eyes on the back.
for(const side of [-1,1]){oval(c,.48,side*.23,.11,.055,'#212a20');oval(c,.53,side*.23,.035,.018,'#e7b751');patch(c,.39,side*.23,.15,.075,'#65733f',side);}
// Log lies across the front: cylindrical light, broken bark plates running along its axis.
oval(c,.86,.04,.43,1.0,'#18231c55');
c.beginPath();c.moveTo(.51,-.87);c.lineTo(.66,-.97);c.lineTo(1.06,-.94);c.lineTo(1.25,-.82);c.lineTo(1.23,.87);c.lineTo(1.05,.98);c.lineTo(.65,.96);c.lineTo(.51,.83);c.closePath();const wood=c.createLinearGradient(.5,0,1.25,0);wood.addColorStop(0,'#493d2c');wood.addColorStop(.38,'#b19a72');wood.addColorStop(.72,'#87704e');wood.addColorStop(1,'#403629');c.fillStyle=wood;c.fill();
for(let i=0;i<11;i++){const x=.55+i*.061;c.beginPath();c.moveTo(x,-.85);for(let j=0;j<9;j++)c.lineTo(x+Math.sin(i*3+j*1.3)*.018,-.85+j*.214);c.strokeStyle=['#54452f','#9f8963','#726043'][i%3];c.lineWidth=.018+(i%2)*.008;c.stroke();for(let j=0;j<3;j++){const y=-.65+j*.52+Math.sin(i*7+j)*.10;stroke(c,x,y,x+.048,y+.045,'#4e402d',.012);}}

for(const side of [-1,1]){oval(c,.87,side*.91,.35,.095,'#c0aa7d');oval(c,.87,side*.924,.26,.057,'#2c251d');stroke(c,.56,side*.58,1.18,side*.59,'#46542f',.044);stroke(c,.57,side*.63,1.17,side*.64,'#788046',.023);}
// Only the short gripping pads overlap the sides of the drum.
for(const side of [-1,1]){const l=side===-1?lift:0,x=.78-l*.17,y=side*(.81+l*.12);patch(c,x,y,.23,.16,shade(c,x,y,.28,'#899062','#424b30'),side);for(let j=0;j<3;j++)stroke(c,x-.12+j*.085,y-side*.02,x-.09+j*.085,y-side*.14,'#8b805d',.04);}
for(let k=0;k<3;k++){const x=-.39-k*.16,y=-.25+k*.23;stroke(c,x,y,x-.34,y-.12,'#485b32',.025);for(let j=0;j<5;j++){const u=x-j*.065;stroke(c,u,y-j*.023,u-.085,y-j*.023-.065,'#9ca56c',.025);stroke(c,u,y-j*.023,u-.08,y-j*.023+.045,'#7f914e',.025);}}
if(a!=null&&a>=.6&&a<1){const p=(a-.6)/.4;c.strokeStyle='rgba(204,225,143,'+(1-p)*.6+')';c.lineWidth=.025;c.beginPath();c.ellipse(.85,0,.2+p*1.4,.3+p*1.4,0,0,7);c.stroke();}
c.restore();}

root.Gulen={draw,attackProgress,boost,expire,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
