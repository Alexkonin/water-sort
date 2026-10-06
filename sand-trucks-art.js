/* Rounded toy trucks with divided cargo beds; geometry stays strictly top-down. */
(function(root){
  'use strict';
  const NS='http://www.w3.org/2000/svg';let serial=0;
  const PALETTE=['#f5b544','#f4df68','#f1ecd6','#28bfc5','#387fa9','#cd6656'];
  function el(tag,attrs={}){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;}
  function add(g,tag,attrs){const n=el(tag,attrs);g.append(n);return n;}
  function box(g,x,y,w,h,r,fill,attrs={}){return add(g,'rect',{x,y,width:w,height:h,rx:r,fill,...attrs});}
  function shape(g,d,fill,attrs={}){return add(g,'path',{d,fill,...attrs});}
  function circle(g,x,y,r,fill){return add(g,'circle',{cx:x,cy:y,r,fill});}
  function mix(a,b,t){const ca=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)),cb=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));return'#'+ca.map((v,i)=>Math.round(v+(cb[i]-v)*t).toString(16).padStart(2,'0')).join('');}
  function create(a,cell=28){
    const root=el('g',{'data-truck-art':'toy'}),g=el('g'),long=a.cells.length===3,L=a.cells.length*cell-11,t=-L/2,b=L/2,color=PALETTE[a.color];
    const dark=mix(color,'#24483c',.58),mid=mix(color,'#365948',.28),light=mix(color,'#fff0ba',.43),bed=t+20,bottom=b-5,sections=long?3:2;
    root.append(g);
    // A continuous rounded body keeps the cabin visibly attached to its bed.
    for(const y of[t+6,b-11])for(const x of[-12,8])box(g,x,y,4,8,1.6,'#102b29');
    box(g,-10.5,t,21,L,6,color,{stroke:'#163933','stroke-width':1.2});
    shape(g,`M-7 ${t+4}Q0 ${t+1} 7 ${t+4}V${t+8}Q0 ${t+11} -7 ${t+8}Z`,'#20434a');
    shape(g,`M-5.5 ${t+4}Q-1 ${t+2.8} 4 ${t+4}L-1 ${t+6}H-5.5Z`,'#b9dfd5');
    box(g,-7,t+12,14,3,1.5,light);
    for(const x of[-8,5])box(g,x,t+1.4,3,1.4,.7,'#fff6cf');
    box(g,-8,t+18,16,L-21,4,mid);
    box(g,-6,bed,12,bottom-bed,2.5,dark);
    // Keep the grain reveal and compartment walls separate: the walls remain
    // visible even at full capacity, without changing the collection mechanics.
    const cargo=el('g',{class:'cargo',opacity:0}),clipId='sand-truck-cargo-'+serial++,defs=el('defs'),clip=el('clipPath',{id:clipId}),window=el('rect',{x:-6,y:bottom,width:12,height:0});
    clip.append(window);defs.append(clip);g.append(defs);cargo.setAttribute('clip-path',`url(#${clipId})`);
    box(cargo,-6,bed,12,bottom-bed,2.5,color);
    for(let i=0;i<(long?28:14);i++){const x=-4.6+(i*13%23)/2.5,y=bed+1+(i*17%47)/47*(bottom-bed-2);circle(cargo,x,y,i%3?.3:.5,i%2?light:mid);}
    g.append(cargo);
    const walls=el('g',{'data-sections':sections});g.append(walls);
    for(let n=1;n<sections;n++){const y=bed+(bottom-bed)*n/sections;box(walls,-6.6,y-.3,13.2,2,1,dark);box(walls,-6.6,y-.8,13.2,1.5,.75,light);}
    shape(g,`M-8 ${b-6}V${t+23}Q-8 ${t+18} -3 ${t+18}H3`,'none',{stroke:light,'stroke-width':2,'stroke-linecap':'round'});
    // Preserve full cell-sized touch targets, independent of the narrow body.
    box(root,-14,-a.cells.length*cell/2+1,28,a.cells.length*cell-2,4,'none',{class:'selection'});
    box(root,-14,-a.cells.length*cell/2+1,28,a.cells.length*cell-2,3,'transparent');
    root._truck={window,cargo,bed,bottom,load:null};update(root,0,0);return root;
  }
  function update(g,angle=0,load=0){
    const model=g._truck;if(!model)return;
    const fill=Math.max(0,Math.min(1,load));if(model.load!==fill){model.load=fill;const h=(model.bottom-model.bed)*fill;model.window.setAttribute('y',model.bottom-h);model.window.setAttribute('height',h);model.cargo.setAttribute('opacity',fill?1:0);}
  }
  root.SandTruckArt={create,update,PALETTE};
})(globalThis);
