/* Hand-composed opening pictures. Coordinates use a 96 × 80 artboard;
   rasterization produces real collectible sand, not a decorative overlay. */
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'../sand-trucks-levels.js');
function picture(index,width,height){
 const rows=Array.from({length:height},()=>Array(width).fill(index===2?3:2));
 function paint(color,inside){for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(inside((x+.5)*96/width,(y+.5)*80/height))rows[y][x]=color;}
 function ellipse(cx,cy,rx,ry,color){paint(color,(x,y)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1);}
 function poly(points,color){paint(color,(x,y)=>{let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const[a,b]=points[i],[c,d]=points[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;}return inside;});}
 function ribbon(x1,x2,y,amp,thick,color,phase=0){paint(color,(x,v)=>x>=x1&&x<=x2&&Math.abs(v-y-Math.sin((x-x1)/(x2-x1)*Math.PI*2+phase)*amp)<thick/2);}
 if(index===0){
  // A generous off-centre sun, broad tapered rays, and its reflection.
  const cx=35,cy=28;
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,point=(r,t)=>[cx+Math.cos(t)*r,cy+Math.sin(t)*r];
   poly([point(15,a-.23),point(i%2?24:26,a),point(15,a+.23)],1);
  }
  ellipse(cx,cy,16,16,1);
  paint(3,(x,y)=>y>57+2*Math.sin(x/14)+1.3*Math.sin(x/7));
  ribbon(22,47,63,1,2.8,1);ribbon(27,42,69,.7,2,1);ribbon(31,39,75,.4,1.8,1);
  ribbon(1,16,68,.8,1.8,2);ribbon(56,81,64,1,1.8,2);ribbon(67,94,74,1,1.8,2);
  // Two broad, angled gull silhouettes balance the empty upper right.
  poly([[65,24],[70,25],[73,28],[77,25],[83,25],[77,27],[73,31],[69,27]],3);
  poly([[78,15],[82,16],[84,18],[87,16],[91,16],[87,18],[84,20],[81,18]],3);
 }else if(index===1){
  // Curved, wind-filled sails and a low, rising bow; the mast is exposed
  // between the sails so it remains legible at phone size.
  paint(3,(x,y)=>y>60+1.6*Math.sin(x/12));
  ellipse(16,14,6,6,1);
  poly([[54,11],[51,17],[45,24],[37,33],[29,44],[24,53],[51,51]],1);
  poly([[54,15],[65,26],[72,38],[77,49],[57,51]],5);
  poly([[57,19],[63,27],[68,38],[70,46],[60,47]],1);
  poly([[53,10],[55,10],[57,62],[54,62]],0);
  poly([[55,11],[67,14],[56,18]],5);
  poly([[18,57],[40,59],[68,57],[81,53],[75,63],[66,68],[32,69],[24,65]],5);
  poly([[23,58],[42,60],[69,58],[78,55],[75,59],[42,63],[27,61]],0);
  ribbon(13,37,73,.6,2,2);ribbon(44,72,74,.8,2,2);ribbon(79,96,66,.5,1.8,2);
  ribbon(2,16,58,.6,1.5,3);ribbon(80,94,50,.6,1.5,3);
 }else if(index===2){
  // Left-facing fish: forked tail, overlapping fins, crescent gill and eye.
  poly([[66,36],[83,21],[89,19],[86,35],[90,52],[83,51],[68,42]],5);
  poly([[67,37],[85,27],[81,37],[86,46],[68,40]],0);
  poly([[39,26],[46,14],[58,16],[64,28]],5);
  poly([[43,49],[54,62],[62,60],[60,47]],5);
  ellipse(46,38,27,17,0);
  ellipse(42,32,20,9,1);
  ellipse(48,36,20,10,0);
  poly([[51,38],[61,37],[57,49],[49,47]],5);
  paint(1,(x,y)=>x<39&&x>30&&((x-29)/10)**2+((y-38)/17)**2<=1&&((x-26)/9)**2+((y-37)/18)**2>1);
  ellipse(27,34,3,3.5,1);ellipse(26.5,34,1.7,2,4);
  poly([[19,40],[23,41],[19,43]],3);
  // Open bubbles, low sea grass and a quiet seabed frame the silhouette.
  for(const[x,y,r]of[[15,25,2.8],[20,14,3.8]]){ellipse(x,y,r,r,1);ellipse(x,y,r-1.4,r-1.4,3);}
  paint(0,(x,y)=>y>75+2*Math.sin(x/13));
  poly([[8,79],[6,68],[8,57],[10,67],[10,79]],5);
  poly([[11,79],[12,68],[18,62],[16,71]],5);
  poly([[83,79],[79,70],[79,63],[83,69],[85,79]],5);
  poly([[86,79],[86,65],[91,58],[90,69]],5);
  ellipse(67,75,3,1.7,1);ellipse(30,77,4,1.8,1);
 }
 return rows.map(row=>row.join(''));
}
function refine(level,index,authoredRows){
 const rows=authoredRows||picture(index,level.rows[0].length,level.rows.length),counts=Array(6).fill(0);
 for(const c of rows.join(''))counts[+c]++;
 const arrows=level.arrows.map(a=>({...a})),T=require('../sand-trucks.js');
 // Retain the parking geometry and legal exit order. Reassign loads to the
 // new picture and record a winning release schedule in the real physics.
 const total=rows[0].length*rows.length;
 const quota=counts.map(n=>n?Math.max(1,Math.floor(n/total*arrows.length)):0);
 while(quota.reduce((a,b)=>a+b,0)<arrows.length){let best=0;for(let c=1;c<6;c++)if(counts[c]/(quota[c]+1)>counts[best]/(quota[best]+1))best=c;quota[best]++;}
 while(quota.reduce((a,b)=>a+b,0)>arrows.length){let best=quota.findIndex(q=>q>1);for(let c=0;c<6;c++)if(quota[c]>1&&counts[c]/quota[c]<counts[best]/quota[best])best=c;quota[best]--;}
 const loads=quota.map((q,c)=>Array.from({length:q},(_,i)=>Math.floor(counts[c]/q)+(i<counts[c]%q?1:0)));
 const cells=rows.flatMap(row=>Array(T.GRAIN_SCALE).fill([...row].flatMap(c=>Array(T.GRAIN_SCALE).fill(+c)))).flat();
 const colorCount=counts.filter(Boolean).length,limit=index<30?Math.max(level.limit||3,colorCount+1):level.limit||3;
 if(colorCount>limit)throw Error('Too many colors for level '+(index+1));
 const s=T.create(index+1);s.puzzle={...s.puzzle,limit,arrows,art:{...s.puzzle.art,width:rows[0].length*T.GRAIN_SCALE,height:rows.length*T.GRAIN_SCALE,cells}};
 s.grains=cells.slice();s.motion=T.Sand.create(cells.length);
 const releaseFrames=[];let next=0;
 for(let frame=0;frame<45000;frame++){
  while(next<level.solution.length&&T.workingCount(s)<s.puzzle.limit){
   const busy=new Set(s.active.filter(c=>c.loaded<arrows[c.id].capacity).map(c=>arrows[c.id].color)),front=Array(6).fill(0);
   for(const i of T.frontier(s.puzzle.art,s.grains))front[s.grains[i]]++;
   const colors=loads.map((_,c)=>c).filter(c=>loads[c].length&&!busy.has(c)).sort((a,b)=>front[b]-front[a]||loads[b].length-loads[a].length||a-b);
   if(!colors.length)break;
   const id=level.solution[next],color=colors[0];arrows[id].color=color;arrows[id].capacity=loads[color].shift()*T.GRAIN_SCALE**2;
   if(T.dispatch(s,id)!=='ok')throw Error('Blocked departure '+(index+1)+':'+id);
   s.history=[];releaseFrames.push(frame);next++;
  }
  T.step(s,.04);if(s.jammed)throw Error('Picture jammed '+(index+1));
  if(T.won(s)){
   const result={...level,rows,arrows:arrows.map(a=>({...a,capacity:a.capacity/T.GRAIN_SCALE**2})),releaseFrames};
   delete result.releaseTicks;return result;
  }
 }
 throw Error('Picture timed out '+(index+1));
}
if(require.main===module){
 const levels=require(file);for(let i=0;i<3;i++)levels[i]=refine(levels[i],i);
 fs.writeFileSync(file,'/* 100 pictures and parking lots; generated release orders replay the actual sand physics. */\n(function(root){\n  const levels='+JSON.stringify(levels)+';\n  if(typeof module!=="undefined"&&module.exports)module.exports=levels;else root.SandTruckLevels=levels;\n})(globalThis);\n');
}
module.exports={picture,refine};
