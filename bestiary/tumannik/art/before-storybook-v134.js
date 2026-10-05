/* Top-down fog spirit. +x forward; all damage belongs to the siege timer. */
(function(root){
'use strict';
const TAU=Math.PI*2,ATTACK_DURATION=.9,CONTACT=.55,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const phase=(o.distance||0)*2+(o.seed||0),a=clamp(o.attack||0),active=o.state==='attack';return {flow:(o.time||0)*1.1+(o.seed||0),sway:Math.sin(phase)*.038,coil:active?(a<.28?ease(a/.28):1-ease((a-.28)/.30)):0,reach:active?(a<CONTACT?ease((a-.28)/(CONTACT-.28)):1-ease((a-CONTACT)/.23)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.20):0}}
function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill()}
function cloud(c,x,y,rx,ry,alpha){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(-.2,-.18,.05,0,0,1);g.addColorStop(0,'rgba(228,240,244,'+alpha+')');g.addColorStop(.48,'rgba(160,185,203,'+alpha*.65+')');g.addColorStop(1,'rgba(143,175,195,0)');oval(c,0,0,1,1,g);c.restore()}
function drawAura(c,{radius,time=0}){for(let i=0;i<5;i++){const a=i*2.4+time*.10;cloud(c,Math.cos(a)*radius*.27,Math.sin(a)*radius*.27,radius*.78,radius*.72,.10)} }
function draw(c,o={}){
 const r=(o.size||100)/3.2,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2.2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);
 if(o.shadow!==false)oval(c,-.2,.15,1.05,.48,'#24364518');
 // Airy wisps surround a dense core that stays readable at map scale.
 for(let j=0;j<3;j++)for(let i=4;i>=0;i--){const lag=p.flow-i*.42-j;cloud(c,-.25-i*.27*(1-p.coil*.3),Math.sin(lag)*(.11+i*.035)+(j-1)*.22,.52-i*.045,.36-i*.022,.20+(4-i)*.025)}
 c.save();c.scale(1-p.coil*.15,1+p.coil*.10);
 const core=c.createLinearGradient(0,-.64,0,.65);
 core.addColorStop(0,'#e2f0f3');core.addColorStop(.48,'#b6cfdc');core.addColorStop(1,'#607e94');
 c.beginPath();c.moveTo(.62,-.35);
 c.bezierCurveTo(.24,-.78,-.43,-.64,-.64,-.35);
 c.bezierCurveTo(-.88,-.38,-1.02,-.17,-1.19,-.08);
 c.bezierCurveTo(-.97,.02,-.85,.01,-.72,.06);
 c.bezierCurveTo(-.93,.20,-1.01,.33,-1.13,.35);
 c.bezierCurveTo(-.77,.49,-.53,.29,-.38,.43);
 c.bezierCurveTo(.03,.77,.69,.49,.62,-.35);c.closePath();
 c.fillStyle=core;c.fill();c.strokeStyle='#4d687d99';c.lineWidth=.055;c.stroke();c.restore();
 cloud(c,.04,0,.87*(1-p.coil*.15),.69*(1+p.coil*.10),.30);
 cloud(c,-.16,-.23,.58,.39,.35);
 // A curved mist lash grows out of the body, reaches the gate, and dissolves.
 if(p.reach>0){const ex=.4+(target.x-.4)*p.reach,ey=target.y*p.reach;
  for(let i=0;i<10;i++){const u=i/9;cloud(c,.4+(ex-.4)*u,ey*u-Math.sin(u*Math.PI)*.22,.19+(1-u)*.12,.12+(1-u)*.07,.45)}
 }
 c.save();c.translate(.47-p.coil*.09,p.sway);c.rotate(-p.sway*.6);c.scale(1.4,1.24);
 const mask=c.createLinearGradient(-.19,-.43,.30,.43);mask.addColorStop(0,'#fff6df');mask.addColorStop(.5,'#dddccd');mask.addColorStop(1,'#9ea99f');
 c.beginPath();c.moveTo(-.02,-.43);c.bezierCurveTo(.34,-.38,.39,.21,.05,.43);c.bezierCurveTo(-.24,.39,-.31,-.30,-.02,-.43);c.closePath();c.fillStyle=mask;c.fill();c.strokeStyle='#40596b';c.lineWidth=.045;c.stroke();
 for(const side of [-1,1])oval(c,.075,side*.18,.055,.112,'#203340');
 c.restore();
 if(p.impact){const k=1-p.impact;for(let i=0;i<5;i++){const a=i*TAU/5;cloud(c,target.x+Math.cos(a)*k*.45,target.y+Math.sin(a)*k*.45,.22,.20,p.impact*.45)}}
 c.restore();
}
root.TumannikBefore={draw,drawAura,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
