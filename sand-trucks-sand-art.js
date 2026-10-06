/* Continuous color mass with fine, non-repeating grain texture. */
(function(root){
'use strict';
function create(canvas,colors){
 const ctx=canvas.getContext('2d'),texture=document.createElement('canvas');texture.width=canvas.width;texture.height=canvas.height;
 const noise=texture.getContext('2d'),pixels=noise.createImageData(texture.width,texture.height);let seed=731;
 for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const bright=(seed>>>30)&1,value=bright?255:40;pixels.data[i]=value;pixels.data[i+1]=bright?247:49;pixels.data[i+2]=bright?216:36;pixels.data[i+3]=12+(seed>>>24)%25;}
 noise.putImageData(pixels,0,0);
 function draw(art,grains,m){
  const w=canvas.width/art.width,h=canvas.height/art.height;ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let color=0;color<colors.length;color++){
   ctx.fillStyle=colors[color];ctx.beginPath();
   for(let i=0;i<grains.length;i++)if(grains[i]===color){
    const slide=m.slide[i],x=(i%art.width+slide)*w,y=(Math.floor(i/art.width)+m.offset[i]+Math.abs(slide)*m.drop[i])*h;
    let height=h;
    // A cell transfer briefly leaves a one-grain pore in the dense mass.
    // Join vertical neighbours across that pore; keep the free surface and
    // larger gaps around detached falling grains visible.
    if(!slide)for(let rows=1;rows<=2;rows++){
     const below=i+rows*art.width;if(below>=grains.length)break;
     if(grains[below]<0)continue;
     if(!m.slide[below]){const gap=(rows+m.offset[below]-m.offset[i])*h;if(gap>h)height=gap;}
     break;
    }
    ctx.rect(x-.2,y-.2,w+.4,height+.4);
   }
   ctx.fill();
  }
  ctx.globalCompositeOperation='source-atop';ctx.drawImage(texture,0,0);
  ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#163b3d';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';
 }
 return{draw};
}
root.SandTruckSandArt={create};
})(globalThis);
