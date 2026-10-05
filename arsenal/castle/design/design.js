(() => {
'use strict';
const $=s=>document.querySelector(s), cv=$('#field'), c=cv.getContext('2d');
const towerHP=[0,30,50,80], fenceHP=[0,35,70], names=['','Застава','Донжон','Цитадель'];
function poly(c,p,color){c.fillStyle=color;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.strokeStyle='#354d3c';c.lineWidth=2;c.stroke();}
function block(c,x,y,w,h){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#c0c5a2');g.addColorStop(.55,'#94a385');g.addColorStop(1,'#657e65');c.fillStyle=g;c.beginPath();c.roundRect(x,y,w,h,3);c.fill();c.strokeStyle='#425d48';c.lineWidth=1.5;c.stroke();c.fillStyle='#d1d2ad';c.fillRect(x+2,y+1,w-4,3);}
function tower(c,x,y,s,l){c.save();c.translate(x,y);c.scale(s/100,s/100);c.fillStyle='#152d2750';c.beginPath();c.ellipse(2,30,64,18,0,0,7);c.fill();poly(c,[[-55,18],[-43,6],[43,6],[55,18],[55,30],[42,40],[-42,40],[-55,30]],'#6c8568');poly(c,[[-55,18],[-43,6],[43,6],[55,18],[42,29],[-42,29]],'#a8b394');
 if(l>=3)for(const a of [-1,1]){block(c,a*48-13,-45,26,72);poly(c,[[a*48-19,-45],[a*48,-73],[a*48+19,-45]],'#bdab63');c.fillStyle='#f5d181';c.fillRect(a*48-3,-23,6,12);}
 block(c,-32,-31-(l-1)*15,64,60+(l-1)*15);
 for(let i=-1;i<=1;i++)block(c,i*23-8,-42-(l-1)*15,16,16);
 if(l>=2){block(c,-40,-18,10,49);block(c,30,-18,10,49);c.fillStyle='#eed792';c.fillRect(-4,-43,8,13);}
 c.fillStyle='#172d26';c.beginPath();c.roundRect(-11,0,22,31,[11,11,0,0]);c.fill();c.strokeStyle='#c4cbaa';c.lineWidth=4;c.stroke();
 if(l===3){poly(c,[[-9,-25],[9,-25],[7,-12],[0,-5],[-7,-12]],'#bfa45c');c.strokeStyle='#554f31';c.beginPath();c.moveTo(0,-72);c.lineTo(0,-97);c.stroke();poly(c,[[0,-97],[23,-92],[0,-85]],'#ba7c56');}c.restore();}
function fence(c,x,y,s,l,hp=1){if(!l)return;c.save();c.translate(x,y);c.scale(s/100,s/100);for(let i=-4;i<=4;i++){if(hp<=0){poly(c,[[i*11-4,8],[i*11+7,2],[i*11+12,7],[i*11,13]],'#71644a');continue;}poly(c,[[i*11-4,20],[i*11-4,-15],[i*11,-24],[i*11+4,-15],[i*11+4,20]],'#a58a59');if(l===2)poly(c,[[i*11-5,-14],[i*11,-26],[i*11+5,-14]],'#b7c0a0');}if(hp>0){c.fillStyle='#755f42';c.fillRect(-49,3,98,5);if(l===2){c.fillRect(-49,-9,98,5);}}c.restore();}
function hero(c,x,y,hit){c.save();c.translate(x,y);c.fillStyle='#162e2850';c.beginPath();c.ellipse(0,10,16,6,0,0,7);c.fill();poly(c,[[-10,6],[-8,-13],[7,-13],[11,7]],'#718a5b');c.fillStyle='#ddcaa0';c.beginPath();c.arc(0,-19,7,0,7);c.fill();c.fillStyle='#adb798';c.fillRect(-7,-24,14,5);poly(c,[[-14,-10],[-3,-8],[-4,4],[-10,9],[-16,3]],'#c1a05c');c.strokeStyle=hit?'#fff0b5':'#ccd4bd';c.lineWidth=3;c.beginPath();c.moveTo(8,-5);c.lineTo(hit?25:14,hit?-10:-24);c.stroke();c.restore();}
for(let l=1;l<=3;l++){const a=document.createElement('article');a.innerHTML=`<canvas width="340" height="180" role="img" aria-label="${names[l]}"></canvas><h3>${l} · ${names[l]}</h3><p>${['','Низкая башня с воротами.','Вырастает центральный донжон, появляются опоры.','Донжон и опоры остаются; добавляются боковые башни и знамя.'][l]}</p>`;$('#ranks').append(a);tower(a.firstChild.getContext('2d'),170,135,100,l);}
for(let l=1;l<=2;l++){const a=document.createElement('article');a.innerHTML=`<canvas width="340" height="180" role="img" aria-label="Частокол ${l}"></canvas><h3>${l} · ${l===1?'Деревянный рубеж':'Укреплённый рубеж'}</h3><p>${l===1?'Заострённые брёвна и поперечная связь.':'Те же брёвна, вторая связь и металлические наконечники.'}</p>`;$('#fences').append(a);fence(a.firstChild.getContext('2d'),170,110,220,l);}
let S,last=0,stamp='',tick=0;
function reset(){S={level:1,fence:0,hp:30,fhp:0,post:.68,hero:null,enemies:[],spawn:0,spawnT:0,paused:false,kills:0};$('#tower').value='1';$('#fence').value='0';$('#post').value='0.68';$('#summon').disabled=false;$('#summon').textContent='Призвать чемпиона · 100';$('#pause').textContent='Пауза';$('#notice').textContent='Выберите развитие крепости и запустите волну.';}
reset();
$('#tower').onchange=e=>{const old=towerHP[S.level];S.level=+e.target.value;S.hp=Math.max(0,Math.min(towerHP[S.level],S.hp+towerHP[S.level]-old));};
$('#fence').onchange=e=>{S.fence=+e.target.value;S.fhp=fenceHP[S.fence];};
$('#summon').onclick=()=>{if(S.hero)return;S.hero={x:.17,hp:45,cool:0,respawn:0,flash:0};$('#summon').disabled=true;$('#summon').textContent='Чемпион призван';};
$('#wave').onclick=()=>{if(S.hp<=0)return;S.spawn=6;S.spawnT=0;$('#notice').textContent='Монстры идут к воротам. Чемпиона можно перемещать во время боя.';};
$('#pause').onclick=()=>{S.paused=!S.paused;$('#pause').textContent=S.paused?'Продолжить':'Пауза';};
$('#reset').onclick=reset;
function post(v){S.post=Math.max(.52,Math.min(.85,v));$('#notice').textContent='Пост назначен. Чемпион защищает участок рядом с отметкой.';}
$('#post').onchange=e=>post(+e.target.value);
// One projection for drawing, picking and the two defence lines.
const MAP={w:800,h:520};
function view(){return cv.clientWidth<520?{w:480,left:210}:{w:800,left:0};}
function ground(u){return {x:400+100*Math.sin((u-.17)*Math.PI/1.6),y:190+(u-.17)*365};}
cv.onclick=e=>{const r=cv.getBoundingClientRect(),v=view(),x=v.left+(e.clientX-r.left)*v.w/r.width,y=(e.clientY-r.top)*MAP.h/r.height,u=.17+(y-190)/365;if(u<.52||u>.85||Math.abs(x-ground(u).x)>44){$('#notice').textContent='Назначьте пост на дороге за частоколом.';return;}post(u);};
const repair=document.createElement('button');repair.textContent='Починить частокол';repair.onclick=()=>{S.fhp=fenceHP[S.fence];};$('#reset').after(repair);
function update(dt){if(S.hp<=0)return;if(S.spawn){S.spawnT-=dt;if(S.spawnT<=0){S.spawn--;S.spawnT=1.8;S.enemies.push({x:.97,hp:24,cool:0});}}
 const h=S.hero;if(h){h.flash=Math.max(0,h.flash-dt);if(h.respawn>0){h.respawn-=dt;if(h.respawn<=0){h.hp=45;h.x=.17;}}else{h.cool=Math.max(0,h.cool-dt);const target=S.enemies.filter(e=>e.hp>0&&Math.abs(e.x-S.post)<.12).sort((a,b)=>Math.abs(a.x-h.x)-Math.abs(b.x-h.x))[0];const dest=target?target.x-.025:S.post;h.x+=Math.sign(dest-h.x)*Math.min(Math.abs(dest-h.x),dt*.15);if(target&&Math.abs(target.x-h.x)<.04&&h.cool<=0){target.hp-=8;h.cool=.8;h.flash=.18;}}}
 for(const e of S.enemies){if(e.hp<=0)continue;e.cool=Math.max(0,e.cool-dt);const engaged=h&&h.hp>0&&h.respawn<=0&&Math.abs(e.x-h.x)<.045;const barrier=S.fhp>0?.44:.18;if(engaged||e.x<=barrier){if(e.cool<=0){e.cool=1;if(engaged){h.hp=Math.max(0,h.hp-5);if(h.hp===0){h.respawn=8;h.x=.17;}}else if(S.fhp>0)S.fhp=Math.max(0,S.fhp-5);else S.hp=Math.max(0,S.hp-5*(1-(S.level-1)*.1));}}else e.x=Math.max(barrier,e.x-dt*.045);}
 S.kills+=S.enemies.filter(e=>e.hp<=0).length;S.enemies=S.enemies.filter(e=>e.hp>0);
}
function bar(x,y,hp,max,w=34){c.fillStyle='#263b2b';c.fillRect(x-w/2,y,w,4);c.fillStyle='#c5d696';c.fillRect(x-w/2,y,w*Math.max(0,hp/max),4);}
function drawGround(){c.fillStyle='#344e37';c.fillRect(0,0,800,520);
 // Quiet ground detail, kept away from the approach to the gate.
 for(let i=0;i<100;i++){const x=(i*173+39)%800,y=(i*97+21)%520;if(x>305&&x<565)continue;c.fillStyle=i%3?'#43603d':'#3d5838';c.beginPath();c.ellipse(x,y,12+i%9,4+i%4,0,0,7);c.fill();}
 const path=()=>{c.beginPath();for(let i=0;i<=50;i++){const p=ground(.17+i*.018);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);}};
 c.lineCap='round';path();c.strokeStyle='#526445';c.lineWidth=96;c.stroke();path();c.strokeStyle='#89916a';c.lineWidth=78;c.stroke();path();c.strokeStyle='#969a74';c.lineWidth=60;c.stroke();
 for(let i=0;i<30;i++){const p=ground(.25+i*.025);c.fillStyle='#7e896349';c.beginPath();c.ellipse(p.x+(i%3-1)*19,p.y,3+i%3,2,0,0,7);c.fill();}
}
function frame(ms){const dt=Math.min((ms-last)/1000||0,.05);last=ms;if(!document.hidden&&!S.paused)update(dt);
 const v=view();cv.style.aspectRatio=v.w+'/'+MAP.h;const d=Math.min(devicePixelRatio||1,2),w=Math.round(cv.clientWidth*d),h=Math.round(w*MAP.h/v.w);if(w>0&&(cv.width!==w||cv.height!==h)){cv.width=w;cv.height=h;}c.setTransform(cv.width/v.w,0,0,cv.height/MAP.h,-v.left*cv.width/v.w,0);c.clearRect(0,0,MAP.w,MAP.h);drawGround();
 const p=ground(S.post);c.strokeStyle='#d5d6a166';c.lineWidth=1.5;c.setLineDash([4,5]);c.beginPath();c.ellipse(p.x,p.y,49,44,0,0,7);c.stroke();c.setLineDash([]);c.strokeStyle='#ece0a3';c.beginPath();c.ellipse(p.x,p.y,12,6,0,0,7);c.stroke();
 tower(c,400,160,96,S.level);bar(400,48,S.hp,towerHP[S.level],48);
 // Sort bodies by ground position so near figures overlap distant ones naturally.
 const actors=S.enemies.map((e,i)=>({u:e.x,draw(){const p=ground(e.x),x=p.x+(i%3-1)*11,y=p.y;c.fillStyle='#172e2940';c.beginPath();c.ellipse(x,y+3,12,5,0,0,7);c.fill();c.fillStyle='#9c9270';c.strokeStyle='#43543c';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y-8,10,12,0,0,7);c.fill();c.stroke();c.fillStyle='#d0c09a';c.beginPath();c.arc(x,y-19,6,0,7);c.fill();bar(x,y-31,e.hp,24,23);}}));
 if(S.hero&&S.hero.respawn<=0){const h=S.hero;actors.push({u:h.x,draw(){const p=ground(h.x);c.save();c.translate(p.x,p.y-5);c.scale(.72,.72);hero(c,0,0,h.flash>0);c.restore();bar(p.x,p.y-34,h.hp,45,27);}});}
 if(S.fence){actors.push({u:.42,draw(){const p=ground(.42);fence(c,p.x,p.y-18,108,S.fence,S.fhp);bar(p.x-72,p.y-17,S.fhp,fenceHP[S.fence],30);}});}
 actors.sort((a,b)=>a.u-b.u).forEach(a=>a.draw());

 repair.disabled=!S.fence||S.fhp>=fenceHP[S.fence]||S.hp<=0;repair.textContent=`Ремонт частокола · ${S.fence===2?50:30}`;$('#wave').disabled=S.spawn>0||S.enemies.length>0||S.hp<=0;
 if(ms-tick>250){tick=ms;const h=S.hero;const text=`Башня: ${Math.ceil(S.hp)}/${towerHP[S.level]} · Частокол: ${S.fence?Math.ceil(S.fhp)+'/'+fenceHP[S.fence]:'нет'} · Чемпион: ${!h?'не призван':h.respawn>0?'возвращение через '+Math.ceil(h.respawn)+' с':h.hp+'/45'} · Побеждено: ${S.kills}${S.hp<=0?' · Замок пал — сбросьте сцену.':''}`;if(text!==stamp){$('#status').textContent=text;stamp=text;}}
 requestAnimationFrame(frame);}
requestAnimationFrame(frame);
})();
