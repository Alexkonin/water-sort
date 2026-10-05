/* Towers-compatible overhead renderer; heading 0 = right. Drawing owns no combat state. */
(function(root){'use strict';
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)},CONTACT=.48;
function pose(o={}){const p=clamp(o.attack||0),active=o.state==='attack',strike=active?(p<CONTACT?ease((p-.24)/.24):1-ease((p-CONTACT)/.52)):0,wind=active?ease(p/.24)*(1-ease((p-.24)/.24)):0;return {strike,wind,step:o.state==='walk'?Math.sin((o.distance||0)*10):0,block:o.state==='block'?1:0,impact:active&&p>=CONTACT?1-clamp((p-CONTACT)/.16):0}}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,Math.PI*2);c.fillStyle=col;c.fill()}
function poly(c,pts,col){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=col;c.fill()}
function rod(c,a,b,width,col){c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineWidth=width;c.strokeStyle=col;c.lineCap='round';c.stroke()}
function draw(c,o={}){const p=pose(o),r=(o.size||30)/2.8;c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);
const grad=(x,y,r,light,dark)=>{let g=c.createRadialGradient(x-.12,y-.16,.02,x,y,r);g.addColorStop(0,light);g.addColorStop(1,dark);return g};
oval(c,-.1,.12,1.05,.96,'#15201b40');
for(const s of [-1,1])oval(c,-.42+p.step*s*.17,s*.39,.33,.19,grad(-.4,s*.39,.4,'#956b47','#46362c'));
// Scarf trails behind head and shoulders; large red patch remains legible at 30 px.
poly(c,[[-.25,-.29],[-.94,-.42],[-1.2,-.18],[-1.08,-.02],[-1.2,.1],[-.58,.19]],'#8c3832');
oval(c,-.13,0,.68,.68,grad(-.13,0,.8,'#7d9090','#344b50'));
for(let i=0;i<12;i++){let a=i*2.4;oval(c,-.14+Math.cos(a)*.46,Math.sin(a)*.49,.065,.05,i%2?'#a5af9e':'#4d6062')}
// Left shield viewed edge-on from directly above, not a front-facing billboard.
const sx=.40+p.block*.25,sy=-.65+p.block*.20;
rod(c,[-.08,-.48],[sx-.1,sy],.30,'#6b7775');oval(c,sx-.10,sy,.15,.14,'#bb8d66');
poly(c,[[sx-.15,sy-.47],[sx+.10,sy-.51],[sx+.27,sy-.30],[sx+.30,sy+.32],[sx+.13,sy+.53],[sx-.12,sy+.47]],'#414b4b');
poly(c,[[sx-.08,sy-.40],[sx+.08,sy-.43],[sx+.19,sy-.25],[sx+.21,sy+.27],[sx+.08,sy+.43],[sx-.06,sy+.38]],'#a58050');rod(c,[sx+.18,sy-.29],[sx+.19,sy+.30],.055,'#cfb98e');
// Right arm stays connected, with the strike ending at the front edge of reach.
const hx=.27-p.wind*.55+p.strike*.43,hy=.65+p.wind*.12-p.strike*.35;
rod(c,[-.12,.48],[hx,hy],.29,'#50676d');oval(c,hx-.04,hy,.16,.14,'#775039');oval(c,hx+.03,hy,.12,.12,'#c1956f');
const mx=.68-p.wind*1.05+p.strike*.73,my=.77+p.wind*.12-p.strike*.75;
rod(c,[hx,hy],[mx,my],.105,'#6d4a31');oval(c,mx,my,.22,.20,grad(mx,my,.27,'#d2cbb5','#606f70'));for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rod(c,[mx+Math.cos(a)*.10,my+Math.sin(a)*.10],[mx+Math.cos(a)*.20,my+Math.sin(a)*.18],.03,'#a9b4ad')}
oval(c,.24,0,.38,.38,'#9e4438');
// Only nose and a sliver of beard visible below helmet in strict overhead view.
oval(c,.56,0,.20,.24,'#68492f');oval(c,.69,0,.105,.10,'#c49b77');
oval(c,.22,0,.43,.43,grad(.22,0,.49,'#d2cec0','#5a696c'));rod(c,[-.12,0],[.61,0],.075,'#acb5ae');oval(c,.16,0,.11,.11,'#d9d6c6');rod(c,[.52,0],[.73,0],.065,'#aeb6ad');
if(p.impact){c.globalAlpha*=p.impact;for(let i=0;i<5;i++){let a=i*2.4,d=(1-p.impact)*.3;oval(c,1.45+Math.cos(a)*d,Math.sin(a)*d,.045,.03,'#ffe6ad')}}c.restore()}
root.DobrynyaTopdown={draw,pose,CONTACT};
})(typeof module==='object'?module.exports:window);
