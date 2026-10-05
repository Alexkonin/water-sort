/* Deterministic campaign authoring. Every truck batch is replayed with the real physics. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),T=require('../sand-trucks.js'),G=require('../arrow-escape.js');
const firstTen=require('../sand-trucks-levels.js').slice(0,10);
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};}
const themes=['Воздушный шар','Горный перевал','Замок на холме','Лунная бухта','Сад тюльпанов','Домик-гриб','Кит в волнах','Песчаные дюны','Паровозик','Мост над рекой','Сова на ветке','Звёздная башня','Морской краб','Чайник у окна','Цветущий кактус'];
const moods=['Рассвет','Тёплый день','Золотой час','Вечерний свет','Синие дали','Тихая ночь'];
function picture(n){
 const family=(n-11)%15,variant=Math.floor((n-11)/15),w=48,h=40,r=random(n*997),night=variant===5,sky=night?4:2,water=variant%2?4:3;
 const a=Array.from({length:h},()=>Array(w).fill(sky)),cx=18+Math.floor(r()*13),base=29+variant%3;
 function box(x,y,ww,hh,c){for(let yy=Math.max(0,Math.floor(y));yy<Math.min(h,Math.ceil(y+hh));yy++)for(let xx=Math.max(0,Math.floor(x));xx<Math.min(w,Math.ceil(x+ww));xx++)a[yy][xx]=c;}
 function ellipse(cx,cy,rx,ry,c){for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1)a[y][x]=c;}
 function poly(points,c){for(let y=0;y<h;y++)for(let x=0;x<w;x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const[u,v]=points[i],[p,q]=points[j];if((v>y+.5)!==(q>y+.5)&&x+.5<(p-u)*(y+.5-v)/(q-v)+u)inside=!inside;}if(inside)a[y][x]=c;}}
 function line(x1,y1,x2,y2,width,c){const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1))*2;for(let k=0;k<=steps;k++)ellipse(x1+(x2-x1)*k/steps,y1+(y2-y1)*k/steps,width,width,c);}
 function cloud(x,y){ellipse(x,y,5,2,2);ellipse(x-2,y-1,2,2,2);ellipse(x+1,y-2,3,3,2);}
 const warm=variant%2?5:0,accent=variant%3===0?5:1;
 box(0,base,48,40-base,water);
 if(family!==3&&family!==13){ellipse(7+variant*6,7,3+variant%2,3+variant%2,1);if(night)ellipse(8+variant*6,6,3,3,sky);else cloud(37-variant*4,9);}
 switch(family){
 case 0:
  poly([[0,base],[12,base-5],[29,base+1],[48,base-5],[48,40],[0,40]],3);
  ellipse(cx,15,9+variant%3,11,accent);poly([[cx-7,20],[cx+7,20],[cx+3,28],[cx-3,28]],accent);ellipse(cx,14,3,10,warm);
  line(cx-3,26,cx-3,31,.5,0);line(cx+3,26,cx+3,31,.5,0);box(cx-4,30,8,5,0);box(cx-3,30,6,1,1);break;
 case 1:
  poly([[0,base],[13+variant,9],[29,base],[40,12],[48,25],[48,40],[0,40]],4);
  poly([[2,base],[cx,5+variant],[44,base],[48,40],[0,40]],warm);poly([[cx,5+variant],[cx-6,14+variant],[cx-2,12],[cx+2,15],[cx+5,12+variant]],2);
  poly([[0,34],[20,29],[48,35],[48,40],[0,40]],1);break;
 case 2:
  ellipse(24,40,28,11,0);box(cx-10,17,20,16,accent);box(cx-14,12,7,21,warm);box(cx+7,12,7,21,warm);
  for(const x of[cx-14,cx-9,cx+7,cx+12])box(x,9,2,5,warm);box(cx-3,10,6,20,accent);poly([[cx-5,10],[cx,3],[cx+5,10]],5);
  ellipse(cx,29,3,5,4);box(cx-3,29,6,5,4);for(const x of[cx-12,cx+9])box(x,17,3,5,2);break;
 case 3:
  box(0,0,48,40,4);ellipse(cx,12,8,8,1);ellipse(cx+4,9,8,8,4);box(0,base,48,12,3);
  for(let i=0;i<8;i++)box(3+i*6,(i*11+variant*3)%24,1,1,2);
  poly([[0,30],[9,26],[20,33],[33,28],[48,31],[48,40],[0,40]],0);for(let i=0;i<3;i++)box(cx-5+i,base+2+i*3,10-i*2,1,1);break;
 case 4:
  box(0,32,48,8,0);for(let i=0;i<3+variant%3;i++){const x=6+i*9,y=15+(i+variant)%3*4;line(x,33,x,y,1,3);poly([[x,27],[x-5,22],[x-5,26],[x,31]],3);ellipse(x,y,4,5,accent);poly([[x-4,y-4],[x-2,y-7],[x,y-3],[x+2,y-7],[x+4,y-4],[x+3,y+1],[x-3,y+1]],warm);}break;
 case 5:
  ellipse(24,39,29,8,0);box(cx-6,19,12,15,2);ellipse(cx,18,15,11,5);box(cx-16,19,32,3,5);box(cx-6,22,12,12,2);
  for(const[x,y]of[[cx-8,16],[cx+2,11],[cx+8,17]])ellipse(x,y,2,2,1);ellipse(cx,30,3,4,0);box(cx-3,30,6,4,0);box(cx+3,25,2,3,4);break;
 case 6:
  box(0,23,48,17,3);ellipse(cx,27,14,8,4);poly([[cx+10,27],[cx+20,20],[cx+17,30],[cx+10,32]],4);ellipse(cx-5,30,7,3,2);ellipse(cx-9,25,1,1,1);
  line(cx-7,18,cx-7,10,.8,3);line(cx-7,11,cx-11,8,.8,3);line(cx-7,11,cx-3,8,.8,3);for(let i=0;i<3;i++)box(2+i*16,36-i%2,10,1,2);break;
 case 7:
  poly([[0,27],[10,20],[26,29],[40,19],[48,24],[48,40],[0,40]],1);poly([[0,35],[19,24],[33,28],[48,34],[48,40],[0,40]],0);
  line(cx,31,cx,16,1.5,4);line(cx,24,cx-5,24,1.5,4);line(cx-5,24,cx-5,19,1.5,4);line(cx,21,cx+4,21,1.5,4);line(cx+4,21,cx+4,17,1.5,4);break;
 case 8:
  box(0,34,48,6,0);box(0,33,48,1,4);box(4,24,18,6,warm);box(6,17,10,13,warm);box(7,18,7,5,2);box(18,18,3,7,4);box(5,15,13,2,4);box(26,22,16,8,accent);
  for(const x of[8,18,29,39]){ellipse(x,31,3,3,4);ellipse(x,31,1,1,1);}for(let i=0;i<3;i++)ellipse(20+i*4,13-i*3,2+i*.3,2,2);break;
 case 9:
  box(0,26,48,14,3);box(0,22,48,6,0);for(let x=8;x<48;x+=14){ellipse(x,30,5,6,3);box(x-5,30,10,9,3);}box(0,21,48,2,warm);for(let x=2;x<48;x+=5)box(x,18,1,4,warm);line(0,17,48,17,.7,warm);break;
 case 10:
  line(0,33,48,30,1.5,0);ellipse(cx,22,9,12,warm);poly([[cx-8,15],[cx-10,5],[cx-2,11],[cx+2,11],[cx+10,5],[cx+8,15]],warm);
  for(const x of[cx-4,cx+4]){ellipse(x,17,4,5,2);ellipse(x,17,1.5,2,4);}poly([[cx-2,22],[cx+2,22],[cx,26]],1);ellipse(cx,28,4,4,accent);break;
 case 11:
  poly([[0,40],[24,28],[48,40]],0);box(cx-6,15,12,20,warm);poly([[cx-9,16],[cx,5],[cx+9,16]],5);box(cx-2,25,4,10,4);box(cx-2,19,4,4,1);
  poly([[cx,1],[cx+1,4],[cx+4,4],[cx+2,6],[cx+3,9],[cx,7],[cx-3,9],[cx-2,6],[cx-4,4],[cx-1,4]],1);break;
 case 12:
  box(0,22,48,18,1);ellipse(cx,27,9,6,5);for(const sign of[-1,1]){for(let k=0;k<3;k++)line(cx+sign*7,27+k*2,cx+sign*(13+k),25+k*4,1,5);line(cx+sign*7,24,cx+sign*12,20,1,5);ellipse(cx+sign*13,18,4,3,5);line(cx+sign*3,24,cx+sign*4,20,.8,5);ellipse(cx+sign*4,20,1,1,4);}break;
 case 13:
  box(4,3,40,24,0);box(6,5,36,20,4);ellipse(cx,12,4,4,1);box(23,4,2,23,0);box(4,15,40,2,0);box(0,33,48,7,0);
  ellipse(cx,26,9,8,accent);ellipse(cx+10,25,5,5,accent);ellipse(cx+10,25,3,3,sky);poly([[cx-6,23],[cx-15,20],[cx-10,29],[cx-5,30]],accent);box(cx-6,18,12,2,warm);ellipse(cx,17,2,2,warm);break;
 case 14:
  box(0,34,48,6,0);poly([[cx-8,28],[cx+8,28],[cx+5,37],[cx-5,37]],warm);box(cx-9,27,18,3,1);line(cx,27,cx,11,2.5,3);line(cx,20,cx-7,20,2,3);line(cx-7,20,cx-7,14,2,3);line(cx,23,cx+7,23,2,3);line(cx+7,23,cx+7,16,2,3);ellipse(cx,10,3,3,5);ellipse(cx+7,15,2,2,1);break;
 }
 return{title:themes[family]+' · '+moods[variant],rows:a.map(row=>row.join(''))};
}
function legal(arrows){const p={width:12,height:12,arrows},pending=arrows.map(a=>a.id);for(const id of pending.slice()){if(G.blockers(p,pending,id).length)return false;pending.splice(0,1);}return true;}
function parking(n){
 const source=firstTen[(n*7)%10],r=random(n*1777),turn=n%4,mirror=Math.floor(n/4)%2;
 const arrows=source.solution.map((id,i)=>({id:i,color:0,capacity:1,cells:source.arrows[id].cells.map(([x,y])=>{if(mirror)x=11-x;for(let t=0;t<turn;t++)[x,y]=[11-y,x];return[x,y];})}));
 for(let k=0;k<100;k++){
  const i=Math.floor(r()*arrows.length),a=arrows[i],dir=G.direction(a),step=r()<.5?-1:1,old=a.cells,next=old.map(([x,y])=>[x+dir[0]*step,y+dir[1]*step]);
  const occupied=new Set(arrows.filter(b=>b!==a).flatMap(b=>b.cells.map(c=>c.join(','))));
  if(next.some(([x,y])=>x<0||y<0||x>=12||y>=12||occupied.has(x+','+y)))continue;
  a.cells=next;if(!legal(arrows))a.cells=old;
 }return arrows;
}
function build(n){
 const art=picture(n),arrows=parking(n),limit=n<31?3:n<61?4:5,warm=n%2?0:5,cool=n%3?3:4;
 // Keep every scene's palette within the working limit, while wrong duplicate
 // color choices can still block the road. Later chapters introduce more colors.
 const mapping=limit===3?[warm,warm,2,cool,cool,warm]:limit===4?[warm,1,2,cool,cool,warm]:[warm,1,2,3,4,warm];
 art.rows=art.rows.map(row=>[...row].map(c=>mapping[+c]).join(''));
 const rows=art.rows.flatMap(row=>Array(T.GRAIN_SCALE).fill([...row].map(c=>c.repeat(T.GRAIN_SCALE)).join(''))),cells=rows.join('').split('').map(Number);
 const counts=Array.from({length:6},(_,c)=>cells.filter(v=>v===c).length),quota=counts.map(count=>count?Math.max(1,Math.floor(count/cells.length*arrows.length)):0);
 while(quota.reduce((a,b)=>a+b,0)<arrows.length){let best=0;for(let c=1;c<6;c++)if(counts[c]/(quota[c]+1)>counts[best]/(quota[best]+1))best=c;quota[best]++;}
 while(quota.reduce((a,b)=>a+b,0)>arrows.length){let best=quota.findIndex(q=>q>1);for(let c=0;c<6;c++)if(quota[c]>1&&counts[c]/quota[c]<counts[best]/quota[best])best=c;quota[best]--;}
 const loads=quota.map((q,c)=>Array.from({length:q},(_,i)=>Math.floor(counts[c]/q)+(i<counts[c]%q?1:0)));
 const puzzle={level:n,width:12,height:12,limit,art:{title:art.title,width:rows[0].length,height:rows.length,cells},arrows,solution:[]};
 const s={...T.create(1),puzzle,remaining:arrows.map(a=>a.id),grains:cells.slice(),motion:T.Sand.create(cells.length)},releaseFrames=[];let next=0;
 for(let frame=0;frame<45000;frame++){
  while(next<arrows.length&&T.workingCount(s)<limit){
   const busy=new Set(s.active.filter(c=>c.loaded<arrows[c.id].capacity).map(c=>arrows[c.id].color)),front=Array(6).fill(0);for(const i of T.frontier(puzzle.art,s.grains))front[s.grains[i]]++;
   const colors=loads.map((q,c)=>c).filter(c=>loads[c].length&&!busy.has(c)).sort((a,b)=>front[b]-front[a]||loads[b].length-loads[a].length||a-b);if(!colors.length)break;
   const color=colors[0];arrows[next].color=color;arrows[next].capacity=loads[color].shift();
   if(T.dispatch(s,next)!=='ok')throw Error('illegal generated departure '+n+':'+next);s.history=[];releaseFrames.push(frame);next++;
  }
  T.step(s,.04);if(s.jammed)throw Error('generated jam '+n);
  if(T.won(s))return{...art,width:12,height:12,limit,arrows:arrows.map(a=>({...a,capacity:a.capacity/T.GRAIN_SCALE**2})),solution:arrows.map(a=>a.id),releaseFrames};
 }
 throw Error('simulation timed out for level '+n);
}
if(require.main===module){
 const levels=firstTen.slice(),start=Date.now();for(let n=11;n<=100;n++){levels.push(build(n));console.log(n,levels.at(-1).title,levels.at(-1).arrows.length+' trucks',Math.round((Date.now()-start)/1000)+'s');}
 if(new Set(levels.map(l=>l.rows.join(''))).size!==100)throw Error('duplicate picture');
 const output='/* 100 pictures and parking lots; generated release orders replay the actual sand physics. */\n(function(root){\n  const levels='+JSON.stringify(levels)+';\n  if(typeof module!=="undefined"&&module.exports)module.exports=levels;else root.SandTruckLevels=levels;\n})(globalThis);\n';
 fs.writeFileSync(path.join(root,'sand-trucks-levels.js'),output);
}
module.exports={picture,parking,build};
