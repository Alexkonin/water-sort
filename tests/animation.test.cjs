// Run: node --test tests/animation.test.cjs
// Execute the production animation with a deterministic frame clock and a tiny DOM.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../water-sort.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const animation = script.slice(script.indexOf('const smooth ='), script.indexOf('function dropletsAt'));
class Element {
  constructor(rect = {}) {
    this.attrs = {}; this.children = []; this.style = { setProperty(k,v){this[k]=v;} };
    this.rect = rect; this.classes = new Set();
    this.classList = { add: (...c) => c.forEach(x => this.classes.add(x)),
      remove: (...c) => c.forEach(x => this.classes.delete(x)),
      contains: c => this.classes.has(c),
      toggle: (c, on) => on ? this.classes.add(c) : this.classes.delete(c) };
  }
  setAttribute(k,v){ this.attrs[k] = String(v); }
  getAttribute(k){ return this.attrs[k]; }
  appendChild(e){ this.children.push(e); return e; }
  append(...es){ this.children.push(...es); }
  get lastElementChild(){ return this.children.at(-1); }
  querySelector(){ return this.liquid; }
  getBoundingClientRect(){
    return { ...this.rect, top: this.rect.top + (this.classes.has('sel') ? -9 : 0) };
  }
}
function setup({ width=390, height=844, unit=26, reduced=false, caps=[5,5,5,2], rects } = {}) {
  let now=0, frames=[], paints=[];
  const positions = rects || [
    [20,130,48], [78,130,48], [210,410,48], [268,410+3*unit,48]
  ];
  const els=positions.map(([left,top,w],i)=>{
    const h=unit*(caps[i]+.3)+3, rect={left,top,width:w,height:h,right:left+w,bottom:top+h};
    const e=new Element(rect); e.liquid=new Element({ ...rect, bottom:rect.bottom-3 }); return e;
  });
  const context=vm.createContext({
    CAP:5, UNIT:unit, COLORS:['red','green','blue','gold','pink'],
    clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    state:{gen:1,caps}, tubeEls:els, reduceMotion:{matches:reduced},
    vpW:()=>width, vpH:()=>height,
    document:{body:new Element(), createElement:()=>new Element(), createElementNS:()=>new Element(),
      querySelector:()=>new Element({bottom:52})},
    performance:{now:()=>now},
    requestAnimationFrame:f=>frames.push(f),
    paintTube:i=>paints.push(i), sndFlow(){},sndPlop(){},dropletsAt(){},rippleAt(){},
  });
  vm.runInContext(animation,context);
  return { c:context, els, paints,
    pool:()=>vm.runInContext('PFX_POOL',context),
    step(t){now=t;const batch=frames;frames=[];batch.forEach(f=>f(t));},
    pending:()=>frames.length,
    pour(a=0,b=1,n=2,startA=5,startB=0){
      for(let i=0;i<startB;i++)els[b].liquid.appendChild(new Element());
      return context.animatePour({a,b,n,startA,startB,colorIdx:3,
        srcColors:['red','green','blue','gold','gold'].slice(0,startA)});
    }
  };
}
test('original color order at takeoff, no renderer swap during return, clean completion',async()=>{
  const h=setup(); h.els[0].classList.add('sel'); const done=h.pour();
  const fx=h.pool()[0];
  assert.equal(fx.rects[0].attrs.fill,'red');
  assert.ok(+fx.rects[0].attrs.y > +fx.rects[2].attrs.y, 'bottom color must stay at bottom');
  assert.equal(fx.surface.attrs.fill,'gold');
  assert.match(h.els[0].style.transform,/translate\(0\.000px,-9\.000px\)/);
  let hadStream=false, hadReturn=false;
  for(let t=16;t<=1800;t+=16){
    h.step(t);
    if(fx.stream.attrs.d)hadStream=true;
    if(hadStream && !fx.stream.attrs.d && fx.taken){
      hadReturn=true;
      assert.equal(h.els[0].liquid.style.visibility,'hidden');
      assert.equal(h.paints.length,0,'do not repaint before landing');
    }
    for(const e of [...fx.rects,fx.surface,fx.volume,fx.stream]){
      assert.ok(!Object.values(e.attrs).some(v=>/NaN|Infinity/.test(v)));
    }
  }
  await done;
  assert.ok(hadStream && hadReturn);
  assert.deepEqual(h.paints,[0,1]);
  assert.equal(h.pending(),0); assert.equal(fx.taken,false);
  assert.equal(h.els[0].style.transform,'');
  assert.equal(h.els[0].liquid.style.visibility,'');
  assert.ok(!h.els[0].classList.contains('flying'));
});
test('parallel pours have independent overlays and both complete',async()=>{
  const h=setup();const a=h.pour();const b=h.pour(2,3,1);
  assert.equal(h.pool().length,2);
  assert.notEqual(h.pool()[0].clipPath,h.pool()[1].clipPath);
  for(let t=16;t<2000;t+=16)h.step(t);
  await Promise.all([a,b]);
  assert.equal(h.paints.length,4); assert.ok(h.pool().every(f=>!f.taken));
});
test('level change cancels both animations without repainting the replacement board',async()=>{
  const h=setup();const a=h.pour();const b=h.pour(2,3,1);
  h.step(100);h.c.state.gen++;h.step(116);await Promise.all([a,b]);
  assert.equal(h.pending(),0);assert.equal(h.paints.length,0);
  assert.ok(h.pool().every(f=>!f.taken));
  assert.ok(h.els.every(e=>!e.classList.contains('flying') && !e.liquid.classList.contains('pouring')));
});
test('reduced motion completes the real move without any flight or overlay',async()=>{
  const h=setup({reduced:true});await h.pour();
  assert.equal(h.pool().length,0);assert.equal(h.pending(),0);assert.deepEqual(h.paints,[0,1]);
});
test('delayed frames and tab suspension still finish and release resources',async()=>{
  const h=setup();const done=h.pour();h.step(90);h.step(5000);await done;
  assert.equal(h.pending(),0);assert.equal(h.pool()[0].taken,false);assert.deepEqual(h.paints,[0,1]);
});
test('stream starts empty and its tail falls away instead of disappearing at the mouth',()=>{
  const h=setup(),c=h.c, p0=[100,100],p1=[100,300];
  assert.equal(c.ribbonPath(p0,p1,12,0,400,100),'');
  const stream=c.ribbonPath(p0,p1,12,450,400,100);
  assert.ok(stream.length>0);
  const y=Number(stream.match(/^M[\d.]+,([\d.]+)/)[1]);
  assert.ok(y>100 && y<300,'tail must be detached from mouth');
  assert.equal(c.ribbonPath(p0,p1,12,500,400,100),'');
});
test('flow stays inside mobile/desktop viewports and the mouth remains above destination',async()=>{
  for(const width of [320,390,812]){
    for(const requestedUnit of [20,36,60]){
      // Include opposite edges, close neighbours, long cross-row pours and tiny receivers.
      const w=width===320?40:width===390?52:72;
      const unit=Math.min(requestedUnit,w*.95);
      for(const destX of [12,width/2-w/2,width-w-12]){
        const h=setup({width,unit,rects:[[12,240,w],[destX,240,w],[12,530,w],[width-w-12,530,w]]});
        const done=h.pour();h.step(450);
        const m=h.els[0].style.transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\) rotate\(([-\d.]+)deg\) scale\(([-\d.]+)\)/);
        const [dx,dy,deg,scale]=m.slice(1).map(Number),r=h.els[0].rect;
        const map=h.c.mapper(r.left+r.width/2,r.top+r.height/2,dx,dy,deg,scale);
        for(const [x,y] of [[r.left,r.top],[r.right,r.top],[r.right,r.bottom],[r.left,r.bottom]].map(map)){
          assert.ok(x>=7.9 && x<=width-7.9,`outside x: ${x}, width ${width}, unit ${unit}`);
          assert.ok(y>=59.9,`outside top: ${y}`);
        }
        const cavity=h.c.cavityPolygon(r,5),lip=map([deg>0?cavity.right:cavity.left,cavity.top]);
        assert.ok(Math.abs(lip[0]-(destX+w/2))<.02);
        assert.ok(Math.abs(lip[1]-225)<.02);
        h.step(3000);await done;
      }
    }
  }
});
test('takeoff and landing keep the entire bottle on screen',async()=>{
  for(const width of [320,390,812]){
    const w=width===812?72:52,unit=w*.85;
    for(const destX of [12,width/2-w/2,width-w-12]){
      const h=setup({width,unit,rects:[[12,240,w],[destX,240,w],[12,530,w],[width-w-12,530,w]]});
      const done=h.pour();
      for(let t=16;t<1800;t+=16){
        h.step(t);
        const m=h.els[0].style.transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\) rotate\(([-\d.]+)deg\) scale\(([-\d.]+)\)/);
        if(!m)continue;
        const [dx,dy,deg,scale]=m.slice(1).map(Number),r=h.els[0].rect;
        const map=h.c.mapper(r.left+r.width/2,r.top+r.height/2,dx,dy,deg,scale);
        for(const [x,y] of [[r.left,r.top],[r.right,r.top],[r.right,r.bottom],[r.left,r.bottom]].map(map)){
          assert.ok(x>=7.9 && x<=width-7.9,`flight outside x: ${x}, width ${width}, t ${t}`);
          assert.ok(y>=59.9 && y<844,`flight outside y: ${y}, width ${width}, t ${t}`);
        }
      }
      await done;
    }
  }
});

