/* Floating dandelion seed. +x is forward; combat owns damage and contact. */
(function(root){
'use strict';
const TAU=Math.PI*2,CONTACT=.52,ATTACK_DURATION=.8,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const phase=(o.state==='walk'?(o.distance||0)*4:(o.time||0)*1.7)+(o.seed||0),a=clamp(o.attack||0),active=o.state==='attack';return {sway:Math.sin(phase)*.10,drift:Math.sin(phase*.7)*.08,fold:active?(a<.3?smooth(a/.3):1-smooth((a-.6)/.4)):0,dart:active?(a<CONTACT?smooth((a-.3)/(CONTACT-.3)):1-smooth((a-CONTACT)/.35)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.18):0}}
function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill()}
function draw(c,o={}){
 const r=(o.size||80)/2.7,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.55,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
 // Two-tone filaments retain subpixel detail on the pale stone road.
 const rayWidth=Math.max(.027,.80/r),edgeWidth=Math.max(.061,1.55/r);
 const barbWidth=Math.max(.016,.50/r),barbEdge=Math.max(.040,1.02/r);
 const dx=(target.x-.85)*p.dart,dy=target.y*p.dart;
 if(o.shadow!==false)oval(c,dx,dy+.18,.70,.40,'#243d2620');
 c.translate(dx,dy);c.rotate(p.sway*(1-p.fold));c.translate(0,p.drift*(1-p.dart));
 if(o.evade>0)c.translate(0,-Math.sin(clamp(o.evade/.22)*Math.PI)*.30);
 // Compact flexible stem, seed suspended slightly ahead of the canopy in top view.
 c.beginPath();c.moveTo(-.27,0);c.quadraticCurveTo(.05,-.11-p.sway,.40,0);c.strokeStyle='#394a4c';c.lineWidth=Math.max(.09,1.5/r);c.stroke();c.strokeStyle='#e4d29d';c.lineWidth=Math.max(.043,.65/r);c.stroke();
 c.save();c.translate(.50,0);c.rotate(-p.sway*.7);
 c.beginPath();c.moveTo(.38,0);c.bezierCurveTo(.02,-.32,-.25,-.24,-.25,0);c.bezierCurveTo(-.25,.24,.02,.32,.38,0);c.closePath();
 const g=c.createLinearGradient(-.1,-.22,.16,.25);g.addColorStop(0,'#fff0af');g.addColorStop(.45,'#dda548');g.addColorStop(1,'#8c512c');c.fillStyle=g;c.fill();c.strokeStyle='#354347';c.lineWidth=Math.max(.046,1.05/r);c.stroke();
 c.strokeStyle='#9b7f4c77';c.lineWidth=.016;for(const side of [-1,1]){c.beginPath();c.moveTo(-.23,0);c.quadraticCurveTo(.0,side*.18,.36,0);c.stroke();oval(c,.095,side*.105,.031,.040,'#473c29')}
 c.restore();
 // Sixteen stable radial rays; no new random geometry every frame.
 c.save();c.translate(-.30,0);c.scale(1,.98-p.fold*.68);
 const halo=c.createRadialGradient(0,0,.03,0,0,.91);halo.addColorStop(0,'#d9f6ff55');halo.addColorStop(1,'#d9f6ff00');oval(c,0,0,.92,.92,halo);
 for(let i=0;i<16;i++){
  const a=i*TAU/16,len=.78+.08*Math.sin(i*2.4);c.save();c.rotate(a);
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(len*.55,-.055,len,-.015);c.strokeStyle='#3d5965cc';c.lineWidth=edgeWidth;c.stroke();c.strokeStyle=i%2?'#e8f8ff':'#ffffff';c.lineWidth=rayWidth;c.stroke();
  for(let j=0;j<3;j++){const x=len*(.45+j*.18);for(const side of [-1,1]){c.beginPath();c.moveTo(x,-.025);c.quadraticCurveTo(x+.1,side*.09,x+.15,side*(.12+j*.012));c.strokeStyle='#3d5965aa';c.lineWidth=barbEdge;c.stroke();c.strokeStyle='#f0fbff';c.lineWidth=barbWidth;c.stroke()}}
  c.restore();
 }
 oval(c,0,0,.093,.093,'#385562');oval(c,0,0,.057,.057,'#fff5d5');c.restore();c.restore();
 if(p.impact){c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.globalAlpha=p.impact;for(let i=0;i<6;i++){const a=i*TAU/6,k=1-p.impact;c.strokeStyle='#f8f2d5';c.lineWidth=.025;c.beginPath();c.moveTo(target.x+Math.cos(a)*k*.45,target.y+Math.sin(a)*k*.45);c.lineTo(target.x+Math.cos(a)*(k*.45+.10),target.y+Math.sin(a)*(k*.45+.10));c.stroke()}c.restore()}
}
root.Pushinka={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
