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
