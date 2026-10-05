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
 // A swept, soft tuft: one organic volume, no spokes or crystalline branches.
 const dx=(target.x-.85)*p.dart,dy=target.y*p.dart;
 if(o.shadow!==false)oval(c,dx-.15,dy+.20,.72,.35,'#302e452b');
 c.translate(dx,dy);c.rotate(p.sway*(1-p.fold));c.translate(0,p.drift*(1-p.dart));
 if(o.evade>0)c.translate(0,-Math.sin(clamp(o.evade/.22)*Math.PI)*.30);
 // Flexible neck and a substantial copper seed make the small silhouette readable.
 c.beginPath();c.moveTo(-.12,.02);c.bezierCurveTo(.12,-.10-p.sway,.24,.17,.48,.05);
 c.strokeStyle='#776078';c.lineWidth=.07;c.stroke();
 c.beginPath();c.moveTo(.85,0);c.bezierCurveTo(.68,-.20,.27,-.34,.24,-.07);c.bezierCurveTo(.18,.23,.51,.29,.85,0);c.closePath();
 const seed=c.createLinearGradient(.28,-.21,.64,.21);seed.addColorStop(0,'#ffdfa0');seed.addColorStop(.4,'#d58d46');seed.addColorStop(1,'#754637');c.fillStyle=seed;c.fill();
 c.strokeStyle='#634b53';c.lineWidth=Math.max(.028,.65/r);c.stroke();
 c.beginPath();c.moveTo(.32,-.07);c.quadraticCurveTo(.50,-.14,.72,-.025);c.strokeStyle='#ffe8bcaa';c.lineWidth=.034;c.stroke();
 // Fold the tuft into a streamlined plume during the dart.
 c.save();c.translate(-.22,0);c.scale(1+p.fold*.08,1-p.fold*.67);
 function tuft(){c.beginPath();c.moveTo(.34,.05);
 c.bezierCurveTo(.26,-.25,.10,-.36,.00,-.44);
 c.bezierCurveTo(-.04,-.69,-.28,-.78,-.45,-.65);
 c.bezierCurveTo(-.72,-.83,-.91,-.59,-.83,-.43);
 c.bezierCurveTo(-1.06,-.46,-1.14,-.20,-.99,-.04);
 c.bezierCurveTo(-1.14,.15,-.94,.36,-.79,.33);
 c.bezierCurveTo(-.86,.58,-.56,.71,-.39,.53);
 c.bezierCurveTo(-.13,.67,.06,.40,.09,.29);
 c.bezierCurveTo(.26,.25,.25,.12,.34,.05);c.closePath();}
 const fluff=c.createLinearGradient(-.65,-.65,.06,.55);fluff.addColorStop(0,'#fffdf3');fluff.addColorStop(.40,'#f3edf4');fluff.addColorStop(.72,'#c9bdd7');fluff.addColorStop(1,'#82748f');
 tuft();c.fillStyle=fluff;c.fill();
 // Broad inner locks share the flow toward the neck; edges stay soft and unoutlined.
 const locks=[[-.80,-.33,-.68,-.60,-.23,-.47],[-.72,.05,-.87,-.13,-.31,-.26],[-.59,.36,-.78,.23,-.20,.13],[-.37,.46,-.49,.18,.04,.04]];
 for(const [x,y,bx,by,ex,ey] of locks){c.beginPath();c.moveTo(.20,.09);c.bezierCurveTo(ex,ey,bx,by,x,y);c.bezierCurveTo(x-.10,y+.10,ex-.03,ey+.16,.20,.09);c.closePath();c.fillStyle='#fffdf351';c.fill();}
 // Sparse trailing silk strands replace the old radial lattice.
 for(let i=0;i<11;i++){const y=-.52+i*.102,x=-.68-.16*Math.cos(i*.75),flutter=Math.sin((o.distance||0)*3+(o.seed||0)+i*.6)*.025;
 c.beginPath();c.moveTo(-.10,y*.26);c.bezierCurveTo(-.38,y*.60,x,y+flutter,x-.16-(i%3)*.055,y-.06+flutter);
 c.strokeStyle=i%3?'#fffdf4b3':'#b0a1bd88';c.lineWidth=Math.max(.009,.35/r);c.stroke();}
 // Highlight at the attachment keeps the tuft visibly connected to its seed.
 oval(c,.18,.07,.075,.055,'#f6e9c7');
 c.restore();c.restore();
 if(p.impact){c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.globalAlpha=p.impact;for(let i=0;i<6;i++){const a=i*TAU/6,k=1-p.impact;c.strokeStyle='#f8f2d5';c.lineWidth=.025;c.beginPath();c.moveTo(target.x+Math.cos(a)*k*.45,target.y+Math.sin(a)*k*.45);c.lineTo(target.x+Math.cos(a)*(k*.45+.10),target.y+Math.sin(a)*(k*.45+.10));c.stroke()}c.restore()}
}
root.PushinkaBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
