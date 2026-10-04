/* Overhead straw spirit. Combat remains owned by Towers. */
(function(root){'use strict';
const ATTACK_DURATION=.9,CONTACT=.6,TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),walking=o.state==='walk',ph=(o.distance||0)*11+(o.seed||0);return {step:walking?Math.sin(ph):0,sway:walking?Math.sin(ph)*.055:0,strike:o.state==='attack'?(a<CONTACT?ease((a-.22)/.38):1-ease((a-CONTACT)/.4)):0,wind:Math.sin((o.time||0)*3+(o.seed||0))*.025};}
function line(c,x,y,u,v,color,width){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill()}
const colors=['#b99854','#e5ce93','#c6aa6a','#f0dfaf','#94733e'];
function bundle(c,x,y,length,width,angle,seed){c.save();c.translate(x,y);c.rotate(angle);oval(c,0,0,length*.43,width*.42,'#8f713e');for(let i=0;i<27;i++){const q=Math.sin(i*17.13+seed),v=((i+.5)/27-.5)*width;line(c,-length*(.37+.1*q),v*.72,length*(.40+.13*Math.sin(i*8.9)),v+q*.035,colors[i%5],.015+(i%3)*.005);}c.restore()}
function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.8,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='butt';
// Torso closes the distance, keeping both straw arms short and attached.
c.translate((target.x-1.19)*p.strike,target.y*p.strike);
if(o.shadow!==false)oval(c,-.08,.10,1.10,.84,'#24261844');
c.rotate(p.sway);
for(const s of [-1,1])bundle(c,-.48+p.step*s*.13,s*.48,.8,.35,.12*s,4+s);
for(const s of [-1,1]){const hit=s===-1?p.strike:p.strike*.35;bundle(c,.20+hit*.24,s*(.61-hit*.24),1.45,.38,s*(.60-hit*.68)+p.step*s*.08,6+s);}
oval(c,-.08,0,.89,.70,'#715632');
const body=c.createRadialGradient(-.25,-.27,.05,0,0,.95);body.addColorStop(0,'#d0b77c');body.addColorStop(1,'#846336');oval(c,-.08,0,.84,.65,body);
// Irregular fine stalks follow the sheaf length, rather than radial spokes.
for(let i=0;i<94;i++){const v=((i+.5)/94-.5)*1.30,q=Math.sin(i*19.31),span=Math.sqrt(Math.max(0,1-(v/.69)**2));const x=-.85*span-.09*q,y=v;line(c,x,y,.77*span+.12*q,y+q*.075+p.wind,colors[i%5],.012+(i%3)*.006);if(i%5===0)line(c,x*.7,y,.98*span+.18*q,y+q*.17,colors[(i+2)%5],.012);}
// Recessed charcoal eyes between forward-facing straw fringes.
for(const s of [-1,1]){oval(c,.59,s*.22,.13,.095,'#372b1b');oval(c,.63,s*.22,.036,.029,'#ffc966');}
// Rope wraps across the visible back, with a small side knot and frayed ends.
c.beginPath();c.moveTo(-.24,-.62);c.bezierCurveTo(-.08,-.30,-.10,.30,-.27,.64);c.strokeStyle='#59472d';c.lineWidth=.10;c.stroke();
for(let i=0;i<14;i++){const y=-.57+i*.085;line(c,-.22+.08*Math.cos(y*2),y,-.16+.08*Math.cos(y*2),y+.045,'#b09a70',.035);}
oval(c,-.25,.54,.11,.09,'#796342');line(c,-.26,.55,-.50,.78,'#796342',.045);line(c,-.24,.57,-.12,.86,'#796342',.045);
// Three slender wheat ears on the swept crown, visible from overhead.
for(let k=0;k<3;k++){const y=-.28+k*.22;line(c,-.32,y,-1.04-k*.055,y-.20,'#ae8e50',.018);for(let j=0;j<5;j++){const x=-.68-j*.065,yy=y-.12-j*.014;line(c,x,yy,x-.08,yy-.045,'#d6bc7b',.038);line(c,x,yy,x-.07,yy+.04,'#cfb16e',.035);}}
c.restore();}
root.Solomennik={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
