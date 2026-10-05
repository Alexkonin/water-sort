/* Alternate art only. The established gait and attack pose remain authoritative. */
(function(root){
'use strict';const TAU=Math.PI*2;
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill()}
function poly(c,p,col){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=col;c.fill()}
function stone(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);poly(c,[[-.8,-.4],[-.4,-.72],[.48,-.62],[.8,-.1],[.56,.57],[-.53,.6]],'#879a89');poly(c,[[-.8,-.4],[-.4,-.72],[.48,-.62],[.17,-.1],[-.62,.13]],'#bed0b1');poly(c,[[.17,-.1],[.8,-.1],[.56,.57],[-.53,.6],[-.62,.13]],'#617e72');c.restore()}
function moss(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(-1,.2);c.bezierCurveTo(-1.18,-.45,-.5,-.55,-.31,-.47);c.bezierCurveTo(-.1,-1,.64,-.77,.68,-.28);c.bezierCurveTo(1.15,-.35,1.13,.35,.65,.5);c.bezierCurveTo(.09,.75,-.5,.54,-1,.2);c.fillStyle='#708f49';c.fill();poly(c,[[-.88,-.12],[-.56,-.39],[-.27,-.3],[.06,-.63],[.5,-.48],[.17,-.08],[-.42,.1]],'#b7c876');c.restore()}
function draw(c,o={}){const K=root.Kamnespin,r=(o.size||80)/2.8,p=K.pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.42,y:0},dx=(target.x-.9)*p.ram,dy=target.y*p.ram;c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.translate(dx,dy);if(o.shadow!==false)oval(c,0,.11,1.08,.82,'#243d3438');
for(let i=0;i<4;i++){const f=p.feet[i];stone(c,(i<2?.56:-.64)+f.x,(i%2?1:-1)*(.73+p.tuck*.1)-f.lift*.035,.33);}
const head=.93-p.tuck*.26;stone(c,head,0,.43);for(const side of [-1,1]){oval(c,head+.14,side*.19,.072,.045,'#2d4a42');oval(c,head+.16,side*.19,.030,.023,'#f3d78b');}
c.save();c.translate(-p.tuck*.045,p.weight);c.rotate(p.roll);c.scale(1,1-p.tuck*.035);
poly(c,[[-1,-.32],[-.79,-.68],[-.27,-.83],[.27,-.75],[.74,-.49],[.91,-.05],[.78,.38],[.38,.70],[-.25,.76],[-.76,.5]],'#8fa694');
poly(c,[[-1,-.32],[-.79,-.68],[-.27,-.83],[.27,-.75],[.10,-.24],[-.43,-.06],[-.76,.5]],'#c5d3b2');
poly(c,[[.27,-.75],[.74,-.49],[.91,-.05],[.78,.38],[.30,.21],[.10,-.24]],'#7d9886');
poly(c,[[-.76,.5],[-.43,-.06],[.10,-.24],[.30,.21],[.78,.38],[.38,.70],[-.25,.76]],'#617f73');
moss(c,-.43,-.43,.41);moss(c,.12,-.49,.29);moss(c,-.51,.31,.22);
for(const [x,y] of [[-.28,.07],[.43,-.09],[.14,.43]])oval(c,x,y,.035,.022,'#d4dfba');c.restore();c.restore();}
root.StorybookKamnespin={draw};
})(typeof module==='object'?module.exports:window);
