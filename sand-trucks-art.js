/* Storybook vehicles: sculpted color planes, warm fittings and world-space light.
   Same art direction as StorybookGun v04; geometry stays strictly top-down. */
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
    const root=el('g',{'data-truck-art':'storybook'}),g=el('g',{transform:'scale(.82 1)'}),long=a.cells.length===3,L=a.cells.length*cell-11,t=-L/2,b=L/2,bed=t+25,bh=b-bed,color=PALETTE[a.color];
    const dark=mix(color,'#24483c',.58),mid=mix(color,'#365948',.25),light=mix(color,'#fff0ba',.43),metal='#b9b785',bronze='#867d50';
    root.append(g);
    const faces=[];function face(node,nx,ny,base=color){faces.push({node,nx,ny,base});return node;}
    // One continuous chassis makes cabin and bed read as a single vehicle.
    // The narrower drawing leaves air between neighbours; hit areas stay full size.
    const silhouette=`M-7 ${t-1}Q-12 ${t-1}-12 ${t+5}V${b-3}Q-12 ${b+2}-7 ${b+2}H7Q12 ${b+2}12 ${b-3}V${t+5}Q12 ${t-1}7 ${t-1}Z`;
    shape(g,silhouette,'#102c29',{stroke:'#102c29','stroke-width':2.5});
    box(g,-10,t+1,20,L,4,mid);
    const axles=long?[t+10,b-23,b-10]:[t+10,b-10];
    for(const y of axles){
      box(g,-12.5,y-1,25,2,1,'#31473b');
      for(const side of[-1,1]){const x=side<0?-14:9;
        box(g,x,y-5,5,10,2,'#172e2a');box(g,x+.5,y-4.6,3.8,8.8,1.5,'#35473a');
        box(g,x+(side<0?.65:2.7),y-3.7,1.1,7.4,.5,'#62715a');
        for(const dy of[-2.5,0,2.5])shape(g,`M${x+.8} ${y+dy-.4}l2.8 .8`,'none',{stroke:'#1c3229','stroke-width':.75});
        box(g,side<0?-10.6:9.2,y-2,.95,4,.4,metal);
      }
    }
    // Painted front fenders and bonnet: the cabin reads as the front at 20 px.
    for(const side of[-1,1])face(box(g,side<0?-12.5:9,t+5,3.5,12,1.8,mid),side,0);
    shape(g,`M-8 ${t}H8Q11.5 ${t} 11.5 ${t+4}V${t+18}Q11.5 ${t+22} 8 ${t+23}H-8Q-11.5 ${t+22}-11.5 ${t+18}V${t+4}Q-11.5 ${t}-8 ${t}Z`,dark);
    box(g,-10.5,t+.5,20.5,20.8,3.7,color);
    face(shape(g,`M-8 ${t+.5}H7.5L9.2 ${t+2.7}H-8.2L-9.5 ${t+4}V${t+17.7}L-10.5 ${t+19}V${t+3.7}Q-10.5 ${t+.5}-8 ${t+.5}Z`,light),-1,-.65);
    face(shape(g,`M8 ${t+2}Q10 ${t+2} 10 ${t+4}V${t+19}L7.5 ${t+21.3}H-7.5L-9 ${t+19.4}H7.7Z`,mid),1,.6);
    // Rounded engine cover, two headlamps and a small bronze grille.
    box(g,-7.8,t+2.5,15.6,6.4,2.4,mid);box(g,-7.4,t+2.4,14.4,5.3,2.2,color);
    face(box(g,-6.3,t+2.8,11.6,1.25,.6,light),0,-1);
    box(g,-4.8,t-.65,9.6,1.7,.7,bronze);for(const x of[-3,-1,1,3])box(g,x,t-.35,.8,1,.3,'#414d37');
    for(const x of[-9.5,6.4]){box(g,x,t+.4,3.1,2.5,1,bronze);box(g,x+.35,t+.3,2.35,1.75,.65,'#fff0b6');}
    // Windshield is blue-green glass, with one broad curved reflected patch.
    shape(g,`M-8.2 ${t+10}Q0 ${t+8.4} 8.2 ${t+10}L7.3 ${t+15.4}Q0 ${t+16.6}-7.3 ${t+15.4}Z`,'#203c42');
    shape(g,`M-6.7 ${t+10.5}Q-1 ${t+9.5} 5.8 ${t+10.1}L1.7 ${t+12.3}H-6.4Z`,'#9cc5c4');
    shape(g,`M-6.2 ${t+14.5}L-.7 ${t+13.8}M1 ${t+14}L5.8 ${t+14.5}`,'none',{stroke:'#3d6468','stroke-width':.65});
    box(g,-7.8,t+17,15.6,5,1.9,dark);box(g,-7.2,t+16.5,14.2,4.6,1.6,color);
    face(box(g,-6,t+16.7,11.8,1.1,.5,light),0,-1);
    box(g,-3.8,t+18,7.6,1.65,.7,mid);box(g,-2.6,t+18.2,5.2,.6,.3,light);
    // Mirrors, entry steps and exhaust are deliberately large, sparse details.
    for(const side of[-1,1]){const x=side<0?-13.9:11.2;box(g,x,t+13,2.7,3.6,1,bronze);box(g,x+.35,t+13.2,1.9,2.2,.65,'#b3ccaf');box(g,side<0?-11.4:8.6,t+21,2.8,2.3,.6,metal);}
    box(g,8.8,t+19,1.8,8.4,.8,bronze);box(g,9,t+18.7,1.7,2,.6,'#344b3e');box(g,9,t+21,.5,5,.2,'#ded2a0');
    // The bed is a hollow painted casting, with a thick rim and deep inner walls.
    box(g,-11.9,bed,23.8,bh+1.2,2.9,dark);
    face(box(g,-11.7,bed,23.1,bh,2.5,color),0,1);
    box(g,-8.8,bed+2.6,17.6,bh-5,1.7,dark);
    box(g,-7.1,bed+4.6,14.2,bh-8.8,1.3,mix(color,'#817d55',.43));
    shape(g,`M-7.1 ${bed+4.6}H7.1L5.8 ${bed+6.6}H-5.8V${b-5.4}L-7.1 ${b-4.2}Z`,mix(color,'#3d5943',.4));
    for(let y=bed+9;y<b-5;y+=long?9:7)box(g,-5.6,y,11.2,.8,.35,mix(color,'#f0dda0',.28));
    // A fixed grain mound is revealed by a clip, rather than stretched as it fills.
    const cargo=el('g',{class:'cargo',opacity:0}),clipId='sand-truck-cargo-'+serial++,defs=el('defs'),clip=el('clipPath',{id:clipId}),window=el('rect',{x:-7.2,y:b-4.2,width:14.4,height:0});clip.append(window);defs.append(clip);g.append(defs);cargo.setAttribute('clip-path',`url(#${clipId})`);
    box(cargo,-7,bed+4.5,14,bh-8.5,1.1,color);
    shape(cargo,`M-7 ${b-4}V${bed+10}Q-4 ${bed+3} 0 ${bed+5}Q5 ${bed+4} 7 ${bed+10}V${b-4}Z`,mix(color,'#ffe7a0',.18));
    shape(cargo,`M1 ${bed+6}Q7 ${bed+8} 7 ${bed+13}V${b-4}H2Q5 ${b-12} 1 ${bed+6}Z`,mix(color,'#8d8751',.14));
    for(let i=0;i<(long?32:18);i++){const x=-5.8+(i*13%29)/2.5,y=bed+6+(i*17%53)/53*Math.max(1,bh-12);circle(cargo,x,y,i%3?.38:.65,i%2?mix(color,'#fff2bd',.5):mix(color,'#60623d',.3));}
    g.append(cargo);
    face(box(g,-11.1,bed+.8,2.8,bh-1.5,1.1,light),-1,0);
    face(box(g,8.6,bed+.8,2.4,bh-1.5,1,mid),1,0);
    face(box(g,-9.2,bed+.7,18.4,2,1,light),0,-1);
    face(box(g,-9.2,b-2.1,18.4,2.5,1,color),0,1);
    for(const y of[bed+5,...(long?[bed+17]:[]),b-5])for(const side of[-1,1]){box(g,side<0?-11.2:9,y,2,2.7,.4,mid);circle(g,side*10.05,y+1,.55,metal);}
    for(const x of[-6.5,4.4]){box(g,x,b-2.8,2.1,3.4,.6,bronze);box(g,x+.25,b-2.7,1.5,.8,.3,'#e5d1a0');}
    for(const x of[-10,7]){box(g,x,b+.2,3,1.8,.5,'#743f32');box(g,x+.4,b+.1,2.1,.8,.3,'#ed9676');}
    box(root,-14,-a.cells.length*cell/2+1,28,a.cells.length*cell-2,4,'none',{class:'selection'});
    box(root,-14,-a.cells.length*cell/2+1,28,a.cells.length*cell-2,3,'transparent');
    root._truck={faces,window,cargo,bed:bed+4.5,bottom:b-4.2,angle:null,load:null};update(root,0,0);return root;
  }
  function update(g,angle=0,load=0){
    const model=g._truck;if(!model)return;
    const a=Math.round(angle/3)*3;
    if(model.angle!==a){model.angle=a;const r=a*Math.PI/180,cos=Math.cos(r),sin=Math.sin(r);
      for(const f of model.faces){const x=f.nx*cos-f.ny*sin,y=f.nx*sin+f.ny*cos,light=(-x*.65-y*.76)/Math.max(1,Math.hypot(f.nx,f.ny));f.node.setAttribute('fill',light>0?mix(f.base,'#fff0bb',light*.47):mix(f.base,'#244b3b',-light*.43));}}
    const fill=Math.max(0,Math.min(1,load));if(model.load!==fill){model.load=fill;const h=(model.bottom-model.bed)*fill;model.window.setAttribute('y',model.bottom-h);model.window.setAttribute('height',h);model.cargo.setAttribute('opacity',fill?1:0);}
  }
  root.SandTruckArt={create,update,PALETTE};
})(globalThis);
