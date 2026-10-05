(function(root){'use strict';const ATTACK_DURATION=1.4,CONTACT=.62,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',phase=(o.distance||0)*7+(o.seed||0);return {phase,roll:o.state==='walk'?Math.sin(phase)*.035:0,ram:active?(a<CONTACT?ease((a-.34)/.28):1-ease((a-CONTACT)/.38)):0,brace:active&&a<.34?Math.sin(a/.34*Math.PI)*.13:0,impact:active&&a>=CONTACT?1-clamp((a-CONTACT)/.23):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function line(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function poly(c,p,col){c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle=col;c.fill()}
function draw(c,o={}){const r=(o.size||120)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.translate((target.x-1.57)*p.ram-p.brace,target.y*p.ram);
if(o.shadow!==false)oval(c,-.13,.12,1.35,1.03,'#20271944');c.rotate(p.roll);
// Four root feet take weight in staggered beats, always close to the body.
for(let i=0;i<4;i++){const front=i<2,side=i%2?1:-1,phase=p.phase+i*Math.PI*.5,step=o.state==='walk'?Math.sin(phase)*.15:0,x=(front?.42:-.77)+step,y=side*.77;line(c,x-.13,y*.7,x,y,'#493e29',.30);oval(c,x,y,.29,.20,'#655237');for(let j=0;j<3;j++)line(c,x-.11,y+(j-1)*.055,x+.25,y+(j-1)*.11,'#91724b',.052);}
const body=c.createRadialGradient(-.3,-.3,.02,-.15,0,1.2);body.addColorStop(0,'#8a8052');body.addColorStop(.55,'#5a5737');body.addColorStop(1,'#302e22');oval(c,-.25,0,1.0,.80,body);
for(let i=0;i<35;i++){const a=i*2.399,d=.14+(i%6)*.12,x=-.23+Math.cos(a)*d,y=Math.sin(a)*d*.89;poly(c,[[x-.18,y-.08],[x+.06,y-.13],[x+.20,y+.02],[x+.04,y+.13],[x-.15,y+.10]],['#705e3f','#8a7550','#554831'][i%3]);line(c,x-.1,y-.04,x+.10,y+.03,'#ae93614a',.025);}
for(let i=0;i<21;i++){const a=i*2.4,d=.1+(i%4)*.15,x=-.36+Math.cos(a)*d,y=Math.sin(a)*d;oval(c,x,y,.15+(i%3)*.03,.11,['#66753a','#8b914c','#4d6231'][i%3],a);if(i%3===0)for(let j=0;j<3;j++)oval(c,x+j*.04,y,.022,.021,'#b9b487');}
// Short heartwood mask is part of the shoulders, pointing forward.
poly(c,[[.19,-.4],[.55,-.36],[1.08,-.13],[1.22,0],[1.08,.13],[.55,.36],[.19,.4],[.36,0]],'#776241');poly(c,[[.32,-.19],[.66,-.16],[1.20,0],[.66,.15],[.43,.21],[.56,0]],'#b09a68');line(c,.49,-.07,1.10,0,'#51412d',.025);
for(const side of [-1,1]){line(c,.61,side*.23,.80,side*.17,'#24291b',.085);line(c,.65,side*.22,.78,side*.18,'#efbc61',.033);}
// Oak bough antlers: thick curved roots split into tapering living branches.
for(const side of [-1,1]){c.save();c.translate(.52,side*.34);c.rotate(side*(-p.ram*.10+p.roll*.6));const pts=[[0,0],[.22,side*.40],[.37,side*.78],[.76,side*1.05],[1.05,side*1.10]];for(let j=0;j<4;j++){line(c,...pts[j],...pts[j+1],'#443722',.19-j*.037);line(c,pts[j][0]-.025,pts[j][1],pts[j+1][0]-.025,pts[j+1][1],'#ad9361',.045-j*.008);}for(const [x,y,dx,dy] of [[.24,.46,-.16,.40],[.40,.80,.06,.43],[.69,1.00,.25,-.30]]){line(c,x,side*y,x+dx,side*(y+dy),'#6d5737',.075);line(c,x+dx,side*(y+dy),x+dx+.11,side*(y+dy+.09),'#bca476',.027);oval(c,x+dx,side*(y+dy),.12,.055,'#7d8940',side*.6);}c.restore();}
for(let k=0;k<3;k++){const x=-.55-k*.13,y=-.21+k*.20;line(c,x,y,x-.24,y-.16,'#536738',.023);for(let j=0;j<4;j++){line(c,x-j*.06,y-j*.04,x-j*.06-.08,y-j*.04+.04,'#9da66a',.023);line(c,x-j*.06,y-j*.04,x-j*.06+.015,y-j*.04-.08,'#889957',.023);}}
if(p.impact>0){c.save();c.globalAlpha*=p.impact;for(let i=0;i<8;i++){const a=i*2.4,d=(1-p.impact)*.6;oval(c,1.1+Math.cos(a)*d,Math.sin(a)*d,.035+(i%2)*.02,.03,'#9c895b');}c.restore();}c.restore();}
root.ForestLordBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
