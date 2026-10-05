/* Storybook v04: each part carries its own curved light and contact shadow. */
(function(root){
'use strict';const TAU=Math.PI*2;
function poly(c,p,col){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=col;c.fill()}
function disk(c,x,y,r,col){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=col;c.fill()}
function box(c,x,y,w,h,r,col){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=col;c.fill()}
function body(c,s,lvl=1){c.save();c.scale(s,s);const r=.29+(lvl-1)*.018,a=r*.7,p=[[-a,-r],[a,-r],[r,-a],[r,a],[a,r],[-a,r],[-r,a],[-r,-a]];c.save();c.translate(.025,.04);poly(c,p,'#163b3238');c.restore();poly(c,p,'#65775b');c.save();c.scale(.93,.93);poly(c,p,'#d0cd9f');c.restore();poly(c,[[r,-a],[r,a],[a,r],[-a,r],[-r,a],[-a,r-.065],[a-.02,r-.065],[r-.065,a-.02],[r-.065,-a]],'#9fa77c');poly(c,[[-r,-a],[-a,-r],[a,-r],[a-.02,-r+.038],[-a+.02,-r+.038],[-r+.038,-a+.02]],'#eee2b7');disk(c,.012,.024,.232,'#3a5446');disk(c,0,0,.215,'#8b9970');disk(c,-.013,-.016,.188,'#bac29a');c.restore()}
function live(c,s,t){const lvl=t.lvl||1,aim=t.aim||0,back=-(t.recoil||0)*.07,L=.38+(lvl-1)*.025,w=[0,.105,.17,.17,.195,.215][lvl];c.save();c.scale(s,s);c.rotate(aim);
const lx=(-Math.cos(aim)-Math.sin(aim))*.023,ly=(Math.sin(aim)-Math.cos(aim))*.023;
function armor(x,y,ww,hh,r){box(c,x-lx*.5,y-ly*.5,ww,hh,r,'#284e40');box(c,x,y,ww*.96,hh*.91,r,'#51795d');box(c,x+.018+lx*.35,y+.018+ly*.35,ww-.042,hh-.05,Math.max(.015,r*.8),'#93ad7c');}
if(lvl>=3){for(const side of [-1,1]){const yy=side*(lvl===5?.265:.22)-.045;armor(-.17,yy,lvl===5?.46:.30,.09,.025);}}
if(lvl===1){disk(c,-lx,-ly,.175,'#294f42');disk(c,0,0,.164,'#63896b');disk(c,lx*1.1,ly*1.1,.136,'#9cb686');disk(c,lx*1.6,ly*1.6,.074,'#b8c99b');}
else armor(-.215,lvl>=4?-.22:-.15,lvl>=4?.44:.40,lvl>=4?.44:.30,lvl>=4?.09:.11);
// Barrel casts a narrow displaced shadow on its cradle.
box(c,back+.004-lx,-w/2-ly,L,w,.02,'#294b3cd9');
box(c,back+.015,-w/2,L-.015,w,.025,'#355f49');
const side=ly<0?-1:1;box(c,back+.023,-w*.35,L-.037,w*.68,.017,'#799966');
box(c,back+.028,side<0?-w*.35:w*.08,L-.047,w*.25,.01,'#aec28b');
if(lvl>=2){box(c,back+.065,-w*.67,.093,w*1.34,.022,'#897346');box(c,back+.065,-w*.60,.074,w*1.12,.018,'#d4bc75');box(c,back+.071,side<0?-w*.53:w*.26,.058,w*.28,.01,'#efdb9f');}
if(lvl>=4){box(c,back+L-.069,-w*.60,.073,w*1.20,.014,'#77925e');box(c,back+L-.062,side<0?-w*.51:w*.28,.058,w*.23,.008,'#b7c891');}
box(c,back+L-.025,-w*.43,.029,w*.86,.009,'#203f33');
if(t.flash>0)poly(c,[[L,0],[L+.09,-.045],[L+.21,0],[L+.09,.045]],'#f8e6a1');c.restore();}
root.StorybookGun={body,live};
})(typeof module==='object'?module.exports:window);
