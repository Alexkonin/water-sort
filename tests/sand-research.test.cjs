const {test}=require('node:test'),assert=require('node:assert/strict');
const Columns=require('../output/sand-research-v01/columns.js'),Particles=require('../output/sand-research-v01/particles.js');
for(const Model of[Columns,Particles])test(Model.name+' conserves each color through collapse and extraction and respects container bounds',()=>{
 const art={width:30,height:24,cells:Array.from({length:720},(_,i)=>i%30>14?Math.floor(i/30)%6:-1)},m=new Model(art),initial=m.counts();let collected=0;
 for(let tick=0;tick<600;tick++){
  if(tick%12===0)collected+=m.collect(20,3);m.step(1/120);assert.deepEqual(m.counts(),initial);
  if(m.particles)for(const p of m.particles){assert.ok([p.x,p.y,p.vx,p.vy].every(Number.isFinite));assert.ok(p.x>=m.radius&&p.x<=art.width-m.radius);assert.ok(p.y>=m.radius&&p.y<=art.height-m.radius);}
  else for(const col of m.columns){for(let i=0;i<col.length;i++){const p=col[i];assert.ok(Number.isFinite(p.y)&&p.y>=-1e-6&&p.y<=art.height-1+1e-6);if(i)assert.ok(p.y-col[i-1].y>=1-1e-6);}}
 }
 assert.ok(collected>0);
});
