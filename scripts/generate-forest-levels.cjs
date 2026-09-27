// Детерминированный каталог: node scripts/generate-forest-levels.cjs
const fs=require('node:fs'),path=require('node:path');
const {step,search,solution}=require('../forest-lights.js');
let seed=3826;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const levels=[],used=new Set(),recent=[];
// Два коротких знакомства, затем три огонька, с девятого уровня — четыре.
const stages=[[2,2,2,3],[3,6,3,4],[4,272,4,10],[5,220,10,13],[6,240,13,16],[7,260,16,18]];
const pattern=s=>s[0]==='R'?s.replace(/[LR]/g,m=>m==='L'?'R':'L'):s;
function rotationOnly(start,target){let s=start;for(let i=0;i<8;i++,s=step(s,'R'))if(s===target)return true;return false;}
function directTrioOnly(start,target){let s=start;for(let i=0;i<3;i++,s=step(s,'T'))if(s===target)return true;return false;}
for(const [colors,count,min,maxDepth] of stages){
  const base=Array(8).fill('0');
  for(let c=1;c<=colors;c++)base[Math.floor((c-1)*8/colors)]=String(c);
  const tables=[];let target=base.join('');
  for(let rotation=0;rotation<8;rotation++){
    const table=search(target), buckets=new Map();
    for(const [start,{depth}] of table){
      // Одно кольцо не решает ни одну задачу. Один поворот тройки тоже не
      // заменяет полноценную задачу: нужны и подвод огоньков, и перестановки.
      if(depth<min || depth>maxDepth || rotationOnly(start,target)||directTrioOnly(start,target))continue;
      const misplaced=[...start].filter((c,i)=>c!=='0'&&c!==target[i]).length;
      if(misplaced<Math.min(colors,2))continue;
      if(!buckets.has(depth))buckets.set(depth,[]);
      buckets.get(depth).push(start);
    }
    tables.push({target,table,buckets});target=step(target,'R');
  }
  for(let i=0;i<count;i++){
    const depth=Math.round(min+(maxDepth-min)*i/Math.max(1,count-1));
    const candidates=[];
    for(const t of tables){
      for(const start of t.buckets.get(depth)||[]){
        if(used.has(t.target+':'+start))continue;
        candidates.push({start,t});
      }
    }
    // Выбираем из перемешанной выборки, оценивая разнообразие приёмов,
    // начальное расположение рабочей тройки и неподвижных отметок.
    let selected,top=-Infinity;
    for(let n=0;n<Math.min(180,candidates.length);n++){
      const j=n+Math.floor(random()*(candidates.length-n));
      [candidates[n],candidates[j]]=[candidates[j],candidates[n]];
      const {start,t}=candidates[n],moves=solution(start,t.target,t.table),sig=pattern(moves);
      if(recent.at(-1)===sig)continue;
      const ready=start.slice(3,6).replaceAll('0','').length;
      const preferTrio=levels.length%2===0;
      let score=random()+(recent.includes(sig)?-8:3)+(moves.startsWith('T')===preferTrio?4:0);
      if(levels.length<20)score+=(ready>=2?3:0);
      if(levels.at(-1)?.target===t.target)score-=2;
      if(score>top){top=score;selected={start,target:t.target,par:depth,solution:moves};}
    }
    if(!selected)throw Error('No varied candidate for level '+(levels.length+1));
    used.add(selected.target+':'+selected.start);levels.push(selected);
    recent.push(pattern(selected.solution));if(recent.length>5)recent.shift();
  }
  console.log(colors+' огоньков: '+count+' уровней, минимум ходов '+min+'–'+maxDepth);
}
if(levels.length!==1000)throw Error('Expected 1000');
const out='/* 1000 проверенных уровней. Генератор: scripts/generate-forest-levels.cjs. */\n'+
  'globalThis.FOREST_CATALOG_VERSION = 2;\n'+
  'globalThis.FOREST_LEVELS = '+JSON.stringify(levels)+';\n';
fs.writeFileSync(path.join(__dirname,'../forest-lights-levels.js'),out);
