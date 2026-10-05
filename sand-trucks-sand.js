/* Dense granular flow: continuous fall inside cells, contact, and frictional slides. */
(function(root){
  'use strict';
  const GRAVITY=600,MAX_SPEED=119,SLIDE_SPEED=120,EPS=1e-7;
  const scratch=new WeakMap();
  function create(size){return{offset:new Float64Array(size),velocity:new Float64Array(size),slide:new Float64Array(size),drop:new Float64Array(size)};}
  function clear(m,i){m.offset[i]=m.velocity[i]=m.slide[i]=m.drop[i]=0;}
  function side(art,grains,i,dir){
    const w=art.width,x=i%w,y=Math.floor(i/w);
    if(x+dir<0||x+dir>=w||y+1>=art.height)return -1;
    if(grains[i+w+dir]<0)return 1;
    // Surface shear: a 3:2 drop exceeds the chosen repose slope. Let the
    // exposed grain roll over its neighbour instead of locking to a 45° grid.
    const far=x+3*dir;
    if(grains[i+dir]<0&&far>=0&&far<w&&y+2<art.height&&grains[i+2*dir]<0&&grains[i+w+2*dir]<0&&grains[i+2*w+3*dir]<0)return 0;
    return -1;
  }
  function canMove(art,grains){
    for(let i=0;i<grains.length-art.width;i++)if(grains[i]>=0&&(grains[i+art.width]<0||side(art,grains,i,-1)>=0||side(art,grains,i,1)>=0))return true;
    return false;
  }
  function slideTo(grains,m,i,to,dir,dt,touched){
    m.slide[i]+=dir*SLIDE_SPEED*dt;
    if(Math.abs(m.slide[i])>=1-EPS){grains[to]=grains[i];grains[i]=-1;const drop=m.drop[i];clear(m,i);clear(m,to);touched[to]=1;m.velocity[to]=drop?Math.min(SLIDE_SPEED,MAX_SPEED):0;}
  }
  function step(art,grains,m,tick,dt){
    const w=art.width,h=art.height;let moving=0;
    if(!scratch.has(m))scratch.set(m,{touched:new Uint8Array(grains.length),planned:new Int8Array(grains.length)});
    const {touched,planned}=scratch.get(m);touched.fill(0);planned.fill(0);
    // Decide surface shear against the same contact field for the whole mass.
    // Updating contacts bottom-up first would turn a crumbling face into a piston.
    for(let i=0;i<grains.length-w;i++)if(grains[i]>=0&&grains[i+w]>=0&&!m.slide[i]){
      const x=i%w,y=Math.floor(i/w);let dir=((Math.imul(x+17,73856093)^Math.imul(y+tick+7,19349663))>>>3)&1?1:-1;
      let drop=side(art,grains,i,dir);if(drop<0){dir=-dir;drop=side(art,grains,i,dir);}
      if(drop>=0)planned[i]=dir*(drop+1);
    }
    for(let y=h-1;y>=0;y--)for(let n=0;n<w;n++){
      const x=(tick+y)%2?w-1-n:n,i=y*w+x;if(touched[i])continue;if(grains[i]<0){clear(m,i);continue;}
      if(y===h-1){if(m.offset[i]||m.slide[i])moving++;clear(m,i);continue;}
      const below=i+w,old=m.offset[i],v=Math.min(MAX_SPEED,m.velocity[i]+GRAVITY*dt);
      // Complete a started roll before switching to vertical free fall.
      const rolling=Math.sign(m.slide[i]);
      if(rolling&&grains[i+w*m.drop[i]+rolling]<0){slideTo(grains,m,i,i+w*m.drop[i]+rolling,rolling,dt,touched);moving++;continue;}
      m.slide[i]=0;m.drop[i]=0;
      // An exposed steep face sheds grains sideways before the whole column
      // can sink vertically. This propagates a shear layer into the pile.
      const plan=planned[i],dir=Math.sign(plan),drop=Math.abs(plan)-1;
      if(plan&&grains[i+w*drop+dir]<0){
        m.offset[i]=0;m.drop[i]=drop;slideTo(grains,m,i,i+w*drop+dir,dir,dt,touched);moving++;continue;
      }
      // A supported grain follows the continuous displacement of the grain below.
      // This keeps a collapsing column dense instead of opening a striped grid of air.
      const space=grains[below]<0?1:m.offset[below];
      if(grains[below]<0||space>old+EPS){
        m.slide[i]=0;const desired=old+v*dt;
        if(grains[below]<0&&desired>=1){
          let offset=desired-1,velocity=v;
          if(y+1===h-1){offset=0;velocity=0;}
          else if(grains[below+w]>=0&&offset>=m.offset[below+w]){offset=m.offset[below+w];velocity=Math.min(v,m.velocity[below+w]);}
          grains[below]=grains[i];grains[i]=-1;m.offset[below]=offset;m.velocity[below]=velocity;m.slide[below]=0;clear(m,i);
        }else{m.offset[i]=Math.min(desired,space);m.velocity[i]=desired>=space&&grains[below]>=0?Math.min(v,m.velocity[below]):v;}
        moving++;continue;
      }
      m.velocity[i]=0;
    }
    return moving;
  }
  function snapshot(m){const rows=[];for(let i=0;i<m.offset.length;i++)if(m.offset[i]||m.velocity[i]||m.slide[i])rows.push([i,m.offset[i],m.velocity[i],m.slide[i],m.drop[i]]);return rows;}
  function restore(size,rows,grains){
    const m=create(size);if(!Array.isArray(rows))return m;const seen=new Set();
    for(const row of rows){if(!Array.isArray(row)||(row.length!==4&&row.length!==5))return create(size);const[i,o,v,s,drop=s?1:0]=row;
      if(!Number.isInteger(i)||i<0||i>=size||grains[i]<0||seen.has(i)||!Number.isFinite(o)||o<0||o>=1||!Number.isFinite(v)||v<0||v>MAX_SPEED||!Number.isFinite(s)||Math.abs(s)>=1)return create(size);
      if(drop!==0&&drop!==1)return create(size);seen.add(i);m.offset[i]=o;m.velocity[i]=v;m.slide[i]=s;m.drop[i]=drop;
    }return m;
  }
  const api={GRAVITY,MAX_SPEED,SLIDE_SPEED,create,clear,canMove,step,snapshot,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SandTruckSand=api;
})(globalThis);
