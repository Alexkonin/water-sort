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
