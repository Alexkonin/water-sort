/* Forest light spirit. +x forward, game timer owns the attack contact. */
(function(root){
'use strict';
const TAU=Math.PI*2,ATTACK_DURATION=.9,CONTACT=.6;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',phase=(o.distance||0)*3+(o.seed||0);return {
 sway:o.state==='walk'?Math.sin(phase)*.065:0,
 flutter:.5+.5*Math.sin((o.time||0)*25+(o.seed||0)),
 charge:active?(a<.32?ease(a/.32):1-ease((a-CONTACT)/.30)):0,
 dash:active?(a<CONTACT?ease((a-.25)/.35):1-ease((a-CONTACT)/.4)):0,
 pulse:active&&a>=.32&&a<=CONTACT?ease((a-.32)/(CONTACT-.32)):null,
 impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.25):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=col;c.fill()}
function leaf(c,side,open){
 c.save();c.translate(.36,side*.14);c.rotate(side*open);
 c.beginPath();c.moveTo(.05,0);c.bezierCurveTo(-.25,-side*.08,-.96,side*.05,-1.29,side*.30);c.bezierCurveTo(-1.09,side*.69,-.20,side*.79,.05,0);c.closePath();
 const g=c.createLinearGradient(-.8,-.4,0,.6);g.addColorStop(0,'#87904d');g.addColorStop(.45,'#526039');g.addColorStop(1,'#303d28');c.fillStyle=g;c.fill();c.strokeStyle='#bc9353';c.lineWidth=.035;c.stroke();
 c.beginPath();c.moveTo(-.03,side*.07);c.bezierCurveTo(-.25,side*.31,-.70,side*.43,-1.23,side*.32);c.strokeStyle='#c5a56a';c.lineWidth=.025;c.stroke();
 for(let i=0;i<3;i++){const x=-.25-i*.24;c.beginPath();c.moveTo(x,side*(.25+i*.05));c.quadraticCurveTo(x-.07,side*.47,x-.17,side*(.53-i*.035));c.strokeStyle='#a58d505e';c.lineWidth=.02;c.stroke()}
 c.restore();
}
function draw(c,o={}){
 const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
 if(o.shadow!==false)oval(c,-.10,.20,1.03,.61,'#15251c35');
 // The pulse is drawn in fixed local coordinates, so contact matches the real gate.
 c.save();c.translate(p.dash*.14,p.sway*(1-p.dash));
 const light=c.createRadialGradient(-.66,0,.03,-.66,0,1.10+p.charge*.2);light.addColorStop(0,'#ffe18899');light.addColorStop(.4,'#f9b93d38');light.addColorStop(1,'#e8ab2900');oval(c,-.66,0,1.25,1.1,light);
 for(const side of [-1,1]){
  c.save();c.translate(.18,side*.20);c.rotate(side*(.28+p.flutter*.23));
  oval(c,-.26,side*.56,.56,.24,'#fff1b27a',side*.50);
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-.11,side*.41,-.59,side*.75);c.strokeStyle='#fff0b4a6';c.lineWidth=.018;c.stroke();c.restore();
  for(let i=0;i<3;i++)oval(c,.1-i*.27,side*.46,.095,.15,'#756039',side*.4);
 }
 const amber=c.createRadialGradient(-.81,-.08,.02,-.58,0,.55);amber.addColorStop(0,'#fff0ac');amber.addColorStop(.42,'#ffc454');amber.addColorStop(1,'#a06e25');oval(c,-.57,0,.57,.46,amber);
 for(let i=0;i<3;i++){c.beginPath();c.ellipse(-.53-i*.14,0,.10,.36-i*.05,0,-Math.PI/2,Math.PI/2);c.strokeStyle='#ffe4a56b';c.lineWidth=.021;c.stroke()}
 leaf(c,-1,.06+p.charge*.16);leaf(c,1,.06+p.charge*.16);
 oval(c,.58,0,.34,.35,'#b08a4c');oval(c,.64,0,.30,.31,'#342f25');
 for(const side of [-1,1]){
  oval(c,.81,side*.15,.09,.036,'#ffc75e',side*-.55);oval(c,.84,side*.15,.036,.017,'#fff2bc',side*-.55);
  c.beginPath();c.moveTo(.72,side*.23);c.quadraticCurveTo(1.03,side*.38,1.08,side*.59);c.strokeStyle='#b08b4b';c.lineWidth=.041;c.stroke();oval(c,1.08,side*.59,.055,.09,'#ffd581',side*-.25);
 }
 c.restore();
 if(p.pulse!==null){const x=-.65+(target.x+.65)*p.pulse,y=target.y*p.pulse;const g=c.createRadialGradient(x,y,0,x,y,.23);g.addColorStop(0,'#fff8cb');g.addColorStop(.35,'#ffd26bbf');g.addColorStop(1,'#ffc24c00');oval(c,x,y,.24,.24,g);c.strokeStyle='#ffe5a7aa';c.lineWidth=.03;c.beginPath();c.ellipse(x,y,.06,.13,0,0,TAU);c.stroke();}
 if(p.impact>0){c.globalAlpha*=p.impact;c.strokeStyle='#ffe4a4';c.lineWidth=.028;c.beginPath();c.ellipse(target.x,target.y,.1+(1-p.impact)*.28,.16+(1-p.impact)*.35,0,0,TAU);c.stroke();}
 c.restore();
}
root.Svetlyachok={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
