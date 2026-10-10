const {test}=require('node:test'),assert=require('node:assert/strict'),Surface=require('../sand-trucks-surface.js');
const colors=['#f5b544','#387fa9'];
function draw(rows){const w=rows[0].length,h=rows.length,field=Surface.create(w,h,colors),xs=[],ys=[],grains=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){xs.push(x+.5);ys.push(y+.5);grains.push(rows[y][x]);}const input=JSON.stringify({xs,ys,grains});field.render(xs,ys,grains);assert.equal(JSON.stringify({xs,ys,grains}),input);return field;}
function at(f,x,y){return f.material[Math.floor(y*f.scale)*f.width+Math.floor(x*f.scale)];}
test('enclosed gaps of several cells become material, not dark background',()=>{
 const f=draw([[-1,-1,-1,-1,-1,-1,-1],[0,0,0,0,0,0,0],[0,0,-1,-1,-1,1,1],[0,0,-1,-1,-1,1,1],[0,0,0,0,1,1,1]]);
 for(let y=2;y<4;y++)for(let x=2;x<5;x++)assert.ok(at(f,x+.5,y+.5)>=0);
 assert.equal(at(f,3.5,.25),-1);assert.equal(at(f,1.5,2.5),0);assert.equal(at(f,5.5,2.5),1);
});
test('exterior air and large gaps below detached clumps remain empty',()=>{
 const f=draw([[0,0,-1,-1,1,1],[0,0,-1,-1,1,1],[-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1],[1,1,1,1,1,1]]);
 assert.equal(at(f,2.5,1.5),-1);assert.equal(at(f,1.5,3.5),-1);assert.equal(at(f,4.5,1.5),1);
});
test('rendering empty sand clears the previous frame and keeps opaque background',()=>{
 const f=Surface.create(4,4,colors);f.render([1.5],[1.5],[0]);f.render([],[],[]);
 assert.ok(f.material.every(c=>c===-1));for(let i=0;i<f.pixels.length;i+=4)assert.deepEqual(Array.from(f.pixels.slice(i,i+4)),[22,59,61,255]);
});
test('fractional positions cannot create an enclosed black component',()=>{
 const w=20,h=16,f=Surface.create(w,h,colors),xs=[],ys=[],g=[];
 for(let y=2;y<h;y++)for(let x=0;x<w;x++){xs.push(x+.5+.3*Math.sin(x*5+y));ys.push(y+.5+.4*Math.cos(y*7+x));g.push(y>9?1:0);}
 f.render(xs,ys,g);const seen=new Uint8Array(f.material.length),q=[];const add=i=>{if(f.material[i]<0&&!seen[i]){seen[i]=1;q.push(i);}};
 for(let x=0;x<f.width;x++){add(x);add((f.height-1)*f.width+x);}for(let y=0;y<f.height;y++){add(y*f.width);add((y+1)*f.width-1);}
 for(let k=0;k<q.length;k++){const i=q[k],x=i%f.width;if(x)add(i-1);if(x<f.width-1)add(i+1);if(i>=f.width)add(i-f.width);if(i<f.material.length-f.width)add(i+f.width);}
 for(let i=0;i<f.material.length;i++)if(f.material[i]<0)assert.equal(seen[i],1,`isolated dark pixel ${i}`);
});
test('the recorded level-11 artifact reconstructs without changing its saved state',()=>{
 // Use the captured grains, not restore(), which correctly restarts an older
 // campaign picture after its artwork and truck loads have been replaced.
 const sample=require('./fixtures/sand-render-level11.json'),T=require('../sand-trucks.js'),before=JSON.stringify(sample.save),art=sample.puzzle.art;
 const f=Surface.create(art.width,art.height,T.COLORS);f.render(sample.view.x.map(x=>x+.5),sample.view.y.map(y=>y+.5),sample.save.grains);
 const air=new Set();for(let i=0;i<f.material.length;i++)if(f.material[i]<0)air.add(i);
 const stack=[...air].filter(i=>i<f.width||i>=f.material.length-f.width||i%f.width===0||i%f.width===f.width-1);
 for(let i=0;i<stack.length;i++){const p=stack[i];if(!air.delete(p))continue;for(const n of[p-f.width,p+f.width,...(p%f.width?[p-1]:[]),...(p%f.width<f.width-1?[p+1]:[])])if(air.has(n))stack.push(n);}
 assert.equal(air.size,0,'no isolated background remains within the picture');
 assert.equal(JSON.stringify(sample.save),before);
});
