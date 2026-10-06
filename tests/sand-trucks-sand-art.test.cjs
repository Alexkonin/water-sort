const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const S=require('../sand-trucks-sand.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../sand-trucks-sand-art.js'),'utf8');
function render(grains,motion=S.create(grains.length)){
 const shapes=[];
 const ctx={globalCompositeOperation:'source-over',clearRect(){shapes.length=0;},beginPath(){},rect(x,y,w,h){shapes.push({x,y,w,h,color:this.fillStyle});},fill(){},drawImage(){},fillRect(){}};
 const canvas={width:10,height:grains.length*10,getContext:()=>ctx};
 const scope={document:{createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})}};
 vm.runInNewContext(source,scope);scope.SandTruckSandArt.create(canvas,['gold','blue']).draw({width:1,height:grains.length},grains,motion);
 return y=>shapes.findLast(r=>5>=r.x&&5<r.x+r.w&&y>=r.y&&y<r.y+r.h)?.color;
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
