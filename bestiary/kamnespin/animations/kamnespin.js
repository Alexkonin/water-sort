/* Shared top-down stone spirit. +x is forward. Drawing never changes combat.
   Feet follow travelled distance; the siege timer owns contact and damage. */
(function(root){
  'use strict';
  const TAU=Math.PI*2,ATTACK_DURATION=1,CONTACT=.6;
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  function attackProgress(remaining,after=0){
    if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));
    return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null;
  }
  function pose(o={}){
    const moving=o.state==='walk',phase=(o.distance||0)/.88+(o.seed||0)/TAU;
    // Crawl: one foot advances during each quarter-cycle, three support the mass.
    const feet=[0,.5,.75,.25].map(offset=>{
      const u=((phase+offset)%1+1)%1;
      return moving?(u<.25?{x:-.15+.30*ease(u/.25),lift:Math.sin(u/.25*Math.PI)}:{x:.15-.30*(u-.25)/.75,lift:0}):{x:0,lift:0};
    });
    const active=o.state==='attack',a=clamp(o.attack||0);
    const tuck=active?(a<.4?ease(a/.4):1-ease((a-.72)/.28)):0;
    const ram=active?(a<CONTACT?ease((a-.4)/.2):1-ease((a-CONTACT)/.28)):0;
    return {feet,tuck,ram,roll:moving?Math.sin(phase*TAU)*.032:0,
      weight:moving?Math.cos(phase*TAU*2)*.014:0,
      impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.18):0};
  }
  function oval(c,x,y,rx,ry,fill,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=fill;c.fill()}
  function poly(c,points,fill){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=fill;c.fill()}
  const outline=[[-1,-.35],[-.81,-.72],[-.29,-.84],[.24,-.77],[.71,-.57],[.90,-.18],[.84,.32],[.51,.65],[.03,.77],[-.60,.65],[-.95,.28]];
  function shell(c){c.beginPath();outline.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath()}
  function rock(c,x,y,sx,sy){
    c.save();c.translate(x,y);c.scale(sx,sy);
    const g=c.createLinearGradient(-.7,-.7,.6,.8);g.addColorStop(0,'#b8b29e');g.addColorStop(.48,'#837f70');g.addColorStop(1,'#4c5045');
    poly(c,[[-.8,-.48],[-.35,-.83],[.5,-.70],[.88,-.08],[.61,.70],[-.48,.73],[-.86,.15]],g);
    poly(c,[[-.8,-.48],[-.35,-.83],[.5,-.70],[.2,-.25],[-.42,-.20]],'#c0bba455');
    c.restore();
  }
  function moss(c,x,y,s){
    oval(c,x+.01,y+.025,s*.96,s*.65,'#354329');
    for(let i=0;i<7;i++){const a=i*2.399,r=s*(.18+(i%3)*.16);oval(c,x+Math.cos(a)*r,y+Math.sin(a)*r*.65,s*(.32+(i%2)*.07),s*.26,['#53623a','#76834b','#93a05b'][i%3],a)}
  }
  function draw(c,o={}){
    const r=(o.size||80)/2.8,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.42,y:0};
    const shift={x:(target.x-.9)*p.ram,y:target.y*p.ram};
    c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);
    if(o.shadow!==false)oval(c,shift.x-.03,shift.y+.07,1.07,.87,'#24312633');
    c.save();c.translate(shift.x,shift.y);
    for(let i=0;i<4;i++){
      const front=i<2,side=i%2?1:-1,foot=p.feet[i];
      const x=(front?.56:-.64)+foot.x-(front?0:p.tuck*.055),y=side*(.73+p.tuck*.10)-foot.lift*.035;
      oval(c,x+.015,y+.04,.27,.17,'#252d2933');
      rock(c,x,y,.31+foot.lift*.018,.27);
      if(i===1||i===2)moss(c,x-.04,y-.04,.095);
    }
    // Small stone head slides under the overhanging shell during the brace.
    const head=.91-p.tuck*.26;
    rock(c,head,0,.39,.35);
    for(const side of [-1,1]){
      oval(c,head+.14,side*.20,.075,.044,'#343329',side*.25);
      oval(c,head+.153,side*.20,.040,.025,'#e9b854',side*.25);
      oval(c,head+.16,side*.196,.015,.014,'#fff2b2');
    }
    c.save();c.translate(-p.tuck*.045,p.weight);c.rotate(p.roll);c.scale(1,1-p.tuck*.035);
    const g=c.createLinearGradient(-.72,-.78,.70,.78);g.addColorStop(0,'#c3bfaa');g.addColorStop(.35,'#989784');g.addColorStop(.7,'#747868');g.addColorStop(1,'#454d41');
    shell(c);c.fillStyle=g;c.fill();
    poly(c,[[-1,-.35],[-.81,-.72],[-.29,-.84],[-.38,-.30],[-.82,-.03]],'#d5ceaf66');
    poly(c,[[-.29,-.84],[.24,-.77],[.71,-.57],[.32,-.24],[-.38,-.30]],'#e3ddc333');
    poly(c,[[.32,-.24],[.71,-.57],[.90,-.18],[.84,.32],[.39,.16]],'#555e4c77');
    poly(c,[[-.82,-.03],[-.38,-.30],[-.13,.20],[-.60,.65],[-.95,.28]],'#75796866');
    poly(c,[[-.13,.20],[.39,.16],[.84,.32],[.51,.65],[.03,.77],[-.60,.65]],'#35433344');
    c.lineWidth=.021;c.lineCap='round';c.strokeStyle='#424b3b77';
    for(const points of [[[-.76,-.53],[-.46,-.27],[-.51,.06]],[[-.25,.51],[-.13,.20],[.15,.13]],[[.34,-.51],[.32,-.24],[.58,-.08]]]){c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.stroke()}
    // Fixed surface markings stay attached to the stone, including on turns.
    for(let i=0;i<18;i++){const a=i*2.399,rad=.20+(i%5)*.12;oval(c,-.12+Math.cos(a)*rad,Math.sin(a)*rad*.82,.012+(i%3)*.009,.014,'#dad3b54d',a)}
    moss(c,-.60,-.40,.25);moss(c,-.12,-.50,.28);moss(c,.32,-.43,.19);moss(c,-.69,.23,.17);moss(c,.05,.39,.14);
    for(const [x,y] of [[-.35,.22],[.43,.31],[-.78,-.06]]){oval(c,x,y,.044,.031,'#c5c3a2aa');oval(c,x+.047,y-.027,.028,.025,'#d7d1afaa')}
    c.restore();c.restore();
    if(p.impact>0){
      const k=1-p.impact;c.globalAlpha=p.impact;c.strokeStyle='#d9caa3';c.lineWidth=.032;
      c.beginPath();c.ellipse(target.x,target.y,.09+k*.10,.19+k*.35,0,0,TAU);c.stroke();
      for(let i=0;i<5;i++){const a=i*TAU/5;rock(c,target.x+Math.cos(a)*(.10+k*.34),target.y+Math.sin(a)*(.10+k*.40),.025+i*.004,.023)}
    }
    c.restore();
  }
  root.Kamnespin={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
