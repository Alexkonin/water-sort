/* Three SVG truck concepts, local coordinates in the same 28-unit parking grid. */
(function(root){
const NS='http://www.w3.org/2000/svg';
const palettes=[['#39b8b0','#177c7c','#91ddd0'],['#eee5bd','#a89f7b','#fff7db'],['#e7c958','#a78b33','#fff09c']];
function node(tag,attrs){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs||{}))e.setAttribute(k,v);return e;}
function create(style,{color=0,cells=2,load=0}={}){
 const g=node('g',{'data-model':style}),[paint,shade,light]=palettes[color],L=cells*28-10,t=-L/2,b=L/2,ink='#163933';
 const add=(tag,a)=>{const e=node(tag,a);g.append(e);return e;};
 const rect=(x,y,w,h,r,fill,extra={})=>add('rect',{x,y,width:w,height:h,rx:r,fill,...extra});
 const path=(d,fill,extra={})=>add('path',{d,fill,...extra});
 const wheel=(x,y,w=4,h=9)=>rect(x,y,w,h,1.4,'#102b29');
 if(style==='workhorse'){
  // A broad forward cabin, narrow neck and continuous angular chassis.
  rect(-10,t+2,20,L-2,3,ink);
  for(const y of[t+5,b-13]){wheel(-13,y);wheel(9,y);}
  path(`M-8 ${t}H8L11 ${t+4}V${t+16}H8V${b-2}H-8V${t+16}H-11V${t+4}Z`,paint,{stroke:ink,'stroke-width':1.1});
  rect(-8,t+4,16,6,1.2,'#173b40');path(`M-7 ${t+4.7}H6L-1 ${t+7.2}H-7Z`,'#8fbebb');
  rect(-8,t+12,16,3,1,light);rect(-3,t+1,6,1,0,shade);
  rect(-10,t+18,20,b-t-18,2,shade,{stroke:ink,'stroke-width':1});
  rect(-8,t+20,16,b-t-23,1,light);rect(-6,t+22,12,b-t-27,.7,shade);
  for(let y=t+26;y<b-5;y+=8)rect(-5,y,10,.7,0,paint);
  for(const x of[-10,7])rect(x,t+1,3,2,.5,'#fff1b0');
 }else if(style==='pebble'){
  // A single rounded toy body and a U-shaped basin; few, large details.
  for(const y of[t+6,b-11]){wheel(-12,y,4,8);wheel(8,y,4,8);}
  rect(-10.5,t,21,L,6,paint,{stroke:ink,'stroke-width':1.2});
  path(`M-7 ${t+4}Q0 ${t+1} 7 ${t+4}V${t+8}Q0 ${t+11}-7 ${t+8}Z`,'#20434a');
  path(`M-5.5 ${t+4}Q-1 ${t+2.8} 4 ${t+4}L-1 ${t+6}H-5.5Z`,'#b9dfd5');
  rect(-7,t+12,14,3,1.5,light);
  rect(-8,t+18,16,b-t-21,4,shade);rect(-6,t+20,12,b-t-25,3,'#44776a');
  path(`M-8 ${b-6}V${t+23}Q-8 ${t+18}-3 ${t+18}H3`, 'none',{stroke:light,'stroke-width':2,'stroke-linecap':'round'});
  for(const x of[-8,5])rect(x,t+1.4,3,1.4,.7,'#fff6cf');
 }else{
  // A tapered mining skip and a small contrasting cab under one stout chassis.
  for(const y of[t+5,b-14]){wheel(-13,y,5,11);wheel(8,y,5,11);}
  path(`M-8 ${t}H8V${t+14}L11 ${t+20}V${b-2}L8 ${b}H-8L-11 ${b-2}V${t+20}L-8 ${t+14}Z`,ink);
  rect(-8,t,16,16,2.3,light);rect(-6,t+3,12,7,1.2,'#214047');
  path(`M-5 ${t+3.8}H5L-1 ${t+6}H-5Z`,'#a2c6c1');rect(-6,t+12,12,2,.5,shade);
  path(`M-7 ${t+17}H7L11 ${t+23}V${b-2}H-11V${t+23}Z`,paint,{stroke:ink,'stroke-width':1.1});
  path(`M-5 ${t+20}H5L8 ${t+25}V${b-5}H-8V${t+25}Z`,shade);
  path(`M-7 ${b-5}V${t+25}L-4 ${t+21}H4`,'none',{stroke:light,'stroke-width':1.5});
  rect(-11,b-3,22,3,.7,light);for(const x of[-8,6])rect(x,t+1,2,1.4,.3,'#fff6cc');
 }
 if(load>0){const start=t+23,h=Math.max(2,b-start-6)*Math.min(1,load);rect(-5,b-6-h,10,h,2,paint);path(`M-5 ${b-6-h+2}Q0 ${b-10-h} 5 ${b-6-h+2}`,light);for(let i=0;i<9;i++)add('circle',{cx:-3+(i*5%7),cy:b-7-(i*11%17)/17*h,r:.5,fill:light});}
 return g;
}
root.TruckConcepts={create};
})(globalThis);
