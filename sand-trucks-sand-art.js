/* Continuous color mass with fine, non-repeating grain texture. */
(function(root){
'use strict';
function create(canvas,colors){
 const ctx=canvas.getContext('2d'),texture=document.createElement('canvas');texture.width=canvas.width;texture.height=canvas.height;
 const noise=texture.getContext('2d'),pixels=noise.createImageData(texture.width,texture.height);let seed=731;
 for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const bright=(seed>>>30)&1,value=bright?255:40;pixels.data[i]=value;pixels.data[i+1]=bright?247:49;pixels.data[i+2]=bright?216:36;pixels.data[i+3]=12+(seed>>>24)%25;}
 noise.putImageData(pixels,0,0);
 let moving=false;
 function draw(art,grains,m,dt=0){
  const w=canvas.width/art.width,h=canvas.height/art.height;ctx.clearRect(0,0,canvas.width,canvas.height);
  const view=root.SandTruckSand?.visual(m,art,grains),blend=-Math.expm1(-Math.min(.05,Math.max(0,dt))/.035);
  moving=false;
  if(view)for(let i=0;i<grains.length;i++)if(grains[i]>=0){
   const tx=i%art.width+m.slide[i],ty=Math.floor(i/art.width)+m.offset[i]+Math.abs(m.slide[i])*m.drop[i];
   view.x[i]+=(tx-view.x[i])*blend;view.y[i]+=(ty-view.y[i])*blend;
   if(Math.abs(tx-view.x[i])+Math.abs(ty-view.y[i])<.005){view.x[i]=tx;view.y[i]=ty;}else moving=true;
  }
  for(let color=0;color<colors.length;color++){
   ctx.fillStyle=colors[color];ctx.beginPath();
   for(let i=0;i<grains.length;i++)if(grains[i]===color){
    const slide=m.slide[i],x=(view?view.x[i]:i%art.width+slide)*w,y=(view?view.y[i]:Math.floor(i/art.width)+m.offset[i]+Math.abs(slide)*m.drop[i])*h;
    let height=h;
    // A cell transfer briefly leaves a one-grain pore in the dense mass.
    // Join vertical neighbours across that pore; keep the free surface and
    // larger gaps around detached falling grains visible.
    if(view||!slide)for(let rows=1;rows<=2;rows++){
     const below=i+rows*art.width;if(below>=grains.length)break;
     if(grains[below]<0)continue;
     if(view){
      const by=view.y[below]*h;
      // A dense column under the moving grains seals sub-pixel cracks between
      // independently sliding neighbours without extending its free surface.
      if(by>y)ctx.rect(i%art.width*w-.2,y-.2,w+.4,Math.max(h,by-y)+.4);
     }else if(!m.slide[below]){const gap=(rows+m.offset[below]-m.offset[i])*h;if(gap>h)height=gap;}
     break;
    }
    ctx.rect(x-.2,y-.2,w+.4,height+.4);
   }
   ctx.fill();
  }
  ctx.globalCompositeOperation='source-atop';ctx.drawImage(texture,0,0);
  ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#163b3d';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';
 }
 return{draw,get moving(){return moving;}};
}
root.SandTruckSandArt={create};
})(globalThis);
