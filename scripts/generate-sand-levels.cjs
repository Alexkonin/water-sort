/* Deterministic campaign authoring. Every truck batch is replayed with the real physics. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),G=require('../arrow-escape.js');
const firstTen=require('../sand-trucks-levels.js').slice(0,10);
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};}
const {picture}=require('./sand-picture-art.cjs');
const {refine}=require('./refine-sand-intro.cjs');
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
 const art=picture(n),arrows=parking(n),limit=n<31?3:n<61?4:5;
 return refine({...art,width:12,height:12,limit,arrows,solution:arrows.map(a=>a.id)},n-1,art.rows);
}
if(require.main===module){
 const levels=firstTen.slice(),start=Date.now();for(let n=11;n<=100;n++){levels.push(build(n));console.log(n,levels.at(-1).title,levels.at(-1).arrows.length+' trucks',Math.round((Date.now()-start)/1000)+'s');}
 if(new Set(levels.map(l=>l.rows.join(''))).size!==100)throw Error('duplicate picture');
 const output='/* 100 pictures and parking lots; generated release orders replay the actual sand physics. */\n(function(root){\n  const levels='+JSON.stringify(levels)+';\n  if(typeof module!=="undefined"&&module.exports)module.exports=levels;else root.SandTruckLevels=levels;\n})(globalThis);\n';
 fs.writeFileSync(path.join(root,'sand-trucks-levels.js'),output);
}
module.exports={picture,parking,build};
