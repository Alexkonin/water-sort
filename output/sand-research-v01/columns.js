/* Dense-column approximation: vertical contacts plus surface avalanches. */
(function(root){
'use strict';
class ColumnSand{
 constructor(art){this.width=art.width;this.height=art.height;this.columns=Array.from({length:this.width},()=>[]);this.removed=Array(6).fill(0);this.tick=0;art.cells.forEach((color,i)=>{if(color>=0)this.columns[i%this.width].push({y:Math.floor(i/this.width),v:0,color});});}
 collect(center,radius=5){let count=0;for(let x=0;x<this.width;x++){const col=this.columns[x],p=col.at(-1);if(p&&p.y>=this.height-1-.01&&Math.abs(x+.5-center)<radius){col.pop();this.removed[p.color]++;count++;}}return count;}
 step(dt){
  this.tick++;
  // Ordered contacts keep the dense material closed. Each grain accelerates
  // until it touches the next one; no independently smoothed render positions.
  for(const col of this.columns){let floor=this.height;for(let i=col.length-1;i>=0;i--){const p=col[i];p.v+=80*dt;p.y+=p.v*dt;if(p.y+1>=floor){p.y=floor-1;p.v=i===col.length-1?0:col[i+1].v;}floor=p.y;}}
  // Surface-only flow is a deliberate approximation; it cannot reproduce
  // deep internal shear bands. Relax a slope above approximately 34 degrees.
  if(this.tick%3===0)for(let n=0;n<this.width;n++){
   const x=this.tick%2?n:this.width-1-n,col=this.columns[x];if(!col.length)continue;
   const p=col[0];if(p.moveTick===this.tick)continue;let best=-1,gap=1.5;
   for(const dx of[-1,1]){const q=x+dx;if(q<0||q>=this.width)continue;const surface=this.columns[q][0]?.y??this.height;if(surface-p.y>gap){gap=surface-p.y;best=q;}}
   if(best>=0){col.shift();p.moveTick=this.tick;p.v=Math.max(p.v,4);this.columns[best].unshift(p);}
  }
 }
 draw(ctx,colors){const sx=ctx.canvas.width/this.width,sy=ctx.canvas.height/this.height;ctx.fillStyle='#163b3d';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);for(let x=0;x<this.width;x++)for(const p of this.columns[x]){ctx.fillStyle=colors[p.color];const left=Math.floor(x*sx),top=Math.floor(p.y*sy);ctx.fillRect(left,top,Math.ceil((x+1)*sx)-left,Math.ceil((p.y+1)*sy)-top);}}
 counts(){const n=this.removed.slice();for(const col of this.columns)for(const p of col)n[p.color]++;return n;}
}
if(typeof module!=='undefined'&&module.exports)module.exports=ColumnSand;else root.ColumnSand=ColumnSand;
})(globalThis);
