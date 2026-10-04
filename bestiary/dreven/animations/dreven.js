/* Dreven: six weight-bearing roots; +x forward. Combat owns the contact timer. */
(function(root){
'use strict';
const TAU=Math.PI*2,ATTACK_DURATION=1.2,CONTACT=.6;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){
 const phase=(o.distance||0)/.85+(o.seed||0)/TAU,a=clamp(o.attack||0),active=o.state==='attack';
 const reach=active?(a<CONTACT?ease((a-.32)/.28):1-ease((a-CONTACT)/.4)):0;
 const brace=active?(a<.32?ease(a/.32):1-ease((a-.7)/.3)):0;
 const roots=Array.from({length:6},(_,i)=>{const u=((phase+i/6)%1+1)%1;return o.state==='walk'?{step:u<1/6?-.09+.18*ease(u*6):.09-.18*(u-1/6)*1.2,lift:0}:{step:0,lift:0}});
 return {roots,reach,brace,roll:o.state==='walk'?Math.sin(phase*TAU)*.018:0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.2):0};
}
function oval(c,x,y,rx,ry,color,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=color;c.fill()}
function draw(c,o={}){
 const r=(o.size||100)/3,p=pose(o),t=o.time||0,h=o.viewHeading??o.heading??0;
 const sh=Math.sin(h),ch=Math.cos(h),zTop=1.28-p.brace*.08;
 // Near-orthographic overhead view: height adds only a shallow rim shadow.
 const project=(x,y,z=0)=>[(x*ch-y*sh),(x*sh+y*ch)-z*.12];
 const path=(points,color,stroke)=>{c.beginPath();points.forEach((q,i)=>{const v=project(...q);i?c.lineTo(...v):c.moveTo(...v)});c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.018;c.stroke()}};
 const dot=(x,y,z,rx,ry,col)=>{const v=project(x,y,z);oval(c,v[0],v[1],rx,ry,col)};
 c.save();c.translate(o.x||0,o.y||0);if(o.viewHeading!==undefined)c.rotate(-h);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
 if(o.shadow!==false)oval(c,0,.1,1.24,1.10,'#14211855');
 const target=o.target||{x:r*2.1,y:0};
 // Endpoint correction: target is measured in the game's uncompressed ground plane.
 const tx=target.x/r,ty=target.y/r,wy=tx*sh+ty*ch,wx=tx*ch-ty*sh;
 const targetRoot={x:wx*ch+wy*sh,y:-wx*sh+wy*ch};
 // Uneven buttress roots spread and taper across the ground, without knees or feet.
 const layout=[[.22,1.31,.30,.19],[1.23,1.05,.38,-.16],[2.51,1.36,.26,.18],[3.44,1.12,.36,-.22],[4.28,1.25,.31,.19],[5.69,1.18,.40,-.18]];
 const roots=layout.map(([a,len,width,curve],i)=>{const q=p.roots[i],front=i===0||i===5;
 let x=Math.cos(a)*len+q.step,y=Math.sin(a)*len;
 if(front){x+=(targetRoot.x-x)*p.reach;y+=(targetRoot.y-y)*p.reach;}
 return {i,a,x,y,q,width,curve,front,depth:Math.sin(a+h)};});
 function rootLeg(k){const {a,x,y,width,curve,front}=k;
  const base={x:Math.cos(a)*.48,y:Math.sin(a)*.48},nx=-Math.sin(a),ny=Math.cos(a);
  function ribbon(start,end,w,bend){
   const dx=end.x-start.x,dy=end.y-start.y,l=Math.hypot(dx,dy)||1,px=-dy/l,py=dx/l;
   const points=Array.from({length:13},(_,i)=>{const u=i/12,bulge=Math.sin(u*Math.PI)*bend;
    return {x:start.x+dx*u+px*bulge,y:start.y+dy*u+py*bulge,w:w*Math.pow(1-u,1.45)*(1+.10*Math.sin(u*17))};});
   path([...points.map(q=>[q.x+px*q.w,q.y+py*q.w,.06]),...points.slice().reverse().map(q=>[q.x-px*q.w,q.y-py*q.w,.06])],'#765338','#453323');
   // Long wood fibres continue from trunk to the tapered tips.
   for(const [offset,col,line] of [[-.32,'#b28a54',.032],[.28,'#392d2399',.023],[0,'#d1a56866',.016]]){c.beginPath();points.forEach((q,i)=>{const v=project(q.x+px*q.w*offset,q.y+py*q.w*offset,.07);i?c.lineTo(...v):c.moveTo(...v)});c.strokeStyle=col;c.lineWidth=line;c.stroke()}
  }
  const end={x,y};
  // Forks are shorter than the parent, irregular and flattened against the soil.
  const fork={x:base.x+(x-base.x)*.53,y:base.y+(y-base.y)*.53};
  const spread=front?1-p.reach:1;
  if(spread>.08){ribbon(fork,{x:x*.91+nx*.24*spread,y:y*.91+ny*.24*spread},width*.36,-curve*.8);
   if(k.i%2===0)ribbon({x:(fork.x+x)*.5,y:(fork.y+y)*.5},{x:x*.96-nx*.18*spread,y:y*.96-ny*.18*spread},width*.18,curve*.35);}
  ribbon(base,end,width,curve*(1-(front?p.reach:0)));
 }
 roots.slice().sort((a,b)=>a.depth-b.depth).forEach(rootLeg);
 // Solid trunk: uneven vertical bark slabs surround a raised cut surface.
 const N=20,ring=Array.from({length:N},(_,i)=>{const a=i*TAU/N;return {a,rad:.76+.055*Math.sin(i*2.6),z:zTop+.07*Math.sin(i*3.1)}});
 for(let i=0;i<N;i++){const a=ring[i],b=ring[(i+1)%N];if(Math.sin((a.a+Math.PI/N)+h)<0)continue;
  const shade=Math.sin(a.a+h-.5),color=shade>.7?'#9b7850':shade>.1?'#785b3c':'#513e2d';
  path([[Math.cos(a.a)*a.rad,Math.sin(a.a)*a.rad,a.z],[Math.cos(b.a)*b.rad,Math.sin(b.a)*b.rad,b.z],[Math.cos(b.a)*.82,Math.sin(b.a)*.82,.24],[Math.cos(a.a)*.82,Math.sin(a.a)*.82,.18]],color,'#3e3024');
  for(let j=0;j<2;j++){const ang=a.a+.07+j*.1,v1=project(Math.cos(ang)*.80,Math.sin(ang)*.80,.35),v2=project(Math.cos(ang)*a.rad,Math.sin(ang)*a.rad,a.z-.08);c.beginPath();c.moveTo(...v1);c.lineTo((v1[0]+v2[0])/2+.025,(v1[1]+v2[1])/2);c.lineTo(...v2);c.strokeStyle=j?'#b08c5955':'#31271f99';c.lineWidth=j?.022:.035;c.stroke()}
 }
 const top=ring.map(k=>[Math.cos(k.a)*k.rad,Math.sin(k.a)*k.rad,k.z]);
 const wood=c.createLinearGradient(-.7,-1.8,.7,-.7);wood.addColorStop(0,'#d4b487');wood.addColorStop(.55,'#b48b5c');wood.addColorStop(1,'#8b633e');path(top,wood,'#59412b');
 // Off-centre, weathered growth rings: broad grain instead of a concentric target.
 for(let j=1;j<=9;j++){const pts=Array.from({length:81},(_,i)=>{const a=i*TAU/80,rad=j*.073*(1+.055*Math.sin(a*3+.5)+.022*Math.sin(a*8+j*.15));return project(-.075+Math.cos(a)*rad, .035+Math.sin(a)*rad*.93,zTop+.006)});c.beginPath();pts.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=j%3?'#67472a80':'#e1bd8477';c.lineWidth=j%3?.012:.020;c.stroke()}
 // Split grain and forked drying cracks, fixed to the wood as it turns.
 for(const [a,len] of [[.83,.28],[1.92,.39],[2.86,.27],[3.7,.42],[4.78,.31],[5.58,.22]]){
  const ca=Math.cos(a),sa=Math.sin(a),px=-sa,py=ca;
  const edge={x:ca*.73,y:sa*.73},mid={x:ca*(.73-len*.55)+px*.027,y:sa*(.73-len*.55)+py*.027},tip={x:ca*(.73-len),y:sa*(.73-len)};
  path([[edge.x+px*.022,edge.y+py*.022,zTop+.01],[mid.x+px*.010,mid.y+py*.010,zTop+.01],[tip.x,tip.y,zTop+.01],[mid.x-px*.014,mid.y-py*.014,zTop+.01],[edge.x-px*.009,edge.y-py*.009,zTop+.01]],'#493322bb');
  path([[mid.x,mid.y,zTop+.012],[mid.x+px*.08-ca*.06,mid.y+py*.08-sa*.06,zTop+.012],[mid.x+px*.013,mid.y+py*.013,zTop+.012]],'#5b3c27aa');
 }
 // Asymmetric broken bark plates, with bright torn wood on their inner edges.
 for(const [a,width,height] of [[.55,.22,.13],[1.28,.36,.23],[2.08,.20,.12],[2.65,.38,.28],[3.45,.28,.19],[4.03,.22,.12],[4.67,.35,.24],[5.38,.22,.17]]){
  const b=a+width,pt=(angle,rad,z)=>[Math.cos(angle)*rad,Math.sin(angle)*rad,z];
  path([pt(a,.68,zTop),pt(a-.03,.79,zTop+height),pt(a+width*.38,.84,zTop+height*.8),pt(b,.78,zTop+height*1.1),pt(b+.025,.67,zTop)],'#63472f','#3d3024');
  path([pt(a,.68,zTop),pt(a+width*.33,.73,zTop+height*.65),pt(b,.69,zTop+height*.35),pt(b+.025,.67,zTop)],'#b18b58');
 }
 // Broken front notch opens into the hollow, readable from above in every direction.
 const hollow=[[.86,-.25,zTop],[.61,-.28,zTop],[.39,-.17,zTop],[.34,.02,zTop],[.47,.21,zTop],[.73,.25,zTop],[.91,.12,zTop]];
 path(hollow,'#38281c','#b18a55');
 path([[.84,-.16,zTop],[.59,-.19,zTop],[.44,-.08,zTop],[.46,.09,zTop],[.66,.17,zTop],[.87,.09,zTop]],'#191b12');
 const e=project(.63,0,zTop+.01),glow=c.createRadialGradient(e[0],e[1],0,e[0],e[1],.24);
 glow.addColorStop(0,'#ffe5a3');glow.addColorStop(.25,'#ec8e29bb');glow.addColorStop(1,'#d66e1500');oval(c,e[0],e[1],.23,.21,glow);
 dot(.64,0,zTop+.02,.051,.047,'#ffd383');
 for(const a of [-.47,.47]){const v1=project(Math.cos(a)*.70,Math.sin(a)*.70,zTop+.02),v2=project(Math.cos(a)*.83,Math.sin(a)*.83,zTop+.02);c.beginPath();c.moveTo(...v1);c.lineTo(...v2);c.strokeStyle='#ffbe60';c.lineWidth=.035;c.stroke()}
 // Uneven moss cushions overlap the broken rim, as in the concept sheet.
 for(const [a,size] of [[1.20,.16],[2.7,.20],[3.9,.11],[4.8,.18],[5.4,.09]]){
  const cx=Math.cos(a)*.73,cy=Math.sin(a)*.73;
  dot(cx,cy,zTop+.03,size*1.15,size*.82,'#35482b');
  for(let i=0;i<13;i++){const ang=i*2.399,rr=size*(.17+(i%4)*.20),x=cx+Math.cos(ang)*rr,y=cy+Math.sin(ang)*rr;
   dot(x,y,zTop+.10,size*(.28+(i%3)*.06),size*.27,['#536838','#718347','#919d58'][i%3]);}
 }

 for(let i=0;i<3;i++)dot(-.63,.42,.57+i*.16,.10-i*.013,.045,'#c6a378');
 if(o.burning>0){for(let i=0;i<6;i++){const a=i*2.399,v=project(Math.cos(a)*.81,Math.sin(a)*.81,.5+.1*Math.sin(t*8+i));oval(c,v[0],v[1],.04,.08,'#ffae4fcc');}}
 if(p.impact>0){c.globalAlpha*=p.impact;c.strokeStyle='#d9bb78';c.lineWidth=.03;const v=project(targetRoot.x,targetRoot.y);c.beginPath();c.ellipse(v[0],v[1],.15+(1-p.impact)*.4,.09+(1-p.impact)*.2,0,0,TAU);c.stroke()}
 c.restore();
}
root.Dreven={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
