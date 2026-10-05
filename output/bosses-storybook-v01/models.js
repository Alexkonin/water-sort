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

(function(root){'use strict';const ATTACK_DURATION=1.4,CONTACT=.62,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',phase=(o.distance||0)*7+(o.seed||0);return {phase,roll:o.state==='walk'?Math.sin(phase)*.035:0,ram:active?(a<CONTACT?ease((a-.34)/.28):1-ease((a-CONTACT)/.38)):0,brace:active&&a<.34?Math.sin(a/.34*Math.PI)*.13:0,impact:active&&a>=CONTACT?1-clamp((a-CONTACT)/.23):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function line(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function poly(c,p,col){c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle=col;c.fill()}

// Cut-paper light and shadow planes, clipped to the current silhouette.
function planes(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();oval(c,x+rx*.2,y+ry*.42,rx,ry,shade);oval(c,x-rx*.16,y-ry*.25,rx*.92,ry*.73,light);c.restore()}

function draw(c,o={}){const r=(o.size||120)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.translate((target.x-1.57)*p.ram-p.brace,target.y*p.ram);
if(o.shadow!==false)oval(c,-.13,.12,1.35,1.03,'#20271944');c.rotate(p.roll);
// Four root feet take weight in staggered beats, always close to the body.
for(let i=0;i<4;i++){const front=i<2,side=i%2?1:-1,phase=p.phase+i*Math.PI*.5,step=o.state==='walk'?Math.sin(phase)*.15:0,x=(front?.42:-.77)+step,y=side*.77;line(c,x-.13,y*.7,x,y,'#493e29',.30);oval(c,x,y,.29,.20,'#655237');for(let j=0;j<3;j++)line(c,x-.11,y+(j-1)*.055,x+.25,y+(j-1)*.11,'#91724b',.052);}
// A broad oak back carries a few interlocking bark plates and soft moss banks.
 c.beginPath();c.moveTo(.45,-.58);c.bezierCurveTo(-.15,-1.03,-1.18,-.79,-1.24,-.20);c.bezierCurveTo(-1.42,.47,-.48,.92,.36,.60);c.quadraticCurveTo(.76,0,.45,-.58);c.closePath();
 planes(c,'#806b46','#b2a16b','#514a33',-.3,0,1,.8);
 for(const [x,y,a] of [[-.85,-.3,-.2],[-.53,.34,.1],[-.04,.35,.2]]){c.save();c.translate(x,y);c.rotate(a);poly(c,[[-.29,-.23],[.08,-.31],[.32,-.1],[.23,.24],[-.17,.26]],'#746140');poly(c,[[-.29,-.23],[.08,-.31],[.32,-.1],[-.05,-.07],[-.17,.26]],'#9a8254');c.restore();}
 for(const [x,y,rx,ry] of [[-.78,-.29,.35,.25],[-.25,-.41,.44,.29],[-.27,.03,.32,.23]]){oval(c,x,y,rx,ry,'#71844a');oval(c,x-.055,y-.065,rx*.86,ry*.7,'#a2ae68');}
// Short heartwood mask is part of the shoulders, pointing forward.
poly(c,[[.19,-.4],[.55,-.36],[1.08,-.13],[1.22,0],[1.08,.13],[.55,.36],[.19,.4],[.36,0]],'#776241');poly(c,[[.32,-.19],[.66,-.16],[1.20,0],[.66,.15],[.43,.21],[.56,0]],'#b09a68');line(c,.49,-.07,1.10,0,'#51412d',.025);
for(const side of [-1,1]){line(c,.61,side*.23,.80,side*.17,'#24291b',.085);line(c,.65,side*.22,.78,side*.18,'#efbc61',.033);}
// Oak bough antlers: thick curved roots split into tapering living branches.
for(const side of [-1,1]){c.save();c.translate(.52,side*.34);c.rotate(side*(-p.ram*.10+p.roll*.6));const pts=[[0,0],[.22,side*.40],[.37,side*.78],[.76,side*1.05],[1.05,side*1.10]];for(let j=0;j<4;j++){line(c,...pts[j],...pts[j+1],'#443722',.19-j*.037);line(c,pts[j][0]-.025,pts[j][1],pts[j+1][0]-.025,pts[j+1][1],'#ad9361',.045-j*.008);}for(const [x,y,dx,dy] of [[.24,.46,-.16,.40],[.40,.80,.06,.43],[.69,1.00,.25,-.30]]){line(c,x,side*y,x+dx,side*(y+dy),'#6d5737',.075);line(c,x+dx,side*(y+dy),x+dx+.11,side*(y+dy+.09),'#bca476',.027);oval(c,x+dx,side*(y+dy),.12,.055,'#7d8940',side*.6);}c.restore();}
// One broad fern accent replaces fine hatching on the back.
poly(c,[[-.96,.13],[-1.16,-.01],[-.94,-.03],[-.86,-.24],[-.72,-.02],[-.51,.02],[-.74,.15],[-.82,.35]],'#b3b67a');
if(p.impact>0){c.save();c.globalAlpha*=p.impact;for(let i=0;i<8;i++){const a=i*2.4,d=(1-p.impact)*.6;oval(c,1.1+Math.cos(a)*d,Math.sin(a)*d,.035+(i%2)*.02,.03,'#9c895b');}c.restore();}c.restore();}
root.ForestLord={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

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

(function(root){'use strict';const ATTACK_DURATION=1.25,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',phase=(o.time||0)*2+(o.seed||0);return {hover:.06+Math.sin(phase)*.025,sway:Math.sin(phase*.73)*.025,trail:Math.sin((o.distance||0)*3+phase*.6)*.10,spread:active?(a<.3?ease(a/.3):1-ease((a-.3)/.3)):0,strike:active?(a<CONTACT?ease((a-.3)/.3):1-ease((a-CONTACT)/.4)):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function line(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function leaf(c,x,y,l,w,a,col){c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(l*.45,0);c.quadraticCurveTo(0,-w,-l*.65,-w*.13);c.lineTo(-l*.43,w*.03);c.lineTo(-l*.58,w*.29);c.quadraticCurveTo(0,w*.58,l*.45,0);c.closePath();c.fillStyle=col;c.fill();c.restore()}

// Cut-paper light and shadow planes, clipped to the current silhouette.
function planes(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();oval(c,x+rx*.2,y+ry*.42,rx,ry,shade);oval(c,x-rx*.16,y-ry*.25,rx*.92,ry*.73,light);c.restore()}

function draw(c,o={}){const r=(o.size||120)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
// The torso approaches the target; attached arms keep a bounded reach.
const dx=(target.x-1.55)*p.strike,dy=target.y*p.strike;c.translate(dx,dy);
if(o.shadow!==false)oval(c,-.08,.20,1.06,.67,'#1e182a35');c.save();c.translate(0,-p.hover);c.rotate(p.sway*(1-p.strike));
for(let i=0;i<4;i++){const y=(i-1.5)*.24;c.beginPath();c.moveTo(-.24,y);c.bezierCurveTo(-.70,y+p.trail,-1.12,y-p.trail,-1.30-(i%3)*.08,y+p.trail*.7);c.strokeStyle=i%2?'#66503a':'#352c29';c.lineWidth=.06+(i%3)*.016;c.stroke();}
// Long curved wooden limbs grow from under the shoulder mantle.
for(const side of [-1,1]){const handX=.86+.36*p.strike-.22*p.spread,handY=side*(.85+.48*p.spread-.55*p.strike);c.beginPath();c.moveTo(-.18,side*.48);c.bezierCurveTo(.10,side*(1.18+.3*p.spread),handX-.26,handY+side*.26,handX,handY);c.strokeStyle='#302823';c.lineWidth=.19;c.stroke();c.strokeStyle='#806d55';c.lineWidth=.10;c.stroke();for(let j=0;j<3;j++){const y=handY+side*(j-1)*.07;c.beginPath();c.moveTo(handX-.07,y);c.quadraticCurveTo(handX+.16,y-side*.03,handX+.33,y-side*.10);c.strokeStyle=j===1?'#b09a74':'#68553e';c.lineWidth=.036;c.stroke();}for(let j=0;j<5;j++)oval(c,.20+j*.035,side*(.92+.15*p.spread)+(j%2)*.03,.038,.028,'#b6b29a');}
// A scalloped mantle with three large overlapping folds, not loose leaf confetti.
 c.beginPath();c.moveTo(.38,-.43);c.quadraticCurveTo(-.23,-.94,-.75,-.62);c.lineTo(-1.18,-.40);c.lineTo(-.93,-.16);c.lineTo(-1.30,.04);c.lineTo(-.94,.23);c.lineTo(-1.06,.53);c.quadraticCurveTo(-.18,.85,.37,.43);c.closePath();
 planes(c,'#665669','#887184','#353644',-.3,0,.89,.65);
 for(const [x,y,a,col] of [[-.48,-.37,-.16,'#9b8090'],[-.68,.03,0,'#776579'],[-.43,.39,.28,'#51485e']])leaf(c,x,y,1.13,.36,a+p.trail*.18,col);
// Birch shield viewed from above, pale and dominant against the dark mantle.
c.beginPath();c.moveTo(1.03,0);c.bezierCurveTo(.85,-.12,.65,-.41,.35,-.37);c.quadraticCurveTo(.18,-.12,.22,0);c.quadraticCurveTo(.18,.12,.35,.37);c.bezierCurveTo(.65,.41,.85,.12,1.03,0);c.closePath();planes(c,'#e6dcc1','#fff1d2','#b2b99e',.55,0,.49,.36);
for(const side of [-1,1]){oval(c,.57,side*.15,.10,.028,'#231f24',-side*.28);line(c,.65,side*.22,.78,side*.16,'#a5573d',.034);}
// A single dark notch keeps the birch character readable at game scale.
line(c,.33,-.12,.42,-.10,'#8e8066',.035);
if(p.strike>.9){for(let i=0;i<5;i++){const a=i*2.4;leaf(c,1.40+Math.cos(a)*.15,Math.sin(a)*.25,.13,.04,a,'#9d8361');}}
c.restore();c.restore();}
root.WhiteMask={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const ATTACK_DURATION=1.5,CONTACT=.64,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack';return {phase:(o.distance||0)*5+(o.seed||0),coil:active?(a<.35?ease(a/.35):1-ease((a-.35)/.4)):0,wave:active?ease((a-.35)/(CONTACT-.35)):0,fade:active?1-ease((a-CONTACT)/(1-CONTACT)):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function draw(c,o={}){const r=(o.size||120)/3,p=pose(o),t=o.time||0,goal=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:3,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
const point=u=>({x:.58-u*2.95-p.coil*Math.sin(u*Math.PI)*.22,y:Math.sin(u*7-p.phase)*.44*u+Math.sin(u*Math.PI*2)*p.coil*.48});
if(o.shadow!==false)oval(c,-.5,.14,1.72,.58,'#122c353d');
// Water silhouette remains visible around the dark body on a sandy road.
for(const side of [-1,1]){c.beginPath();c.moveTo(.38,side*.31);c.bezierCurveTo(-.1,side*(.93+Math.sin(t*2)*.06),-1.1,side*.4,-2.2,side*.8+Math.sin(p.phase)*.2);c.bezierCurveTo(-1.4,side*.17,-.65,side*.25,.38,side*.31);c.fillStyle='#79d5d18a';c.fill();c.strokeStyle='#cbffefb8';c.lineWidth=.024;c.stroke();}
// Tapered, overlapping cross sections build a continuous muscular S-shaped body.
for(let i=48;i>=0;i--){const u=i/48,q=point(u),w=.045+.38*Math.pow(1-u,.65);oval(c,q.x,q.y,w*1.17,w,'#132f3b');oval(c,q.x-.015,q.y-.035,w*.95,w*.84,i%3?'#255363':'#2d6070');}
// Inner current follows the spine, with moving light motes.
c.beginPath();for(let i=0;i<=48;i++){const u=i/48,q=point(u);if(i===0)c.moveTo(q.x,q.y);else c.lineTo(q.x,q.y)}c.strokeStyle='#47c9c47a';c.lineWidth=.13;c.stroke();c.strokeStyle='#a6fff0a0';c.lineWidth=.025;c.stroke();
for(let i=0;i<12;i++){const u=(i/12+t*.10)%1,q=point(u);oval(c,q.x,q.y+Math.sin(i*3+t)*.055,.018+(i%3)*.006,.018,'#d1fff3');}
for(let i=1;i<13;i++){const u=i/15,q=point(u),w=.30*(1-u);for(const s of [-1,1]){c.beginPath();c.moveTo(q.x+.055,q.y+s*w*.35);c.quadraticCurveTo(q.x-.07,q.y+s*w*.7,q.x-.11,q.y+s*w);c.strokeStyle='#669ba96b';c.lineWidth=.016;c.stroke();}}
const tail=point(1);c.beginPath();c.moveTo(tail.x,tail.y);c.bezierCurveTo(tail.x-.48,tail.y+.28,tail.x-.55,tail.y-.42,tail.x-.20,tail.y-.38);c.strokeStyle='#99f5eaa0';c.lineWidth=.07;c.stroke();
// Broad shield-shaped head seen from above, with slanted luminous eyes.
c.save();c.translate(-p.coil*.14,0);c.beginPath();c.moveTo(1.13,0);c.quadraticCurveTo(1.14,-.28,.77,-.40);c.quadraticCurveTo(.25,-.48,.18,0);c.quadraticCurveTo(.25,.48,.77,.40);c.quadraticCurveTo(1.14,.28,1.13,0);const g=c.createLinearGradient(.5,-.4,.6,.4);g.addColorStop(0,'#55818a');g.addColorStop(.4,'#284f60');g.addColorStop(1,'#102d3b');c.fillStyle=g;c.fill();c.strokeStyle='#7bb6b2';c.lineWidth=.028;c.stroke();
for(const side of [-1,1]){oval(c,.80,side*.235,.14,.067,'#3fe8e277',side*.28);oval(c,.82,side*.23,.087,.027,'#d4fff5',side*.28);c.beginPath();c.moveTo(.47,side*.12);c.lineTo(.72,side*.16);c.lineTo(.96,side*.12);c.strokeStyle='#80a8ae';c.lineWidth=.027;c.stroke();}
c.beginPath();c.moveTo(.32,0);c.lineTo(.57,-.12);c.lineTo(.77,0);c.lineTo(.57,.12);c.closePath();c.fillStyle='#416b77';c.fill();c.restore();
// The wave travels to the actual siege target; its crest reaches it at damage contact.
if(o.state==='attack'&&p.wave>0&&p.fade>0){const x=1.1+(goal.x-1.1)*p.wave,y=goal.y*p.wave;c.save();c.globalAlpha*=p.fade;c.translate(x,y);c.rotate(Math.atan2(goal.y,goal.x-1.1));c.beginPath();c.moveTo(-.25,-.65);c.bezierCurveTo(.12,-.40,.18,.40,-.25,.65);c.strokeStyle='#59c6c6a0';c.lineWidth=.25;c.stroke();c.strokeStyle='#ddfff5';c.lineWidth=.05;c.stroke();for(let i=0;i<5;i++)oval(c,-.3-(i%2)*.13,(i-2)*.24,.04,.025,'#baffee');c.restore();}
c.restore();}
root.RiverSerpentBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const ATTACK_DURATION=1.5,CONTACT=.64,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack';return {phase:(o.distance||0)*5+(o.seed||0),coil:active?(a<.35?ease(a/.35):1-ease((a-.35)/.4)):0,wave:active?ease((a-.35)/(CONTACT-.35)):0,fade:active?1-ease((a-CONTACT)/(1-CONTACT)):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}

// Cut-paper light and shadow planes, clipped to the current silhouette.
function planes(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();oval(c,x+rx*.2,y+ry*.42,rx,ry,shade);oval(c,x-rx*.16,y-ry*.25,rx*.92,ry*.73,light);c.restore()}

function draw(c,o={}){const r=(o.size||120)/3,p=pose(o),t=o.time||0,goal=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:3,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
const point=u=>({x:.58-u*2.95-p.coil*Math.sin(u*Math.PI)*.22,y:Math.sin(u*7-p.phase)*.44*u+Math.sin(u*Math.PI*2)*p.coil*.48});
if(o.shadow!==false)oval(c,-.5,.14,1.72,.58,'#122c353d');
// Water silhouette remains visible around the dark body on a sandy road.
for(const side of [-1,1]){c.beginPath();c.moveTo(.38,side*.31);c.bezierCurveTo(-.1,side*(.93+Math.sin(t*2)*.06),-1.1,side*.4,-2.2,side*.8+Math.sin(p.phase)*.2);c.bezierCurveTo(-1.4,side*.17,-.65,side*.25,.38,side*.31);c.fillStyle='#79d5d18a';c.fill();}
// One tapered ribbon keeps the swimming silhouette continuous at every phase.
 function ribbon(){c.beginPath();for(let i=0;i<=48;i++){const u=i/48,q=point(u),w=.035+.38*Math.pow(1-u,.65);if(i===0)c.moveTo(q.x,q.y-w);else c.lineTo(q.x,q.y-w);}for(let i=48;i>=0;i--){const u=i/48,q=point(u),w=.035+.38*Math.pow(1-u,.65);c.lineTo(q.x,q.y+w);}c.closePath();}
 ribbon();c.fillStyle='#214d59';c.fill();c.save();c.clip();
 c.beginPath();for(let i=0;i<=48;i++){const u=i/48,q=point(u);if(i===0)c.moveTo(q.x,q.y-.11);else c.lineTo(q.x,q.y-.11*(1-u));}c.strokeStyle='#518d90';c.lineWidth=.26;c.stroke();c.restore();
 for(let i=1;i<7;i++){const u=i/8,q=point(u),w=.18*(1-u);c.beginPath();c.moveTo(q.x+.10,q.y-.03);c.lineTo(q.x-.03,q.y-w-.13);c.lineTo(q.x-.16,q.y-.02);c.lineTo(q.x-.04,q.y+.06);c.closePath();c.fillStyle=i%2?'#85bcb0':'#679f9e';c.fill();}
 // Sparse luminous pearls belong to the inner current, not the surface texture.
 for(let i=0;i<4;i++){const u=(i/4+t*.10)%1,q=point(u);oval(c,q.x,q.y,.026,.022,'#c2f4df');}
const tail=point(1);c.beginPath();c.moveTo(tail.x,tail.y);c.bezierCurveTo(tail.x-.48,tail.y+.28,tail.x-.55,tail.y-.42,tail.x-.20,tail.y-.38);c.strokeStyle='#99f5eaa0';c.lineWidth=.07;c.stroke();
// Broad shield-shaped head seen from above, with slanted luminous eyes.
c.save();c.translate(-p.coil*.14,0);c.beginPath();c.moveTo(1.13,0);c.quadraticCurveTo(1.14,-.28,.77,-.40);c.quadraticCurveTo(.25,-.48,.18,0);c.quadraticCurveTo(.25,.48,.77,.40);c.quadraticCurveTo(1.14,.28,1.13,0);planes(c,'#3c7279','#7eada5','#244858',.65,0,.52,.40);
for(const side of [-1,1]){oval(c,.80,side*.235,.14,.067,'#3fe8e277',side*.28);oval(c,.82,side*.23,.087,.027,'#d4fff5',side*.28);c.beginPath();c.moveTo(.47,side*.12);c.lineTo(.72,side*.16);c.lineTo(.96,side*.12);c.strokeStyle='#80a8ae';c.lineWidth=.027;c.stroke();}
c.beginPath();c.moveTo(.32,0);c.lineTo(.57,-.12);c.lineTo(.77,0);c.lineTo(.57,.12);c.closePath();c.fillStyle='#416b77';c.fill();c.restore();
// The wave travels to the actual siege target; its crest reaches it at damage contact.
if(o.state==='attack'&&p.wave>0&&p.fade>0){const x=1.1+(goal.x-1.1)*p.wave,y=goal.y*p.wave;c.save();c.globalAlpha*=p.fade;c.translate(x,y);c.rotate(Math.atan2(goal.y,goal.x-1.1));c.beginPath();c.moveTo(-.25,-.65);c.bezierCurveTo(.12,-.40,.18,.40,-.25,.65);c.strokeStyle='#59c6c6a0';c.lineWidth=.25;c.stroke();c.strokeStyle='#ddfff5';c.lineWidth=.05;c.stroke();for(let i=0;i<5;i++)oval(c,-.3-(i%2)*.13,(i-2)*.24,.04,.025,'#baffee');c.restore();}
c.restore();}
root.RiverSerpent={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const ATTACK_DURATION=1.5,CONTACT=.64,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',phase=(o.distance||0)*6+(o.seed||0);return {phase,roll:o.state==='walk'?Math.sin(phase)*.025:0,ram:active?(a<CONTACT?ease((a-.36)/.28):1-ease((a-CONTACT)/.36)):0,brace:active&&a<.36?Math.sin(a/.36*Math.PI)*.16:0,impact:active&&a>=CONTACT?1-clamp((a-CONTACT)/.24):0,charge:active?Math.sin(Math.min(a/CONTACT,1)*Math.PI/2):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function stroke(c,pts,col,w){c.beginPath();pts.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function cloud(c,x,y,r,t){const g=c.createRadialGradient(x-r*.3,y-r*.4,0,x,y,r);g.addColorStop(0,'#9392b3');g.addColorStop(.42,'#646783');g.addColorStop(1,'#303548');oval(c,x,y,r,r*.82,g);for(let j=0;j<3;j++){const a=j*2.1+t*.18;oval(c,x+Math.cos(a)*r*.45,y+Math.sin(a)*r*.35,r*.45,r*.36,j===0?'#8588a499':'#555d7899');}}
function draw(c,o={}){const r=(o.size||120)/3,p=pose(o),t=o.time||0,target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2.5,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
c.translate((target.x-1.44)*p.ram-p.brace,target.y*p.ram);c.rotate(p.roll);
if(o.shadow!==false)oval(c,-.15,.1,1.35,1.02,'#21213944');
// Four short weight-bearing legs: a staggered heavy step, tucked under the cloud mantle.
for(let i=0;i<4;i++){const front=i<2,s=i%2?1:-1,step=o.state==='walk'?Math.sin(p.phase+i*Math.PI*.5)*.13:0,x=(front?.4:-.74)+step,y=s*.68;stroke(c,[[x-.1,y*.65],[x,y]],'#262b3c',.25);oval(c,x,y,.23,.17,'#585b65');stroke(c,[[x+.18,y],[x-.03,y]],'#232634',.025);cloud(c,x-.14,y,.19,t+i);}
// Attached tail dissolves into a storm wisp.
c.beginPath();c.moveTo(-.85,0);c.bezierCurveTo(-1.36,-.07,-1.23,.30+Math.sin(t*1.8)*.1,-1.63,.23);c.strokeStyle='#333a50';c.lineWidth=.07;c.stroke();cloud(c,-1.64,.23,.21,t);
oval(c,-.27,0,.96,.64,'#292f43');oval(c,.07,0,.76,.72,'#3b4059');
// Broad, irregular cloud banks cover the shoulders and back, rather than a circular puffball.
for(let i=0;i<25;i++){const a=i*2.399,d=.16+(i%5)*.13,x=-.24+Math.cos(a)*d*1.25,y=Math.sin(a)*d*.91;cloud(c,x+Math.sin(t*.8+i)*.025,y,.20+(i%4)*.035,t+i);}
// Slow internal electrical pulses remain readable without strobing.
const light=.35+.25*Math.sin(t*2+(o.seed||0))+.4*p.charge;c.save();c.globalAlpha*=light;
const bolt=[[-.99,.04],[-.72,-.08],[-.58,.06],[-.29,-.15],[-.12,.01],[.12,-.12],[.35,.02]];
stroke(c,bolt,'#8f8dff88',.095);stroke(c,bolt,'#d5dcff',.023);stroke(c,[[-.28,-.15],[-.43,-.36],[-.28,-.49]],'#bebfff',.018);stroke(c,[[-.60,.04],[-.47,.31],[-.59,.44]],'#bebfff',.018);c.restore();
// Long stern bovine face, seen from above.
oval(c,.68,0,.48,.32,'#272e41');oval(c,.82,0,.35,.25,'#41485c');oval(c,1.10,0,.21,.22,'#535767');oval(c,1.19,-.085,.048,.027,'#202333');oval(c,1.19,.085,.048,.027,'#202333');
for(const s of [-1,1]){oval(c,.70,s*.22,.11,.046,'#7a8fff66',-s*.3);oval(c,.72,s*.22,.075,.024,'#e0ebff',-s*.3);
// Ivory horns sweep sideways and curve forward, clear above the cloud silhouette.
c.beginPath();c.moveTo(.42,s*.24);c.bezierCurveTo(.03,s*.60,.09,s*1.08,.68,s*1.23);c.quadraticCurveTo(1.02,s*1.28,1.44,s*1.04);c.bezierCurveTo(.92,s*1.13,.62,s*.89,.62,s*.57);c.lineTo(.67,s*.30);c.closePath();const h=c.createLinearGradient(.3,0,1.1,s*1.2);h.addColorStop(0,'#a5a1a1');h.addColorStop(.45,'#eee4cc');h.addColorStop(1,'#fff4da');c.fillStyle=h;c.fill();c.strokeStyle='#7d7c89';c.lineWidth=.018;c.stroke();
for(let j=0;j<4;j++){const x=.34+j*.075,y=s*(.55+j*.10);stroke(c,[[x-.08,y],[x+.06,y+s*.065]],'#9d97a55a',.018);}}
cloud(c,.35,0,.25,t);
if(p.impact>0){c.save();c.globalAlpha*=p.impact;const reach=.25+(1-p.impact)*.65;c.beginPath();c.ellipse(1.44,0,reach*.5,1.02+reach,0,0,7);c.strokeStyle='#bfcaff';c.lineWidth=.033;c.stroke();for(const s of [-1,1])stroke(c,[[1.44,s*1.04],[1.22,s*.74],[1.56,s*.43],[1.31,s*.2],[1.44,0]],'#e6efff',.04);c.restore();}
c.restore();}
root.ThunderBullBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const ATTACK_DURATION=1.5,CONTACT=.64,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',phase=(o.distance||0)*6+(o.seed||0);return {phase,roll:o.state==='walk'?Math.sin(phase)*.025:0,ram:active?(a<CONTACT?ease((a-.36)/.28):1-ease((a-CONTACT)/.36)):0,brace:active&&a<.36?Math.sin(a/.36*Math.PI)*.16:0,impact:active&&a>=CONTACT?1-clamp((a-CONTACT)/.24):0,charge:active?Math.sin(Math.min(a/CONTACT,1)*Math.PI/2):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function stroke(c,pts,col,w){c.beginPath();pts.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function cloud(c,x,y,r,t){oval(c,x,y,r,r*.82,'#535d7a');c.save();c.clip();oval(c,x-r*.12,y-r*.22,r*.88,r*.64,'#949bb5');c.restore();}
// Cut-paper light and shadow planes, clipped to the current silhouette.
function planes(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();oval(c,x+rx*.2,y+ry*.42,rx,ry,shade);oval(c,x-rx*.16,y-ry*.25,rx*.92,ry*.73,light);c.restore()}

function draw(c,o={}){const r=(o.size||120)/3,p=pose(o),t=o.time||0,target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2.5,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
c.translate((target.x-1.44)*p.ram-p.brace,target.y*p.ram);c.rotate(p.roll);
if(o.shadow!==false)oval(c,-.15,.1,1.35,1.02,'#21213944');
// Four short weight-bearing legs: a staggered heavy step, tucked under the cloud mantle.
for(let i=0;i<4;i++){const front=i<2,s=i%2?1:-1,step=o.state==='walk'?Math.sin(p.phase+i*Math.PI*.5)*.13:0,x=(front?.4:-.74)+step,y=s*.68;stroke(c,[[x-.1,y*.65],[x,y]],'#262b3c',.25);oval(c,x,y,.23,.17,'#585b65');stroke(c,[[x+.18,y],[x-.03,y]],'#232634',.025);cloud(c,x-.14,y,.19,t+i);}
// Attached tail dissolves into a storm wisp.
c.beginPath();c.moveTo(-.85,0);c.bezierCurveTo(-1.36,-.07,-1.23,.30+Math.sin(t*1.8)*.1,-1.63,.23);c.strokeStyle='#333a50';c.lineWidth=.07;c.stroke();cloud(c,-1.64,.23,.21,t);
oval(c,-.27,0,.96,.64,'#292f43');oval(c,.07,0,.76,.72,'#3b4059');
// Broad, irregular cloud banks cover the shoulders and back, rather than a circular puffball.
for(const [x,y,r] of [[-.84,.05,.40],[-.54,-.37,.43],[-.14,.38,.46],[.14,-.25,.54],[-.34,-.03,.47]])cloud(c,x+Math.sin(t*.8+x)*.014,y,r,t);
// Slow internal electrical pulses remain readable without strobing.
const light=.35+.25*Math.sin(t*2+(o.seed||0))+.4*p.charge;c.save();c.globalAlpha*=light;
const bolt=[[-.99,.04],[-.72,-.08],[-.58,.06],[-.29,-.15],[-.12,.01],[.12,-.12],[.35,.02]];
stroke(c,bolt,'#8f8dff88',.095);stroke(c,bolt,'#d5dcff',.023);stroke(c,[[-.28,-.15],[-.43,-.36],[-.28,-.49]],'#bebfff',.018);stroke(c,[[-.60,.04],[-.47,.31],[-.59,.44]],'#bebfff',.018);c.restore();
// Long stern bovine face, seen from above.
oval(c,.68,0,.48,.32,'#272e41');oval(c,.82,0,.35,.25,'#41485c');oval(c,1.10,0,.21,.22,'#535767');oval(c,1.19,-.085,.048,.027,'#202333');oval(c,1.19,.085,.048,.027,'#202333');
for(const s of [-1,1]){oval(c,.70,s*.22,.11,.046,'#7a8fff66',-s*.3);oval(c,.72,s*.22,.075,.024,'#e0ebff',-s*.3);
// Ivory horns sweep sideways and curve forward, clear above the cloud silhouette.
c.beginPath();c.moveTo(.42,s*.24);c.bezierCurveTo(.03,s*.60,.09,s*1.08,.68,s*1.23);c.quadraticCurveTo(1.02,s*1.28,1.44,s*1.04);c.bezierCurveTo(.92,s*1.13,.62,s*.89,.62,s*.57);c.lineTo(.67,s*.30);c.closePath();planes(c,'#dbd8bd','#fff0d0','#929ca0',.65,s*.74,.66,.50);}
cloud(c,.35,0,.25,t);
if(p.impact>0){c.save();c.globalAlpha*=p.impact;const reach=.25+(1-p.impact)*.65;c.beginPath();c.ellipse(1.44,0,reach*.5,1.02+reach,0,0,7);c.strokeStyle='#bfcaff';c.lineWidth=.033;c.stroke();for(const s of [-1,1])stroke(c,[[1.44,s*1.04],[1.22,s*.74],[1.56,s*.43],[1.31,s*.2],[1.44,0]],'#e6efff',.04);c.restore();}
c.restore();}
root.ThunderBull={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

/* Shared top-down stone spirit. +x is forward. Drawing never changes combat.
   Feet follow travelled distance; the siege timer owns contact and damage. */
(function(root){
  'use strict';
  const TAU=Math.PI*2,ATTACK_DURATION=1,CONTACT=.6;
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  function attackProgress(remaining,after=0){
    if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));
    return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null;
  }
  function pose(o={}){
    const moving=o.state==='walk',phase=(o.distance||0)/.88+(o.seed||0)/TAU;
    // Crawl: one foot advances during each quarter-cycle, three support the mass.
    const feet=[0,.5,.75,.25].map(offset=>{
      const u=((phase+offset)%1+1)%1;
      return moving?(u<.25?{x:-.15+.30*ease(u/.25),lift:Math.sin(u/.25*Math.PI)}:{x:.15-.30*(u-.25)/.75,lift:0}):{x:0,lift:0};
    });
    const active=o.state==='attack',a=clamp(o.attack||0);
    const tuck=active?(a<.4?ease(a/.4):1-ease((a-.72)/.28)):0;
    const ram=active?(a<CONTACT?ease((a-.4)/.2):1-ease((a-CONTACT)/.28)):0;
    return {feet,tuck,ram,roll:moving?Math.sin(phase*TAU)*.032:0,
      weight:moving?Math.cos(phase*TAU*2)*.014:0,
      impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.18):0};
  }
  function oval(c,x,y,rx,ry,fill,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=fill;c.fill()}
  function poly(c,points,fill){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=fill;c.fill()}
  const outline=[[-1,-.35],[-.81,-.72],[-.29,-.84],[.24,-.77],[.71,-.57],[.90,-.18],[.84,.32],[.51,.65],[.03,.77],[-.60,.65],[-.95,.28]];
  function shell(c){c.beginPath();outline.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath()}
  function rock(c,x,y,sx,sy){
    c.save();c.translate(x,y);c.scale(sx,sy);
    const g=c.createLinearGradient(-.7,-.7,.6,.8);g.addColorStop(0,'#b8b29e');g.addColorStop(.48,'#837f70');g.addColorStop(1,'#4c5045');
    poly(c,[[-.8,-.48],[-.35,-.83],[.5,-.70],[.88,-.08],[.61,.70],[-.48,.73],[-.86,.15]],g);
    poly(c,[[-.8,-.48],[-.35,-.83],[.5,-.70],[.2,-.25],[-.42,-.20]],'#c0bba455');
    c.restore();
  }
  function moss(c,x,y,s){
    oval(c,x+.01,y+.025,s*.96,s*.65,'#354329');
    for(let i=0;i<7;i++){const a=i*2.399,r=s*(.18+(i%3)*.16);oval(c,x+Math.cos(a)*r,y+Math.sin(a)*r*.65,s*(.32+(i%2)*.07),s*.26,['#53623a','#76834b','#93a05b'][i%3],a)}
  }
  function draw(c,o={}){
    const r=(o.size||80)/2.8,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.42,y:0};
    const shift={x:(target.x-.9)*p.ram,y:target.y*p.ram};
    c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);
    if(o.shadow!==false)oval(c,shift.x-.03,shift.y+.07,1.07,.87,'#24312633');
    c.save();c.translate(shift.x,shift.y);
    for(let i=0;i<4;i++){
      const front=i<2,side=i%2?1:-1,foot=p.feet[i];
      const x=(front?.56:-.64)+foot.x-(front?0:p.tuck*.055),y=side*(.73+p.tuck*.10)-foot.lift*.035;
      oval(c,x+.015,y+.04,.27,.17,'#252d2933');
      rock(c,x,y,.31+foot.lift*.018,.27);
      if(i===1||i===2)moss(c,x-.04,y-.04,.095);
    }
    // Small stone head slides under the overhanging shell during the brace.
    const head=.91-p.tuck*.26;
    rock(c,head,0,.39,.35);
    for(const side of [-1,1]){
      oval(c,head+.14,side*.20,.075,.044,'#343329',side*.25);
      oval(c,head+.153,side*.20,.040,.025,'#e9b854',side*.25);
      oval(c,head+.16,side*.196,.015,.014,'#fff2b2');
    }
    c.save();c.translate(-p.tuck*.045,p.weight);c.rotate(p.roll);c.scale(1,1-p.tuck*.035);
    const g=c.createLinearGradient(-.72,-.78,.70,.78);g.addColorStop(0,'#c3bfaa');g.addColorStop(.35,'#989784');g.addColorStop(.7,'#747868');g.addColorStop(1,'#454d41');
    shell(c);c.fillStyle=g;c.fill();
    poly(c,[[-1,-.35],[-.81,-.72],[-.29,-.84],[-.38,-.30],[-.82,-.03]],'#d5ceaf66');
    poly(c,[[-.29,-.84],[.24,-.77],[.71,-.57],[.32,-.24],[-.38,-.30]],'#e3ddc333');
    poly(c,[[.32,-.24],[.71,-.57],[.90,-.18],[.84,.32],[.39,.16]],'#555e4c77');
    poly(c,[[-.82,-.03],[-.38,-.30],[-.13,.20],[-.60,.65],[-.95,.28]],'#75796866');
    poly(c,[[-.13,.20],[.39,.16],[.84,.32],[.51,.65],[.03,.77],[-.60,.65]],'#35433344');
    c.lineWidth=.021;c.lineCap='round';c.strokeStyle='#424b3b77';
    for(const points of [[[-.76,-.53],[-.46,-.27],[-.51,.06]],[[-.25,.51],[-.13,.20],[.15,.13]],[[.34,-.51],[.32,-.24],[.58,-.08]]]){c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.stroke()}
    // Fixed surface markings stay attached to the stone, including on turns.
    for(let i=0;i<18;i++){const a=i*2.399,rad=.20+(i%5)*.12;oval(c,-.12+Math.cos(a)*rad,Math.sin(a)*rad*.82,.012+(i%3)*.009,.014,'#dad3b54d',a)}
    moss(c,-.60,-.40,.25);moss(c,-.12,-.50,.28);moss(c,.32,-.43,.19);moss(c,-.69,.23,.17);moss(c,.05,.39,.14);
    for(const [x,y] of [[-.35,.22],[.43,.31],[-.78,-.06]]){oval(c,x,y,.044,.031,'#c5c3a2aa');oval(c,x+.047,y-.027,.028,.025,'#d7d1afaa')}
    c.restore();c.restore();
    if(p.impact>0){
      const k=1-p.impact;c.globalAlpha=p.impact;c.strokeStyle='#d9caa3';c.lineWidth=.032;
      c.beginPath();c.ellipse(target.x,target.y,.09+k*.10,.19+k*.35,0,0,TAU);c.stroke();
      for(let i=0;i<5;i++){const a=i*TAU/5;rock(c,target.x+Math.cos(a)*(.10+k*.34),target.y+Math.sin(a)*(.10+k*.40),.025+i*.004,.023)}
    }
    c.restore();
  }
  root.Kamnespin={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

/* Storybook v03. Rounded mass, moss wrapping the shoulder; established gait. */
(function(root){
'use strict';const TAU=Math.PI*2;
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill()}
function fill(c,col){c.fillStyle=col;c.fill()}
function boulder(c){c.beginPath();c.moveTo(-1,-.15);c.bezierCurveTo(-1.08,-.58,-.72,-.82,-.30,-.84);c.bezierCurveTo(.05,-.96,.56,-.73,.72,-.47);c.bezierCurveTo(.94,-.23,.91,.18,.65,.44);c.bezierCurveTo(.4,.76,-.04,.83,-.46,.68);c.bezierCurveTo(-.84,.59,-1.02,.24,-1,-.15);c.closePath()}
function pebble(c,x,y,rx,ry){oval(c,x,y,rx,ry,'#536d63');oval(c,x-.025,y-.035,rx*.88,ry*.78,'#9eaf93');oval(c,x-.055,y-.07,rx*.51,ry*.36,'#c6cfaa')}
function draw(c,o={}){const p=root.Kamnespin.pose(o),r=(o.size||80)/2.8,target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.42,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.translate((target.x-.9)*p.ram,target.y*p.ram);
if(o.shadow!==false)oval(c,-.02,.12,1.07,.79,'#183c323d');
for(let i=0;i<4;i++){const foot=p.feet[i],side=i%2?1:-1;pebble(c,(i<2?.45:-.64)+foot.x,side*(.66+p.tuck*.07)-foot.lift*.035,.24,.22);}
// A broad low brow, visible snout and tiny amber eyes give the rock a presence.
const head=.86-p.tuck*.27;oval(c,head+.01,.025,.40,.32,'#354f46');pebble(c,head+.04,-.015,.37,.29);
for(const side of [-1,1]){oval(c,head+.19,side*.18,.083,.052,'#304e43');oval(c,head+.215,side*.18,.040,.030,'#edc875');oval(c,head+.225,side*.18-.009,.012,.011,'#fff0bc');}
oval(c,head+.33,0,.10,.11,'#b9c4a1');
c.save();c.translate(-p.tuck*.045,p.weight);c.rotate(p.roll);c.scale(1,1-p.tuck*.035);
boulder(c);fill(c,'#688579');c.save();c.clip();
// Rounded top plane falls away into the shaded lower flank.
c.beginPath();c.moveTo(-1.06,-.22);c.bezierCurveTo(-.95,-.87,-.03,-1.04,.52,-.66);c.bezierCurveTo(.87,-.4,.63,.12,.24,.31);c.bezierCurveTo(-.19,.56,-.77,.3,-1.06,-.22);fill(c,'#a8b99a');
c.beginPath();c.moveTo(-.94,-.28);c.bezierCurveTo(-.88,-.68,-.36,-.87,.05,-.75);c.bezierCurveTo(.35,-.64,.39,-.52,.28,-.38);c.bezierCurveTo(-.05,-.49,-.51,-.48,-.76,-.09);c.quadraticCurveTo(-.91,-.13,-.94,-.28);fill(c,'#c9d2af');
c.beginPath();c.moveTo(-.84,.3);c.bezierCurveTo(-.27,.74,.47,.43,.78,.08);c.bezierCurveTo(.72,.62,.10,.91,-.46,.68);c.closePath();fill(c,'#4f7065');
// Moss grows over the back ridge and curls down the left shoulder.
c.beginPath();c.moveTo(-1.02,-.29);c.bezierCurveTo(-.91,-.62,-.75,-.83,-.38,-.83);c.bezierCurveTo(-.26,-.94,-.05,-.86,.04,-.74);c.bezierCurveTo(.35,-.79,.51,-.6,.38,-.44);c.bezierCurveTo(.3,-.30,.11,-.39,.02,-.30);c.bezierCurveTo(-.13,-.15,-.25,-.34,-.37,-.16);c.bezierCurveTo(-.43,.02,-.65,-.09,-.66,.14);c.bezierCurveTo(-.72,.34,-.96,.25,-1.02,-.29);fill(c,'#4e7042');
c.beginPath();c.moveTo(-1,-.37);c.bezierCurveTo(-.85,-.81,-.53,-.85,-.34,-.83);c.bezierCurveTo(-.2,-.92,-.05,-.83,.02,-.72);c.bezierCurveTo(.26,-.77,.40,-.62,.33,-.51);c.bezierCurveTo(.23,-.43,.06,-.56,-.05,-.42);c.bezierCurveTo(-.2,-.3,-.32,-.45,-.46,-.3);c.bezierCurveTo(-.7,-.14,-.72,-.18,-.81,.03);c.bezierCurveTo(-.93,.08,-1,-.11,-1,-.37);fill(c,'#89a85d');
c.beginPath();c.moveTo(-.91,-.42);c.bezierCurveTo(-.74,-.73,-.53,-.77,-.35,-.72);c.bezierCurveTo(-.25,-.81,-.09,-.73,-.06,-.63);c.bezierCurveTo(-.36,-.59,-.48,-.66,-.66,-.43);c.quadraticCurveTo(-.82,-.27,-.91,-.42);fill(c,'#b8ca80');
// Sparse lichen islands, no outline or scatter of cracks.
oval(c,-.27,.06,.083,.048,'#cfce9e');oval(c,-.15,.09,.038,.028,'#b6c396');oval(c,.30,-.25,.04,.026,'#d5d7b0');
c.restore();c.restore();c.restore();
// Contact feedback stays at the gate while the body recoils.
if(p.impact>0){const k=1-p.impact;c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.globalAlpha*=p.impact;c.strokeStyle='#d9caa3';c.lineWidth=.032;c.beginPath();c.ellipse(target.x,target.y,.09+k*.10,.19+k*.35,0,0,TAU);c.stroke();for(let i=0;i<5;i++){const a=i*TAU/5;oval(c,target.x+Math.cos(a)*(.10+k*.34),target.y+Math.sin(a)*(.10+k*.40),.025+i*.004,.023,'#a8b99a');}c.restore();}
}
root.StorybookKamnespin={draw};
})(typeof module==='object'?module.exports:window);

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

/* Shared overhead puffball and offspring. Rendering never spawns or deals damage. */
(function(root){
'use strict';
const TAU=Math.PI*2,ATTACK_DURATION=.9,CONTACT=.58,BIRTH_DURATION=.45,DEATH_DURATION=.8;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const phase=(o.distance||0)*TAU*1.6+(o.seed||0),a=clamp(o.attack||0),active=o.state==='attack';return {rock:o.state==='walk'?Math.sin(phase)*.055:0,squash:o.state==='walk'?Math.cos(phase*2)*.025:0,feet:[Math.sin(phase)*.12,-Math.sin(phase)*.12],brace:active?(a<.32?ease(a/.32):1-ease((a-.32)/.4)):0,jet:active?(a<CONTACT?ease((a-.32)/(CONTACT-.32)):1-ease((a-CONTACT)/.32)):0,contact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.2):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=col;c.fill()}
function poly(c,points,col){c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle=col;c.fill()}
function shell(c,spore=false){
 const g=c.createRadialGradient(-.32,-.36,.02,0,0,1);g.addColorStop(0,'#fff3d9');g.addColorStop(.55,spore?'#e9ca8f':'#e5d1a7');g.addColorStop(.84,'#b69a66');g.addColorStop(1,'#796348');
 c.beginPath();for(let i=0;i<=48;i++){const a=i*TAU/48,r=.9+.025*Math.sin(a*3+.4)+.012*Math.cos(a*7);const x=Math.cos(a)*r,y=Math.sin(a)*r*.92;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.fillStyle=g;c.fill();c.strokeStyle='#776348';c.lineWidth=.026;c.stroke();
 const count=spore?12:24;
 for(let i=0;i<count;i++){const a=i*2.399,r=.28+(i%5)*.125,x=Math.cos(a)*r,y=Math.sin(a)*r*.92,s=.045+(i%3)*.012;
 poly(c,[[x-s,y+s*.5],[x,y-s],[x+s,y+s*.5],[x,y+s]],'#ad8550');poly(c,[[x-s,y+s*.5],[x,y-s],[x,y+s*.25]],'#eed3a2');}
 for(let i=0;i<(spore?16:40);i++){const a=i*2.399,r=.23+(i%7)*.09;oval(c,Math.cos(a)*r,Math.sin(a)*r*.92,.011+(i%2)*.005,.012,'#8e734b55')}
 for(const side of [-1,1]){oval(c,.67,side*.32,.115,.048,'#594a2f',side*-.55);oval(c,.69,side*.32,.059,.024,'#d9b66c',side*-.55)}
}
function draw(c,o={}){
 const r=(o.size||90)/2.7,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
 if(o.shadow!==false)oval(c,0,.10,1,.85,'#26302133');
 for(const side of [-1,1]){const step=o.state==='walk'?p.feet[side===1?0:1]:0;oval(c,-.12+step,side*.83,.26,.20,'#8d7856');for(let j=0;j<3;j++)oval(c,.02+step-j*.09,side*(.91+j*.018),.075,.075,j%2?'#b59b6b':'#998055')}
 c.save();c.rotate(p.rock);c.scale(1+p.squash-p.brace*.08,1-p.squash+p.brace*.06);shell(c);
 // Star-shaped opening sits on top, visible in every travel direction.
 const star=[];for(let i=0;i<12;i++){const a=i*TAU/12,r=i%2?.14:.27;star.push([-.12+Math.cos(a)*r,Math.sin(a)*r]);}
 poly(c,star,'#a27b43');const inner=star.map(([x,y])=>[-.12+(x+.12)*.72,y*.72]);poly(c,inner,'#493c23');oval(c,-.12,0,.07,.065,'#b2a059');c.restore();
 if(p.jet>0){const reach=p.jet;for(let i=0;i<18;i++){const u=(i+1)/18,x=-.12+(target.x+.12)*u*reach,y=target.y*u*reach+Math.sin(i*2.4)*(.07+u*.14);oval(c,x,y,.025+u*.035,.025+u*.035,`rgba(189,164,91,${.3+.5*(1-u)})`)}
 oval(c,-.12+ (target.x+.12)*reach,target.y*reach,.12,.12,'#dac38499');}
 if(p.contact>0){c.globalAlpha*=p.contact;c.strokeStyle='#efda9b';c.lineWidth=.025;c.beginPath();c.ellipse(target.x,target.y,.1+(1-p.contact)*.16,.18+(1-p.contact)*.25,0,0,TAU);c.stroke()}
 c.restore();
}
function sporeAttackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(.5,1-after/.65));return remaining>=0&&remaining<=.325?.5-remaining/.65:null}
function sporePose(o={}){const a=clamp(o.attack||0),active=o.state==='attack';return {dart:active?(a<.5?ease((a-.18)/.32):1-ease((a-.5)/.5)):0,crouch:active?(a<.18?ease(a/.18):1-ease((a-.18)/.32)):0};}
function drawSpore(c,o={}){
 const g=clamp(o.growth||0),p=sporePose(o);
 if(g>0){c.save();draw(c,{...o,state:o.state==='attack'?'idle':o.state});c.restore();}
 c.save();c.globalAlpha*=1-g;
 const r=(o.size||35)/2.7,phase=(o.distance||0)*8+(o.seed||0),birth=o.birth==null?1:clamp(o.birth/BIRTH_DURATION),hop=o.state==='walk'?Math.abs(Math.sin(phase))*.15:0;
 const target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.8,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
 if(o.shadow!==false)oval(c,0,.10,.92,.72,'#26302133');
 c.translate((target.x-.90)*p.dart,target.y*p.dart);
 c.scale(1-p.crouch*.12,1+p.crouch*.09);
 c.scale(.45+.55*ease(birth),.45+.55*ease(birth));c.translate(0,-hop-Math.sin(birth*Math.PI)*.25);
 c.beginPath();c.moveTo(-.70,0);c.quadraticCurveTo(-1.15,Math.sin(phase)*.18,-1.32,.04);c.strokeStyle='#a98a54';c.lineWidth=.08;c.stroke();
 for(const side of [-1,1])oval(c,-.13,side*.79,.17,.13,'#9a7a4c');shell(c,true);
 poly(c,[[-.15,-.12],[-.06,-.23],[.02,-.08],[-.07,.06]],'#a5844f');
 c.restore();c.restore();
}
function drawDeath(c,o={}){
 const t=clamp(o.progress||0),r=(o.size||90)/2.7;
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);
 // A dry fungal shell breaks outwards at the same instant as the live spores spawn.
 c.globalAlpha*=1-t;
 for(let i=0;i<8;i++){const a=i*TAU/8,d=.40+ease(t)*1.08,x=Math.cos(a)*d,y=Math.sin(a)*d;
 c.save();c.translate(x,y);c.rotate(a+t*.8);c.scale(1-t*.5,1-t*.5);poly(c,[[-.24,-.12],[-.13,-.31],[.15,-.25],[.22,.09],[-.06,.17]],i%2?'#d9c69b':'#bba376');c.restore();}
 for(let i=0;i<28;i++){const a=i*2.399,d=(.15+(i%7)*.12)*(.4+t*1.8);oval(c,Math.cos(a)*d,Math.sin(a)*d,.025+(i%3)*.012,.025+(i%3)*.012,'#cbb57a99')}
 c.restore();
}
root.Dozhdevik={sporePose,sporeAttackProgress,draw,drawSpore,drawDeath,pose,attackProgress,ATTACK_DURATION,CONTACT,BIRTH_DURATION,DEATH_DURATION};
})(typeof module==='object'?module.exports:window);
