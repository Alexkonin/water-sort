/* Top-down Ugolek game renderer. No game-state mutations or damage side effects.
   heading: radians, right=0. distance: travelled cells, not elapsed seconds.
   state: idle | walk | attack. attack: normalized progress 0..1, owned by simulation.
   size: approximate full visible width in CSS pixels. Caller owns canvas DPR.
   Contact is driven by the unchanged siege timer; drawing never causes damage. */
(function(root){
  'use strict';
  const TAU=Math.PI*2, clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const ATTACK_DURATION=.72, CONTACT=.46, RELEASE=.16;
  function pose(o={}){
    const time=o.time||0, seed=o.seed||0, walking=o.state==='walk';
    const phase=(o.distance||0)/.68*TAU+seed;
    const step=walking?Math.sin(phase):0, bob=walking?Math.sin(phase*2):0;
    const active=o.state==='attack', p=clamp(o.attack||0);
    const wind=active?(p<.10?smooth(p/.10):1-smooth((p-.10)/.10)):0;
    const thrust=active?(p<RELEASE?smooth((p-.10)/.06):1-smooth((p-RELEASE)/.25)):0;
    const flash=active?Math.max(0,1-Math.abs(p-CONTACT)/.12):0;
    return {step,bob,wind,thrust,flash,ember:active&&p>=RELEASE?.72+.28*smooth((p-CONTACT)/(1-CONTACT)):1,breath:Math.sin(time*2.3+seed),
      lean:step*.07,blink:((time+seed*2)%5.7)>5.54?0.12:1};
  }
  function oval(c,x,y,rx,ry,fill,angle=0){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fill();}
  function body(c){
    c.beginPath();c.moveTo(.62,-.59);
    c.bezierCurveTo(.95,-.35,.91,.45,.53,.68);
    c.bezierCurveTo(.18,.88,-.62,.88,-.89,.57);
    c.bezierCurveTo(-1.07,.36,-1.05,-.21,-.86,-.49);
    c.quadraticCurveTo(-.98,-.80,-.77,-.83);
    c.quadraticCurveTo(-.58,-.83,-.38,-.68);
    c.quadraticCurveTo(-.56,-.96,-.31,-.85);
    c.quadraticCurveTo(.18,-.80,.62,-.59);c.closePath();
  }
  function eye(c,y,p){
    c.save();c.translate(.43,y);c.scale(1,p.blink*(1-p.wind*.32));
    c.fillStyle='#211f1b';c.beginPath();c.moveTo(-.24,0);c.quadraticCurveTo(-.02,-.25,.19,-.09);c.quadraticCurveTo(.26,.02,.13,.16);c.quadraticCurveTo(-.06,.25,-.24,0);c.fill();
    c.fillStyle='#fff0c8';c.beginPath();c.moveTo(-.185,0);c.quadraticCurveTo(-.005,-.17,.135,-.065);c.quadraticCurveTo(.195,.045,.095,.115);c.quadraticCurveTo(-.035,.175,-.185,0);c.fill();
    oval(c,.064,.003,.087,.115,'#e4a73b');oval(c,.091,.004,.049,.087,'#191815');oval(c,.085,-.047,.027,.032,'#fffcec');
    c.restore();
  }
  function paw(c,hx,hy,side,root){
    c.save();c.translate(hx,hy);c.scale(1,side);
    const x=root.x-hx,y=(root.y-hy)*side;
    // One filled mitten from the body to the grip; no clipped root oval,
    // separate wrist ring, or outline across the attachment to the body.
    c.beginPath();c.moveTo(x-.045,y+.04);
    c.bezierCurveTo(x+.035,y+.065,.015,.335,.095,.28);
    c.bezierCurveTo(.145,.245,.12,.185,.06,.188);
    c.quadraticCurveTo(.012,.135,-.04,.168);
    c.quadraticCurveTo(-.065,.20,-.105,.205);
    c.quadraticCurveTo(x+.055,y-.045,x-.03,y-.065);
    c.quadraticCurveTo(x-.065,y-.015,x-.045,y+.04);c.closePath();
    const g=c.createLinearGradient(x,y,.07,.20);
    g.addColorStop(0,'#383631');g.addColorStop(.60,'#575147');g.addColorStop(1,'#866a4a');
    c.fillStyle=g;c.fill();
    // A soft solid thumb highlight gives volume without reading as another arc.
    oval(c,.025,.205,.046,.035,'#bc935e',-.25);
    c.restore();
  }
  // Follow the mascot's fissure: one bright junction, three sweeping arms,
  // a few hairline splits. No repeated zigzag or comb of parallel offshoots.
  const fissures=[
    {width:.085,points:[[-.43,.02],[-.40,-.19],[-.29,-.39],[-.30,-.55],[-.33,-.70]]},
    {width:.080,points:[[-.43,.02],[-.32,.20],[-.28,.36],[-.20,.49],[-.19,.62]]},
    {width:.060,points:[[-.43,.02],[-.60,.07],[-.68,.18],[-.78,.23],[-.88,.36]]},
    {width:.025,points:[[-.40,-.19],[-.51,-.25],[-.55,-.35]]},
    {width:.022,points:[[-.60,.07],[-.67,-.005],[-.76,-.025]]},
    {width:.021,points:[[-.20,.49],[-.10,.54],[-.07,.61]]}
  ].map(({points,width},branch)=>{
    // Bake a continuous tapered opening once, with gently uneven edges.
    // Catmull–Rom interpolation removes the elbows between control points.
    const samples=[],steps=10;
    for(let i=0;i<points.length-1;i++){
      const a=points[Math.max(0,i-1)],b=points[i],d=points[i+1],e=points[Math.min(points.length-1,i+2)];
      for(let j=0;j<steps;j++){
        const t=j/steps,t2=t*t,t3=t2*t;
        samples.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+d[k])*t+
          (2*a[k]-5*b[k]+4*d[k]-e[k])*t2+(-a[k]+3*b[k]-3*d[k]+e[k])*t3)));
      }
    }
    samples.push(points[points.length-1]);
    const left=[],right=[];
    samples.forEach((point,i)=>{
      const prev=samples[Math.max(0,i-1)],next=samples[Math.min(samples.length-1,i+1)];
      const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1;
      const u=i/(samples.length-1);
      const half=width*.43*Math.pow(1-u,1.2)*(1+.16*Math.sin(u*19+branch*2)+.07*Math.sin(u*41+branch));
      left.push([point[0]-dy/len*half,point[1]+dx/len*half]);
      right.push([point[0]+dy/len*half,point[1]-dx/len*half]);
    });
    return left.concat(right.reverse());
  });
  function drawFissure(c,time,seed,p){
    const t=time*.85+seed*1.7;
    const heat=.5+.3*Math.sin(t*1.13)+.2*Math.sin(t*.47+1.2);
    // A single filled opening: no strokes, segment caps, outlines or halo.
    c.beginPath();
    for(const edge of fissures){
      c.moveTo(...edge[0]);for(let i=1;i<edge.length;i++)c.lineTo(...edge[i]);c.closePath();
    }
    const core=c.createRadialGradient(-.43,.02,0,-.43,.02,.76);
    core.addColorStop(0,'#fff1bd');
    core.addColorStop(.13+heat*.07,'#ffd98b');
    core.addColorStop(.48+heat*.12,'#ef963f');core.addColorStop(1,'#91451e');
    c.fillStyle=core;c.fill();
    // Slow travelling warmth stays entirely inside the same continuous opening.
    const drift=.50+.22*Math.sin(t*.61)+.10*Math.sin(t*.37+1);
    const warmth=c.createLinearGradient(-.52,-.76,-.24,.70);
    warmth.addColorStop(0,'rgba(255,237,177,0)');
    warmth.addColorStop(drift-.16,'rgba(255,237,177,0)');
    warmth.addColorStop(drift,'rgba(255,244,206,'+(.16+heat*.22+p.wind*.05)+')');
    warmth.addColorStop(drift+.16,'rgba(255,237,177,0)');
    warmth.addColorStop(1,'rgba(255,237,177,0)');
    c.fillStyle=warmth;c.fill();
  }
  // Warm charcoal and ash; amber light comes from the ember and the crack.
  function draw(c,o={}){
    const p=pose(o), r=(o.size||40)/2.55;
    const hx=.95-p.wind*.08+p.thrust*.23, hy=p.step*.012;
    c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);
    if(o.shadow!==false)oval(c,-.02,.1,1.01,.75,'rgba(0,0,0,.20)');
    // Feet follow distance; both tuck in during the wind-up and brace at contact.
    for(const side of [-1,1]){
      const foot=p.step*side*.19;
      oval(c,-.44+foot-p.wind*.05,side*(.76+p.thrust*.07),.28,.15,'#1f1e1b',side*.12);
      oval(c,-.42+foot,side*.77,.15,.075,'#4d4942',side*.12);
    }
    c.save();c.translate(-p.wind*.12+p.thrust*.18,p.step*.065);
    c.rotate(p.lean);c.scale(1-p.wind*.10+p.thrust*.14,1+p.wind*.07-p.thrust*.07+p.breath*.008);
    body(c);c.fillStyle='#201f1c';c.fill();c.lineWidth=.05;c.strokeStyle='#191815';c.stroke();
    const g=c.createLinearGradient(-.75,-.7,.65,.65);g.addColorStop(0,'#64605a');g.addColorStop(.48,'#383632');g.addColorStop(1,'#201f1c');body(c);c.fillStyle=g;c.fill();
    c.fillStyle='rgba(181,171,149,.24)';c.beginPath();c.moveTo(-.72,-.62);c.quadraticCurveTo(-.35,-.76,.15,-.47);c.quadraticCurveTo(-.13,-.57,-.46,-.40);c.quadraticCurveTo(-.59,-.38,-.72,-.62);c.fill();
    drawFissure(c,o.time||0,o.seed||0,p);
    eye(c,-.30,p);eye(c,.30,p);
    c.strokeStyle='#191815';c.lineWidth=.038;c.beginPath();c.arc(.70,0,.078,-.85,.85);c.stroke();
    c.restore();
    // Counter-motion: hands steady the ember instead of following the body's sway.
    const glow=c.createRadialGradient(hx,hy,0,hx,hy,.55+p.wind*.08+p.flash*.15);
    glow.addColorStop(0,'rgba(255,169,61,'+(.40+p.wind*.16)+')');glow.addColorStop(1,'rgba(255,151,48,0)');
    oval(c,hx,hy,.58,.58,glow);
    c.save();c.translate(hx,hy);c.scale(p.ember,p.ember);c.translate(-hx,-hy);
    oval(c,hx,hy,.205+p.wind*.02+p.flash*.045,.215+p.flash*.02,'#cf652a');
    oval(c,hx+.01,hy,.155+p.flash*.035,.17+p.flash*.03,'#ffb442');
    oval(c,hx+.025,hy-.018,.083+p.wind*.035+p.flash*.025,.10+p.wind*.02,'#fff0b3');
    c.restore();
    for(const side of [-1,1]){
      // The root follows the body; the mitten tip steadies the ember.
      const rx=.79*(1-p.wind*.10+p.thrust*.14);
      const ry=side*.36*(1+p.wind*.07-p.thrust*.07+p.breath*.008);
      paw(c,hx,hy,side,{
        x:-p.wind*.12+p.thrust*.18+rx*Math.cos(p.lean)-ry*Math.sin(p.lean),
        y:p.step*.065+rx*Math.sin(p.lean)+ry*Math.cos(p.lean)
      });
    }
    const releasePose=pose({state:'attack',attack:RELEASE});
    const from={x:.95-releasePose.wind*.08+releasePose.thrust*.23,y:0};
    const to=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2.7,y:0};
    drawShot(c,{progress:o.state==='attack'?o.attack:null,from,to,size:.115});

    c.restore();
  }
  function shotPose(progress,from,to){
    if(progress==null||progress<RELEASE||progress>CONTACT)return null;
    const t=clamp((progress-RELEASE)/(CONTACT-RELEASE));
    return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t-Math.sin(Math.PI*t)*Math.hypot(to.x-from.x,to.y-from.y)*.16,t};
  }
  function drawShot(c,{progress,from,to,size}){
    const shot=shotPose(progress,from,to);
    c.save();
    if(shot){
      for(let i=3;i>=0;i--){
        const q=shotPose(Math.max(RELEASE,progress-i*.016),from,to);
        c.globalAlpha=1-i*.23;oval(c,q.x,q.y,size*(1-i*.17),size*(.8-i*.12),i?'#f6a23a':'#ffcb61');
      }
      c.globalAlpha=1;oval(c,shot.x,shot.y,size*.45,size*.40,'#fff4c9');
    }
    if(progress!=null&&progress>=CONTACT&&progress<CONTACT+.15){
      const k=(progress-CONTACT)/.15;c.globalAlpha=1-k;c.strokeStyle='#ffd88a';c.lineWidth=size*.30;
      c.beginPath();c.arc(to.x,to.y,size*(1+k*2),0,TAU);c.stroke();
      for(let i=0;i<5;i++){const a=i*TAU/5;oval(c,to.x+Math.cos(a)*size*(1+k*3),to.y+Math.sin(a)*size*(1+k*3),size*.22,size*.17,'#ffc05a');}
    }
    c.restore();
  }
  function attackProgress(remaining,after=0){
    if(after>0)return clamp(1-after/ATTACK_DURATION,CONTACT,1);
    const before=ATTACK_DURATION*CONTACT;
    return remaining>=0 && remaining<=before ? CONTACT-remaining/ATTACK_DURATION : null;
  }
  root.Ugolek={draw,pose,attackProgress,ATTACK_DURATION,CONTACT,RELEASE,shotPose,drawShot};
})(typeof module==='object'?module.exports:window);
