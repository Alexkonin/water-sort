(function(root){'use strict';const ATTACK_DURATION=1.25,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',phase=(o.time||0)*2+(o.seed||0);return {hover:.06+Math.sin(phase)*.025,sway:Math.sin(phase*.73)*.025,trail:Math.sin((o.distance||0)*3+phase*.6)*.10,spread:active?(a<.3?ease(a/.3):1-ease((a-.3)/.3)):0,strike:active?(a<CONTACT?ease((a-.3)/.3):1-ease((a-CONTACT)/.4)):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function line(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function leaf(c,x,y,l,w,a,col){c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(l*.45,0);c.quadraticCurveTo(0,-w,-l*.65,-w*.13);c.lineTo(-l*.43,w*.03);c.lineTo(-l*.58,w*.29);c.quadraticCurveTo(0,w*.58,l*.45,0);c.closePath();c.fillStyle=col;c.fill();line(c,l*.32,0,-l*.48,0,'#b3947544',.012);c.restore()}
function draw(c,o={}){const r=(o.size||120)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
// The torso approaches the target; attached arms keep a bounded reach.
const dx=(target.x-1.55)*p.strike,dy=target.y*p.strike;c.translate(dx,dy);
if(o.shadow!==false)oval(c,-.08,.20,1.06,.67,'#1e182a35');c.save();c.translate(0,-p.hover);c.rotate(p.sway*(1-p.strike));
for(let i=0;i<9;i++){const y=(i-4)*.12;c.beginPath();c.moveTo(-.24,y);c.bezierCurveTo(-.70,y+p.trail,-1.12,y-p.trail,-1.30-(i%3)*.08,y+p.trail*.7);c.strokeStyle=i%2?'#66503a':'#352c29';c.lineWidth=.026+(i%3)*.01;c.stroke();}
// Long curved wooden limbs grow from under the shoulder mantle.
for(const side of [-1,1]){const handX=.86+.36*p.strike-.22*p.spread,handY=side*(.85+.48*p.spread-.55*p.strike);c.beginPath();c.moveTo(-.18,side*.48);c.bezierCurveTo(.10,side*(1.18+.3*p.spread),handX-.26,handY+side*.26,handX,handY);c.strokeStyle='#302823';c.lineWidth=.19;c.stroke();c.strokeStyle='#806d55';c.lineWidth=.10;c.stroke();for(let j=0;j<3;j++){const y=handY+side*(j-1)*.07;c.beginPath();c.moveTo(handX-.07,y);c.quadraticCurveTo(handX+.16,y-side*.03,handX+.33,y-side*.10);c.strokeStyle=j===1?'#b09a74':'#68553e';c.lineWidth=.036;c.stroke();}for(let j=0;j<5;j++)oval(c,.20+j*.035,side*(.92+.15*p.spread)+(j%2)*.03,.038,.028,'#b6b29a');}
const body=c.createRadialGradient(-.1,-.2,.01,-.1,0,.95);body.addColorStop(0,'#5b4653');body.addColorStop(1,'#171922');oval(c,-.19,0,.86,.66,body);
for(let i=0;i<40;i++){const a=i*2.399,d=.15+(i%6)*.105,x=-.26+Math.cos(a)*d,y=Math.sin(a)*d;leaf(c,x,y,.47+(i%3)*.10,.17,a*.12+p.trail*(1-d),['#53424b','#3a303f','#706057','#282637'][i%4]);}
for(let side of [-1,1])for(let i=0;i<5;i++)leaf(c,.05-i*.14,side*(.39+i*.055),.60,.20,side*(-.50+i*.12)+p.trail*.3,['#584953','#6e5960','#403745'][i%3]);
// Birch shield viewed from above, pale and dominant against the dark mantle.
c.beginPath();c.moveTo(1.03,0);c.bezierCurveTo(.85,-.12,.65,-.41,.35,-.37);c.quadraticCurveTo(.18,-.12,.22,0);c.quadraticCurveTo(.18,.12,.35,.37);c.bezierCurveTo(.65,.41,.85,.12,1.03,0);c.closePath();const mask=c.createLinearGradient(.2,-.3,.8,.3);mask.addColorStop(0,'#baad91');mask.addColorStop(.35,'#fff1d5');mask.addColorStop(.65,'#e9dfc9');mask.addColorStop(1,'#b8a98f');c.fillStyle=mask;c.fill();c.strokeStyle='#72604b';c.lineWidth=.021;c.stroke();
for(const side of [-1,1]){oval(c,.57,side*.15,.10,.028,'#231f24',-side*.28);line(c,.65,side*.22,.78,side*.16,'#a5573d',.034);}
for(let i=0;i<12;i++){const x=.28+(i%5)*.11,y=((i*7)%11-5)*.039;if(x>.7&&Math.abs(y)>.11)continue;line(c,x,y,x+.035+(i%2)*.025,y+.007,'#8f7b624d',.01);}
for(let i=0;i<4;i++)leaf(c,.24-i*.08,-.30-i*.03,.27,.09,-.8+i*.1,'#655043');
if(p.strike>.9){for(let i=0;i<5;i++){const a=i*2.4;leaf(c,1.40+Math.cos(a)*.15,Math.sin(a)*.25,.13,.04,a,'#9d8361');}}
c.restore();c.restore();}
root.WhiteMaskBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
