/* Mahjong solitaire: integer-grid stacks, seeded deals and replayable saves. */
(function(root){
  'use strict';
  const VERSION=1, LEVELS=1000, TYPES=18;
  const validLevel=n=>Number.isInteger(n)&&n>=1&&n<=LEVELS;
  function random(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function mix(items,rng){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function layout(level){
    if(!validLevel(level))throw Error('Invalid level');
    const rows=level<=10?4:level<=30?6:8, tiles=[];
    const layers=level<=10?2:3;
    for(let z=0;z<layers;z++)for(let y=z;y<rows-z;y++){
      // Three symmetric silhouettes, all with even rows and supported stacks.
      const inset=level%3===2&&(y===0||y===rows-1)?1:0;
      const left=Math.max(z,inset),right=6-left;
      if(level%3===0&&z===2&&(y===z||y===rows-z-1))continue;
      for(let x=left;x<right;x++)tiles.push({id:tiles.length,x,y,z});
    }
    return {tiles,rows,name:['Бамбук','Сад','Лотос'][level%3]};
  }
  function isFree(tile,tiles){
    if(!tile||!tiles.some(t=>t.id===tile.id))return false;
    if(tiles.some(t=>t.z>tile.z&&t.x===tile.x&&t.y===tile.y))return false;
    const neighbor=dx=>tiles.some(t=>t.z===tile.z&&t.y===tile.y&&t.x===tile.x+dx);
    return !neighbor(-1)||!neighbor(1);
  }
  function pairs(tiles){
    const free=tiles.filter(t=>isFree(t,tiles)),out=[];
    for(let i=0;i<free.length;i++)for(let j=i+1;j<free.length;j++)if(free[i].type===free[j].type)out.push([free[i].id,free[j].id]);
    return out;
  }
  function remove(tiles,ids){
    if(!Array.isArray(ids)||ids.length!==2||ids[0]===ids[1])return null;
    const [a,b]=ids.map(id=>tiles.find(t=>t.id===id));
    if(!a||!b||a.type!==b.type||!isFree(a,tiles)||!isFree(b,tiles))return null;
    return tiles.filter(t=>!ids.includes(t.id));
  }
  function pathFor(tiles,rng){
    // Retry unrestricted peeling; symmetric row edges provide a bounded fallback.
    for(let attempt=0;attempt<33;attempt++){
      let left=tiles.slice();const path=[];
      while(left.length){
        const free=mix(left.filter(t=>isFree(t,left)),rng);
        const a=free[0],b=attempt===32?free.find(t=>t.id!==a?.id&&t.y===a.y&&t.z===a.z):free[1];
        if(!a||!b)break;
        path.push([a.id,b.id]);left=left.filter(t=>t.id!==a.id&&t.id!==b.id);
      }
      if(!left.length)return path;
    }
    throw Error('Unpairable geometry');
  }
  function assign(tiles,path,types){
    const kinds=new Map();path.forEach((pair,i)=>pair.forEach(id=>kinds.set(id,types[i])));
    return tiles.map(t=>({...t,type:kinds.get(t.id)}));
  }
  function generate(level){
    const shape=layout(level),rng=random(level*7919+VERSION*104729),solution=pathFor(shape.tiles,rng);
    const kinds=mix(Array.from({length:TYPES},(_,i)=>i),rng),variety=level<=10?8:TYPES;
    const types=mix(solution.map((_,i)=>kinds[Math.floor(i/2)%variety]),rng);
    return {...shape,tiles:assign(shape.tiles,solution,types),solution};
  }
  function shuffle(tiles,puzzle,seed){
    if(!tiles.length)return [];
    // Rebuild the remaining tiles on a known solvable suffix. This also rescues
    // geometry with two vertically stacked tiles, where swapping faces cannot.
    const solution=puzzle.solution.slice(-tiles.length/2),ids=new Set(solution.flat());
    const counts=new Map();for(const t of tiles)counts.set(t.type,(counts.get(t.type)||0)+1);
    const types=[];for(const [kind,n]of counts){if(n%2)throw Error('Unpaired tiles');for(let i=0;i<n/2;i++)types.push(kind);}
    return assign(puzzle.tiles.filter(t=>ids.has(t.id)),solution,mix(types,random(seed)));
  }
  function apply(tiles,puzzle,action){
    if(!action||typeof action!=='object'||!tiles.length)return null;
    if(action.kind==='pair')return remove(tiles,action.ids);
    if(action.kind==='shuffle'&&Number.isInteger(action.seed)&&action.seed>=0&&action.seed<=0xffffffff)return shuffle(tiles,puzzle,action.seed);
    return null;
  }
  function replay(puzzle,actions){
    if(!Array.isArray(actions)||actions.length>1000)return null;
    let tiles=puzzle.tiles;
    for(const action of actions){tiles=apply(tiles,puzzle,action);if(!tiles)return null;}
    return tiles;
  }
  function restore(value){
    const d=value&&typeof value==='object'?value:{},level=validLevel(d.level)?d.level:1,puzzle=generate(level);
    const completed=Array.isArray(d.completed)?[...new Set(d.completed.filter(validLevel))]:[];
    const tiles=d.version===VERSION?replay(puzzle,d.actions):null;
    return {version:VERSION,level,puzzle,tiles:tiles||puzzle.tiles,actions:tiles?d.actions:[],completed,sound:d.sound!==false,helpSeen:d.helpSeen===true};
  }
  const api={VERSION,LEVELS,TYPES,layout,isFree,pairs,remove,generate,shuffle,apply,replay,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Mahjong=api;
})(globalThis);
