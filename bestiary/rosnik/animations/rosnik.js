/* Rosnik: flowing dew spirit, overhead view. Combat owns healing and damage. */
(function(root){
'use strict';const TAU=Math.PI*2,ATTACK_DURATION=1,CONTACT=.6;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),phase=(o.distance||0)*4+(o.seed||0),active=o.state==='attack';return {flow:o.state==='walk'?Math.sin(phase)*.05:0,reach:active?(a<CONTACT?ease((a-.27)/.33):1-ease((a-CONTACT)/.4)):0,brace:active?(a<.27?ease(a/.27):1-ease((a-.27)/.5)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.22):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=col;c.fill()}
function draw(c,o={}){
 const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
 if(o.shadow!==false)oval(c,-.12,.12,1.02,.75,'#204c4333');
 // Low liquid ripples, no feet and no jumping.
 for(let i=0;i<2;i++){const u=((o.distance||0)*.8+i*.5)%1;c.strokeStyle=`rgba(178,244,222,${(1-u)*.20})`;c.lineWidth=.025;c.beginPath();c.ellipse(-.25-u*.26,0,.86+u*.20,.64+u*.09,0,0,TAU);c.stroke()}
 if(p.reach>0){const x=.65+(target.x-.65)*p.reach,y=target.y*p.reach;
  for(const [w,col] of [[.20,'#397d7480'],[.13,'#94e1d6b3'],[.034,'#f0fff4']]){c.beginPath();c.moveTo(.42,0);c.bezierCurveTo(.72,-.28*p.reach,x-.2,y-.20*p.reach,x,y);c.strokeStyle=col;c.lineWidth=w;c.stroke()}oval(c,x,y,.10,.09,'#c6f4e6');}
 c.save();c.scale(1+p.flow-p.brace*.08,1-p.flow+p.brace*.06);
 c.beginPath();c.moveTo(-1.12,-.05);c.bezierCurveTo(-.67,-.37,-.55,-.77,.05,-.76);c.bezierCurveTo(.98,-.76,1.06,.44,.36,.69);c.bezierCurveTo(-.26,.93,-.67,.32,-1.12,-.05);c.closePath();
 const water=c.createRadialGradient(.22,-.24,.04,0,0,1.13);water.addColorStop(0,'#cdf4dfc9');water.addColorStop(.4,'#80cfc6c9');water.addColorStop(.8,'#3d999cae');water.addColorStop(1,'#235c62e6');c.fillStyle=water;c.fill();c.strokeStyle='#a7e8e0';c.lineWidth=.035;c.stroke();
 // Inner spirit sits beneath the watery highlights, not a face on a glass shell.
 const light=c.createRadialGradient(.28,0,0,.28,0,.51);light.addColorStop(0,'#f7ffcbbd');light.addColorStop(1,'#eaffb000');oval(c,.28,0,.53,.47,light);
 c.beginPath();c.moveTo(-.08,-.12);c.bezierCurveTo(.13,-.05,.10,-.35,.39,-.28);c.bezierCurveTo(.74,-.22,.67,.35,.32,.32);c.bezierCurveTo(.02,.29,.16,.03,-.08,-.12);c.fillStyle='#edfac7ce';c.fill();
 for(const side of [-1,1]){oval(c,.48,side*.12,.08,.027,'#708940',side*-.5);oval(c,.51,side*.12,.027,.012,'#faffd8',side*-.5)}
 for(let i=0;i<8;i++){const a=i*2.399,d=.40+(i%3)*.10,x=Math.cos(a)*d,y=Math.sin(a)*d*.83;oval(c,x,y,.025+(i%2)*.012,.029,'#bdf5eb50');oval(c,x-.012,y-.012,.010,.010,'#f3fff6bb')}
 c.beginPath();c.moveTo(-.27,-.62);c.bezierCurveTo(.15,-.85,.58,-.56,.69,-.36);c.strokeStyle='#effff0c4';c.lineWidth=.043;c.stroke();
 c.beginPath();c.moveTo(.23,.60);c.quadraticCurveTo(.65,.53,.78,.19);c.strokeStyle='#c8fff3a8';c.lineWidth=.024;c.stroke();
 // Leaf follows the rear shoulder of the droplet.
 c.beginPath();c.moveTo(-.94,-.02);c.bezierCurveTo(-1.05,-.67,-.39,-.95,-.11,-.59);c.bezierCurveTo(-.16,-.11,-.59,-.24,-.94,-.02);c.closePath();const leaf=c.createLinearGradient(-.7,-.8,-.4,0);leaf.addColorStop(0,'#95aa57');leaf.addColorStop(.5,'#567a3b');leaf.addColorStop(1,'#304f2e');c.fillStyle=leaf;c.fill();c.strokeStyle='#b2bd74';c.lineWidth=.025;c.stroke();
 c.beginPath();c.moveTo(-.94,-.02);c.quadraticCurveTo(-.48,-.55,-.18,-.60);c.strokeStyle='#b9ce7e';c.lineWidth=.025;c.stroke();for(let i=0;i<3;i++){c.beginPath();c.moveTo(-.76+i*.16,-.25-i*.1);c.lineTo(-.80+i*.16,-.52-i*.05);c.strokeStyle='#a0b86888';c.lineWidth=.018;c.stroke()}
 oval(c,-.45,-.59,.076,.059,'#b3ebe7aa');oval(c,-.48,-.61,.022,.016,'#f7fff4');c.restore();
 if(p.impact>0){c.globalAlpha*=p.impact;for(let i=0;i<6;i++){const a=i*TAU/6,d=(1-p.impact)*.4;oval(c,target.x+Math.cos(a)*d,target.y+Math.sin(a)*d,.035,.028,'#d2fff0')}}
 c.restore();
}
function drawHeal(c,o={}){const phase=(o.time||0)*1.3+(o.seed||0),x=o.target.x,y=o.target.y,s=o.size||3;c.save();for(let i=0;i<3;i++){const u=((phase+i/3)%1+1)%1,arc=Math.sin(u*Math.PI)*s*2;oval(c,x*u,y*u-arc,s*(.65+u*.35),s*(.65+u*.35),'#a6efddbb');oval(c,x*u-s*.2,y*u-arc-s*.25,s*.22,s*.18,'#f2fff1');}c.strokeStyle='#baf5df88';c.lineWidth=Math.max(1,s*.3);c.beginPath();c.ellipse(x,y,s*2.2,s*1.5,0,0,TAU);c.stroke();c.restore();}
root.Rosnik={draw,drawHeal,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