test('layers respond with inertia, conserve volume and keep color order during tilt and return',async()=>{
  for(const [startA,n] of [[5,2],[5,1],[4,1]]){
    const h=setup(),done=h.pour(0,1,n,startA),fx=h.pool()[0];
    const original=fx.rects.slice(0,3).map(r=>({...r.attrs}));
    const cavity=h.c.cavityPolygon(h.els[0].rect);
    const volumes=original.map(r=>h.c.areaBelow(cavity.poly,+r.y)-h.c.areaBelow(cavity.poly,+r.y+ +r.height));
    let previousTopArea=Infinity,changedShape=false,hadSway=false,settled=false;
    for(let t=0;t<2000;t+=8){
      h.step(t);
      const pose=h.els[0].style.transform.match(/rotate\(([-\d.]+)deg\) scale\(([-\d.]+)\)/);
      if(!pose)continue;
      const scale=+pose[2];
      const wp=[...fx.clipPath.attrs.d.matchAll(/[ML]([-\d.]+),([-\d.]+)/g)].map(m=>[+m[1],+m[2]]);
      let priorBottom=Infinity;
      fx.rects.slice(0,3).forEach((r,i)=>{
        assert.equal(r.attrs.fill,original[i].fill);
        const [sway,cx,cy]=r.attrs.transform.match(/rotate\(([^)]+)\)/)[1].split(' ').map(Number);
        assert.ok(Math.abs(sway)<8,'inertia must remain a small departure from gravity');
        if(Math.abs(sway)>1)hadSway=true;
        if(hadSway && Math.abs(sway)<.01 && t>1200)settled=true;
        const lp=wp.map(h.c.mapper(cx,cy,0,0,-sway));
        const top=+r.attrs.y,bottom=top+ +r.attrs.height;
        assert.ok(bottom<=priorBottom+.05,'colors cannot exchange order');priorBottom=top;
        const area=(h.c.areaBelow(lp,top)-h.c.areaBelow(lp,bottom))/(scale*scale);
        assert.ok(Math.abs(area-volumes[i])<14,'tilting must preserve each lower color volume');
        if(Math.abs(+r.attrs.height/scale- +original[i].height)>2)changedShape=true;
      });
      const points=[...fx.surface.attrs.d.matchAll(/[ML]([-\d.]+),([-\d.]+)/g)].map(m=>[+m[1],+m[2]]);
      let area=0;
      for(let i=0;i<points.length;i++){
        const a=points[i],b=points[(i+1)%points.length];area+=a[0]*b[1]-b[0]*a[1];
      }
      area=Math.abs(area)/2/(scale*scale);
      assert.ok(area<=previousTopArea+14,'top color cannot gain volume while draining');previousTopArea=area;
    }
    assert.ok(changedShape,'liquid must redistribute inside the tilted bottle');
    assert.ok(hadSway && settled,'liquid must move independently then settle before the DOM handoff');
    await done;
  }
});
test('curved free surfaces conserve area at different angles and flatten without a jump',()=>{
  const h=setup(),cav=h.c.cavityPolygon(h.els[0].rect);
  const polygonArea=points=>Math.abs(points.reduce((s,a,i)=>{
    const b=points[(i+1)%points.length];return s+a[0]*b[1]-b[0]*a[1];
  },0))/2;
  for(const angle of [-75,-25,0,25,75]){
    const poly=cav.poly.map(h.c.mapper(cav.left,cav.top,0,0,angle));
    for(const layers of [.5,2,4.8]){
      const volume=h.c.areaBelow(cav.poly,cav.bottom-layers*26);
      for(const phase of [0,1.3,3,5]){
        const {wet,edge}=h.c.liquidSurface(poly,volume,2.5,phase);
        assert.ok(Math.abs(polygonArea(wet)-volume)<.2,'surface waves must not change liquid volume');
        assert.ok(edge.length>5,'free surface should visibly curve');
        const nearFlat=h.c.liquidSurface(poly,volume,.03,phase);
        const flat=h.c.liquidSurface(poly,volume,0,phase);
        assert.ok(Math.abs(nearFlat.edge[0][1]-flat.edge[0][1])<.1);
      }
    }
  }
});
test('pour angle follows remaining volume and connects the free surface to the lip',()=>{
  const h=setup(),cav=h.c.cavityPolygon(h.els[0].rect);
  let previousAngle=0;
  for(let layers=5;layers>=0;layers-=.125){
    const volume=h.c.areaBelow(cav.poly,cav.bottom-layers*26);
    const angle=h.c.pourAngle(cav,volume);
    assert.ok(angle>=previousAngle && angle<=90); previousAngle=angle;
    for(const side of [-1,1]){
      const lip=[side>0?cav.right:cav.left,cav.top];
      const m=h.c.mapper(lip[0],lip[1],0,0,side*angle);
      const held=h.c.areaBelow(cav.poly.map(m),cav.top);
      assert.ok(Math.abs(held-volume)<.1,'surface must meet the lip without reversing colors');
    }
  }
});
test('both edges of the jet start on the visible mouth and touch the source liquid',async()=>{
  const points=d=>[...d.matchAll(/[ML]([-\d.]+),([-\d.]+)/g)].map(m=>[+m[1],+m[2]]);
  for(const side of [-1,1])for(const startA of [1,3,5]){
    const h=setup({rects:[[side>0?20:230,240,64],[side>0?230:20,240,64],[20,500,64],[230,500,64]]});
    const done=h.pour(0,1,1,startA),fx=h.pool()[0],r=h.els[0].rect;
    const cav=h.c.cavityPolygon(r);
    let connectedFrames=0;
    for(let t=400;t<=650;t+=16){
      h.step(t);
      const jet=points(fx.stream.attrs.d||'');
      if(!jet.length)continue;
      const [dx,dy,deg,scale]=h.els[0].style.transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\) rotate\(([-\d.]+)deg\) scale\(([-\d.]+)\)/).slice(1).map(Number);
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      const unrotate=h.c.mapper(cx+dx,cy+dy,0,0,-deg,1/scale);
      const ends=[jet[0],jet.at(-1)];
      const local=ends.map(unrotate).map(([x,y])=>[x-dx,y-dy]);
      if(Math.abs(local[0][1]-cav.top)>.15)continue; // detached tail after the valve closes
      connectedFrames++;
      for(const [x,y] of local){
        assert.ok(Math.abs(y-cav.top)<.15,'both jet edges must start on the same physical mouth');
        assert.ok(x>=cav.left-.15 && x<=cav.right+.15,'jet cannot originate beside the glass');
      }
      const wet=points(fx.surface.attrs.d);
      for(const endpoint of ends){
        assert.ok(wet.some(p=>Math.hypot(p[0]-endpoint[0],p[1]-endpoint[1])<.2),
          `source and jet disconnected: side=${side}, layers=${startA}, t=${t}, endpoint=${endpoint}, wet=${JSON.stringify(wet)}`);
      }
    }
    assert.ok(connectedFrames>5,'exercise an actual continuous pour');
    h.step(3000);await done;
  }
});
