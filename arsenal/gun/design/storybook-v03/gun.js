/* Art-direction prototype v03: flat color planes, overhead camera. */
(function(root){
'use strict';
const tau=Math.PI*2;
function path(c,p){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath()}
function poly(c,p,color){path(c,p);c.fillStyle=color;c.fill()}
function disk(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,tau);c.fillStyle=color;c.fill()}
function box(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
function planes(c,shape,aim,base,light,shade){shape();c.fillStyle=base;c.fill();c.save();c.clip();c.rotate(-aim);poly(c,[[-1,-1],[1,-1],[-.48,.34],[-1,.34]],light);poly(c,[[1,-.28],[1,1],[-1,1],[-1,.75]],shade);c.restore()}
function body(c,s,lvl=1){c.save();c.scale(s,s);const r=.29+(lvl-1)*.018,a=r*.70,p=[[-a,-r],[a,-r],[r,-a],[r,a],[a,r],[-a,r],[-r,a],[-r,-a]];c.save();c.translate(.025,.045);poly(c,p,'#263e3538');c.restore();poly(c,p,'#607b61');c.save();c.scale(.91,.91);poly(c,p,'#c8caa0');poly(c,[[-a,-r],[a,-r],[r,-a],[-.04,-.04],[-r,a],[-r,-a]],'#e0dbb3');poly(c,[[r,-a],[r,a],[a,r],[-a,r],[-r,a],[0,.12]],'#9daa7c');c.restore();disk(c,.014,.018,.227,'#405c4b');disk(c,0,-.018,.205,'#9baa78');c.restore()}
function live(c,s,t){const lvl=t.lvl||1,aim=t.aim||0,back=-(t.recoil||0)*.07,length=.38+(lvl-1)*.025,width=[0,.105,.17,.17,.195,.215][lvl];c.save();c.scale(s,s);c.rotate(aim);
const paint=shape=>planes(c,shape,aim,'#648b73','#a7c49a','#355f51');
if(lvl===1)paint(()=>{c.beginPath();c.arc(0,0,.17,0,tau)});
else if(lvl===2)paint(()=>box(c,-.205,-.14,.4,.28,.12));
else if(lvl===3){paint(()=>box(c,-.105,-.25,.055,.5,.01));for(const side of [-1,1])paint(()=>box(c,-.18,side*.25-.05,.29,.1,.025));paint(()=>box(c,-.21,-.16,.36,.32,.045));}
else {paint(()=>path(c,[[-.27,-.15],[-.15,-.255],[.13,-.255],[.265,-.12],[.265,.12],[.13,.255],[-.15,.255],[-.27,.15]]));if(lvl===5)for(const side of [-1,1])paint(()=>path(c,[[-.19,side*.23],[-.13,side*.32],[.28,side*.32],[.35,side*.24],[.25,side*.19]]));}
paint(()=>box(c,back+.015,-width/2,length-.015,width,.018));
if(lvl>=2){planes(c,()=>box(c,back+.06,-width*.72,.105,width*1.44,.024),aim,'#d2b568','#eee0a4','#9e874f');}
if(lvl>=4)paint(()=>box(c,back+length-.075,-width*.67,.075,width*1.34,.012));
box(c,back+length-.028,-width*.45,.028,width*.9,.006);c.fillStyle='#203e36';c.fill();
if(t.flash>0){poly(c,[[length,0],[length+.09,-.045],[length+.21,0],[length+.09,.045]],'#f8e6a1');}
c.restore();}
root.StorybookGun={body,live};
})(typeof module==='object'?module.exports:window);
