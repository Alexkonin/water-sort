/* Mahjong solitaire: half-grid stacks, seeded deals and replayable saves. */
(function(root){
  'use strict';
  const VERSION=3, RULES_VERSION=2, LEVELS=10000, TYPES=42;
  const validLevel=n=>Number.isInteger(n)&&n>=1&&n<=LEVELS;
  function random(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function mix(items,rng){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function legacyLayout(level){
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
  // Each row is symmetric and has an even tile count, providing a safe peeling fallback.
  const SHAPES=['Черепаха','Ромб','Крылья','Крепость','Мост','Лотос','Ступени','Песочные часы','Сад','Волна','Корона','Долина'];
  const profiles=[
    [4,2,0,0,0,0,2,4],[6,4,2,0,0,2,4,6],[0,2,4,2,2,4,2,0],
    [0,0,4,4,4,4,0,0],[2,2,0,4,4,0,2,2],[4,0,2,0,0,2,0,4],
    [6,4,4,2,2,0,0,0],[0,2,4,6,6,4,2,0],[2,0,2,0,0,2,0,2],
    [4,2,0,2,4,2,0,2],[0,4,0,2,2,0,4,0],[0,0,2,4,4,2,0,0]
  ];
  const overlap=(a,b)=>Math.abs(a.x-b.x)<1&&Math.abs(a.y-b.y)<1;
  function buildLayout(level,portrait){
    if(!validLevel(level))throw Error('Invalid level');
    const target=level<=10?32:level<=30?48:level<=60?72:level<=100?96:level<=150?120:144;
    const rng=random(level*3571+32452843),family=(level-1)%SHAPES.length;
    const rows=portrait?(target<=32?6:target<=72?8:10):(target<=48?4:target<=96?6:8);
    const width=portrait?(target<=48?4:target<=96?6:8):(target<=48?6:target<=96?8:10);
    const tiles=[],add=(x,y,z)=>tiles.push({id:tiles.length,x,y,z});
    for(let y=0;y<rows;y++){
      const profile=profiles[family][Math.floor(y*8/rows)];
      // Shallow side cutouts leave enough support for stacks inside the narrow footprint.
      const inset=portrait?Math.min((width-4)/2,profile>=4?1:0):Math.min(width-4,profile)/2;
      for(let x=inset;x<width-inset;x++)add(x,y,0);
    }
    const supported=(t,below)=>[.25,.75].every(dx=>[.25,.75].every(dy=>below.some(b=>t.x+dx>b.x&&t.x+dx<b.x+1&&t.y+dy>b.y&&t.y+dy<b.y+1)));
    for(let z=1;z<=4&&tiles.length<target;z++){
      const below=tiles.filter(t=>t.z===z-1),candidates=[],offset=z%2/2;
      for(let y=offset;y<rows-1;y++)for(let x=portrait?0:offset;x<=(width-2)/2;x++){
        const a={x,y,z},b={x:width-1-x,y,z};
        if(!overlap(a,b)&&supported(a,below)&&supported(b,below))candidates.push([a,b]);
      }
      const limit=z===4?target:tiles.length+Math.max(2,Math.ceil((target-tiles.length)*.65/2)*2);
      for(const pair of mix(candidates,rng)){
        if(tiles.length>=target||tiles.length>=limit)break;
        if(pair.some(t=>tiles.some(b=>b.z===z&&overlap(t,b))))continue;
        pair.forEach(t=>add(t.x,t.y,t.z));
      }
    }
    // Fill symmetric ground-level gaps; legacy layouts may then extend sideways.
    for(let spread=0;tiles.length<target&&(!portrait||spread<width/2);spread++)for(const y of mix(Array.from({length:rows},(_,i)=>i),rng)){
      if(tiles.length>=target)break;
      const x=(width-2)/2-spread,right=width-1-x;
      if(!tiles.some(t=>t.z===0&&t.y===y&&(t.x===x||t.x===right))){add(x,y,0);add(right,y,0);}
    }
    // Portrait layouts grow downward rather than sprouting horizontal wings.
    if(portrait)for(let y=rows;tiles.length<target;y++)for(let x=0;x<width/2&&tiles.length<target;x++){
      add(x,y,0);add(width-1-x,y,0);
    }
    const minX=Math.min(...tiles.map(t=>t.x));tiles.forEach(t=>t.x-=minX);
    return {tiles,rows:portrait?Math.max(...tiles.map(t=>t.y))+1:rows,name:SHAPES[family]};
  }
  const layout=level=>buildLayout(level,true),layoutV2=level=>buildLayout(level,false);
  const matchKey=type=>type>=34&&type<38?34:type>=38?38:type;
  const matches=(a,b)=>matchKey(a.type)===matchKey(b.type);
  function isFree(tile,tiles){
    if(!tile||!tiles.some(t=>t.id===tile.id))return false;
    if(tiles.some(t=>t.z>tile.z&&overlap(t,tile)))return false;
    const neighbor=dx=>tiles.some(t=>t.z===tile.z&&Math.abs(t.y-tile.y)<1&&t.x===tile.x+dx);
    return !neighbor(-1)||!neighbor(1);
  }
  function pairs(tiles){
    const free=tiles.filter(t=>isFree(t,tiles)),out=[];
    for(let i=0;i<free.length;i++)for(let j=i+1;j<free.length;j++)if(matches(free[i],free[j]))out.push([free[i].id,free[j].id]);
    return out;
  }
  function remove(tiles,ids){
    if(!Array.isArray(ids)||ids.length!==2||ids[0]===ids[1])return null;
    const [a,b]=ids.map(id=>tiles.find(t=>t.id===id));
    if(!a||!b||!matches(a,b)||!isFree(a,tiles)||!isFree(b,tiles))return null;
    return tiles.filter(t=>!ids.includes(t.id));
  }
  function pathFor(tiles,rng){
    // Precompute blockers once; deal generation and 10,000-level audits stay inexpensive.
    const blockers=new Map(tiles.map(t=>[t.id,{
      top:tiles.filter(b=>b.z>t.z&&overlap(t,b)).map(b=>b.id),
      left:tiles.filter(b=>b.z===t.z&&Math.abs(t.y-b.y)<1&&b.x===t.x-1).map(b=>b.id),
      right:tiles.filter(b=>b.z===t.z&&Math.abs(t.y-b.y)<1&&b.x===t.x+1).map(b=>b.id)
    }]));
    // Retry unrestricted peeling; symmetric row edges provide a bounded fallback.
    for(let attempt=0;attempt<33;attempt++){
      let left=tiles.slice();const path=[],alive=new Set(tiles.map(t=>t.id));
      while(left.length){
        const free=mix(left.filter(t=>{const b=blockers.get(t.id);return !b.top.some(id=>alive.has(id))&&(!b.left.some(id=>alive.has(id))||!b.right.some(id=>alive.has(id)));}),rng);
        const a=free[0],b=attempt===32?free.find(t=>t.id!==a?.id&&t.y===a.y&&t.z===a.z):free[1];
        if(!a||!b)break;
        path.push([a.id,b.id]);alive.delete(a.id);alive.delete(b.id);left=left.filter(t=>t.id!==a.id&&t.id!==b.id);
      }
      if(!left.length)return path;
    }
    throw Error('Unpairable geometry');
  }
  function assign(tiles,path,types){
    const kinds=new Map();path.forEach((pair,i)=>pair.forEach((id,j)=>kinds.set(id,Array.isArray(types[i])?types[i][j]:types[i])));
    return tiles.map(t=>({...t,type:kinds.get(t.id)}));
  }
  function legacyGenerate(level){
    if(level>1000)throw Error('Invalid legacy level');
    const shape=legacyLayout(level),rng=random(level*7919+104729),solution=pathFor(shape.tiles,rng);
    const kinds=mix(Array.from({length:18},(_,i)=>i),rng),variety=level<=10?8:18;
    const types=mix(solution.map((_,i)=>kinds[Math.floor(i/2)%variety]),rng);
    return {...shape,tiles:assign(shape.tiles,solution,types),solution};
  }
  function generate(level,version=VERSION){
    if(version===1)return legacyGenerate(level);
    const shape=version===2?layoutV2(level):layout(level),rng=random(level*7919+version*104729),solution=pathFor(shape.tiles,rng);
    const kinds=mix(Array.from({length:34},(_,i)=>i),rng),types=[];
    const normalCount=shape.tiles.length===144?136:shape.tiles.length;
    for(const kind of kinds.slice(0,normalCount/4))types.push([kind,kind],[kind,kind]);
    if(shape.tiles.length===144)for(const group of [[34,35,36,37],[38,39,40,41]]){
      const faces=mix(group,rng);types.push(faces.slice(0,2),faces.slice(2));
    }
    return {...shape,rulesVersion:RULES_VERSION,tiles:assign(shape.tiles,solution,mix(types,rng)),solution};
  }
  function shufflePlan(tiles,puzzle,seed){
    if(puzzle.rulesVersion===RULES_VERSION){
      try{return {positions:tiles,solution:pathFor(tiles,random(seed))};}catch{}
    }
    // A vertically trapped remainder needs rebuilding, not merely new faces.
    const solution=puzzle.solution.slice(-tiles.length/2),ids=new Set(solution.flat());
    return {positions:puzzle.tiles.filter(t=>ids.has(t.id)),solution};
  }
  function shuffle(tiles,puzzle,seed){
    if(!tiles.length)return [];
    const {positions,solution}=shufflePlan(tiles,puzzle,seed);
    const counts=new Map();for(const t of tiles){const key=matchKey(t.type);if(!counts.has(key))counts.set(key,[]);counts.get(key).push(t.type);}
    const types=[];for(const faces of counts.values()){if(faces.length%2)throw Error('Unpaired tiles');for(let i=0;i<faces.length;i+=2)types.push(faces.slice(i,i+2));}
    return assign(positions,solution,mix(types,random(seed)));
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
    const d=value&&typeof value==='object'?value:{},level=validLevel(d.level)?d.level:1,version=Array.isArray(d.actions)&&d.actions.length===0?VERSION:d.version===1&&level<=1000?1:d.version===2?2:VERSION,puzzle=generate(level,version);
    const completed=Array.isArray(d.completed)?[...new Set(d.completed.filter(validLevel))]:[];
    const tiles=d.version===version?replay(puzzle,d.actions):null;
    return {version,level,puzzle,tiles:tiles||puzzle.tiles,actions:tiles?d.actions:[],completed,sound:false,helpSeen:d.helpSeen===true};
  }
  const api={VERSION,LEVELS,TYPES,SHAPES,matchKey,matches,layout,isFree,pairs,remove,generate,shufflePlan,shuffle,apply,replay,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Mahjong=api;
})(globalThis);
