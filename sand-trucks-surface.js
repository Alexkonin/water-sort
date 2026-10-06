/* Continuous sand surface reconstructed from grain positions, independent of physics. */
(function(root){
'use strict';
function create(width,height,colors){
 const scale=4,w=width*scale,h=height*scale,size=w*h;
 const material=new Int8Array(size),distance=new Float32Array(size),exterior=new Uint8Array(size),queue=new Int32Array(size),pixels=new Uint8ClampedArray(size*4);
 const rgb=colors.map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16))),background=[22,59,61];
 function render(xs,ys,grains,count=grains.length){
  material.fill(-1);distance.fill(Infinity);exterior.fill(0);
  const radius=.73*scale;
  // Nearest material wins inside overlapping particle footprints. Blending
  // colors would muddy the palette used to choose the next truck.
  for(let i=0;i<count;i++)if(grains[i]>=0){
   const cx=xs[i]*scale,cy=ys[i]*scale;
   for(let y=Math.max(0,Math.floor(cy-radius));y<Math.min(h,Math.ceil(cy+radius));y++)for(let x=Math.max(0,Math.floor(cx-radius));x<Math.min(w,Math.ceil(cx+radius));x++){
    const at=y*w+x,d=(x+.5-cx)**2+(y+.5-cy)**2;
    if(d<=radius*radius&&d<distance[at]){distance[at]=d;material[at]=grains[i];}
   }
  }
  // Air connected to any boundary is outside the mass. It must remain air,
  // including the gap below a falling clump and open collection channels.
  let read=0,end=0;
  const air=i=>{if(material[i]<0&&!exterior[i]){exterior[i]=1;queue[end++]=i;}};
  for(let x=0;x<w;x++){air(x);air((h-1)*w+x);}for(let y=0;y<h;y++){air(y*w);air(y*w+w-1);}
  while(read<end){const i=queue[read++],x=i%w;if(x)air(i-1);if(x<w-1)air(i+1);if(i>=w)air(i-w);if(i<size-w)air(i+w);}
  // Fill only enclosed pores with their nearest material. This is surface
  // reconstruction, never a mutation of grains, collisions or collected mass.
  read=0;end=0;for(let i=0;i<size;i++)if(material[i]>=0)queue[end++]=i;
  const spread=(to,from)=>{if(material[to]<0&&!exterior[to]){material[to]=material[from];queue[end++]=to;}};
  while(read<end){const i=queue[read++],x=i%w;if(x)spread(i-1,i);if(x<w-1)spread(i+1,i);if(i>=w)spread(i-w,i);if(i<size-w)spread(i+w,i);}
  let seed=731;
  for(let i=0;i<size;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const color=material[i]<0?background:rgb[material[i]],noise=material[i]<0?1:1+((seed>>>24)/255-.5)*.035;
   for(let c=0;c<3;c++)pixels[i*4+c]=color[c]*noise;pixels[i*4+3]=255;
  }
  return pixels;
 }
 return{scale,width:w,height:h,pixels,material,exterior,render};
}
const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SandTruckSurface=api;
})(globalThis);
