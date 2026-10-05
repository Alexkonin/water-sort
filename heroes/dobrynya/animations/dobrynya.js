/* Articulated low-poly 3D prototype. Units: metres, Y up, forward +Z. */
(function(root){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const CONTACT=.46,BLOCK_CONTACT=.5;
function pose(mode,p,time=0){
 p=clamp(p);const hit=mode==='attack',guard=mode==='block';
 const wind=hit?smooth(p/.3)*(1-smooth((p-.3)/.16)):0;
 const strike=hit?smooth((p-.30)/.16)*(1-smooth((p-.55)/.45)):0;
 const brace=guard?smooth(p/.24)*(1-smooth((p-.72)/.28)):0;
 const recoil=guard?Math.sin(clamp((p-.5)/.2)*Math.PI)*.10:0;
 const walk=mode==='walk'?Math.sin(p*Math.PI*2):0;
 return {wind,strike,brace,recoil,walk,bob:mode==='walk'?Math.abs(walk)*.045:Math.sin(time*2)*.008,
  impact:hit&&p>=CONTACT?1-clamp((p-CONTACT)/.15):0,blockImpact:guard&&p>=BLOCK_CONTACT?1-clamp((p-BLOCK_CONTACT)/.14):0,
  arm:wind*-2.35-strike*.65,bodyTurn:wind*-.28+strike*.2,lean:strike*.08-brace*.06};
}
// Affine transforms, then depth-sorted lit polygons. No network or runtime dependencies.
const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function mul(a,b){let o=Array(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)o[r*4+c]+=a[r*4+k]*b[k*4+c];return o}
function matrix(x=0,y=0,z=0,rx=0,ry=0,rz=0){let t=I();t[3]=x;t[7]=y;t[11]=z;let a=I(),b=I(),c=I();a[5]=a[10]=Math.cos(rx);a[6]=-Math.sin(rx);a[9]=Math.sin(rx);b[0]=b[10]=Math.cos(ry);b[2]=Math.sin(ry);b[8]=-Math.sin(ry);c[0]=c[5]=Math.cos(rz);c[1]=-Math.sin(rz);c[4]=Math.sin(rz);return mul(t,mul(b,mul(a,c)))}
const point=(m,p)=>[m[0]*p[0]+m[1]*p[1]+m[2]*p[2]+m[3],m[4]*p[0]+m[5]*p[1]+m[6]*p[2]+m[7],m[8]*p[0]+m[9]*p[1]+m[10]*p[2]+m[11]];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function build(mode,p,time=0,enemy=true){const f=[],q=pose(mode,p,time);function face(m,pts,color){f.push({pts:pts.map(v=>point(m,v)),color})}
 function box(m,x,y,z,w,h,d,color){let v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(a=>[x+a[0]*w/2,y+a[1]*h/2,z+a[2]*d/2]);for(const ids of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]])face(m,ids.map(i=>v[i]),color)}
 function round(m,x,y,z,rx,ry,rz,color,n=10,rings=6){let rows=[];for(let j=0;j<=rings;j++){let a=Math.PI*j/rings;rows.push(Array.from({length:n},(_,i)=>{let b=i*Math.PI*2/n;return [x+rx*Math.sin(a)*Math.cos(b),y+ry*Math.cos(a),z+rz*Math.sin(a)*Math.sin(b)]}))}for(let j=0;j<rings;j++)for(let i=0;i<n;i++)face(m,[rows[j][i],rows[j+1][i],rows[j+1][(i+1)%n],rows[j][(i+1)%n]],color)}
 function cone(m,x,y,z,r,h,color){for(let i=0;i<12;i++){const a=i*Math.PI/6,b=(i+1)*Math.PI/6;face(m,[[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x,y+h,z],[x+Math.cos(b)*r,y,z+Math.sin(b)*r]],color)}}
 const skin='#bd8c66',steel='#879397',cloth='#405a6a',leather='#5b3d2e',red='#9e3e38';
 const base=matrix(0,q.bob,-q.recoil, q.lean,q.bodyTurn);
 for(const side of [-1,1]){let leg=mul(base,matrix(side*.19,.64,0,q.walk*side*.42));box(leg,0,-.22,0,.25,.46,.29,cloth);box(leg,0,-.49,.09,.29,.26,.46,leather);box(leg,0,-.38,0,.3,.09,.31,'#79543a')}
 round(base,0,1.03,0,.46,.49,.28,cloth);box(base,0,.77,0,.75,.12,.52,leather);box(base,0,.78,.275,.14,.12,.035,'#c6a46b');
 round(base,0,1.17,0,.45,.35,.29,steel);
 // Large chain links read as mail without texture dependencies.
 for(let row=0;row<5;row++)for(let col=0;col<8;col++){let x=(col-3.5)*.087,y=.93+row*.083,z=.292-Math.abs(x)*.16;round(base,x,y,z,.031,.025,.014,(row+col)%2?'#bac0b6':'#58696c',6,3)}
 box(base,0,1.5,0,.32,.14,.30,red);const tail=mul(base,matrix(-.17,1.48,-.18,Math.sin(time*4)*.1,0,.2));box(tail,0,-.19,-.08,.17,.42,.05,red);
 const head=mul(base,matrix(0,1.67,0));round(head,0,0,.02,.255,.29,.23,skin);round(head,0,-.14,.16,.23,.19,.13,'#65432c');box(head,0,-.04,.248,.13,.055,.035,'#513725');round(head,0,.014,.251,.057,.07,.055,skin);
 for(const s of [-1,1]){box(head,s*.103,.067,.221,.075,.027,.025,'#ead9bd');box(head,s*.105,.066,.24,.026,.028,.013,'#43392d');box(head,s*.104,.115,.216,.10,.022,.035,'#68452e')}
 round(head,0,.16,0,.28,.17,.25,steel);cone(head,0,.19,0,.24,.29,'#8b9495');box(head,0,.085,.26,.045,.22,.033,'#b4b6a8');
 const right=mul(base,matrix(-.46,1.36,0,q.arm+q.walk*.22,0,-.10));round(right,0,-.12,0,.18,.22,.18,steel);box(right,0,-.34,.015,.22,.24,.23,leather);round(right,0,-.49,.04,.125,.13,.125,skin);
 // Mace is rigidly attached to hand, shaft extends forward.
 box(right,0,-.49,.31,.065,.065,.62,'#745137');round(right,0,-.49,.68,.19,.18,.20,'#92999a',8,4);
 const left=mul(base,matrix(.46,1.35,0,-q.brace*.6-q.strike*.16,0,.12));round(left,0,-.14,0,.17,.23,.17,steel);box(left,0,-.36,.05,.23,.25,.25,leather);round(left,0,-.48,.09,.12,.13,.12,skin);
 const shield=mul(left,matrix(0,-.28,.24,0,-.14+q.brace*.32));
 const shape=[[-.34,-.57],[.34,-.57],[.34,.35],[.20,.54],[0,.66],[-.20,.54],[-.34,.35]];
 face(shield,shape.map(a=>[a[0],a[1],.06]),'#816143');face(shield,shape.map(a=>[a[0],a[1],-.05]).reverse(),'#5d4934');
 for(let i=0;i<shape.length;i++){const a=shape[i],b=shape[(i+1)%shape.length];face(shield,[[a[0],a[1],-.05],[b[0],b[1],-.05],[b[0],b[1],.06],[a[0],a[1],.06]],steel)}
 for(let x=-.27;x<.3;x+=.135)box(shield,x,-.11,.067,.013,.89,.008,'#4e382a');for(let y of [-.45,.24]){box(shield,0,y,.09,.66,.065,.06,steel);for(let x of [-.25,0,.25])round(shield,x,y,.131,.026,.026,.02,'#c1b59a',6,3)}round(shield,0,-.07,.095,.13,.14,.065,steel);
 if(enemy){const strike=mode==='block'?smooth((p-.22)/.28)*(1-smooth((p-.52)/.35)):0;const e=matrix(-.15,.03,1.46-strike*.28+q.impact*.13,q.impact*-.15);round(e,0,.28,0,.32,.35,.29,'#658064');round(e,0,.62,0,.47,.24,.38,'#b77652');for(const s of [-1,1]){round(e,s*.12,.38,-.25,.055,.045,.025,'#f2dca4');round(e,s*.12,.38,-.274,.022,.026,.008,'#302c24');round(e,s*.25,.08,0,.15,.10,.19,'#405440')}for(let i=0;i<6;i++){let a=i*2.4;round(e,Math.cos(a)*.31,.78-(i%2)*.06,Math.sin(a)*.23,.055,.024,.05,'#dfc89b')}
 const impact=Math.max(q.impact,q.blockImpact);if(impact>0){for(let i=0;i<7;i++){let a=i*2.4,r=(1-impact)*.3;round(I(),-.15+Math.cos(a)*r,.83+Math.sin(a)*r,1.03,.025*impact,.025*impact,.025*impact,'#ffd690',5,3)}}}
 return f;
}
function draw(canvas,opts){const {mode='idle',phase=0,time=0,yaw=.6,pitch=.3,enemy=true}=opts;const c=canvas.getContext('2d'),d=Math.min(globalThis.devicePixelRatio||1,2),w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);c.scale(d,d);c.clearRect(0,0,w,h);const scale=Math.min(w*.28,h*.35),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);function view(p){let x=p[0],y=p[1]-.85,z=p[2]-.3;return [x*cy-z*sy,y*cp-(x*sy+z*cy)*sp,y*sp+(x*sy+z*cy)*cp]}function proj(v){return [w/2+v[0]*scale,h*.54-v[1]*scale]}
 c.fillStyle='#dcd5bd';c.beginPath();c.ellipse(w/2,h*.54+.85*cp*scale,scale*1.65,scale*.55,0,0,Math.PI*2);c.fill();
 let faces=build(mode,phase,time,enemy).map(f=>({...f,v:f.pts.map(view)}));faces.sort((a,b)=>a.v.reduce((s,p)=>s+p[2],0)/a.v.length-b.v.reduce((s,p)=>s+p[2],0)/b.v.length);
 for(let f of faces){let n=cross(sub(f.pts[1],f.pts[0]),sub(f.pts[2],f.pts[0])),len=Math.hypot(...n)||1;let light=.64+.36*Math.abs((n[0]*-.4+n[1]*.8+n[2]*.4)/len);let rgb=f.color.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*light));c.fillStyle=`rgb(${rgb.join(',')})`;c.beginPath();f.v.forEach((v,i)=>{let p=proj(v);i?c.lineTo(...p):c.moveTo(...p)});c.closePath();c.fill();}
}
root.Dobrynya={pose,build,draw,CONTACT,BLOCK_CONTACT};
})(typeof module==='object'?module.exports:window);
