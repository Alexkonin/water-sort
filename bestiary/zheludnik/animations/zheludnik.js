(function(root){'use strict';
const ATTACK_DURATION=1,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after):t>=0&&t<=CONTACT?CONTACT-t:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',ph=(o.distance||0)*(o.cracked?14:8)+(o.seed||0),walk=o.state==='walk';return {step:walk?Math.sin(ph):0,roll:walk?Math.sin(ph)*(o.cracked?.045:.10):0,ram:active?(a<CONTACT?ease((a-.28)/.32):1-ease((a-CONTACT)/.4)):0,wind:active&&a<.28?Math.sin(a/.28*Math.PI)*.13:0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function line(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function poly(c,points,col){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=col;c.fill()}
function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.6,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.translate((target.x-1.12)*p.ram-p.wind,target.y*p.ram);
if(o.shadow!==false)oval(c,-.06,.1,1.12,.87,'#24251944');c.rotate(p.roll);
for(const s of [-1,1]){const x=-.25+p.step*s*(o.cracked?.20:.10),y=s*.69;oval(c,x,y,.32,.18,'#54422d');for(let j=0;j<3;j++)line(c,x-.15,y+(j-1)*.07,x+.22,y+(j-1)*.10,'#8e7046',.048);}
const g=c.createRadialGradient(.02,-.30,.03,.10,0,1.15);g.addColorStop(0,'#cf9450');g.addColorStop(.48,'#9d602f');g.addColorStop(1,'#41291d');
c.beginPath();c.moveTo(1.12,0);c.bezierCurveTo(.69,-.79,-.03,-.91,-.65,-.55);c.bezierCurveTo(-1,-.15,-.87,.45,-.46,.65);c.bezierCurveTo(.19,.95,.76,.55,1.12,0);c.closePath();c.fillStyle=g;c.fill();
for(let i=0;i<21;i++){const y=(i-10)*.06;c.beginPath();c.moveTo(-.40,y);c.quadraticCurveTo(.22,y*1.16,1.06-Math.abs(y)*.56,y*.12);c.strokeStyle=i%3?'#e6b06a33':'#40261e55';c.lineWidth=.012;c.stroke();}
if(o.cracked){poly(c,[[.12,-.31],[.33,-.42],[.42,-.28],[.65,-.32],[.60,-.10],[.90,.03],[.69,.18],[.71,.38],[.43,.27],[.25,.44],[.15,.21],[-.03,.17],[.08,-.04],[-.02,-.18]],'#3d291e');poly(c,[[.15,-.25],[.33,-.35],[.40,-.22],[.58,-.25],[.54,-.08],[.80,.03],[.62,.15],[.65,.30],[.42,.20],[.27,.34],[.20,.16],[.06,.13],[.16,-.04],[.05,-.14]],'#e4c587');for(let i=0;i<5;i++)line(c,.22+i*.06,-.18,.40+i*.055,.20,'#fff0bd88',.017);}
// Cap overlaps the shell with layered woody scales, not flat dotted circles.
oval(c,-.50,0,.56,.76,'#392c21');for(let row=0;row<5;row++){const x=-.90+row*.14,span=Math.sqrt(Math.max(0,1-((x+.5)/.58)**2))*.72;for(let j=0;j<7;j++){const y=(j-3)*span/3;poly(c,[[x-.11,y-.10],[x+.08,y-.11],[x+.20,y],[x+.04,y+.12],[x-.12,y+.08]],['#73583b','#8b6a45','#62492f'][(j+row)%3]);line(c,x-.04,y-.06,x+.11,y,'#b1946477',.018);}}
for(const s of [-1,1]){oval(c,-.01,s*.28,.115,.071,'#302519');oval(c,.033,s*.28,.033,.025,'#dca950');}
c.beginPath();c.moveTo(-.72,-.08);c.quadraticCurveTo(-1.18,-.22,-1.21,-.51);c.strokeStyle='#493825';c.lineWidth=.12;c.stroke();line(c,-.79,-.11,-1.12,-.36,'#a08456',.027);
c.save();c.translate(-1.07,-.44);c.rotate(Math.sin((o.time||0)*2)*.06+p.step*.07);poly(c,[[0,0],[.14,-.18],[.26,-.13],[.32,-.30],[.43,-.22],[.56,-.28],[.53,-.11],[.70,0],[.52,.08],[.48,.20],[.34,.14],[.22,.23],[.17,.11],[.04,.10]],'#7e8050');line(c,0,0,.62,-.01,'#bdab71',.02);for(let j=1;j<4;j++){line(c,j*.14,0,j*.14+.04,-.13,'#aaa16b',.012);line(c,j*.14,0,j*.14+.03,.11,'#aaa16b',.012);}c.restore();
if(o.crackAge>=0&&o.crackAge<.5){const t=o.crackAge/.5;for(let i=0;i<5;i++){const a=i*2.4,x=.25+Math.cos(a)*(.45+t*.65),y=Math.sin(a)*(.3+t*.6);c.save();c.translate(x,y);c.rotate(a+t*2);poly(c,[[0,-.07],[.14,0],[.06,.10],[-.06,.06]],'#986036');c.restore();}}
c.restore();}
root.Zheludnik={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
