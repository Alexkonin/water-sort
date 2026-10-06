const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const S=require('../sand-trucks-sand.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../sand-trucks-sand-art.js'),'utf8');
function render(grains,motion=S.create(grains.length)){
 const shapes=[];
 const ctx={globalCompositeOperation:'source-over',clearRect(){shapes.length=0;},beginPath(){},rect(x,y,w,h){shapes.push({x,y,w,h,color:this.fillStyle});},fill(){},drawImage(){},fillRect(){}};
 const canvas={width:10,height:grains.length*10,getContext:()=>ctx};
 const scope={SandTruckSand:S,document:{createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})}};
 vm.runInNewContext(source,scope);const renderer=scope.SandTruckSandArt.create(canvas,['gold','blue']),art={width:1,height:grains.length};renderer.draw(art,grains,motion);
 return Object.assign(y=>shapes.findLast(r=>5>=r.x&&5<r.x+r.w&&y>=r.y&&y<r.y+r.h)?.color,{draw:dt=>renderer.draw(art,grains,motion,dt),moving:()=>renderer.moving});
}
test('a transient one-cell pore does not expose the dark background inside sand',()=>{
 const grains=[-1,0,-1,1,1],motion=S.create(grains.length);motion.offset[3]=.8;
 const before=JSON.stringify({grains,motion}),pixel=render(grains,motion);
 for(let y=10;y<50;y++)assert.ok(pixel(y),`dark pore at ${y}`);
 assert.equal(pixel(5),undefined,'empty area above the surface stays empty');
 assert.equal(pixel(45),'blue','the lower grain keeps its own color');
 assert.equal(JSON.stringify({grains,motion}),before,'rendering cannot change the puzzle or its saved motion');
});
test('larger air gaps around detached falling grains remain visible',()=>{
 const pixel=render([0,-1,-1,1]);
 assert.equal(pixel(5),'gold');assert.equal(pixel(15),undefined);assert.equal(pixel(25),undefined);assert.equal(pixel(35),'blue');
});
test('continuous vertical motion joins neighbouring grains without filling the free surface',()=>{
 const motion=S.create(3);motion.offset[0]=.2;motion.offset[1]=.9;
 const pixel=render([0,1,1],motion);
 assert.equal(pixel(1),undefined);for(let y=3;y<30;y++)assert.ok(pixel(y),`dark seam at ${y}`);
});
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
