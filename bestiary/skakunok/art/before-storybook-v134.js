(function(root){'use strict';
const ATTACK_DURATION=.8,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x));
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),p=clamp(o.progress||0),attack=o.state==='attack';return {flight:o.state==='air'?Math.sin(p*Math.PI):attack?Math.sin(Math.PI*clamp((a-.18)/.42))*.65:0,extend:o.state==='air'?Math.sin(Math.PI*p):attack?Math.sin(Math.PI*clamp((a-.18)/.42)):0,crouch:o.state==='crouch'?p:o.state==='land'?1-p:attack&&a<.18?a/.18:0,strike:attack?(a<.6?clamp((a-.18)/.42):1-clamp((a-.6)/.4)):0,step:o.state==='walk'?Math.sin((o.distance||0)*13+(o.seed||0))*.07:0};}
function stroke(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=col;c.fill()}
function leaf(c,x,y,length,width,angle,light='#98ac50',dark='#354f24'){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(-length*.5,0);c.bezierCurveTo(-length*.10,-width*.70,length*.36,-width*.56,length*.5,0);c.bezierCurveTo(length*.25,width*.50,-length*.23,width*.65,-length*.5,0);c.closePath();const g=c.createLinearGradient(0,-width*.5,0,width*.5);g.addColorStop(0,light);g.addColorStop(1,dark);c.fillStyle=g;c.fill();c.strokeStyle='#b3bd6b';c.lineWidth=.014;c.stroke();stroke(c,-length*.43,0,length*.43,0,'#b5bc6b',.021);for(let j=0;j<5;j++){const u=-length*.32+j*length*.13,w=Math.sin((j+1)/6*Math.PI)*width*.37;for(const s of [-1,1])stroke(c,u,0,u+length*.13,s*w,'#a3b26788',.012);}c.restore()}
function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.6,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.translate((target.x-.88)*p.strike,target.y*p.strike);
if(o.shadow!==false)oval(c,-.09,.09,1.03-p.flight*.15,.71-p.flight*.08,'#20301840');c.save();const size=1+p.flight*.14;c.scale(size*(1-p.crouch*.09),size*(1+p.crouch*.07));
for(const s of [-1,1]){const hip={x:-.23,y:s*.42},knee={x:-.73-p.extend*.28,y:s*(.83-p.crouch*.15)},foot={x:-.13-p.extend*1.47+p.step*s,y:s*(.85-p.extend*.25)};stroke(c,hip.x,hip.y,knee.x,knee.y,'#344728',.18);stroke(c,knee.x,knee.y,foot.x,foot.y,'#69783b',.09);stroke(c,knee.x+.025,knee.y,foot.x,foot.y,'#b0ae61',.025);leaf(c,-.45-p.extend*.15,s*.62,.73,.30,s*.57,'#829d42','#354f26');leaf(c,foot.x,foot.y,.25,.1,.1*s);stroke(c,.32,s*.32,.57+p.step*s,s*.51,'#50662f',.09);}
oval(c,-.07,0,.87,.49,'#314622');
leaf(c,-.16,-.22,1.77,.58,-.09,'#98ad50','#425f29');leaf(c,-.16,.22,1.77,.58,.09,'#829b43','#344e25');stroke(c,-.96,0,.54,0,'#c0be6f',.022);
for(const s of [-1,1]){oval(c,.61,s*.25,.12,.09,'#29351c');oval(c,.66,s*.25,.049,.039,'#d9b546');oval(c,.68,s*.25,.021,.033,'#202b18');}
leaf(c,.57,0,.60,.50,0,'#a7b95c','#48642c');
for(const s of [-1,1]){const bend=Math.sin((o.time||0)*3)*.04-p.extend*.14;c.beginPath();c.moveTo(.73,s*.14);c.quadraticCurveTo(1.10,s*(.27+bend),1.41,s*(.50+bend));c.strokeStyle='#687e39';c.lineWidth=.025;c.stroke();leaf(c,1.42,s*(.50+bend),.23,.10,s*.34,'#a4b354','#506b2c');}
c.restore();c.restore();}
root.SkakunokBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
