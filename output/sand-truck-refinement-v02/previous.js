/* Art-direction prototype: matte toy dump truck, same parking footprint. */
(function(root){
const NS='http://www.w3.org/2000/svg',colors=['#f5b544','#f4df68','#f1ecd6','#28bfc5','#387fa9','#cd6656'];
function mix(a,b,t){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('')}
function create({color=3,cells=3,load=0}={}){
const g=document.createElementNS(NS,'g');g.setAttribute('data-model','refined');const add=(tag,a)=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(a))e.setAttribute(k,v);g.append(e);return e},box=(x,y,w,h,r,fill,a={})=>add('rect',{x,y,width:w,height:h,rx:r,fill,...a}),path=(d,fill,a={})=>add('path',{d,fill,...a});
const c=colors[color],light=mix(c,'#fff6d4',.48),mid=mix(c,'#193e38',.24),dark=mix(c,'#183933',.60),floor=mix(c,'#667265',.48),t=-(cells*28-11)/2,b=-t,bed=t+20,end=b-4,sections=cells===3?3:2,span=(end-bed)/sections;
// Unbroken chassis, cabin shoulders and bed rim all share one silhouette.
box(-10.5,t+1,22,b-t,5,'#102e2944',{transform:'translate(.6 1)'});
box(-8.5,t+3,17,b-t-4,3,dark);
for(const y of[t+6,b-12])for(const x of[-12.2,8]){box(x,y,4.2,9,1.7,'#142f2c');box(x+.6,y+1,2.7,7,1.2,'#36524a')}
box(-10.5,t,21,21,5,mid,{stroke:'#163b34','stroke-width':.7});
box(-10,t,20,19,4.5,c);
// Raised bonnet and broad glass make the front immediately recognisable.
box(-7.8,t+1.2,15.6,4.8,2.2,light);box(-7,t+2.1,14,3,1.5,c);
path(`M-8 ${t+8}Q0 ${t+5.8} 8 ${t+8}L6.6 ${t+12.5}Q0 ${t+14} -6.6 ${t+12.5}Z`,'#1d3e43');
path(`M-6.6 ${t+8.3}Q-1 ${t+6.7} 6 ${t+8}L1 ${t+10}H-6Z`,'#abd3cd');
box(-6.8,t+15,13.6,3.7,1.8,light);box(-5.8,t+15.4,11.6,2.3,1.1,c);
for(const x of[-9,6.3])box(x,t+2,2.7,1.8,.8,'#fff4c6');
box(-4.5,t-.6,9,1.3,.6,'#789087');
// Rounded basin: cast shadow, recessed floor, thick asymmetrically lit walls.
box(-10.5,bed-1,21,end-bed+4,4.4,mid,{stroke:'#22483e','stroke-width':.65});
box(-8.3,bed+1,16.6,end-bed,3,dark);box(-6.5,bed+3,13,end-bed-4,2,floor);
path(`M-6.5 ${bed+3}H6.5L5.5 ${bed+5}H-4.8V${end-2}H-6.5Z`,mix(floor,'#142f2b',.22));
for(let n=1;n<sections;n++){const y=bed+n*span;box(-6.6,y,13.2,1.7,.65,dark);box(-6.6,y-.4,13.2,1.1,.55,mix(c,'#d7dfbc',.3))}
// Individual soft mounds rise inside compartments and gently cover low ribs.
if(load>0){for(let n=0;n<sections;n++){const cy=bed+(n+.5)*span+1,rx=5.7*Math.sqrt(load),ry=(span/2-.9)*Math.sqrt(load);path(`M${-rx} ${cy+ry*.8}V${cy-ry*.35}Q${-rx*.7} ${cy-ry} 0 ${cy-ry*.85}Q${rx*.8} ${cy-ry*1.05} ${rx} ${cy-ry*.3}V${cy+ry*.8}Q0 ${cy+ry} ${-rx} ${cy+ry*.8}Z`,c);path(`M${-rx} ${cy-ry*.25}Q${-rx*.3} ${cy-ry*1.25} ${rx*.9} ${cy-ry*.35}Q0 ${cy-ry*.55} ${-rx} ${cy-ry*.25}Z`,mix(c,'#fff2c5',.27));for(let k=0;k<5;k++)add('circle',{cx:-rx*.55+(k*7%11)/11*rx,cy:cy-ry*.15+(k%3)*ry*.2,r:.22,fill:k%2?light:mid})}}
path(`M-9 ${end-2}V${bed+4}Q-9 ${bed+.3} -5 ${bed+.3}H5`,'none',{stroke:light,'stroke-width':2,'stroke-linecap':'round'});
path(`M9 ${bed+4}V${end-.5}Q9 ${end+1} 6 ${end+1}H-5`,'none',{stroke:mid,'stroke-width':1.6,'stroke-linecap':'round'});
box(-6,end+.3,12,1.4,.7,c);
return g;
}
root.PreviousTruck={create};
})(globalThis);
