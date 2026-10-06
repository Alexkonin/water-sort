/* Experimental 2D positional granular solver. No game saves or shared state. */
(function(root){
'use strict';
class ParticleSand{
 constructor(art){
  this.width=art.width;this.height=art.height;this.particles=[];this.removed=Array(6).fill(0);this.tick=0;this.radius=.49;this.iterations=4;
  art.cells.forEach((color,i)=>{if(color>=0)this.particles.push({x:i%art.width+.5+(((i*1664525+1013904223)>>>0)%101/100-.5)*.025,y:Math.floor(i/art.width)+.5,ox:0,oy:0,vx:0,vy:0,color});});
  this.head=new Int32Array((this.width+2)*(this.height+2));this.next=new Int32Array(art.cells.length);
 }
 collect(center,radius=5){
  let count=0;this.particles=this.particles.filter(p=>{if(p.y>this.height-1.05&&Math.abs(p.x-center)<radius){this.removed[p.color]++;count++;return false;}return true;});return count;
 }
 step(dt){
  const ps=this.particles,r=this.radius,d=r*2,stride=this.width+2,g=80,friction=.55;
  this.tick++;
  for(const p of ps){p.ox=p.x;p.oy=p.y;p.vy+=g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
  for(let pass=0;pass<this.iterations;pass++){
   this.head.fill(-1);
   for(let i=0;i<ps.length;i++){const p=ps[i];p.x=Math.max(r,Math.min(this.width-r,p.x));p.y=Math.max(r,Math.min(this.height-r,p.y));const bin=Math.floor(p.y)*stride+Math.floor(p.x);this.next[i]=this.head[bin];this.head[bin]=i;}
   // Spatial bins limit contacts to neighbouring grains, not all particle pairs.
   for(let i=0;i<ps.length;i++){
    const a=ps[i],bx=Math.floor(a.x),by=Math.floor(a.y);
    for(let yy=Math.max(0,by-1);yy<=Math.min(this.height,by+1);yy++)for(let xx=Math.max(0,bx-1);xx<=Math.min(this.width,bx+1);xx++)for(let j=this.head[yy*stride+xx];j>=0;j=this.next[j]){
     if(j<=i)continue;const b=ps[j];let dx=b.x-a.x,dy=b.y-a.y,dist2=dx*dx+dy*dy;if(dist2>=d*d)continue;
     if(dist2<1e-12){dx=.0001;dy=0;dist2=dx*dx;}const dist=Math.sqrt(dist2),nx=dx/dist,ny=dy/dist,penetration=d-dist;
     a.x-=nx*penetration*.5;a.y-=ny*penetration*.5;b.x+=nx*penetration*.5;b.y+=ny*penetration*.5;
     // Coulomb-style positional friction resists tangential contact slip.
     const tx=-ny,ty=nx,slip=((b.x-b.ox)-(a.x-a.ox))*tx+((b.y-b.oy)-(a.y-a.oy))*ty,correction=Math.sign(slip)*Math.min(Math.abs(slip),friction*penetration)*.5;
     a.x+=tx*correction;a.y+=ty*correction;b.x-=tx*correction;b.y-=ty*correction;
    }
   }
  }
  for(const p of ps){p.x=Math.max(r,Math.min(this.width-r,p.x));p.y=Math.max(r,Math.min(this.height-r,p.y));p.vx=(p.x-p.ox)/dt*.985;p.vy=(p.y-p.oy)/dt*.985;if(p.y>=this.height-r-.001)p.vx*=.9;}
 }
 draw(ctx,colors,raw=false){
  if(!raw)return this.drawMass(ctx,colors);
  const sx=ctx.canvas.width/this.width,sy=ctx.canvas.height/this.height,inkRadius=raw?this.radius:.73;ctx.fillStyle='#163b3d';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
  // Overlapping splats reconstruct a continuous visible surface; raw mode
  // shows the actual collision radii for inspection. This changes no mass.
  for(let color=0;color<colors.length;color++){ctx.fillStyle=colors[color];ctx.beginPath();for(const p of this.particles)if(p.color===color){const x=p.x*sx,y=p.y*sy;ctx.moveTo(x+inkRadius*sx,y);ctx.ellipse(x,y,inkRadius*sx,inkRadius*sy,0,0,Math.PI*2);}ctx.fill();}
 }
 drawMass(ctx,colors){
  if(!this.field){const field=SandTruckSurface.create(this.width,this.height,colors),canvas=document.createElement('canvas');canvas.width=field.width;canvas.height=field.height;const ink=canvas.getContext('2d');this.field={field,canvas,ink,image:ink.createImageData(field.width,field.height),xs:new Float64Array(this.width*this.height),ys:new Float64Array(this.width*this.height),colors:new Int8Array(this.width*this.height)};}
  const f=this.field;for(let i=0;i<this.particles.length;i++){const p=this.particles[i];f.xs[i]=p.x;f.ys[i]=p.y;f.colors[i]=p.color;}
  f.image.data.set(f.field.render(f.xs,f.ys,f.colors,this.particles.length));f.ink.putImageData(f.image,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(f.canvas,0,0,ctx.canvas.width,ctx.canvas.height);
 }
 counts(){return Array.from({length:6},(_,c)=>this.particles.filter(p=>p.color===c).length+this.removed[c]);}
}
if(typeof module!=='undefined'&&module.exports)module.exports=ParticleSand;else root.ParticleSand=ParticleSand;
})(globalThis);
