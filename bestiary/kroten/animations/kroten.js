/* Mole spirit: overhead model. Burrow immunity is owned by the game trait. */
(function(root){
'use strict';const TAU=Math.PI*2,ATTACK_DURATION=.9,CONTACT=.6,DIG_DURATION=.5,EMERGE_DURATION=.45;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),phase=(o.distance||0)*9+(o.seed||0),active=o.state==='attack';return {stroke:o.state==='dig'?Math.sin((o.time||0)*22)*.17:o.state==='walk'?Math.sin(phase)*.13:0,roll:o.state==='walk'?Math.sin(phase)*.025:0,depth:o.state==='dig'?ease(o.progress||0):o.state==='emerge'?1-ease(o.progress||0):o.state==='underground'?1:0,strike:active?(a<CONTACT?ease((a-.25)/.35):1-ease((a-CONTACT)/.4)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.2):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=col;c.fill()}
function poly(c,p,col){c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle=col;c.fill()}
function mound(c,t,amount=1){oval(c,0,0,1.1,.76,'#493625');for(let i=0;i<15;i++){const a=i*2.399,d=.20+(i%4)*.20;oval(c,Math.cos(a)*d,Math.sin(a)*d*.75,.17+(i%3)*.025,.12,['#665039','#82684a','#a1845b'][i%3],a)}for(let i=0;i<7;i++){const a=i*2.399,u=((t*1.5+i*.17)%1+1)%1;oval(c,Math.cos(a)*(1+u*.23),Math.sin(a)*(.65+u*.2),.03+.02*(i%2),.035,'#8b6e48')}}
function draw(c,o={}){
 const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
 if(o.state==='underground'){mound(c,o.time||0);c.restore();return;}
 // Close the gap with the whole body; paws only swing within shoulder reach.
 c.save();c.translate((target.x-1.10)*p.strike,target.y*p.strike);
 if(o.shadow!==false)oval(c,-.08,.10,1.16,.84,'#20261844');
 if(p.depth>0)oval(c,.12,0,.95,.65,'#30271e');
 c.save();c.translate(p.depth*.20,0);c.scale(1-p.depth*.6,1-p.depth*.65);c.rotate(p.roll);
 // Tail and hind paws remain small; the heavy digging shoulders carry the silhouette.
 c.beginPath();c.moveTo(-.83,0);c.quadraticCurveTo(-1.24,-.10,-1.22,.07);c.strokeStyle='#584434';c.lineWidth=.12;c.stroke();
 for(const side of [-1,1])oval(c,-.58,side*.61,.19,.12,'#71543b');
 // Solid forearms overlap both the shoulders and palms throughout the stroke.
 for(const side of [-1,1]){
  const x=.35+p.stroke*side+.30*p.strike,y=side*(.62-.20*p.strike);
  c.beginPath();c.moveTo(.02,side*.43);c.quadraticCurveTo(.23,side*.65,x,y);c.strokeStyle='#554432';c.lineWidth=.42;c.stroke();
  c.beginPath();c.moveTo(.10,side*.44);c.quadraticCurveTo(.26,side*.59,x,y);c.strokeStyle='#806347';c.lineWidth=.27;c.stroke();
 }
 const fur=c.createRadialGradient(-.25,-.35,.05,0,0,1.1);fur.addColorStop(0,'#806347');fur.addColorStop(.55,'#503d30');fur.addColorStop(1,'#30291f');oval(c,-.16,0,.91,.72,fur);
 for(let i=0;i<27;i++){const a=i*2.399,d=.20+(i%5)*.12,x=-.17+Math.cos(a)*d,y=Math.sin(a)*d*.85;poly(c,[[x+.09,y-.055],[x-.10,y],[x+.08,y+.055],[x+.04,y]],['#91715155','#241f1955','#af8a5633'][i%3]);}
 for(const side of [-1,1]){
  const x=.35+p.stroke*side+.30*p.strike,y=side*(.62-.20*p.strike);
  oval(c,x,y,.34,.26,'#554432',side*.35);oval(c,x-.03,y-.04,.28,.22,'#a08660',side*.35);
  for(let j=0;j<4;j++)poly(c,[[x-.23+j*.1,y-.10],[x-.16+j*.1,y-.20],[x-.08+j*.1,y-.06],[x-.15+j*.1,y+.03]],j%2?'#8d7350':'#b2976b');
  for(let j=-1;j<=1;j++){poly(c,[[x+.18,y+j*.13-.05],[x+.45,y+j*.12],[x+.24,y+j*.13+.05]],'#e9d5ad');}
 }
 oval(c,.56,0,.43,.38,fur);oval(c,.92,0,.21,.16,'#be8279');oval(c,.98,-.04,.075,.035,'#e1ada0');
 for(const side of [-1,1])oval(c,.68,side*.24,.065,.024,'#c4a15d',side*-.45);
 for(const [x,y,s] of [[-.50,-.25,.16],[-.34,.21,.13],[-.08,-.38,.12]]){oval(c,x,y,s,s*.65,'#405033');for(let i=0;i<5;i++)oval(c,x+Math.cos(i*2.4)*s*.5,y+Math.sin(i*2.4)*s*.35,s*.40,s*.30,['#667543','#8a914e'][i%2]);}
 poly(c,[[-.28,-.12],[-.50,-.13],[-.46,-.02],[-.31,.05]],'#af8753');
 c.restore();
 // Foreground soil covers the sinking body rather than making it transparent.
 if(p.depth>0){for(let i=0;i<9;i++){const a=i*TAU/9,d=.93-p.depth*.65;oval(c,Math.cos(a)*d+.16,Math.sin(a)*d*.7,.16+p.depth*.14,.12+p.depth*.10,['#6a5137','#93764d','#4e3b29'][i%3]);}}
 c.restore();
 if(p.impact>0){c.globalAlpha*=p.impact;for(let i=0;i<6;i++){const a=i*2.4,d=(1-p.impact)*.35;oval(c,target.x+Math.cos(a)*d,target.y+Math.sin(a)*d,.04,.035,'#c3a675')}}
 c.restore();
}
root.Kroten={draw,pose,attackProgress,ATTACK_DURATION,CONTACT,DIG_DURATION,EMERGE_DURATION};
})(typeof module==='object'?module.exports:window);
