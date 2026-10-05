/* Drawing layer for the independent diorama fork. No combat or save writes.
   All feet, plinths, selection rings and clicks use DioramaGeometry.
   The atlas contains actual upright views; a sprite is never rotated to turn. */
const Diorama = (() => {
  'use strict';
  const Q=DioramaGeometry, TAU=Math.PI*2;
  const atlas=new Image(), frames=[];
  let ready=false, tour=false, tourTime=0, tourLast=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  atlas.onload=()=>{
    // Trim transparent margins per cell, leaving the original atlas intact.
    const a=document.createElement('canvas');a.width=atlas.width;a.height=atlas.height;
    const c=a.getContext('2d',{willReadFrequently:true});c.drawImage(atlas,0,0);
    const data=c.getImageData(0,0,a.width,a.height).data,w=a.width/4,h=a.height/2;
    for(let i=0;i<8;i++){
      const ox=Math.round(i%4*w),oy=Math.round(Math.floor(i/4)*h);
      const cw=Math.round((i%4+1)*w)-ox,ch=Math.round((Math.floor(i/4)+1)*h)-oy;
      let x0=cw,y0=ch,x1=0,y1=0;
      for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[((oy+y)*a.width+ox+x)*4+3]>30){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
      frames.push({x:ox+x0,y:oy+y0,w:x1-x0+1,h:y1-y0+1});
    }
    ready=frames.every(f=>f.w>0&&f.h>0);
  };
  atlas.onerror=()=>{document.querySelector('#buildTipResult').textContent='Ракурсы не загрузились — используется запасной рисунок';};
  atlas.src='bestiary/ugolek/art/diorama-v01/atlas.png';
  // Explicit atlas regions: the castle flag crosses the nominal row boundary.
  // Regions include the complete flag and exclude it from the frost sprite.
  const buildings=new Image(),buildingFrames=[
    {x:205,y:125,w:440,h:342},{x:910,y:44,w:408,h:424},
    {x:208,y:533,w:433,h:425},{x:874,y:499,w:508,h:461}
  ];
  let buildingsReady=false;
  buildings.onload=()=>{
    buildingsReady=buildings.width===1536&&buildings.height===1024;
  };
  buildings.src='diorama-art/buildings-v01.png';
  const firstMap=new Image(),cannonViews=new Image();
  let firstMapReady=false,cannonReady=false;
  firstMap.onload=()=>{firstMapReady=true;terrain=null;};
  firstMap.src=DioramaMaps.firstTrail.image;
  cannonViews.onload=()=>{cannonReady=true;};
  cannonViews.src='diorama-art/v02/cannon-turns.png';
  // Per-view breech pivots keep the weapon on its fixed mounting while it turns.
  // The generated atlas has a common scale, but different transparent margins.
  const cannonPivots=[[166,295],[172,269],[214,273],[228,279],[293,274],[279,269],[215,314],[136,287]];
  function cannonTop(c,x,y,aim,recoil=0){
    const i=Q.direction(aim),w=cannonViews.width/4,h=cannonViews.height/2;
    const dw=CELL*1.35,dh=CELL*.94;
    const pivot=cannonPivots[i];
    const rx=-Math.cos(aim)*recoil*CELL*.05,ry=-Math.sin(aim)*recoil*CELL*.05*Q.depth;
    c.drawImage(cannonViews,i%4*w,Math.floor(i/4)*h,w,h,
      px(x)-dw*pivot[0]/384+rx,py(y)-CELL*.49-dh*pivot[1]/512+ry,dw,dh);
    const tip=Q.muzzle(x,y,aim,'gun',1);return P(tip.x,tip.y,tip.z);
  }
  function building(c,index,x,y,height){const f=buildingFrames[index],h=height*CELL,w=h*f.w/f.h;c.drawImage(buildings,f.x,f.y,f.w,f.h,px(x)-w/2,py(y)+CELL*.1-h,w,h);}
  function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.001,rx),Math.max(.001,ry),0,0,TAU);c.fill();}
  function path(c,points,color){c.fillStyle=color;poly(c,points);c.fill();}
  function line(c,pts,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  function light(c,x,y,r,a,b,d){const g=c.createRadialGradient(x-r*.32,y-r*.45,r*.03,x,y,r);g.addColorStop(0,a);g.addColorStop(.55,b);g.addColorStop(1,d);return g;}
  function P(x,y,z=0){const p=Q.project(x,y,z,CELL);return [p.x,p.y];}
  function shadow(c,x,y,r=.4,h=.7){
    // Upper-left daylight: a soft cast shadow to the lower right, with a
    // denser contact patch fixed to the ground (never bobbing with the sprite).
    softShadow(c,px(x)+CELL*h*.28,py(y)+CELL*h*.20,CELL*(r+h*.24),CELL*(r*.46+h*.12),.34);
    softShadow(c,px(x),py(y)+CELL*.045,CELL*r*1.12,CELL*r*.48,.68);
  }
  function ring(c,x,y,r,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(px(x),py(y),r*CELL,r*CELL*Q.depth,0,0,TAU);c.stroke();}
  // A low eight-sided stone solid with consistent top and side faces.
  function plinth(c,x,y,r=.37,h=.18,base=0){
    const top=[],bottom=[];
    for(let i=0;i<8;i++){const a=(i+.5)*TAU/8;top.push(P(x+Math.cos(a)*r,y+Math.sin(a)*r,base+h));bottom.push(P(x+Math.cos(a)*r,y+Math.sin(a)*r,base));}
    for(let i=0;i<8;i++){const j=(i+1)%8;if((bottom[i][1]+bottom[j][1])/2>=py(y)-.01)path(c,[bottom[i],bottom[j],top[j],top[i]],i<3?'#7a8065':'#5b6954');}
    path(c,top,'#bbb99a');line(c,[...top,top[0]],'#dbd4ac',CELL*.022);
    for(let i=0;i<3;i++){const xx=x+(i-1)*r*.6;line(c,[P(xx,y+r*.87,base+.025),P(xx,y+r*.87,base+h*.75)],'#515e4980',CELL*.017);}
    oval(c,px(x)-r*CELL*.4,py(y)-h*CELL,r*CELL*.24,r*CELL*.10,'#75804b');
  }
  function prism(c,x,y,w,d,h,z=0){
    const a=P(x-w/2,y-d/2,z+h),b=P(x+w/2,y-d/2,z+h),e=P(x+w/2,y+d/2,z+h),f=P(x-w/2,y+d/2,z+h);
    path(c,[a,b,e,f],'#d1ccac');path(c,[b,e,P(x+w/2,y+d/2,z),P(x+w/2,y-d/2,z)],'#6f7963');
    path(c,[f,e,P(x+w/2,y+d/2,z),P(x-w/2,y+d/2,z)],'#a5ac8b');
    line(c,[a,b,e,f,a],'#e9dfb744',CELL*.015);
  }
  // Cylinder swept along a 3D axis. Its rim foreshortens when aimed away.
  function barrel(c,x,y,a,lvl,mortar=false,recoil=0){
    const end=Q.muzzle(x,y,a,mortar?'mortar':'gun',lvl),z=.49;
    const base={x:x-Math.cos(a)*recoil*.06,y:y-Math.sin(a)*recoil*.06,z:mortar?.39:z};
    end.x-=Math.cos(a)*recoil*.06;end.y-=Math.sin(a)*recoil*.06;
    const az=mortar?.78:0,r=mortar?.16:.105+(lvl-1)*.006;
    const ux=-Math.sin(a),uy=Math.cos(a),vx=-Math.cos(a)*Math.sin(az),vy=-Math.sin(a)*Math.sin(az),vz=Math.cos(az);
    const back=[],front=[];
    for(let i=0;i<16;i++){const t=i*TAU/16,dx=r*(ux*Math.cos(t)+vx*Math.sin(t)),dy=r*(uy*Math.cos(t)+vy*Math.sin(t)),dz=r*vz*Math.sin(t);back.push(P(base.x+dx,base.y+dy,base.z+dz));front.push(P(end.x+dx,end.y+dy,end.z+dz));}
    const sides=back.map((p,i)=>({i,y:(p[1]+front[i][1])/2})).sort((a,b)=>a.y-b.y);
    for(const {i} of sides){const j=(i+1)%16;path(c,[back[i],back[j],front[j],front[i]],['#d4ae65','#b48b49','#876335','#654929'][Math.min(3,Math.floor(i/4))]);}
    if(Math.sin(a)>-.6||mortar){path(c,front,'#ddbc79');const center=P(end.x,end.y,end.z);path(c,front.map(p=>[center[0]+(p[0]-center[0])*.72,center[1]+(p[1]-center[1])*.72]),'#252e25');}
    line(c,[back[11],front[11]],'#f7dfa777',CELL*.025);
    return P(end.x,end.y,end.z);
  }
  function tower(c,t,time){
    const x=t.x+.5,y=t.y+.5,s=CELL,a=t.aim??-.6;
    if(buildingsReady){
      building(c,t.type==='frost'?1:t.type==='tesla'?2:0,x,y,t.type==='gun'||t.type==='mortar'?.78:1.12);
      if(t.type==='gun'||t.type==='mortar'){
        const tip=t.type==='gun'&&cannonReady?cannonTop(c,x,y,a,t.recoil||0):barrel(c,x,y,a,t.lvl,t.type==='mortar',t.recoil||0);
        if(t.flash>0){const g=c.createRadialGradient(...tip,0,...tip,s*.25);g.addColorStop(0,'#fff4c8');g.addColorStop(.3,'#ffca6299');g.addColorStop(1,'#ffad3300');oval(c,...tip,s*.25,s*.22,g);}
      }else if(t.type==='tesla'){
        const yy=py(y)-s*.83;line(c,[[px(x-.20),yy],[px(x-.06),yy-s*.045*Math.sin(time*17)],[px(x+.07),yy+s*.035],[px(x+.20),yy]],'#d4f1ff',s*.02);
      }
      for(let i=0;i<t.lvl;i++)oval(c,px(x)+(i-(t.lvl-1)/2)*s*.068,py(y)+s*.07,s*.022,s*.018,t.lvl===5?'#fff0a7':'#ebcd83');
      if(t.lvl>=3)ring(c,x,y,.38,t.lvl===5?'#edd38a99':'#b0c29d88',s*.02);
      return;
    }
    plinth(c,x,y,.37,.20);
    if(t.type==='gun'||t.type==='mortar'){
      oval(c,px(x),py(y)-s*.24,s*.25,s*.11,'#545b43');
      oval(c,px(x),py(y)-s*.36,s*.23,s*.20,light(c,px(x),py(y)-s*.36,s*.25,'#e2c589','#a4884c','#55482e'));
      const tip=barrel(c,x,y,a,t.lvl,t.type==='mortar',t.recoil||0);
      if(t.lvl>=3){oval(c,px(x)-s*.13,py(y)-s*.31,s*.055,s*.055,'#e8ce87');oval(c,px(x)+s*.13,py(y)-s*.31,s*.055,s*.055,'#b49a61');}
      if(t.flash>0){const g=c.createRadialGradient(...tip,0,...tip,s*.28);g.addColorStop(0,'#fff6c8');g.addColorStop(.3,'#ffd36a99');g.addColorStop(1,'#ffad3300');oval(c,...tip,s*.28,s*.24,g);}
    }else if(t.type==='frost'){
      const shards=t.lvl>=3?[-.18,0,.18]:[0];
      for(const dx of shards){const h=dx===0?.72:.42,X=px(x+dx),Y=py(y)-s*.22,w=s*(dx===0?.14:.085);path(c,[[X,Y-h*s],[X-w,Y-h*s*.32],[X,Y]],'#c7f3d8');path(c,[[X,Y-h*s],[X+w,Y-h*s*.30],[X,Y]],'#58b9a1');path(c,[[X-w,Y-h*s*.32],[X,Y-h*s*.45],[X+w,Y-h*s*.30],[X,Y]],'#8cdec3');}
      const g=c.createRadialGradient(px(x),py(y)-s*.48,0,px(x),py(y)-s*.48,s*.40);g.addColorStop(0,'#a8ffda33');g.addColorStop(1,'#a8ffda00');oval(c,px(x),py(y)-s*.48,s*.4,s*.4,g);
    }else{
      for(const dx of [-.19,.19]){prism(c,x+dx,y,.10,.12,.39,.2);oval(c,px(x+dx),py(y)-s*.62,s*.105,s*.085,light(c,px(x+dx),py(y)-s*.62,s*.11,'#f4e7b3','#c3a265','#7a6346'));for(let n=0;n<3;n++)oval(c,px(x+dx),py(y)-s*(.33+n*.08),s*.085,s*.028,'#86b6b9');}
      const yy=py(y)-s*.6;line(c,[[px(x-.19),yy],[px(x-.07),yy-s*.06*Math.sin(time*17)],[px(x+.04),yy+s*.05],[px(x+.19),yy]],'#d4efff',s*.023);
    }
    for(let i=0;i<t.lvl;i++)oval(c,px(x)+(i-(t.lvl-1)/2)*s*.075,py(y)-s*.015,s*.025,s*.023,t.lvl===5?'#ffe3a0':'#ddbd70');
  }
  function palisade(c,frame){
    const {b,h}=frame, rank=Math.min(G.castle.lvl,4)-1, hp=G.castle.palisade||0;
    const ratio=clamp(hp/castleStats().palisadeHp,0,1), count=6+rank;
    const point=(side,z,depth=0)=>P(b.x-Math.sin(h)*side+Math.cos(h)*depth,b.y+Math.cos(h)*side+Math.sin(h)*depth,z);
    const posts=Array.from({length:count},(_,i)=>({i,side:-.44+.88*i/(count-1)})).sort((a,b)=>point(a.side,0)[1]-point(b.side,0)[1]);
    for(const {i,side} of posts){
      const end=i===0||i===count-1,w=end?.067:.052;
      const broken=ratio<.5&&(i===2||i===count-3),height=hp?(.44+rank*.025+(end?.06:0))*(broken?.48:1):.065;
      path(c,[point(side-w,0),point(side-w,height-.075),point(side,height),point(side+w,height-.06),point(side+w,0)],i%2?'#967044':'#a57e4d');
      path(c,[point(side,height),point(side+w,height-.06),point(side+w,0),point(side+.022,0)],'#63482d');
      path(c,[point(side-w,height-.075),point(side,height),point(side+w,height-.06),point(side+.01,height-.10)],'#d4ba86');
      if(end&&hp)for(const z of [.16,.30])line(c,[point(side-w,z,-.01),point(side+w,z,-.01)],rank===3?'#505d53':'#c0a374',CELL*.025);
    }
    if(hp)for(const z of rank===1?[.15]:[.14,.29]){
      for(const [a,b] of ratio<.5?[[-.5,-.1],[.1,.5]]:[[-.5,.5]]){
        line(c,[point(a,z,-.025),point(b,z,-.025)],'#57412b',CELL*.065);
        line(c,[point(a,z+.028,-.03),point(b,z+.028,-.03)],'#b79a65',CELL*.015);
      }
    }
    if(!hp||ratio<.5)for(let i=0;i<(!hp?4:2);i++){
      const side=-.25+i*.16;
      line(c,[point(side-.10,.035,.09),point(side+.10,.035,i%2?.24:-.03)],'#8d6b44',CELL*.065);
    }
    const x=px(b.x),y=py(b.y)-CELL*.76,w=CELL*.84;
    c.fillStyle='#172c22';rr(c,x-w/2-CELL*.035,y-CELL*.03,w+CELL*.07,CELL*.24,CELL*.04);c.fill();
    c.fillStyle='#45503a';c.fillRect(x-w/2,y,w,CELL*.055);
    c.fillStyle=ratio>.5?'#b8cb77':'#e4a367';c.fillRect(x-w/2,y,w*ratio,CELL*.055);
    c.font='600 '+Math.max(8,CELL*.16)+'px system-ui';c.fillStyle='#f2e7cd';c.textAlign='center';c.fillText(hp+'/'+castleStats().palisadeHp,x,y+CELL*.18);c.textAlign='start';
  }
  function castle(c,x,y,time){
    if(buildingsReady){
      building(c,3,x,y,1.52);

      for(let i=0;i<G.castle.lvl;i++)oval(c,px(x)+(i-(G.castle.lvl-1)/2)*CELL*.07,py(y)+CELL*.07,CELL*.024,CELL*.019,'#f1d592');
      if(G.lives<castleStats().hp*.6)line(c,[P(x-.23,y+.03,.55),P(x-.12,y+.03,.32),P(x-.24,y+.03,.15)],'#4a5547',CELL*.025);
      return;
    }
    const s=CELL;plinth(c,x,y,.53,.12);
    prism(c,x,y,.82,.50,.48,.10);
    for(let i=-1;i<=1;i++)prism(c,x+i*.27,y+.20,.13,.13,.14,.58);
    const X=px(x),Y=py(y+.26);c.fillStyle='#364b3b';rr(c,X-s*.115,Y-s*.37,s*.23,s*.35,s*.10);c.fill();
    line(c,[[X-s*.06,Y-s*.3],[X-s*.06,Y-s*.05]],'#c6b77e66',s*.02);
    for(const dx of [-.40,.40]){
      prism(c,x+dx,y,.24,.32,.72,.08);
      path(c,[P(x+dx-.18,y-.18,.78),P(x+dx+.18,y-.18,.78),P(x+dx+.18,y+.18,.78),P(x+dx-.18,y+.18,.78)],'#3a5352');
      path(c,[P(x+dx-.18,y+.18,.78),P(x+dx,y,1.14),P(x+dx+.18,y+.18,.78)],'#637d78');
      path(c,[P(x+dx,y,1.14),P(x+dx+.18,y-.18,.78),P(x+dx+.18,y+.18,.78)],'#314e4b');
      oval(c,px(x+dx),py(y+.17)-s*.50,s*.035,s*.055,'#f8d98a');
    }
    const pole=P(x+.40,y,1.14);line(c,[pole,[pole[0],pole[1]-s*.24]],'#d2c592',s*.018);
    path(c,[[pole[0],pole[1]-s*.24],[pole[0]+s*.20,pole[1]-s*(.21+.025*Math.sin(time*4))],[pole[0],pole[1]-s*.12]],'#d9ac55');
    if(G.castle.lvl>=2){line(c,[P(x-.29,y+.26,.36),P(x+.29,y+.26,.36)],'#e7d6a2',s*.045);}
    if(G.castle.lvl>=3){path(c,[P(x,y+.27,.55),P(x+.1,y+.27,.46),P(x,y+.27,.31),P(x-.1,y+.27,.46)],'#8bcec2');}

    if(G.lives<castleStats().hp*.6)line(c,[P(x-.2,y+.26,.53),P(x-.12,y+.26,.32),P(x-.24,y+.26,.15)],'#4a5547',s*.025);
  }
  function eyes(c,x,y,r,heading,time){
    const front=Math.sin(heading),side=Math.cos(heading);
    if(front<-.65)return;
    const count=Math.abs(side)>.88?1:2;
    for(let i=0;i<count;i++){
      const xx=x+side*r*.28+(count===2?(i-.5)*r*.65:side*r*.3),ry=((time%5.7)>5.55)?.035:.16;
      oval(c,xx,y,r*.14,r*ry,'#fff1c9');if(ry>.05){oval(c,xx+side*r*.025,y+r*.015,r*.069,r*.115,'#292a21');oval(c,xx-r*.025,y-r*.055,r*.026,r*.035,'#fff');}
    }
  }
  function fallback(c,x,y,h,heading,f,time){
    const r=h*.36,color=FOES[f.type]?.color||'#808b63',type=f.type;
    const step=Math.sin(f.d*9+f.ph),wide=['tank','golem','boss'].includes(type)?1.3:1;
    if(['ghost','shade'].includes(type))c.globalAlpha*=.64;
    for(const side of [-1,1])oval(c,x+side*r*.55,y+side*step*r*.09,r*.31,r*.16,'#384638');
    const body=light(c,x,y-r,r*1.45,'#c7d2aa',color,'#344635');
    oval(c,x,y-r,r*wide,r*1.15,body);
    if(type==='tank'||type==='golem'||type==='boss'){
      for(let j=0;j<5;j++){const a=j*.8;oval(c,x+Math.cos(a)*r*.7,y-r*1.72+Math.sin(a)*r*.2,r*.32,r*.18,j%2?'#607b43':'#91a965');}
      line(c,[[x-r*.65,y-r*1.3],[x-r*.2,y-r*.8],[x-r*.4,y-r*.4]],'#4b5d4455',h*.025);
    }
    if(['runner','spore','seedmother','acorn'].includes(type)){
      path(c,[[x,y-r*1.8],[x-r*.8,y-r*2.6],[x+r*.06,y-r*2.3]],'#b2cc73');path(c,[[x,y-r*1.8],[x+r*.8,y-r*2.6],[x+r*.06,y-r*2.3]],'#638b4b');
    }
    if(type==='dew'||type==='ghost')oval(c,x-r*.40,y-r*1.5,r*.14,r*.35,'#edfff799');
    if(type==='puffball'||type==='spore'){oval(c,x,y-r*1.55,r*1.2,r*.65,'#d5cfab');for(let j=-1;j<=1;j++)oval(c,x+j*r*.6,y-r*1.8,r*.12,r*.10,'#ede8d2');}
    if(type==='straw')for(let j=-2;j<=2;j++)line(c,[[x+j*r*.2,y-r*1.9],[x+j*r*.3,y-r*.3]],'#eed490',h*.025);
    eyes(c,x,y-r*.9,r,heading,time);
    if(type==='lantern'||type==='grunt'){
      const ex=x+Math.cos(heading)*r*.65,ey=y-r*.35;oval(c,ex,ey,r*.37,r*.40,light(c,ex,ey,r*.42,'#fff9bb','#ffae3d','#bc6927'));for(const side of [-1,1])oval(c,ex+side*r*.34,ey+r*.16,r*.22,r*.19,'#585446');
    }
    if(type==='boss'){for(const side of [-1,1])line(c,[[x+side*r*.55,y-r*1.8],[x+side*r*.9,y-r*2.5],[x+side*r*.6,y-r*2.8]],'#daceac',h*.06);}
  }
  function creature(c,x,y,f,heading,time,height){
    const moving=!f.siege,step=moving&&!reduced&&f.type!=='runner'?Math.sin(f.d*TAU/.68+f.ph):0;
    const bob=reduced||f.type==='runner'?0:moving?Math.abs(step)*height*.025:Math.sin(time*2+f.ph)*height*.008;
    const attack=f.siege?(f.type==='runner'?Vihrek:Ugolek).attackProgress(f.atk||0,f.attackAfter||0):null;
    const thrust=attack===null||f.type==='runner'?0:Math.max(0,1-Math.abs(attack-.46)/.18);
    const dx=Math.cos(heading)*thrust*height*.06,dy=Math.sin(heading)*thrust*height*.035;
    c.save();c.translate(x+dx,y-bob+dy);c.scale(1+Math.abs(step)*.018,1-Math.abs(step)*.022);
    if(f.hidden)c.globalAlpha=.25;
    if(f.type==='runner'){
      Vihrek.drawDiorama(c,{height,time:reduced?0:time,distance:reduced?0:f.d,seed:f.ph,heading,state:moving?'walk':attack===null?'idle':'attack',attack});
    }else if(f.type==='grunt'&&ready){
      const frame=frames[Q.direction(heading)],w=height*frame.w/frame.h;
      if(moving&&!reduced){
        // Separate the feet at the transparent bottom of the atlas cell. The
        // overlapping body hides the join; each foot follows travelled distance.
        const cut=Math.floor(frame.h*.88),leg=frame.h-cut;
        for(let i=0;i<2;i++){
          const sign=i?1:-1,half=frame.w/2;
          c.drawImage(atlas,frame.x+i*half,frame.y+cut,half,leg,
            -w/2+i*w/2+step*sign*height*.018,-height*(leg/frame.h)-Math.max(0,step*sign)*height*.030,w/2,height*leg/frame.h);
        }
        const bodyH=Math.ceil(frame.h*.91);
        c.drawImage(atlas,frame.x,frame.y,frame.w,bodyH,-w/2,-height,w,height*bodyH/frame.h);
      }else c.drawImage(atlas,frame.x,frame.y,frame.w,frame.h,-w/2,-height,w,height);
    }else fallback(c,0,0,height,heading,f,time);
    c.restore();
    if(f.type==='runner'&&attack!==null){
      const gate=siegeFrame(f).b;Vihrek.drawGust(c,{progress:attack,from:{x,y:y-height*.2},to:{x:px(gate.x),y:py(gate.y)-height*.3},size:height*.3,seed:f.ph});
    }
    if(f.type==='grunt'&&attack!==null){
      const gate=siegeFrame(f).b;
      Ugolek.drawShot(c,{progress:attack,from:{x:x+Math.cos(heading)*height*.24,y:y-height*.32},
        to:{x:px(gate.x),y:py(gate.y)-height*.30},size:height*.055});
    }
    if(f.hit>0){oval(c,x,y-height*.48,height*.24,height*.35,'#fff6d633');}
  }
  function height(f){return CELL*Math.max(.55,Math.min(1.20,f.r*2.75));}
  function headingFor(path,d){const a=atDist(path,Math.max(0,d-.14)),b=atDist(path,Math.min(path.len,d+.14));return Math.atan2(b.y-a.y,b.x-a.x);}
  function foe(c,f,time){
    const p=foePos(f),h=height(f);
    if(f.under){oval(c,px(p.x),py(p.y),h*.32,h*.12,'#756e47');return;}
    if(f.type==='dew'||f.type==='drummer')ring(c,p.x,p.y,.8,'#bbdec144');
    creature(c,px(p.x),py(p.y),f,f.siege?foeHeading(f):headingFor(G.paths[f.pi],f.d),time,h);
    if(f.slow>0)ring(c,p.x,p.y,f.r+.05,'#b7f5ed',CELL*.027);
    if(f.hp<f.hpMax&&!f.hidden){const w=Math.max(h*.7,CELL*.5),y=py(p.y)-h-CELL*.10;c.fillStyle='#243729';rr(c,px(p.x)-w/2-1,y-1,w+2,4,2);c.fill();c.fillStyle=f.hp/f.hpMax>.4?'#c7d888':'#e69876';rr(c,px(p.x)-w/2,y,w*f.hp/f.hpMax,2,1);c.fill();}
  }
  function fern(c,x,y,size){
    const X=px(x),Y=py(y),s=CELL*size;
    for(let j=-1;j<=1;j++){const tx=X+j*s*.7,ty=Y-s*(.65+(.2*(j===0)));line(c,[[X,Y],[tx,ty]],'#789553',s*.04);for(let n=1;n<4;n++){const t=n/4,xx=X+(tx-X)*t,yy=Y+(ty-Y)*t;path(c,[[xx,yy],[xx-s*.22,yy-s*.13],[xx-s*.03,yy-s*.20]],'#91a95a');path(c,[[xx,yy],[xx+s*.22,yy-s*.13],[xx+s*.03,yy-s*.20]],'#607d41');}}
  }
  function terrainLayer(){
    const w=CELL*Q.width,h=CELL*Q.height,{c,x:c2}=offscreen(w,h),r=mulberry32(G.lv*7919+51);
    if(MAPS[G.lv].environment===DioramaMaps.firstTrail&&firstMapReady){
      c2.drawImage(firstMap,0,0,w,h);
      // Register the illustration to the logical route. Its three horizontal
      // runs are slightly above the guide; a common offset keeps all footfalls
      // inside the paving. The first copy supplies the top forest margin.
      c2.drawImage(firstMap,0,h*MAPS[G.lv].environment.offsetY,w,h);
      terrain={cv:c,lv:G.lv,cell:CELL};
      return;
    }
    const X=px(0),Y=py(0),W=COLS*CELL,H=ROWS*CELL*Q.depth;
    c2.fillStyle='#203c2c';rr(c2,X,Y+CELL*.16,W,H,CELL*.2);c2.fill();
    const g=c2.createLinearGradient(X,Y,X+W,Y+H);g.addColorStop(0,'#84975c');g.addColorStop(.55,'#657d48');g.addColorStop(1,'#465f39');
    c2.fillStyle=g;rr(c2,X,Y,W,H,CELL*.2);c2.fill();
    for(let i=0;i<190;i++){
      const xx=r()*COLS,yy=r()*ROWS;if(G.roadKey.has(Math.floor(xx)+','+Math.floor(yy)))continue;
      oval(c2,px(xx),py(yy),CELL*(.10+r()*.22),CELL*(.05+r()*.1),i%2?'#c8ce7e15':'#314e2819');
      if(i%4===0){for(let k=0;k<3;k++)line(c2,[[px(xx)+k*CELL*.04,py(yy)],[px(xx)+(k-.5)*CELL*.04,py(yy)-CELL*.06]],'#b8c57c55',CELL*.012);}
    }
    c2.save();c2.translate(OX,OY);c2.scale(1,Q.depth);c2.lineCap='round';c2.lineJoin='round';
    for(const [col,width,dy] of [['#344a2c77',1.04,.04],['#8e9468',.96,0],['#d0c296',.84,0],['#ded1a7',.66,0]]){
      c2.strokeStyle=col;c2.lineWidth=CELL*width;
      for(const p of G.paths){c2.beginPath();p.pts.forEach((pt,i)=>i?c2.lineTo(pt.x*CELL,(pt.y+dy)*CELL):c2.moveTo(pt.x*CELL,(pt.y+dy)*CELL));c2.stroke();}
    }
    c2.restore();
    const done=new Set();for(const p of G.paths)for(let d=.35;d<p.len;d+=.67){const pt=atDist(p,d),k=Math.floor(pt.x*3)+','+Math.floor(pt.y*3);if(done.has(k))continue;done.add(k);const a=headingAt(p,d)+Math.PI/2,off=(r()-.5)*.1;line(c2,[P(pt.x+Math.cos(a)*.34,pt.y+Math.sin(a)*.34),P(pt.x+off,pt.y+off),P(pt.x-Math.cos(a)*.34,pt.y-Math.sin(a)*.34)],'#a396713f',CELL*.013);}
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      if(G.roadKey.has(x+','+y)||G.blocked.has(x+','+y))continue;
      // Quiet stone chips mark cells; the full construction grid appears on demand.
      oval(c2,px(x+.5),py(y+.5),CELL*.035,CELL*.022,'#d1ca963d');
      if((x*17+y*7)%19===0)fern(c2,x+.22,y+.78,.28);
    }
    for(const k of G.blocked){const [x,y]=k.split(',').map(Number);shadow(c2,x+.5,y+.5,.36);oval(c2,px(x+.5),py(y+.5)-CELL*.15,CELL*.31,CELL*.26,light(c2,px(x+.5),py(y+.5)-CELL*.15,CELL*.34,'#bbc19b','#889174','#5e6d55'));oval(c2,px(x+.42),py(y+.5)-CELL*.32,CELL*.20,CELL*.09,'#75944f');}
    for(let i=0;i<10;i++){const side=i%2?COLS-.12:.12,yy=.8+i*1.15;if(!G.roadKey.has(Math.floor(side)+','+Math.floor(yy)))fern(c2,side,yy,.32);}
    terrain={cv:c,lv:G.lv,cell:CELL};
  }
  function portal(c,x,y,time){
    shadow(c,x,y,.4);const X=px(x),Y=py(y),s=CELL;
    c.save();c.translate(X,Y-s*.25);c.scale(1,.75);
    const g=c.createRadialGradient(0,0,s*.02,0,0,s*.31);g.addColorStop(0,'#233c32');g.addColorStop(.65,'#4b6745');g.addColorStop(1,'#d4df8b');oval(c,0,0,s*.32,s*.32,g);
    c.strokeStyle='#eee7ae';c.lineWidth=s*.03;c.beginPath();c.arc(0,0,s*.25,time,time+4.7);c.stroke();c.restore();
  }
  function projectile(s){
    if(s.kind==='shell'){
      const t=clamp(s.t/s.life,0,1),x=s.from.x+(s.to.x-s.from.x)*t,y=s.from.y+(s.to.y-s.from.y)*t,z=.60*(1-t)+Math.sin(t*Math.PI)*.9;
      shadow(ctx,x,y,.12);oval(ctx,px(x),py(y)-z*CELL,CELL*.09,CELL*.09,light(ctx,px(x),py(y)-z*CELL,CELL*.1,'#ece0b6','#997943','#4b513b'));
      ring(ctx,s.to.x,s.to.y,s.splash,'#b37c4e55');return;
    }
    const x=px(s.x),y=py(s.y)-CELL*.43,a=Math.atan2((s.vy||0)*Q.depth,s.vx||1);
    ctx.save();ctx.translate(x,y);ctx.rotate(a);line(ctx,[[-CELL*.18,0],[0,0]],s.kind==='ice'?'#baf7ea':'#ffe0a0',CELL*.04);oval(ctx,0,0,CELL*.055,CELL*.04,s.kind==='ice'?'#e6fff2':'#fff4c3');ctx.restore();
  }
  function selection(){
    if(G.armed){
      for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
        const free=cellFree(x,y),blocked=G.blocked.has(x+','+y);
        if(!free&&!blocked)continue;
        ctx.fillStyle=free?'#eddf9638':'#6c352619';
        ctx.strokeStyle=free?'#fff0b68c':'#d9a48955';ctx.lineWidth=1;
        rr(ctx,px(x+.08),py(y+.08),CELL*.84,CELL*.84*Q.depth,CELL*.10);ctx.fill();ctx.stroke();
        if(blocked){
          const X=px(x+.5),Y=py(y+.5),r=CELL*.065;
          line(ctx,[[X-r,Y-r],[X+r,Y+r]],'#efc4a9a0',Math.max(1,CELL*.025));
          line(ctx,[[X-r,Y+r],[X+r,Y-r]],'#efc4a9a0',Math.max(1,CELL*.025));
        }
      }
    }
    if(G.selected){const t=G.selected,st=t.type==='castle'?castleStats():towerStats(t);ctx.fillStyle='#ead18413';ctx.beginPath();ctx.ellipse(px(t.x+.5),py(t.y+.5),(st.range||.65)*CELL,(st.range||.65)*CELL*Q.depth,0,0,TAU);ctx.fill();ring(ctx,t.x+.5,t.y+.5,st.range||.65,'#e9d99588');ring(ctx,t.x+.5,t.y+.5,.45,'#fff0b7',CELL*.03);}
  }
  function preview(time){
    const list=[];
    const count=G.lv===0?6:12;
    for(let i=0;i<count;i++){
      const d=(time*.75+i*G.path.len/count)%G.path.len,p=atDist(G.path,d);
      const f={type:'grunt',d,ph:i*.7,r:.3,hp:36,hpMax:36};
      list.push({y:p.y,shadow:()=>shadow(ctx,p.x,p.y,.32,.86),draw(){creature(ctx,px(p.x),py(p.y),f,headingFor(G.path,d),time,CELL*.86);}});
    }
    const candidates=[];for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(!G.roadKey.has(x+','+y)&&!G.blocked.has(x+','+y)&&G.path.cells.some(p=>Math.abs(p[0]-x)+Math.abs(p[1]-y)===1))candidates.push({x,y});
    ['gun','frost','tesla','mortar'].forEach((type,i)=>{
      const fixed=G.lv===0?[{x:2,y:3},{x:7,y:5},{x:1,y:7},{x:5,y:10}][i]:null;
      const pos=fixed||candidates[Math.floor((i+.3)*candidates.length/4)];
      if(pos&&!G.blocked.has(pos.x+','+pos.y)){const t={...pos,type,lvl:2,aim:reduced?Math.PI/4:time*.4};list.push({y:t.y+.5,shadow:()=>shadow(ctx,t.x+.5,t.y+.5,.48,type==='gun'||type==='mortar'?.9:1.12),draw:()=>tower(ctx,t,time)});}
    });
    return list;
  }
  function drawScene(){
    ctx.clearRect(0,0,cv.width/DPR,cv.height/DPR);
    if(!terrain||terrain.lv!==G.lv||terrain.cell!==CELL)terrainLayer();
    if(!terrain)return;
    ctx.drawImage(terrain.cv,0,0,CELL*Q.width,CELL*Q.height);
    const now=performance.now()/1000;
    if(tour){if(!G.paused)stopTour();else{if(!document.hidden)tourTime+=Math.min(.05,Math.max(0,now-tourLast));tourLast=now;}}
    const time=tour?tourTime:G.t;
    if(!tour)selection();
    for(const p of G.paths)portal(ctx,p.pts[0].x,p.pts[0].y,time);
    const b=G.path.pts[G.path.pts.length-1];
    const items=tour?preview(time):[...G.towers.map(t=>({y:t.y+.5,shadow:()=>shadow(ctx,t.x+.5,t.y+.5,.48,t.type==='gun'||t.type==='mortar'?.9:1.12),draw:()=>tower(ctx,t,time)})),...G.foes.map(f=>({y:foePos(f).y,shadow:()=>{if(f.under)return;const p=foePos(f);ctx.save();if(f.hidden)ctx.globalAlpha=.25;shadow(ctx,p.x,p.y,Math.max(.22,f.r),height(f)/CELL);ctx.restore();},draw:()=>foe(ctx,f,time)}))];
    items.push({y:b.y,shadow:()=>shadow(ctx,b.x,b.y,.82,1.52),draw:()=>castle(ctx,b.x,b.y,time)});
    if(G.castle.lvl>=2)for(const frame of palisadeFrames())items.push({y:frame.b.y,shadow:()=>{},draw:()=>palisade(ctx,frame)});
    // Ground pass prevents a foreground object's shadow darkening a neighbour.
    for(const item of items)item.shadow();
    items.sort((a,b)=>a.y-b.y);for(const item of items)item.draw();
    if(!tour){for(const s of G.shots)projectile(s);for(const e of G.fx){ctx.save();if(e.kind==='bolt')ctx.translate(0,-CELL*.43);drawFx(e);ctx.restore();}}
    if(tour){ctx.fillStyle='#193326dc';rr(ctx,px(.15),py(ROWS)-CELL*.36,CELL*8.7,CELL*.32,CELL*.08);ctx.fill();ctx.fillStyle='#e9e3bf';ctx.font=`${Math.max(9,CELL*.18)}px system-ui`;ctx.textAlign='center';ctx.fillText('Прогулка · бой приостановлен · прогресс не меняется',px(4.5),py(ROWS)-CELL*.14);ctx.textAlign='start';}
  }
  let beforeTourPause=false;
  function stopTour(){if(!tour)return;tour=false;G.paused=beforeTourPause;$('#btnTour').setAttribute('aria-pressed','false');$('#btnTour').textContent='Прогулка Уголька';}
  $('#btnTour').addEventListener('click',()=>{
    if(tour){stopTour();return;}
    if(G.over)return;
    beforeTourPause=G.paused;G.paused=true;tour=true;tourLast=performance.now()/1000;
    $('#btnTour').setAttribute('aria-pressed','true');$('#btnTour').textContent='Вернуться к игре';
  });
  // Exit the visual preview before game actions. No preview entities enter G.
  for(const id of ['btnGo','btnRestart','btnMenu','title','btnHelp','stLives','palette','btnSpd','btnUndo'])$('#'+id).addEventListener('click',stopTour,true);
  function portrait(row){const c=row.ctx,S=row.size;c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,S,S);softShadow(c,S/2,S*.87,S*.25,S*.07,.35);creature(c,S/2,S*.88,row.f,Math.PI/4,G.t,S*.76);}
  return {draw:drawScene,portrait,terrain:terrainLayer,stopTour};
})();

draw=Diorama.draw;
drawPortrait=Diorama.portrait;
buildTerrain=Diorama.terrain;
refreshSoundButton();
startLevel(firstUnfinished());
requestAnimationFrame(now=>{last=now;requestAnimationFrame(frame);});
if(!Object.keys(save.stars).length)setTimeout(()=>showHint('Поставьте башни или включите «Прогулку Уголька»'),800);
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).catch(()=>{}));
