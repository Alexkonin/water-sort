/* A reproducible, non-oracle player: once per second choose an unblocked
   bottom color not already working, then another new color, then any exit.
   No solution order, rescue slot or undo. Seeds only break equal choices.
   LEVELS=1,2 RUNS=3 node scripts/audit-sand-balance.cjs [--baseline] */
const T=require('../sand-trucks.js'),G=require('../arrow-escape.js'),data=require('../sand-trucks-levels.js');
const levels=(process.env.LEVELS||'1,2,3,4,5,6,7,8,9,10').split(',').map(Number),runs=+(process.env.RUNS||3);
for(const level of levels){const stats=[];for(let seed=1;seed<=runs;seed++){
 const s=T.create(level);if(process.argv.includes('--baseline'))s.puzzle.limit=data[level-1].limit||3;
 let rng=seed,frame=0;
 for(;frame<20000&&!s.jammed&&!T.won(s);frame++){
  if(frame%25===0&&T.workingCount(s)<T.slotLimit(s)){
   const bottom=new Set(T.frontier(s.puzzle.art,s.grains).map(i=>s.grains[i]));
   const busy=new Set(s.active.filter(c=>c.loaded<s.puzzle.arrows[c.id].capacity).map(c=>s.puzzle.arrows[c.id].color));
   const free=G.available(s.puzzle,s.remaining);
   let choices=free.filter(id=>bottom.has(s.puzzle.arrows[id].color)&&!busy.has(s.puzzle.arrows[id].color));
   if(!choices.length)choices=free.filter(id=>!busy.has(s.puzzle.arrows[id].color));
   if(!choices.length)choices=free;
   rng=(Math.imul(rng,1664525)+1013904223)>>>0;
   if(choices.length)T.dispatch(s,choices[rng%choices.length]);
  }
  T.step(s,.04);
 }
 stats.push({seed,won:T.won(s),jam:s.jammed,percent:Math.round(s.grains.filter(c=>c<0).length/s.grains.length*100),seconds:Math.round(frame*.04)});
 }console.log(JSON.stringify({level,stats}));
}
