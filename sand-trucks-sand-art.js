/* Render a single dense surface instead of independently patched grain rectangles. */
(function(root){
'use strict';
function create(canvas,colors){
 const ctx=canvas.getContext('2d'),buffer=document.createElement('canvas');let field,ink,image,xs,ys,moving=false;
 function draw(art,grains,m,dt=0){
  if(!field||field.width!==art.width*4||field.height!==art.height*4){
   field=root.SandTruckSurface.create(art.width,art.height,colors);buffer.width=field.width;buffer.height=field.height;ink=buffer.getContext('2d');image=ink.createImageData(field.width,field.height);xs=new Float64Array(grains.length);ys=new Float64Array(grains.length);
  }
  const view=root.SandTruckSand?.visual(m,art,grains),blend=-Math.expm1(-Math.min(.05,Math.max(0,dt))/.035);moving=false;
  for(let i=0;i<grains.length;i++)if(grains[i]>=0){
   const tx=i%art.width+m.slide[i],ty=Math.floor(i/art.width)+m.offset[i]+Math.abs(m.slide[i])*m.drop[i];
   if(view){
    view.x[i]+=(tx-view.x[i])*blend;view.y[i]+=(ty-view.y[i])*blend;
    if(Math.abs(tx-view.x[i])+Math.abs(ty-view.y[i])<.005){view.x[i]=tx;view.y[i]=ty;}else moving=true;
   }
   xs[i]=(view?view.x[i]:tx)+.5;ys[i]=(view?view.y[i]:ty)+.5;
  }
  image.data.set(field.render(xs,ys,grains));ink.putImageData(image,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(buffer,0,0,canvas.width,canvas.height);
 }
 return{draw,get moving(){return moving;}};
}
root.SandTruckSandArt={create};
})(globalThis);
