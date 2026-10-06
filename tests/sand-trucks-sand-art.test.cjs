const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const S=require('../sand-trucks-sand.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../sand-trucks-sand-art.js'),'utf8');
function render(grains,motion=S.create(grains.length)){
 const ctx={drawImage(){}};
 const canvas={width:10,height:grains.length*10,getContext:()=>ctx};
 const scope={SandTruckSurface:require('../sand-trucks-surface.js'),SandTruckSand:S,document:{createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})}};
 vm.runInNewContext(source,scope);const renderer=scope.SandTruckSandArt.create(canvas,['#f5b544','#387fa9']),art={width:1,height:grains.length};renderer.draw(art,grains,motion);
 return {draw:dt=>renderer.draw(art,grains,motion,dt),moving:()=>renderer.moving};
}
test('grain identity keeps its drawn position through cell transfers and eases to rest',()=>{
 const grains=[0,-1,-1,-1],motion=S.create(4),art={width:1,height:4},pixel=render(grains,motion),view=S.visual(motion,art,grains);
 motion.offset[0]=.99;motion.velocity[0]=20;S.step(art,grains,motion,0,1/120);
 assert.equal(grains[0],-1);assert.equal(grains[1],0);assert.equal(view.y[1],0,'cell ownership changes without teleporting the drawn grain');
 const snapshot=JSON.stringify({grains,motion:S.snapshot(motion)}),target=1+motion.offset[1];
 pixel.draw(1/60);assert.ok(view.y[1]>0&&view.y[1]<target);assert.equal(pixel.moving(),true);
 for(let n=0;n<60;n++)pixel.draw(1/60);
 assert.equal(view.y[1],target);assert.equal(pixel.moving(),false);
 assert.equal(JSON.stringify({grains,motion:S.snapshot(motion)}),snapshot,'visual settling cannot alter collisions or saves');
});
test('diagonal transfers carry the same visual particle into its destination',()=>{
 const art={width:3,height:3},grains=[-1,0,-1,-1,1,-1,1,1,1],motion=S.create(9),view=S.visual(motion,art,grains);
 S.step(art,grains,motion,0,1/120);const to=grains.indexOf(0);
 assert.notEqual(to,1);assert.equal(view.x[to],1);assert.equal(view.y[to],0);
});
