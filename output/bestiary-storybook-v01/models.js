/* Shared procedural 2.5D leaf model. Rendering has no gameplay side effects.
   seed is the immutable spawn phase; season never depends on animation time.
   draw: centered portrait / top-down. drawDiorama: ground-anchored, heading-aware. */
(function(root){
  'use strict';
  const TAU=Math.PI*2;
  const palettes={
    green:{light:'#e5ee9c',mid:'#9fbd49',dark:'#416322',edge:'#c4ce68',vein:'#edf0ad'},
    autumn:{light:'#ffe3a0',mid:'#e5ac42',dark:'#915022',edge:'#f4c167',vein:'#ffe8ad'}
  };
  function season(seed=0){return Math.sin(seed*127.1+311.7)<0?'green':'autumn';}
  function oval(c,x,y,rx,ry,fill,rotation=0){c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,TAU);c.fillStyle=fill;c.fill();}
  function leaf(c){
    c.beginPath();c.moveTo(0,.42);
    c.bezierCurveTo(-.64,.24,-.77,-.25,-.60,-.67);
    c.lineTo(-.52,-.53);c.lineTo(-.49,-.77);c.lineTo(-.40,-.66);
    c.quadraticCurveTo(-.52,-.79,-.27,-1.04);
    c.bezierCurveTo(-.02,-1.28,.36,-1.40,.60,-1.24);
    c.quadraticCurveTo(.69,-1.15,.51,-1.02);
    c.quadraticCurveTo(.51,-1.25,.35,-1.20);
    c.quadraticCurveTo(.18,-1.10,.39,-.83);
    c.quadraticCurveTo(.52,-.69,.52,-.48);
    c.lineTo(.70,-.62);c.lineTo(.64,-.31);c.lineTo(.73,-.36);c.quadraticCurveTo(.69,-.08,.47,.16);
    c.quadraticCurveTo(.22,.42,0,.42);c.closePath();
  }
  function wind(c,t,p,front){
    c.lineCap='round';
    for(let j=0;j<3;j++){
      const w=.18+j*.15,y=.87-j*.17,phase=t*6+j*1.3;
      c.beginPath();c.ellipse(Math.sin(phase)*.035,y,w,.065+j*.025,-.10,front?0:Math.PI,front?Math.PI:TAU);
      c.lineWidth=.035;c.strokeStyle=front?'#e9f8edbb':'#a1ccbd55';c.stroke();
      c.beginPath();c.ellipse(0,y+.035,w*.90,.065,-.10,front?0:Math.PI,front?Math.PI:TAU);
      c.lineWidth=.012;c.strokeStyle='#faffed88';c.stroke();
      const a=phase+j*2;if((Math.sin(a)>0)===front)oval(c,Math.cos(a)*(w+.05),y+Math.sin(a)*.10,.065,.026,p.mid,a);
    }
  }
  // A gust repeats over 2.4 travelled cells. Frost slows the whole motion;
  // render time only drives the quiet hover when waiting at the castle.
  function pose(o={}){
    const seed=o.seed||0, moving=o.state==='walk';
    const phase=moving?(o.distance||0)*TAU/2.4+seed:(o.time||0)*1.3+seed;
    const gust=Math.sin(phase),lag=Math.sin(phase-.65);
    return {drift:moving?.10*Math.sin(phase):.018*Math.sin(phase),
      surge:moving?.095*gust:0,lift:moving?.045+.055*(1+Math.cos(phase-.4)):.025*Math.sin(phase),
      lean:moving?-.14+.20*lag:.035*Math.sin(phase),
      flutter:moving?.035*Math.sin(phase*5):.012*Math.sin(phase*2),
      wind:phase/2,stretch:moving?1+.12*Math.cos(phase):1};
  }
  const ATTACK_DURATION=.8,CONTACT=.5,RELEASE=.23;
  function attackProgress(remaining,after=0){
    if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));
    return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null;
  }
  function attackPose(progress){
    if(progress==null)return {coil:0,flight:null,impact:0};
    const coil=progress<RELEASE?Math.sin(progress/RELEASE*Math.PI/2):Math.max(0,1-(progress-RELEASE)/.16);
    return {coil,flight:progress>=RELEASE&&progress<=CONTACT?(progress-RELEASE)/(CONTACT-RELEASE):null,
      impact:progress>=CONTACT?Math.max(0,1-(progress-CONTACT)/.20):0};
  }
  function drawGust(c,{progress,from,to,size,seed=0}){
    const p=attackPose(progress),color=palettes[season(seed)].mid;
    if(p.flight===null&&!p.impact)return;
    const k=p.flight===null?1:p.flight,x=from.x+(to.x-from.x)*k,y=from.y+(to.y-from.y)*k;
    const angle=Math.atan2(to.y-from.y,to.x-from.x);
    c.save();c.translate(x,y);c.rotate(angle);c.lineCap='round';
    const spread=p.impact?1+(1-p.impact)*2:.65+k*.5;
    for(let i=0;i<3;i++){
      c.globalAlpha=(p.impact||1)*(1-i*.23);
      c.strokeStyle=i?'#c5e9da':'#f0ffe1';c.lineWidth=size*(i?.07:.10);
      c.beginPath();c.ellipse(-i*size*.25,0,size*.20*spread,size*.65*spread,0,-1.35,4.35);c.stroke();
    }
    for(let i=0;i<4;i++){
      const a=i*TAU/4+k*5;c.globalAlpha=(p.impact||1)*.9;
      oval(c,Math.cos(a)*size*.4*spread,Math.sin(a)*size*.72*spread,size*.13,size*.045,color,a);
    }
    c.restore();
  }
  function render(c,o){
    const t=o.time||0,seed=o.seed||0,p=palettes[o.season]||palettes[season(seed)];
    const motion=pose(o),attack=attackPose(o.state==='attack'?o.attack:null);
    motion.stretch*=1-attack.coil*.36;motion.wind+=attack.coil*1.6;
    if(o.shadow!==false)oval(c,motion.drift,1.03,.45-motion.lift*.4,.075,'#35452b22');
    c.save();c.translate(motion.drift,-motion.surge);
    c.save();c.translate(0,.88);c.scale(1/motion.stretch,motion.stretch);c.translate(0,-.88);
    wind(c,motion.wind,p,false);c.restore();
    // The leaf trails the vortex, then catches up at the end of each gust.
    c.save();c.translate(-motion.drift*.6,-motion.lift);c.rotate(motion.lean+motion.flutter-attack.coil*.6);c.scale(1-attack.coil*.28,1+attack.coil*.10);
    const heading=o.heading,back=heading!==undefined&&Math.sin(heading)<-.45;
    const side=heading===undefined?0:Math.cos(heading);
    c.scale(heading===undefined?1:.65+.35*Math.abs(Math.sin(heading)),1);
    const g=c.createLinearGradient(-.5,-1,.6,.4);g.addColorStop(0,p.light);g.addColorStop(.48,p.mid);g.addColorStop(1,p.dark);
    leaf(c);c.fillStyle=g;c.fill();
    c.save();c.clip();
    const glow=c.createRadialGradient(-.23,-.65,0,-.23,-.65,.83);glow.addColorStop(0,'#ffffdb44');glow.addColorStop(1,'#ffffdb00');c.fillStyle=glow;c.fillRect(-1,-1.5,2,2);
    c.lineCap='round';c.strokeStyle=p.vein;c.lineWidth=.018;
    c.beginPath();c.moveTo(0,.40);c.bezierCurveTo(-.04,-.10,-.21,-.73,.35,-1.25);c.stroke();
    for(const s of [-1,1])for(let i=0;i<4;i++){
      const y=.18-i*.26;c.beginPath();c.moveTo(-.035,y);c.quadraticCurveTo(s*.23,y-.02,s*(.45-i*.045),y-.26);c.globalAlpha=.36;c.lineWidth=.012;c.stroke();
    }
    c.restore();
    // Thick curled side edges give the leaf depth without a hard outline.
    for(const s of [-1,1]){c.save();c.scale(s,1);c.beginPath();c.moveTo(.07,.34);c.bezierCurveTo(.57,.18,.70,-.17,.61,-.48);c.quadraticCurveTo(.55,-.25,.36,-.20);c.quadraticCurveTo(.58,-.13,.40,.10);c.quadraticCurveTo(.28,.27,.07,.34);const fold=c.createLinearGradient(.30,-.2,.61,.06);fold.addColorStop(0,p.dark);fold.addColorStop(.55,p.mid);fold.addColorStop(1,p.edge);c.fillStyle=fold;c.fill();c.restore();}
    if(!back){
      // Wind seen through two irregular openings: no human face or expression.
      const pulse=.88+.12*Math.sin(t*3+seed);
      for(const s of [-1,1]){
        c.save();c.translate(s*.215+side*.025,-.40+(s===1?-.045:.035));
        c.rotate(s===1?-.24:.12);
        c.beginPath();c.moveTo(-.14,-.025);
        c.quadraticCurveTo(-.035,-.085,.14,-.047);
        c.quadraticCurveTo(.08,.06,-.07,.045);
        c.quadraticCurveTo(-.12,.02,-.14,-.025);c.closePath();
        c.fillStyle=p.dark;c.fill();
        c.beginPath();c.moveTo(-.105,-.022);c.quadraticCurveTo(0,-.055,.10,-.036);c.quadraticCurveTo(.04,.031,-.065,.024);c.closePath();c.globalAlpha=pulse;
        c.fillStyle='#f5ffd0';c.fill();c.restore();
      }

    }
    c.restore();
    c.save();c.translate(0,.88);c.scale(1/motion.stretch,motion.stretch);c.translate(0,-.88);
    wind(c,motion.wind,p,true);c.restore();c.restore();
  }
  function draw(c,o={}){c.save();const scale=(o.size||100)/2.5;c.scale(scale,scale);c.translate(0,.14);render(c,o);c.restore();if(o.state==='attack'&&!o.externalGust)drawGust(c,{progress:o.attack,from:{x:0,y:(o.size||100)*.25},to:o.target||{x:0,y:-(o.size||100)*.85},size:(o.size||100)*.19,seed:o.seed});}
  function drawDiorama(c,o={}){c.save();const scale=(o.height||100)/2.5;c.translate(0,-scale*1.08);c.scale(scale,scale);render(c,{...o,shadow:false});c.restore();}
  root.VihrekBefore={draw,drawDiorama,season,palettes,pose,attackPose,attackProgress,drawGust,ATTACK_DURATION,CONTACT,RELEASE};
})(typeof window!=='undefined'?window:globalThis);

/* Shared procedural 2.5D leaf model. Rendering has no gameplay side effects.
   seed is the immutable spawn phase; season never depends on animation time.
   draw: centered portrait / top-down. drawDiorama: ground-anchored, heading-aware. */
(function(root){
  'use strict';
  const TAU=Math.PI*2;
  const palettes={
    green:{light:'#e5ee9c',mid:'#9fbd49',dark:'#416322',edge:'#c4ce68',vein:'#edf0ad'},
    autumn:{light:'#ffe3a0',mid:'#e5ac42',dark:'#915022',edge:'#f4c167',vein:'#ffe8ad'}
  };
  function season(seed=0){return Math.sin(seed*127.1+311.7)<0?'green':'autumn';}
  function oval(c,x,y,rx,ry,fill,rotation=0){c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,TAU);c.fillStyle=fill;c.fill();}
  function leaf(c){
    c.beginPath();c.moveTo(0,.42);
    c.bezierCurveTo(-.64,.24,-.77,-.25,-.60,-.67);
    c.bezierCurveTo(-.54,-1.12,.18,-1.40,.60,-1.24);
    c.bezierCurveTo(.31,-1.21,.25,-.94,.49,-.70);
    c.bezierCurveTo(.77,-.30,.64,.02,.47,.16);
    c.quadraticCurveTo(.22,.42,0,.42);c.closePath();
  }
  function wind(c,t,p,front){
    c.lineCap='round';
    for(let j=0;j<3;j++){
      const w=.18+j*.15,y=.87-j*.17,phase=t*6+j*1.3;
      c.beginPath();c.ellipse(Math.sin(phase)*.035,y,w,.065+j*.025,-.10,front?0:Math.PI,front?Math.PI:TAU);
      c.lineWidth=.035;c.strokeStyle=front?'#e9f8edbb':'#a1ccbd55';c.stroke();
      c.beginPath();c.ellipse(0,y+.035,w*.90,.065,-.10,front?0:Math.PI,front?Math.PI:TAU);
      c.lineWidth=.012;c.strokeStyle='#faffed88';c.stroke();
      const a=phase+j*2;if((Math.sin(a)>0)===front)oval(c,Math.cos(a)*(w+.05),y+Math.sin(a)*.10,.065,.026,p.mid,a);
    }
  }
  // A gust repeats over 2.4 travelled cells. Frost slows the whole motion;
  // render time only drives the quiet hover when waiting at the castle.
  function pose(o={}){
    const seed=o.seed||0, moving=o.state==='walk';
    const phase=moving?(o.distance||0)*TAU/2.4+seed:(o.time||0)*1.3+seed;
    const gust=Math.sin(phase),lag=Math.sin(phase-.65);
    return {drift:moving?.10*Math.sin(phase):.018*Math.sin(phase),
      surge:moving?.095*gust:0,lift:moving?.045+.055*(1+Math.cos(phase-.4)):.025*Math.sin(phase),
      lean:moving?-.14+.20*lag:.035*Math.sin(phase),
      flutter:moving?.035*Math.sin(phase*5):.012*Math.sin(phase*2),
      wind:phase/2,stretch:moving?1+.12*Math.cos(phase):1};
  }
  const ATTACK_DURATION=.8,CONTACT=.5,RELEASE=.23;
  function attackProgress(remaining,after=0){
    if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));
    return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null;
  }
  function attackPose(progress){
    if(progress==null)return {coil:0,flight:null,impact:0};
    const coil=progress<RELEASE?Math.sin(progress/RELEASE*Math.PI/2):Math.max(0,1-(progress-RELEASE)/.16);
    return {coil,flight:progress>=RELEASE&&progress<=CONTACT?(progress-RELEASE)/(CONTACT-RELEASE):null,
      impact:progress>=CONTACT?Math.max(0,1-(progress-CONTACT)/.20):0};
  }
  function drawGust(c,{progress,from,to,size,seed=0}){
    const p=attackPose(progress),color=palettes[season(seed)].mid;
    if(p.flight===null&&!p.impact)return;
    const k=p.flight===null?1:p.flight,x=from.x+(to.x-from.x)*k,y=from.y+(to.y-from.y)*k;
    const angle=Math.atan2(to.y-from.y,to.x-from.x);
    c.save();c.translate(x,y);c.rotate(angle);c.lineCap='round';
    const spread=p.impact?1+(1-p.impact)*2:.65+k*.5;
    for(let i=0;i<3;i++){
      c.globalAlpha=(p.impact||1)*(1-i*.23);
      c.strokeStyle=i?'#c5e9da':'#f0ffe1';c.lineWidth=size*(i?.07:.10);
      c.beginPath();c.ellipse(-i*size*.25,0,size*.20*spread,size*.65*spread,0,-1.35,4.35);c.stroke();
    }
    for(let i=0;i<2;i++){
      const a=i*TAU/4+k*5;c.globalAlpha=(p.impact||1)*.9;
      oval(c,Math.cos(a)*size*.4*spread,Math.sin(a)*size*.72*spread,size*.13,size*.045,color,a);
    }
    c.restore();
  }
  function render(c,o){
    const t=o.time||0,seed=o.seed||0,p=palettes[o.season]||palettes[season(seed)];
    const motion=pose(o),attack=attackPose(o.state==='attack'?o.attack:null);
    motion.stretch*=1-attack.coil*.36;motion.wind+=attack.coil*1.6;
    if(o.shadow!==false)oval(c,motion.drift,1.03,.45-motion.lift*.4,.075,'#35452b22');
    c.save();c.translate(motion.drift,-motion.surge);
    c.save();c.translate(0,.88);c.scale(1/motion.stretch,motion.stretch);c.translate(0,-.88);
    wind(c,motion.wind,p,false);c.restore();
    // The leaf trails the vortex, then catches up at the end of each gust.
    c.save();c.translate(-motion.drift*.6,-motion.lift);c.rotate(motion.lean+motion.flutter-attack.coil*.6);c.scale(1-attack.coil*.28,1+attack.coil*.10);
    const heading=o.heading,back=heading!==undefined&&Math.sin(heading)<-.45;
    const side=heading===undefined?0:Math.cos(heading);
    c.scale(heading===undefined?1:.65+.35*Math.abs(Math.sin(heading)),1);
    leaf(c);material(c,p.mid,p.light,p.dark,0,-.43,.69,.89);
    leaf(c);c.save();c.clip();
    c.lineCap='round';c.strokeStyle=p.vein;c.lineWidth=.018;
    c.beginPath();c.moveTo(0,.40);c.bezierCurveTo(-.04,-.10,-.21,-.73,.35,-1.25);c.stroke();
    for(const s of [-1,1])for(let i=0;i<2;i++){
      const y=.08-i*.45;c.beginPath();c.moveTo(-.035,y);c.quadraticCurveTo(s*.23,y-.02,s*(.45-i*.045),y-.26);c.globalAlpha=.36;c.lineWidth=.012;c.stroke();
    }
    c.restore();
    // Thick curled side edges give the leaf depth without a hard outline.
    for(const s of [-1,1]){c.save();c.scale(s,1);c.beginPath();c.moveTo(.07,.34);c.bezierCurveTo(.57,.18,.70,-.17,.61,-.48);c.quadraticCurveTo(.55,-.25,.36,-.20);c.quadraticCurveTo(.58,-.13,.40,.10);c.quadraticCurveTo(.28,.27,.07,.34);c.fillStyle=s===1?p.dark:p.mid;c.fill();c.restore();}
    if(!back){
      // Wind seen through two irregular openings: no human face or expression.
      const pulse=.88+.12*Math.sin(t*3+seed);
      for(const s of [-1,1]){
        c.save();c.translate(s*.215+side*.025,-.40+(s===1?-.045:.035));
        c.rotate(s===1?-.24:.12);
        c.beginPath();c.moveTo(-.14,-.025);
        c.quadraticCurveTo(-.035,-.085,.14,-.047);
        c.quadraticCurveTo(.08,.06,-.07,.045);
        c.quadraticCurveTo(-.12,.02,-.14,-.025);c.closePath();
        c.fillStyle=p.dark;c.fill();
        c.beginPath();c.moveTo(-.105,-.022);c.quadraticCurveTo(0,-.055,.10,-.036);c.quadraticCurveTo(.04,.031,-.065,.024);c.closePath();c.globalAlpha=pulse;
        c.fillStyle='#f5ffd0';c.fill();c.restore();
      }

    }
    c.restore();
    c.save();c.translate(0,.88);c.scale(1/motion.stretch,motion.stretch);c.translate(0,-.88);
    wind(c,motion.wind,p,true);c.restore();c.restore();
  }

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){c.save();const scale=(o.size||100)/2.5;c.scale(scale,scale);c.translate(0,.14);render(c,o);c.restore();if(o.state==='attack'&&!o.externalGust)drawGust(c,{progress:o.attack,from:{x:0,y:(o.size||100)*.25},to:o.target||{x:0,y:-(o.size||100)*.85},size:(o.size||100)*.19,seed:o.seed});}
  function drawDiorama(c,o={}){c.save();const scale=(o.height||100)/2.5;c.translate(0,-scale*1.08);c.scale(scale,scale);render(c,{...o,shadow:false});c.restore();}
  root.Vihrek={draw,drawDiorama,season,palettes,pose,attackPose,attackProgress,drawGust,ATTACK_DURATION,CONTACT,RELEASE};
})(typeof window!=='undefined'?window:globalThis);

/* Floating dandelion seed. +x is forward; combat owns damage and contact. */
(function(root){
'use strict';
const TAU=Math.PI*2,CONTACT=.52,ATTACK_DURATION=.8,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const phase=(o.state==='walk'?(o.distance||0)*4:(o.time||0)*1.7)+(o.seed||0),a=clamp(o.attack||0),active=o.state==='attack';return {sway:Math.sin(phase)*.10,drift:Math.sin(phase*.7)*.08,fold:active?(a<.3?smooth(a/.3):1-smooth((a-.6)/.4)):0,dart:active?(a<CONTACT?smooth((a-.3)/(CONTACT-.3)):1-smooth((a-CONTACT)/.35)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.18):0}}
function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill()}
function draw(c,o={}){
 const r=(o.size||80)/2.7,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.55,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
 // A swept, soft tuft: one organic volume, no spokes or crystalline branches.
 const dx=(target.x-.85)*p.dart,dy=target.y*p.dart;
 if(o.shadow!==false)oval(c,dx-.15,dy+.20,.72,.35,'#302e452b');
 c.translate(dx,dy);c.rotate(p.sway*(1-p.fold));c.translate(0,p.drift*(1-p.dart));
 if(o.evade>0)c.translate(0,-Math.sin(clamp(o.evade/.22)*Math.PI)*.30);
 // Flexible neck and a substantial copper seed make the small silhouette readable.
 c.beginPath();c.moveTo(-.12,.02);c.bezierCurveTo(.12,-.10-p.sway,.24,.17,.48,.05);
 c.strokeStyle='#776078';c.lineWidth=.07;c.stroke();
 c.beginPath();c.moveTo(.85,0);c.bezierCurveTo(.68,-.20,.27,-.34,.24,-.07);c.bezierCurveTo(.18,.23,.51,.29,.85,0);c.closePath();
 const seed=c.createLinearGradient(.28,-.21,.64,.21);seed.addColorStop(0,'#ffdfa0');seed.addColorStop(.4,'#d58d46');seed.addColorStop(1,'#754637');c.fillStyle=seed;c.fill();
 c.strokeStyle='#634b53';c.lineWidth=Math.max(.028,.65/r);c.stroke();
 c.beginPath();c.moveTo(.32,-.07);c.quadraticCurveTo(.50,-.14,.72,-.025);c.strokeStyle='#ffe8bcaa';c.lineWidth=.034;c.stroke();
 // Fold the tuft into a streamlined plume during the dart.
 c.save();c.translate(-.22,0);c.scale(1+p.fold*.08,1-p.fold*.67);
 function tuft(){c.beginPath();c.moveTo(.34,.05);
 c.bezierCurveTo(.26,-.25,.10,-.36,.00,-.44);
 c.bezierCurveTo(-.04,-.69,-.28,-.78,-.45,-.65);
 c.bezierCurveTo(-.72,-.83,-.91,-.59,-.83,-.43);
 c.bezierCurveTo(-1.06,-.46,-1.14,-.20,-.99,-.04);
 c.bezierCurveTo(-1.14,.15,-.94,.36,-.79,.33);
 c.bezierCurveTo(-.86,.58,-.56,.71,-.39,.53);
 c.bezierCurveTo(-.13,.67,.06,.40,.09,.29);
 c.bezierCurveTo(.26,.25,.25,.12,.34,.05);c.closePath();}
 const fluff=c.createLinearGradient(-.65,-.65,.06,.55);fluff.addColorStop(0,'#fffdf3');fluff.addColorStop(.40,'#f3edf4');fluff.addColorStop(.72,'#c9bdd7');fluff.addColorStop(1,'#82748f');
 tuft();c.fillStyle=fluff;c.fill();
 // Broad inner locks share the flow toward the neck; edges stay soft and unoutlined.
 const locks=[[-.80,-.33,-.68,-.60,-.23,-.47],[-.72,.05,-.87,-.13,-.31,-.26],[-.59,.36,-.78,.23,-.20,.13],[-.37,.46,-.49,.18,.04,.04]];
 for(const [x,y,bx,by,ex,ey] of locks){c.beginPath();c.moveTo(.20,.09);c.bezierCurveTo(ex,ey,bx,by,x,y);c.bezierCurveTo(x-.10,y+.10,ex-.03,ey+.16,.20,.09);c.closePath();c.fillStyle='#fffdf351';c.fill();}
 // Sparse trailing silk strands replace the old radial lattice.
 for(let i=0;i<11;i++){const y=-.52+i*.102,x=-.68-.16*Math.cos(i*.75),flutter=Math.sin((o.distance||0)*3+(o.seed||0)+i*.6)*.025;
 c.beginPath();c.moveTo(-.10,y*.26);c.bezierCurveTo(-.38,y*.60,x,y+flutter,x-.16-(i%3)*.055,y-.06+flutter);
 c.strokeStyle=i%3?'#fffdf4b3':'#b0a1bd88';c.lineWidth=Math.max(.009,.35/r);c.stroke();}
 // Highlight at the attachment keeps the tuft visibly connected to its seed.
 oval(c,.18,.07,.075,.055,'#f6e9c7');
 c.restore();c.restore();
 if(p.impact){c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.globalAlpha=p.impact;for(let i=0;i<6;i++){const a=i*TAU/6,k=1-p.impact;c.strokeStyle='#f8f2d5';c.lineWidth=.025;c.beginPath();c.moveTo(target.x+Math.cos(a)*k*.45,target.y+Math.sin(a)*k*.45);c.lineTo(target.x+Math.cos(a)*(k*.45+.10),target.y+Math.sin(a)*(k*.45+.10));c.stroke()}c.restore()}
}
root.PushinkaBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

/* Floating dandelion seed. +x is forward; combat owns damage and contact. */
(function(root){
'use strict';
const TAU=Math.PI*2,CONTACT=.52,ATTACK_DURATION=.8,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const phase=(o.state==='walk'?(o.distance||0)*4:(o.time||0)*1.7)+(o.seed||0),a=clamp(o.attack||0),active=o.state==='attack';return {sway:Math.sin(phase)*.10,drift:Math.sin(phase*.7)*.08,fold:active?(a<.3?smooth(a/.3):1-smooth((a-.6)/.4)):0,dart:active?(a<CONTACT?smooth((a-.3)/(CONTACT-.3)):1-smooth((a-CONTACT)/.35)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.18):0}}
function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill()}

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){
 const r=(o.size||80)/2.7,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.55,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
 // A swept, soft tuft: one organic volume, no spokes or crystalline branches.
 const dx=(target.x-.85)*p.dart,dy=target.y*p.dart;
 if(o.shadow!==false)oval(c,dx-.15,dy+.20,.72,.35,'#302e452b');
 c.translate(dx,dy);c.rotate(p.sway*(1-p.fold));c.translate(0,p.drift*(1-p.dart));
 if(o.evade>0)c.translate(0,-Math.sin(clamp(o.evade/.22)*Math.PI)*.30);
 // Flexible neck and a substantial copper seed make the small silhouette readable.
 c.beginPath();c.moveTo(-.12,.02);c.bezierCurveTo(.12,-.10-p.sway,.24,.17,.48,.05);
 c.strokeStyle='#776078';c.lineWidth=.07;c.stroke();
 c.beginPath();c.moveTo(.85,0);c.bezierCurveTo(.68,-.20,.27,-.34,.24,-.07);c.bezierCurveTo(.18,.23,.51,.29,.85,0);c.closePath();
 material(c,'#c58f53','#f4d494','#86603e',.51,0,.33,.24);
 // Fold the tuft into a streamlined plume during the dart.
 c.save();c.translate(-.22,0);c.scale(1+p.fold*.08,1-p.fold*.67);
 function tuft(){c.beginPath();c.moveTo(.34,.05);
 c.bezierCurveTo(.26,-.25,.10,-.36,.00,-.44);
 c.bezierCurveTo(-.04,-.69,-.28,-.78,-.45,-.65);
 c.bezierCurveTo(-.72,-.83,-.91,-.59,-.83,-.43);
 c.bezierCurveTo(-1.06,-.46,-1.14,-.20,-.99,-.04);
 c.bezierCurveTo(-1.14,.15,-.94,.36,-.79,.33);
 c.bezierCurveTo(-.86,.58,-.56,.71,-.39,.53);
 c.bezierCurveTo(-.13,.67,.06,.40,.09,.29);
 c.bezierCurveTo(.26,.25,.25,.12,.34,.05);c.closePath();}
 tuft();material(c,'#d5d3d7','#faf4df','#a6aabd',-.35,0,.78,.65);
 // Broad inner locks share the flow toward the neck; edges stay soft and unoutlined.
 const locks=[[-.80,-.33,-.68,-.60,-.23,-.47],[-.72,.05,-.87,-.13,-.31,-.26],[-.59,.36,-.78,.23,-.20,.13],[-.37,.46,-.49,.18,.04,.04]];
 for(const [x,y,bx,by,ex,ey] of locks){c.beginPath();c.moveTo(.20,.09);c.bezierCurveTo(ex,ey,bx,by,x,y);c.bezierCurveTo(x-.10,y+.10,ex-.03,ey+.16,.20,.09);c.closePath();c.fillStyle='#fffdf351';c.fill();}
 // Highlight at the attachment keeps the tuft visibly connected to its seed.
 oval(c,.18,.07,.075,.055,'#f6e9c7');
 c.restore();c.restore();
 if(p.impact){c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.globalAlpha=p.impact;for(let i=0;i<6;i++){const a=i*TAU/6,k=1-p.impact;c.strokeStyle='#f8f2d5';c.lineWidth=.025;c.beginPath();c.moveTo(target.x+Math.cos(a)*k*.45,target.y+Math.sin(a)*k*.45);c.lineTo(target.x+Math.cos(a)*(k*.45+.10),target.y+Math.sin(a)*(k*.45+.10));c.stroke()}c.restore()}
}
root.Pushinka={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

/* Top-down fog spirit. +x forward; all damage belongs to the siege timer. */
(function(root){
'use strict';
const TAU=Math.PI*2,ATTACK_DURATION=.9,CONTACT=.55,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const phase=(o.distance||0)*2+(o.seed||0),a=clamp(o.attack||0),active=o.state==='attack';return {flow:(o.time||0)*1.1+(o.seed||0),sway:Math.sin(phase)*.038,coil:active?(a<.28?ease(a/.28):1-ease((a-.28)/.30)):0,reach:active?(a<CONTACT?ease((a-.28)/(CONTACT-.28)):1-ease((a-CONTACT)/.23)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.20):0}}
function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill()}
function cloud(c,x,y,rx,ry,alpha){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(-.2,-.18,.05,0,0,1);g.addColorStop(0,'rgba(228,240,244,'+alpha+')');g.addColorStop(.48,'rgba(160,185,203,'+alpha*.65+')');g.addColorStop(1,'rgba(143,175,195,0)');oval(c,0,0,1,1,g);c.restore()}
function drawAura(c,{radius,time=0}){for(let i=0;i<5;i++){const a=i*2.4+time*.10;cloud(c,Math.cos(a)*radius*.27,Math.sin(a)*radius*.27,radius*.78,radius*.72,.10)} }
function draw(c,o={}){
 const r=(o.size||100)/3.2,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2.2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);
 if(o.shadow!==false)oval(c,-.2,.15,1.05,.48,'#24364518');
 // Airy wisps surround a dense core that stays readable at map scale.
 for(let j=0;j<3;j++)for(let i=4;i>=0;i--){const lag=p.flow-i*.42-j;cloud(c,-.25-i*.27*(1-p.coil*.3),Math.sin(lag)*(.11+i*.035)+(j-1)*.22,.52-i*.045,.36-i*.022,.20+(4-i)*.025)}
 c.save();c.scale(1-p.coil*.15,1+p.coil*.10);
 const core=c.createLinearGradient(0,-.64,0,.65);
 core.addColorStop(0,'#e2f0f3');core.addColorStop(.48,'#b6cfdc');core.addColorStop(1,'#607e94');
 c.beginPath();c.moveTo(.62,-.35);
 c.bezierCurveTo(.24,-.78,-.43,-.64,-.64,-.35);
 c.bezierCurveTo(-.88,-.38,-1.02,-.17,-1.19,-.08);
 c.bezierCurveTo(-.97,.02,-.85,.01,-.72,.06);
 c.bezierCurveTo(-.93,.20,-1.01,.33,-1.13,.35);
 c.bezierCurveTo(-.77,.49,-.53,.29,-.38,.43);
 c.bezierCurveTo(.03,.77,.69,.49,.62,-.35);c.closePath();
 c.fillStyle=core;c.fill();c.strokeStyle='#4d687d99';c.lineWidth=.055;c.stroke();c.restore();
 cloud(c,.04,0,.87*(1-p.coil*.15),.69*(1+p.coil*.10),.30);
 cloud(c,-.16,-.23,.58,.39,.35);
 // A curved mist lash grows out of the body, reaches the gate, and dissolves.
 if(p.reach>0){const ex=.4+(target.x-.4)*p.reach,ey=target.y*p.reach;
  for(let i=0;i<10;i++){const u=i/9;cloud(c,.4+(ex-.4)*u,ey*u-Math.sin(u*Math.PI)*.22,.19+(1-u)*.12,.12+(1-u)*.07,.45)}
 }
 c.save();c.translate(.47-p.coil*.09,p.sway);c.rotate(-p.sway*.6);c.scale(1.4,1.24);
 const mask=c.createLinearGradient(-.19,-.43,.30,.43);mask.addColorStop(0,'#fff6df');mask.addColorStop(.5,'#dddccd');mask.addColorStop(1,'#9ea99f');
 c.beginPath();c.moveTo(-.02,-.43);c.bezierCurveTo(.34,-.38,.39,.21,.05,.43);c.bezierCurveTo(-.24,.39,-.31,-.30,-.02,-.43);c.closePath();c.fillStyle=mask;c.fill();c.strokeStyle='#40596b';c.lineWidth=.045;c.stroke();
 for(const side of [-1,1])oval(c,.075,side*.18,.055,.112,'#203340');
 c.restore();
 if(p.impact){const k=1-p.impact;for(let i=0;i<5;i++){const a=i*TAU/5;cloud(c,target.x+Math.cos(a)*k*.45,target.y+Math.sin(a)*k*.45,.22,.20,p.impact*.45)}}
 c.restore();
}
root.TumannikBefore={draw,drawAura,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

/* Top-down fog spirit. +x forward; all damage belongs to the siege timer. */
(function(root){
'use strict';
const TAU=Math.PI*2,ATTACK_DURATION=.9,CONTACT=.55,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const phase=(o.distance||0)*2+(o.seed||0),a=clamp(o.attack||0),active=o.state==='attack';return {flow:(o.time||0)*1.1+(o.seed||0),sway:Math.sin(phase)*.038,coil:active?(a<.28?ease(a/.28):1-ease((a-.28)/.30)):0,reach:active?(a<CONTACT?ease((a-.28)/(CONTACT-.28)):1-ease((a-CONTACT)/.23)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.20):0}}
function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill()}
function cloud(c,x,y,rx,ry,alpha){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(-.2,-.18,.05,0,0,1);g.addColorStop(0,'rgba(228,240,244,'+alpha+')');g.addColorStop(.48,'rgba(160,185,203,'+alpha*.65+')');g.addColorStop(1,'rgba(143,175,195,0)');oval(c,0,0,1,1,g);c.restore()}
function drawAura(c,{radius,time=0}){for(let i=0;i<5;i++){const a=i*2.4+time*.10;cloud(c,Math.cos(a)*radius*.27,Math.sin(a)*radius*.27,radius*.78,radius*.72,.10)} }

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){
 const r=(o.size||100)/3.2,p=pose(o),view=o.viewHeading??o.heading??0,target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2.2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);
 if(o.shadow!==false)oval(c,-.2,.15,1.05,.48,'#24364518');
 // Airy wisps surround a dense core that stays readable at map scale.
 for(let j=0;j<3;j++)for(let i=4;i>=0;i--){const lag=p.flow-i*.42-j;cloud(c,-.25-i*.27*(1-p.coil*.3),Math.sin(lag)*(.11+i*.035)+(j-1)*.22,.52-i*.045,.36-i*.022,.20+(4-i)*.025)}
 // The mist gathers beneath a raised mask; only its trailing wake follows the road.
 c.save();c.rotate(-view);c.translate(0,-.12+Math.sin(p.flow)*.035);c.scale(1+p.coil*.10,1-p.coil*.12);
 c.beginPath();c.moveTo(-.55,.42);c.bezierCurveTo(-.75,.19,-.67,-.13,-.43,-.28);
 c.bezierCurveTo(-.48,-.60,.04,-.77,.27,-.48);c.bezierCurveTo(.69,-.49,.79,-.06,.54,.18);
 c.bezierCurveTo(.66,.40,.34,.62,.10,.47);c.bezierCurveTo(-.10,.70,-.37,.50,-.55,.42);c.closePath();
 material(c,'#a6c9d2','#d5e8df','#6797a7',-.02,-.04,.65,.57);c.restore();
 cloud(c,-.24,.10,.78,.43,.27);
 // A curved mist lash grows out of the body, reaches the gate, and dissolves.
 if(p.reach>0){const ex=.4+(target.x-.4)*p.reach,ey=target.y*p.reach;
  for(let i=0;i<10;i++){const u=i/9;cloud(c,.4+(ex-.4)*u,ey*u-Math.sin(u*Math.PI)*.22,.19+(1-u)*.12,.12+(1-u)*.07,.45)}
 }
 // The mask sits on the leading face of the cloud, not on its crown.
 // Turn its three-quarter projection with travel while keeping its chin below its brow.
 const facing=Math.cos(view),front=Math.sin(view),width=.64+.30*Math.abs(front);
 c.save();c.translate(.62-p.coil*.07,0);c.rotate(-view);c.translate(0,-.10+p.sway*.5);
 c.rotate(-facing*.20+p.sway*.4);c.scale(width,.90);
 function plate(){c.beginPath();c.moveTo(-.27,-.34);c.quadraticCurveTo(0,-.48,.27,-.32);c.lineTo(.25,.10);c.quadraticCurveTo(.15,.27,0,.38);c.quadraticCurveTo(-.18,.25,-.26,.07);c.closePath();}
 // Separate cast shadow and a narrow lower edge show thickness without a spherical highlight.
 c.save();c.translate(-facing*.14,.09);plate();c.fillStyle='#456d7577';c.fill();c.restore();
 c.save();c.translate(-facing*.045,.022);plate();c.fillStyle='#8ba69b';c.fill();c.restore();
 plate();c.fillStyle='#f0e9ce';c.fill();c.save();c.clip();
 c.beginPath();c.moveTo(.12,-.43);c.lineTo(.28,-.30);c.lineTo(.27,.14);c.lineTo(0,.38);c.lineTo(.08,.04);c.closePath();c.fillStyle='#c5ceb5';c.fill();c.restore();
 c.save();c.translate(facing*.065,.045);
 for(const side of [-1,1]){c.beginPath();c.moveTo(side*.055,-.13);c.quadraticCurveTo(side*.15,-.24,side*.215,-.15);c.lineTo(side*.16,-.035);c.quadraticCurveTo(side*.09,-.04,side*.055,-.13);c.fillStyle='#31515a';c.fill();}
 c.restore();c.restore();
 if(p.impact){const k=1-p.impact;for(let i=0;i<5;i++){const a=i*TAU/5;cloud(c,target.x+Math.cos(a)*k*.45,target.y+Math.sin(a)*k*.45,.22,.20,p.impact*.45)}}
 c.restore();
}
root.Tumannik={draw,drawAura,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

/* Dreven: six weight-bearing roots; +x forward. Combat owns the contact timer. */
(function(root){
'use strict';
const TAU=Math.PI*2,ATTACK_DURATION=1.2,CONTACT=.6;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){
 const phase=(o.distance||0)/.85+(o.seed||0)/TAU,a=clamp(o.attack||0),active=o.state==='attack';
 const reach=active?(a<CONTACT?ease((a-.32)/.28):1-ease((a-CONTACT)/.4)):0;
 const brace=active?(a<.32?ease(a/.32):1-ease((a-.7)/.3)):0;
 const roots=Array.from({length:6},(_,i)=>{const u=((phase+i/6)%1+1)%1;return o.state==='walk'?{step:u<1/6?-.09+.18*ease(u*6):.09-.18*(u-1/6)*1.2,lift:0}:{step:0,lift:0}});
 return {roots,reach,brace,roll:o.state==='walk'?Math.sin(phase*TAU)*.018:0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.2):0};
}
function oval(c,x,y,rx,ry,color,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=color;c.fill()}
function draw(c,o={}){
 const r=(o.size||100)/3,p=pose(o),t=o.time||0,h=o.viewHeading??o.heading??0;
 const sh=Math.sin(h),ch=Math.cos(h),zTop=1.28-p.brace*.08;
 // Near-orthographic overhead view: height adds only a shallow rim shadow.
 const project=(x,y,z=0)=>[(x*ch-y*sh),(x*sh+y*ch)-z*.12];
 const path=(points,color,stroke)=>{c.beginPath();points.forEach((q,i)=>{const v=project(...q);i?c.lineTo(...v):c.moveTo(...v)});c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.018;c.stroke()}};
 const dot=(x,y,z,rx,ry,col)=>{const v=project(x,y,z);oval(c,v[0],v[1],rx,ry,col)};
 c.save();c.translate(o.x||0,o.y||0);if(o.viewHeading!==undefined)c.rotate(-h);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
 if(o.shadow!==false)oval(c,0,.1,1.24,1.10,'#14211855');
 const target=o.target||{x:r*2.1,y:0};
 // Endpoint correction: target is measured in the game's uncompressed ground plane.
 const tx=target.x/r,ty=target.y/r,wy=tx*sh+ty*ch,wx=tx*ch-ty*sh;
 const targetRoot={x:wx*ch+wy*sh,y:-wx*sh+wy*ch};
 // Uneven buttress roots spread and taper across the ground, without knees or feet.
 const layout=[[.22,1.31,.30,.19],[1.23,1.05,.38,-.16],[2.51,1.36,.26,.18],[3.44,1.12,.36,-.22],[4.28,1.25,.31,.19],[5.69,1.18,.40,-.18]];
 const roots=layout.map(([a,len,width,curve],i)=>{const q=p.roots[i],front=i===0||i===5;
 let x=Math.cos(a)*len+q.step,y=Math.sin(a)*len;
 if(front){x+=(targetRoot.x-x)*p.reach;y+=(targetRoot.y-y)*p.reach;}
 return {i,a,x,y,q,width,curve,front,depth:Math.sin(a+h)};});
 function rootLeg(k){const {a,x,y,width,curve,front}=k;
  const base={x:Math.cos(a)*.48,y:Math.sin(a)*.48},nx=-Math.sin(a),ny=Math.cos(a);
  function ribbon(start,end,w,bend){
   const dx=end.x-start.x,dy=end.y-start.y,l=Math.hypot(dx,dy)||1,px=-dy/l,py=dx/l;
   const points=Array.from({length:13},(_,i)=>{const u=i/12,bulge=Math.sin(u*Math.PI)*bend;
    return {x:start.x+dx*u+px*bulge,y:start.y+dy*u+py*bulge,w:w*Math.pow(1-u,1.45)*(1+.10*Math.sin(u*17))};});
   path([...points.map(q=>[q.x+px*q.w,q.y+py*q.w,.06]),...points.slice().reverse().map(q=>[q.x-px*q.w,q.y-py*q.w,.06])],'#765338','#453323');
   // Long wood fibres continue from trunk to the tapered tips.
   for(const [offset,col,line] of [[-.32,'#b28a54',.032],[.28,'#392d2399',.023],[0,'#d1a56866',.016]]){c.beginPath();points.forEach((q,i)=>{const v=project(q.x+px*q.w*offset,q.y+py*q.w*offset,.07);i?c.lineTo(...v):c.moveTo(...v)});c.strokeStyle=col;c.lineWidth=line;c.stroke()}
  }
  const end={x,y};
  // Forks are shorter than the parent, irregular and flattened against the soil.
  const fork={x:base.x+(x-base.x)*.53,y:base.y+(y-base.y)*.53};
  const spread=front?1-p.reach:1;
  if(spread>.08){ribbon(fork,{x:x*.91+nx*.24*spread,y:y*.91+ny*.24*spread},width*.36,-curve*.8);
   if(k.i%2===0)ribbon({x:(fork.x+x)*.5,y:(fork.y+y)*.5},{x:x*.96-nx*.18*spread,y:y*.96-ny*.18*spread},width*.18,curve*.35);}
  ribbon(base,end,width,curve*(1-(front?p.reach:0)));
 }
 roots.slice().sort((a,b)=>a.depth-b.depth).forEach(rootLeg);
 // Solid trunk: uneven vertical bark slabs surround a raised cut surface.
 const N=20,ring=Array.from({length:N},(_,i)=>{const a=i*TAU/N;return {a,rad:.76+.055*Math.sin(i*2.6),z:zTop+.07*Math.sin(i*3.1)}});
 for(let i=0;i<N;i++){const a=ring[i],b=ring[(i+1)%N];if(Math.sin((a.a+Math.PI/N)+h)<0)continue;
  const shade=Math.sin(a.a+h-.5),color=shade>.7?'#9b7850':shade>.1?'#785b3c':'#513e2d';
  path([[Math.cos(a.a)*a.rad,Math.sin(a.a)*a.rad,a.z],[Math.cos(b.a)*b.rad,Math.sin(b.a)*b.rad,b.z],[Math.cos(b.a)*.82,Math.sin(b.a)*.82,.24],[Math.cos(a.a)*.82,Math.sin(a.a)*.82,.18]],color,'#3e3024');
  for(let j=0;j<2;j++){const ang=a.a+.07+j*.1,v1=project(Math.cos(ang)*.80,Math.sin(ang)*.80,.35),v2=project(Math.cos(ang)*a.rad,Math.sin(ang)*a.rad,a.z-.08);c.beginPath();c.moveTo(...v1);c.lineTo((v1[0]+v2[0])/2+.025,(v1[1]+v2[1])/2);c.lineTo(...v2);c.strokeStyle=j?'#b08c5955':'#31271f99';c.lineWidth=j?.022:.035;c.stroke()}
 }
 const top=ring.map(k=>[Math.cos(k.a)*k.rad,Math.sin(k.a)*k.rad,k.z]);
 const wood=c.createLinearGradient(-.7,-1.8,.7,-.7);wood.addColorStop(0,'#d4b487');wood.addColorStop(.55,'#b48b5c');wood.addColorStop(1,'#8b633e');path(top,wood,'#59412b');
 // Off-centre, weathered growth rings: broad grain instead of a concentric target.
 for(let j=1;j<=9;j++){const pts=Array.from({length:81},(_,i)=>{const a=i*TAU/80,rad=j*.073*(1+.055*Math.sin(a*3+.5)+.022*Math.sin(a*8+j*.15));return project(-.075+Math.cos(a)*rad, .035+Math.sin(a)*rad*.93,zTop+.006)});c.beginPath();pts.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=j%3?'#67472a80':'#e1bd8477';c.lineWidth=j%3?.012:.020;c.stroke()}
 // Split grain and forked drying cracks, fixed to the wood as it turns.
 for(const [a,len] of [[.83,.28],[1.92,.39],[2.86,.27],[3.7,.42],[4.78,.31],[5.58,.22]]){
  const ca=Math.cos(a),sa=Math.sin(a),px=-sa,py=ca;
  const edge={x:ca*.73,y:sa*.73},mid={x:ca*(.73-len*.55)+px*.027,y:sa*(.73-len*.55)+py*.027},tip={x:ca*(.73-len),y:sa*(.73-len)};
  path([[edge.x+px*.022,edge.y+py*.022,zTop+.01],[mid.x+px*.010,mid.y+py*.010,zTop+.01],[tip.x,tip.y,zTop+.01],[mid.x-px*.014,mid.y-py*.014,zTop+.01],[edge.x-px*.009,edge.y-py*.009,zTop+.01]],'#493322bb');
  path([[mid.x,mid.y,zTop+.012],[mid.x+px*.08-ca*.06,mid.y+py*.08-sa*.06,zTop+.012],[mid.x+px*.013,mid.y+py*.013,zTop+.012]],'#5b3c27aa');
 }
 // Asymmetric broken bark plates, with bright torn wood on their inner edges.
 for(const [a,width,height] of [[.55,.22,.13],[1.28,.36,.23],[2.08,.20,.12],[2.65,.38,.28],[3.45,.28,.19],[4.03,.22,.12],[4.67,.35,.24],[5.38,.22,.17]]){
  const b=a+width,pt=(angle,rad,z)=>[Math.cos(angle)*rad,Math.sin(angle)*rad,z];
  path([pt(a,.68,zTop),pt(a-.03,.79,zTop+height),pt(a+width*.38,.84,zTop+height*.8),pt(b,.78,zTop+height*1.1),pt(b+.025,.67,zTop)],'#63472f','#3d3024');
  path([pt(a,.68,zTop),pt(a+width*.33,.73,zTop+height*.65),pt(b,.69,zTop+height*.35),pt(b+.025,.67,zTop)],'#b18b58');
 }
 // Broken front notch opens into the hollow, readable from above in every direction.
 const hollow=[[.86,-.25,zTop],[.61,-.28,zTop],[.39,-.17,zTop],[.34,.02,zTop],[.47,.21,zTop],[.73,.25,zTop],[.91,.12,zTop]];
 path(hollow,'#38281c','#b18a55');
 path([[.84,-.16,zTop],[.59,-.19,zTop],[.44,-.08,zTop],[.46,.09,zTop],[.66,.17,zTop],[.87,.09,zTop]],'#191b12');
 const e=project(.63,0,zTop+.01),glow=c.createRadialGradient(e[0],e[1],0,e[0],e[1],.24);
 glow.addColorStop(0,'#ffe5a3');glow.addColorStop(.25,'#ec8e29bb');glow.addColorStop(1,'#d66e1500');oval(c,e[0],e[1],.23,.21,glow);
 dot(.64,0,zTop+.02,.051,.047,'#ffd383');
 for(const a of [-.47,.47]){const v1=project(Math.cos(a)*.70,Math.sin(a)*.70,zTop+.02),v2=project(Math.cos(a)*.83,Math.sin(a)*.83,zTop+.02);c.beginPath();c.moveTo(...v1);c.lineTo(...v2);c.strokeStyle='#ffbe60';c.lineWidth=.035;c.stroke()}
 // Uneven moss cushions overlap the broken rim, as in the concept sheet.
 for(const [a,size] of [[1.20,.16],[2.7,.20],[3.9,.11],[4.8,.18],[5.4,.09]]){
  const cx=Math.cos(a)*.73,cy=Math.sin(a)*.73;
  dot(cx,cy,zTop+.03,size*1.15,size*.82,'#35482b');
  for(let i=0;i<13;i++){const ang=i*2.399,rr=size*(.17+(i%4)*.20),x=cx+Math.cos(ang)*rr,y=cy+Math.sin(ang)*rr;
   dot(x,y,zTop+.10,size*(.28+(i%3)*.06),size*.27,['#536838','#718347','#919d58'][i%3]);}
 }

 for(let i=0;i<3;i++)dot(-.63,.42,.57+i*.16,.10-i*.013,.045,'#c6a378');
 if(o.burning>0){for(let i=0;i<6;i++){const a=i*2.399,v=project(Math.cos(a)*.81,Math.sin(a)*.81,.5+.1*Math.sin(t*8+i));oval(c,v[0],v[1],.04,.08,'#ffae4fcc');}}
 if(p.impact>0){c.globalAlpha*=p.impact;c.strokeStyle='#d9bb78';c.lineWidth=.03;const v=project(targetRoot.x,targetRoot.y);c.beginPath();c.ellipse(v[0],v[1],.15+(1-p.impact)*.4,.09+(1-p.impact)*.2,0,0,TAU);c.stroke()}
 c.restore();
}
root.DrevenBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

/* Dreven: six weight-bearing roots; +x forward. Combat owns the contact timer. */
(function(root){
'use strict';
const TAU=Math.PI*2,ATTACK_DURATION=1.2,CONTACT=.6;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){
 const phase=(o.distance||0)/.85+(o.seed||0)/TAU,a=clamp(o.attack||0),active=o.state==='attack';
 const reach=active?(a<CONTACT?ease((a-.32)/.28):1-ease((a-CONTACT)/.4)):0;
 const brace=active?(a<.32?ease(a/.32):1-ease((a-.7)/.3)):0;
 const roots=Array.from({length:6},(_,i)=>{const u=((phase+i/6)%1+1)%1;return o.state==='walk'?{step:u<1/6?-.09+.18*ease(u*6):.09-.18*(u-1/6)*1.2,lift:0}:{step:0,lift:0}});
 return {roots,reach,brace,roll:o.state==='walk'?Math.sin(phase*TAU)*.018:0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.2):0};
}
function oval(c,x,y,rx,ry,color,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=color;c.fill()}

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){
 const r=(o.size||100)/3,p=pose(o),t=o.time||0,h=o.viewHeading??o.heading??0;
 const sh=Math.sin(h),ch=Math.cos(h),zTop=1.28-p.brace*.08;
 // Near-orthographic overhead view: height adds only a shallow rim shadow.
 const project=(x,y,z=0)=>[(x*ch-y*sh),(x*sh+y*ch)-z*.12];
 const path=(points,color,stroke)=>{c.beginPath();points.forEach((q,i)=>{const v=project(...q);i?c.lineTo(...v):c.moveTo(...v)});c.closePath();c.fillStyle=color;c.fill();if(false&&stroke){c.strokeStyle=stroke;c.lineWidth=.018;c.stroke()}};
 const dot=(x,y,z,rx,ry,col)=>{const v=project(x,y,z);oval(c,v[0],v[1],rx,ry,col)};
 c.save();c.translate(o.x||0,o.y||0);if(o.viewHeading!==undefined)c.rotate(-h);c.scale(r,r);c.lineCap='round';c.lineJoin='round';
 if(o.shadow!==false)oval(c,0,.1,1.24,1.10,'#14211855');
 const target=o.target||{x:r*2.1,y:0};
 // Endpoint correction: target is measured in the game's uncompressed ground plane.
 const tx=target.x/r,ty=target.y/r,wy=tx*sh+ty*ch,wx=tx*ch-ty*sh;
 const targetRoot={x:wx*ch+wy*sh,y:-wx*sh+wy*ch};
 // Uneven buttress roots spread and taper across the ground, without knees or feet.
 const layout=[[.22,1.31,.30,.19],[1.23,1.05,.38,-.16],[2.51,1.36,.26,.18],[3.44,1.12,.36,-.22],[4.28,1.25,.31,.19],[5.69,1.18,.40,-.18]];
 const roots=layout.map(([a,len,width,curve],i)=>{const q=p.roots[i],front=i===0||i===5;
 let x=Math.cos(a)*len+q.step,y=Math.sin(a)*len;
 if(front){x+=(targetRoot.x-x)*p.reach;y+=(targetRoot.y-y)*p.reach;}
 return {i,a,x,y,q,width,curve,front,depth:Math.sin(a+h)};});
 function rootLeg(k){const {a,x,y,width,curve,front}=k;
  const base={x:Math.cos(a)*.48,y:Math.sin(a)*.48},nx=-Math.sin(a),ny=Math.cos(a);
  function ribbon(start,end,w,bend){
   const dx=end.x-start.x,dy=end.y-start.y,l=Math.hypot(dx,dy)||1,px=-dy/l,py=dx/l;
   const points=Array.from({length:13},(_,i)=>{const u=i/12,bulge=Math.sin(u*Math.PI)*bend;
    return {x:start.x+dx*u+px*bulge,y:start.y+dy*u+py*bulge,w:w*Math.pow(1-u,1.45)*(1+.10*Math.sin(u*17))};});
   path([...points.map(q=>[q.x+px*q.w,q.y+py*q.w,.06]),...points.slice().reverse().map(q=>[q.x-px*q.w,q.y-py*q.w,.06])],'#765338','#453323');
   // Long wood fibres continue from trunk to the tapered tips.
   for(const [offset,col,line] of [[-.25,'#bd9b69',.075]]){c.beginPath();points.forEach((q,i)=>{const v=project(q.x+px*q.w*offset,q.y+py*q.w*offset,.07);i?c.lineTo(...v):c.moveTo(...v)});c.strokeStyle=col;c.lineWidth=line;c.stroke()}
  }
  const end={x,y};
  // Forks are shorter than the parent, irregular and flattened against the soil.
  const fork={x:base.x+(x-base.x)*.53,y:base.y+(y-base.y)*.53};
  const spread=front?1-p.reach:1;
  if(spread>.08){ribbon(fork,{x:x*.91+nx*.24*spread,y:y*.91+ny*.24*spread},width*.36,-curve*.8);
   if(k.i%2===0)ribbon({x:(fork.x+x)*.5,y:(fork.y+y)*.5},{x:x*.96-nx*.18*spread,y:y*.96-ny*.18*spread},width*.18,curve*.35);}
  ribbon(base,end,width,curve*(1-(front?p.reach:0)));
 }
 roots.slice().sort((a,b)=>a.depth-b.depth).forEach(rootLeg);
 // Solid trunk: uneven vertical bark slabs surround a raised cut surface.
 const N=12,ring=Array.from({length:N},(_,i)=>{const a=i*TAU/N;return {a,rad:.76+.055*Math.sin(i*2.6),z:zTop+.07*Math.sin(i*3.1)}});
 for(let i=0;i<N;i++){const a=ring[i],b=ring[(i+1)%N];if(Math.sin((a.a+Math.PI/N)+h)<0)continue;
  const shade=Math.sin(a.a+h-.5),color=shade>.7?'#9b7850':shade>.1?'#785b3c':'#513e2d';
  path([[Math.cos(a.a)*a.rad,Math.sin(a.a)*a.rad,a.z],[Math.cos(b.a)*b.rad,Math.sin(b.a)*b.rad,b.z],[Math.cos(b.a)*.82,Math.sin(b.a)*.82,.24],[Math.cos(a.a)*.82,Math.sin(a.a)*.82,.18]],color,'#3e3024');

 }
 const top=ring.map(k=>[Math.cos(k.a)*k.rad,Math.sin(k.a)*k.rad,k.z]);
 path(top,'#be9f71');material(c,'#b89767','#dec391','#876840',0,-.15,.83,.8);
 // Off-centre, weathered growth rings: broad grain instead of a concentric target.
 for(let j=1;j<=3;j++){const pts=Array.from({length:81},(_,i)=>{const a=i*TAU/80,rad=j*.19*(1+.055*Math.sin(a*3+.5)+.022*Math.sin(a*8+j*.15));return project(-.075+Math.cos(a)*rad, .035+Math.sin(a)*rad*.93,zTop+.006)});c.beginPath();pts.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=j%3?'#67472a80':'#e1bd8477';c.lineWidth=.026;c.stroke()}
 // Split grain and forked drying cracks, fixed to the wood as it turns.
 for(const [a,len] of [[1.92,.29],[3.7,.32]]){
  const ca=Math.cos(a),sa=Math.sin(a),px=-sa,py=ca;
  const edge={x:ca*.73,y:sa*.73},mid={x:ca*(.73-len*.55)+px*.027,y:sa*(.73-len*.55)+py*.027},tip={x:ca*(.73-len),y:sa*(.73-len)};
  path([[edge.x+px*.022,edge.y+py*.022,zTop+.01],[mid.x+px*.010,mid.y+py*.010,zTop+.01],[tip.x,tip.y,zTop+.01],[mid.x-px*.014,mid.y-py*.014,zTop+.01],[edge.x-px*.009,edge.y-py*.009,zTop+.01]],'#493322bb');
  path([[mid.x,mid.y,zTop+.012],[mid.x+px*.08-ca*.06,mid.y+py*.08-sa*.06,zTop+.012],[mid.x+px*.013,mid.y+py*.013,zTop+.012]],'#5b3c27aa');
 }
 // Asymmetric broken bark plates, with bright torn wood on their inner edges.
 for(const [a,width,height] of [[1.28,.50,.18],[2.65,.48,.22],[4.67,.48,.19]]){
  const b=a+width,pt=(angle,rad,z)=>[Math.cos(angle)*rad,Math.sin(angle)*rad,z];
  path([pt(a,.68,zTop),pt(a-.03,.79,zTop+height),pt(a+width*.38,.84,zTop+height*.8),pt(b,.78,zTop+height*1.1),pt(b+.025,.67,zTop)],'#63472f','#3d3024');
  path([pt(a,.68,zTop),pt(a+width*.33,.73,zTop+height*.65),pt(b,.69,zTop+height*.35),pt(b+.025,.67,zTop)],'#b18b58');
 }
 // Broken front notch opens into the hollow, readable from above in every direction.
 const hollow=[[.86,-.25,zTop],[.61,-.28,zTop],[.39,-.17,zTop],[.34,.02,zTop],[.47,.21,zTop],[.73,.25,zTop],[.91,.12,zTop]];
 path(hollow,'#38281c','#b18a55');
 path([[.84,-.16,zTop],[.59,-.19,zTop],[.44,-.08,zTop],[.46,.09,zTop],[.66,.17,zTop],[.87,.09,zTop]],'#191b12');
 const e=project(.63,0,zTop+.01),glow=c.createRadialGradient(e[0],e[1],0,e[0],e[1],.24);
 glow.addColorStop(0,'#ffe5a3');glow.addColorStop(.25,'#ec8e29bb');glow.addColorStop(1,'#d66e1500');oval(c,e[0],e[1],.23,.21,glow);
 dot(.64,0,zTop+.02,.051,.047,'#ffd383');
 for(const a of [-.47,.47]){const v1=project(Math.cos(a)*.70,Math.sin(a)*.70,zTop+.02),v2=project(Math.cos(a)*.83,Math.sin(a)*.83,zTop+.02);c.beginPath();c.moveTo(...v1);c.lineTo(...v2);c.strokeStyle='#ffbe60';c.lineWidth=.035;c.stroke()}
 // Uneven moss cushions overlap the broken rim, as in the concept sheet.
 for(const [a,size] of [[1.20,.16],[2.7,.20],[3.9,.11],[4.8,.18],[5.4,.09]]){
  const cx=Math.cos(a)*.73,cy=Math.sin(a)*.73;
  dot(cx,cy,zTop+.03,size*1.15,size*.82,'#35482b');
  dot(cx-.035,cy-.04,zTop+.10,size,size*.68,'#87a05d');
  dot(cx-.05,cy-.07,zTop+.12,size*.65,size*.36,'#b2c47b');
 }

 for(let i=0;i<3;i++)dot(-.63,.42,.57+i*.16,.10-i*.013,.045,'#c6a378');
 if(o.burning>0){for(let i=0;i<6;i++){const a=i*2.399,v=project(Math.cos(a)*.81,Math.sin(a)*.81,.5+.1*Math.sin(t*8+i));oval(c,v[0],v[1],.04,.08,'#ffae4fcc');}}
 if(p.impact>0){c.globalAlpha*=p.impact;c.strokeStyle='#d9bb78';c.lineWidth=.03;const v=project(targetRoot.x,targetRoot.y);c.beginPath();c.ellipse(v[0],v[1],.15+(1-p.impact)*.4,.09+(1-p.impact)*.2,0,0,TAU);c.stroke()}
 c.restore();
}
root.Dreven={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

/* Mole spirit: overhead model. Burrow immunity is owned by the game trait. */
(function(root){
'use strict';const TAU=Math.PI*2,ATTACK_DURATION=.9,CONTACT=.6,DIG_DURATION=.5,EMERGE_DURATION=.45;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),phase=(o.distance||0)*9+(o.seed||0),active=o.state==='attack';return {stroke:o.state==='dig'?Math.sin((o.time||0)*22)*.17:o.state==='walk'?Math.sin(phase)*.13:0,roll:o.state==='walk'?Math.sin(phase)*.025:0,depth:o.state==='dig'?ease(o.progress||0):o.state==='emerge'?1-ease(o.progress||0):o.state==='underground'?1:0,strike:active?(a<CONTACT?ease((a-.25)/.35):1-ease((a-CONTACT)/.4)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.2):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=col;c.fill()}
function poly(c,p,col){c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle=col;c.fill()}
function mound(c,t,amount=1){oval(c,0,0,1.1,.76,'#493625');for(let i=0;i<15;i++){const a=i*2.399,d=.20+(i%4)*.20;oval(c,Math.cos(a)*d,Math.sin(a)*d*.75,.17+(i%3)*.025,.12,['#665039','#82684a','#a1845b'][i%3],a)}for(let i=0;i<7;i++){const a=i*2.399,u=((t*1.5+i*.17)%1+1)%1;oval(c,Math.cos(a)*(1+u*.23),Math.sin(a)*(.65+u*.2),.03+.02*(i%2),.035,'#8b6e48')}}
function draw(c,o={}){
 const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
 if(o.state==='underground'){mound(c,o.time||0);c.restore();return;}
 // Close the gap with the whole body; paws only swing within shoulder reach.
 c.save();c.translate((target.x-1.10)*p.strike,target.y*p.strike);
 if(o.shadow!==false)oval(c,-.08,.10,1.16,.84,'#20261844');
 if(p.depth>0)oval(c,.12,0,.95,.65,'#30271e');
 c.save();c.translate(p.depth*.20,0);c.scale(1-p.depth*.6,1-p.depth*.65);c.rotate(p.roll);
 // Tail and hind paws remain small; the heavy digging shoulders carry the silhouette.
 c.beginPath();c.moveTo(-.83,0);c.quadraticCurveTo(-1.24,-.10,-1.22,.07);c.strokeStyle='#584434';c.lineWidth=.12;c.stroke();
 for(const side of [-1,1])oval(c,-.58,side*.61,.19,.12,'#71543b');
 // Solid forearms overlap both the shoulders and palms throughout the stroke.
 for(const side of [-1,1]){
  const x=.35+p.stroke*side+.30*p.strike,y=side*(.62-.20*p.strike);
  c.beginPath();c.moveTo(.02,side*.43);c.quadraticCurveTo(.23,side*.65,x,y);c.strokeStyle='#554432';c.lineWidth=.42;c.stroke();
  c.beginPath();c.moveTo(.10,side*.44);c.quadraticCurveTo(.26,side*.59,x,y);c.strokeStyle='#806347';c.lineWidth=.27;c.stroke();
 }
 const fur=c.createRadialGradient(-.25,-.35,.05,0,0,1.1);fur.addColorStop(0,'#806347');fur.addColorStop(.55,'#503d30');fur.addColorStop(1,'#30291f');oval(c,-.16,0,.91,.72,fur);
 for(let i=0;i<27;i++){const a=i*2.399,d=.20+(i%5)*.12,x=-.17+Math.cos(a)*d,y=Math.sin(a)*d*.85;poly(c,[[x+.09,y-.055],[x-.10,y],[x+.08,y+.055],[x+.04,y]],['#91715155','#241f1955','#af8a5633'][i%3]);}
 for(const side of [-1,1]){
  const x=.35+p.stroke*side+.30*p.strike,y=side*(.62-.20*p.strike);
  oval(c,x,y,.34,.26,'#554432',side*.35);oval(c,x-.03,y-.04,.28,.22,'#a08660',side*.35);
  for(let j=0;j<4;j++)poly(c,[[x-.23+j*.1,y-.10],[x-.16+j*.1,y-.20],[x-.08+j*.1,y-.06],[x-.15+j*.1,y+.03]],j%2?'#8d7350':'#b2976b');
  for(let j=-1;j<=1;j++){poly(c,[[x+.18,y+j*.13-.05],[x+.45,y+j*.12],[x+.24,y+j*.13+.05]],'#e9d5ad');}
 }
 oval(c,.56,0,.43,.38,fur);oval(c,.92,0,.21,.16,'#be8279');oval(c,.98,-.04,.075,.035,'#e1ada0');
 for(const side of [-1,1])oval(c,.68,side*.24,.065,.024,'#c4a15d',side*-.45);
 for(const [x,y,s] of [[-.50,-.25,.16],[-.34,.21,.13],[-.08,-.38,.12]]){oval(c,x,y,s,s*.65,'#405033');for(let i=0;i<5;i++)oval(c,x+Math.cos(i*2.4)*s*.5,y+Math.sin(i*2.4)*s*.35,s*.40,s*.30,['#667543','#8a914e'][i%2]);}
 poly(c,[[-.28,-.12],[-.50,-.13],[-.46,-.02],[-.31,.05]],'#af8753');
 c.restore();
 // Foreground soil covers the sinking body rather than making it transparent.
 if(p.depth>0){for(let i=0;i<9;i++){const a=i*TAU/9,d=.93-p.depth*.65;oval(c,Math.cos(a)*d+.16,Math.sin(a)*d*.7,.16+p.depth*.14,.12+p.depth*.10,['#6a5137','#93764d','#4e3b29'][i%3]);}}
 c.restore();
 if(p.impact>0){c.globalAlpha*=p.impact;for(let i=0;i<6;i++){const a=i*2.4,d=(1-p.impact)*.35;oval(c,target.x+Math.cos(a)*d,target.y+Math.sin(a)*d,.04,.035,'#c3a675')}}
 c.restore();
}
root.KrotenBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT,DIG_DURATION,EMERGE_DURATION};
})(typeof module==='object'?module.exports:window);

/* Mole spirit: overhead model. Burrow immunity is owned by the game trait. */
(function(root){
'use strict';const TAU=Math.PI*2,ATTACK_DURATION=.9,CONTACT=.6,DIG_DURATION=.5,EMERGE_DURATION=.45;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),phase=(o.distance||0)*9+(o.seed||0),active=o.state==='attack';return {stroke:o.state==='dig'?Math.sin((o.time||0)*22)*.17:o.state==='walk'?Math.sin(phase)*.13:0,roll:o.state==='walk'?Math.sin(phase)*.025:0,depth:o.state==='dig'?ease(o.progress||0):o.state==='emerge'?1-ease(o.progress||0):o.state==='underground'?1:0,strike:active?(a<CONTACT?ease((a-.25)/.35):1-ease((a-CONTACT)/.4)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.2):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=col;c.fill()}
function poly(c,p,col){c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle=col;c.fill()}
function mound(c,t,amount=1){oval(c,0,0,1.1,.76,'#493625');for(let i=0;i<15;i++){const a=i*2.399,d=.20+(i%4)*.20;oval(c,Math.cos(a)*d,Math.sin(a)*d*.75,.17+(i%3)*.025,.12,['#665039','#82684a','#a1845b'][i%3],a)}for(let i=0;i<7;i++){const a=i*2.399,u=((t*1.5+i*.17)%1+1)%1;oval(c,Math.cos(a)*(1+u*.23),Math.sin(a)*(.65+u*.2),.03+.02*(i%2),.035,'#8b6e48')}}

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){
 const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
 if(o.state==='underground'){mound(c,o.time||0);c.restore();return;}
 // Close the gap with the whole body; paws only swing within shoulder reach.
 c.save();c.translate((target.x-1.10)*p.strike,target.y*p.strike);
 if(o.shadow!==false)oval(c,-.08,.10,1.16,.84,'#20261844');
 if(p.depth>0)oval(c,.12,0,.95,.65,'#30271e');
 c.save();c.translate(p.depth*.20,0);c.scale(1-p.depth*.6,1-p.depth*.65);c.rotate(p.roll);
 // Tail and hind paws remain small; the heavy digging shoulders carry the silhouette.
 c.beginPath();c.moveTo(-.83,0);c.quadraticCurveTo(-1.24,-.10,-1.22,.07);c.strokeStyle='#584434';c.lineWidth=.12;c.stroke();
 for(const side of [-1,1])oval(c,-.58,side*.61,.19,.12,'#71543b');
 // Solid forearms overlap both the shoulders and palms throughout the stroke.
 for(const side of [-1,1]){
  const x=.35+p.stroke*side+.30*p.strike,y=side*(.62-.20*p.strike);
  c.beginPath();c.moveTo(.02,side*.43);c.quadraticCurveTo(.23,side*.65,x,y);c.strokeStyle='#554432';c.lineWidth=.42;c.stroke();
  c.beginPath();c.moveTo(.10,side*.44);c.quadraticCurveTo(.26,side*.59,x,y);c.strokeStyle='#806347';c.lineWidth=.27;c.stroke();
 }
 const fur='#735642';oval(c,-.16,0,.91,.72,fur);material(c,fur,'#b18b62','#4c4236',-.16,0,.91,.72);
 for(const side of [-1,1]){
  const x=.35+p.stroke*side+.30*p.strike,y=side*(.62-.20*p.strike);
  oval(c,x,y,.34,.26,'#554432',side*.35);oval(c,x-.03,y-.04,.28,.22,'#a08660',side*.35);

  for(let j=-1;j<=1;j++){poly(c,[[x+.18,y+j*.13-.05],[x+.45,y+j*.12],[x+.24,y+j*.13+.05]],'#e9d5ad');}
 }
 oval(c,.56,0,.46,.40,fur);material(c,fur,'#b99570','#554b3c',.56,0,.46,.4);oval(c,.92,0,.21,.16,'#be8279');oval(c,.98,-.04,.075,.035,'#e1ada0');
 for(const side of [-1,1])oval(c,.68,side*.24,.065,.024,'#c4a15d',side*-.45);
 for(const [x,y,s] of [[-.55,-.23,.22],[-.3,-.38,.18]]){oval(c,x,y,s,s*.65,'#65794b');oval(c,x-.03,y-.035,s*.75,s*.43,'#a6b877');}
 poly(c,[[-.28,-.12],[-.50,-.13],[-.46,-.02],[-.31,.05]],'#af8753');
 c.restore();
 // Foreground soil covers the sinking body rather than making it transparent.
 if(p.depth>0){for(let i=0;i<9;i++){const a=i*TAU/9,d=.93-p.depth*.65;oval(c,Math.cos(a)*d+.16,Math.sin(a)*d*.7,.16+p.depth*.14,.12+p.depth*.10,['#6a5137','#93764d','#4e3b29'][i%3]);}}
 c.restore();
 if(p.impact>0){c.globalAlpha*=p.impact;for(let i=0;i<6;i++){const a=i*2.4,d=(1-p.impact)*.35;oval(c,target.x+Math.cos(a)*d,target.y+Math.sin(a)*d,.04,.035,'#c3a675')}}
 c.restore();
}
root.Kroten={draw,pose,attackProgress,ATTACK_DURATION,CONTACT,DIG_DURATION,EMERGE_DURATION};
})(typeof module==='object'?module.exports:window);

/* Overhead straw spirit. Combat remains owned by Towers. */
(function(root){'use strict';
const ATTACK_DURATION=.9,CONTACT=.6,TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),walking=o.state==='walk',ph=(o.distance||0)*11+(o.seed||0);return {step:walking?Math.sin(ph):0,sway:walking?Math.sin(ph)*.055:0,strike:o.state==='attack'?(a<CONTACT?ease((a-.22)/.38):1-ease((a-CONTACT)/.4)):0,wind:Math.sin((o.time||0)*3+(o.seed||0))*.025};}
function line(c,x,y,u,v,color,width){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill()}
const colors=['#b99854','#e5ce93','#c6aa6a','#f0dfaf','#94733e'];
function bundle(c,x,y,length,width,angle,seed){c.save();c.translate(x,y);c.rotate(angle);oval(c,0,0,length*.43,width*.42,'#8f713e');for(let i=0;i<27;i++){const q=Math.sin(i*17.13+seed),v=((i+.5)/27-.5)*width;line(c,-length*(.37+.1*q),v*.72,length*(.40+.13*Math.sin(i*8.9)),v+q*.035,colors[i%5],.015+(i%3)*.005);}c.restore()}
function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.8,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='butt';
// Torso closes the distance, keeping both straw arms short and attached.
c.translate((target.x-1.19)*p.strike,target.y*p.strike);
if(o.shadow!==false)oval(c,-.08,.10,1.10,.84,'#24261844');
c.rotate(p.sway);
for(const s of [-1,1])bundle(c,-.48+p.step*s*.13,s*.48,.8,.35,.12*s,4+s);
for(const s of [-1,1]){const hit=s===-1?p.strike:p.strike*.35;bundle(c,.20+hit*.24,s*(.61-hit*.24),1.45,.38,s*(.60-hit*.68)+p.step*s*.08,6+s);}
oval(c,-.08,0,.89,.70,'#715632');
const body=c.createRadialGradient(-.25,-.27,.05,0,0,.95);body.addColorStop(0,'#d0b77c');body.addColorStop(1,'#846336');oval(c,-.08,0,.84,.65,body);
// Irregular fine stalks follow the sheaf length, rather than radial spokes.
for(let i=0;i<94;i++){const v=((i+.5)/94-.5)*1.30,q=Math.sin(i*19.31),span=Math.sqrt(Math.max(0,1-(v/.69)**2));const x=-.85*span-.09*q,y=v;line(c,x,y,.77*span+.12*q,y+q*.075+p.wind,colors[i%5],.012+(i%3)*.006);if(i%5===0)line(c,x*.7,y,.98*span+.18*q,y+q*.17,colors[(i+2)%5],.012);}
// Recessed charcoal eyes between forward-facing straw fringes.
for(const s of [-1,1]){oval(c,.59,s*.22,.13,.095,'#372b1b');oval(c,.63,s*.22,.036,.029,'#ffc966');}
// Rope wraps across the visible back, with a small side knot and frayed ends.
c.beginPath();c.moveTo(-.24,-.62);c.bezierCurveTo(-.08,-.30,-.10,.30,-.27,.64);c.strokeStyle='#59472d';c.lineWidth=.10;c.stroke();
for(let i=0;i<14;i++){const y=-.57+i*.085;line(c,-.22+.08*Math.cos(y*2),y,-.16+.08*Math.cos(y*2),y+.045,'#b09a70',.035);}
oval(c,-.25,.54,.11,.09,'#796342');line(c,-.26,.55,-.50,.78,'#796342',.045);line(c,-.24,.57,-.12,.86,'#796342',.045);
// Three slender wheat ears on the swept crown, visible from overhead.
for(let k=0;k<3;k++){const y=-.28+k*.22;line(c,-.32,y,-1.04-k*.055,y-.20,'#ae8e50',.018);for(let j=0;j<5;j++){const x=-.68-j*.065,yy=y-.12-j*.014;line(c,x,yy,x-.08,yy-.045,'#d6bc7b',.038);line(c,x,yy,x-.07,yy+.04,'#cfb16e',.035);}}
c.restore();}
root.SolomennikBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

/* Overhead straw spirit. Combat remains owned by Towers. */
(function(root){'use strict';
const ATTACK_DURATION=.9,CONTACT=.6,TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),walking=o.state==='walk',ph=(o.distance||0)*11+(o.seed||0);return {step:walking?Math.sin(ph):0,sway:walking?Math.sin(ph)*.055:0,strike:o.state==='attack'?(a<CONTACT?ease((a-.22)/.38):1-ease((a-CONTACT)/.4)):0,wind:Math.sin((o.time||0)*3+(o.seed||0))*.025};}
function line(c,x,y,u,v,color,width){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill()}
const colors=['#b99854','#e5ce93','#c6aa6a','#f0dfaf','#94733e'];
function bundle(c,x,y,length,width,angle,seed){c.save();c.translate(x,y);c.rotate(angle);oval(c,0,0,length*.47,width*.48,'#a7874e');material(c,'#bb9b5c','#ead39b','#8d703d',0,0,length*.47,width*.48);for(let i=0;i<3;i++){const y=(i-1)*width*.2;line(c,-length*.43,y,length*.48,y+.035,colors[i],.028);}c.restore()}

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.8,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='butt';
// Torso closes the distance, keeping both straw arms short and attached.
c.translate((target.x-1.19)*p.strike,target.y*p.strike);
if(o.shadow!==false)oval(c,-.08,.10,1.10,.84,'#24261844');
c.rotate(p.sway);
for(const s of [-1,1])bundle(c,-.48+p.step*s*.13,s*.48,.8,.35,.12*s,4+s);
for(const s of [-1,1]){const hit=s===-1?p.strike:p.strike*.35;bundle(c,.20+hit*.24,s*(.61-hit*.24),1.45,.38,s*(.60-hit*.68)+p.step*s*.08,6+s);}
oval(c,-.08,0,.89,.70,'#715632');
oval(c,-.08,0,.84,.65,'#c8aa6d');material(c,'#c8aa6d','#ead298','#9b7c45',-.08,0,.84,.65);
// Irregular fine stalks follow the sheaf length, rather than radial spokes.
for(let i=0;i<7;i++){const y=(i-3)*.16,span=Math.sqrt(1-(y/.69)**2);line(c,-.78*span,y,.77*span,y+.025+p.wind,colors[i%5],.035);}
// Recessed charcoal eyes between forward-facing straw fringes.
for(const s of [-1,1]){oval(c,.59,s*.22,.13,.095,'#372b1b');oval(c,.63,s*.22,.036,.029,'#ffc966');}
// Rope wraps across the visible back, with a small side knot and frayed ends.
c.beginPath();c.moveTo(-.24,-.62);c.bezierCurveTo(-.08,-.30,-.10,.30,-.27,.64);c.strokeStyle='#59472d';c.lineWidth=.10;c.stroke();
for(let i=0;i<6;i++){const y=-.57+i*.19;line(c,-.22+.08*Math.cos(y*2),y,-.16+.08*Math.cos(y*2),y+.045,'#b09a70',.035);}
oval(c,-.25,.54,.11,.09,'#796342');line(c,-.26,.55,-.50,.78,'#796342',.045);line(c,-.24,.57,-.12,.86,'#796342',.045);
// Three slender wheat ears on the swept crown, visible from overhead.
for(let k=0;k<2;k++){const y=-.28+k*.22;line(c,-.32,y,-1.04-k*.055,y-.20,'#ae8e50',.018);for(let j=0;j<5;j++){const x=-.68-j*.065,yy=y-.12-j*.014;line(c,x,yy,x-.08,yy-.045,'#d6bc7b',.038);line(c,x,yy,x-.07,yy+.04,'#cfb16e',.035);}}
c.restore();}
root.Solomennik={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const ATTACK_DURATION=1.1,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x));
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function boost(f,now,k=.2,duration=4){if(f.dead)return;const old=f.drumFactor||1,next=1+k;if(next>old){f.hp*=next/old;f.hpMax*=next/old;f.drumFactor=next;}f.drumUntil=Math.max(f.drumUntil||0,now+duration);}
function expire(f,now){if(f.drumFactor&&now>=f.drumUntil){f.hp/=f.drumFactor;f.hpMax/=f.drumFactor;f.drumFactor=0;f.drumUntil=0;}}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=col;c.fill()}
function stroke(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function patch(c,x,y,rx,ry,col,seed=0){c.beginPath();for(let i=0;i<18;i++){const a=i*Math.PI/9,d=1+.09*Math.sin(i*2.3+seed);const u=x+Math.cos(a)*rx*d,v=y+Math.sin(a)*ry*d;i?c.lineTo(u,v):c.moveTo(u,v);}c.closePath();c.fillStyle=col;c.fill();}
function shade(c,x,y,r,light,dark){const g=c.createRadialGradient(x-r*.25,y-r*.3,r*.04,x,y,r);g.addColorStop(0,light);g.addColorStop(1,dark);return g;}
function draw(c,o={}){
const r=(o.size||90)/3,walk=o.state==='walk',ph=(o.distance||0)*8+(o.seed||0),a=o.attack;
const strike=a==null?0:a<.6?clamp((a-.25)/.35):1-clamp((a-.6)/.4),lift=a==null?0:Math.sin(Math.PI*clamp(a/.6)),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.5,y:0};
c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
if(o.state==='attack')c.translate((target.x-1.25)*strike,target.y*strike);
if(o.shadow!==false)oval(c,-.08,.09,1.15,1.03,'#1b271d50');
c.rotate(walk?Math.sin(ph)*.025:0);
// Small root feet peek out behind the heavy back, never radiating like legs.
for(const side of [-1,1]){const x=-.61+(walk?Math.sin(ph)*side*.10:0),y=side*.57;patch(c,x,y,.39,.25,'#3c3828',side);for(let j=0;j<3;j++)stroke(c,x-.19,y+(j-1)*.09,x+.14,y+(j-1)*.08,'#766044',.06);}
// Arms are lower than the back and curve around its sides to cradle the log.
for(const side of [-1,1]){const reach=side===-1?lift:0;c.beginPath();c.moveTo(-.29,side*.61);c.bezierCurveTo(-.12,side*1.03,.42-reach*.12,side*1.05,.79-reach*.17,side*(.78+reach*.12));c.strokeStyle='#302f22';c.lineWidth=.42;c.stroke();c.strokeStyle=shade(c,.1,side*.75,.72,'#697349','#373d2b');c.lineWidth=.34;c.stroke();for(let j=0;j<3;j++)stroke(c,.02,side*(.87+j*.04),.43-reach*.1,side*(.91+j*.025),'#7c714f',.025);}
// One broad pear-shaped back, narrow at the rear, with a low forward brow.
c.beginPath();c.moveTo(-1.02,0);c.bezierCurveTo(-1.05,-.56,-.59,-.88,-.08,-.85);c.bezierCurveTo(.48,-.83,.66,-.44,.59,0);c.bezierCurveTo(.66,.44,.48,.83,-.08,.85);c.bezierCurveTo(-.59,.88,-1.05,.56,-1.02,0);c.closePath();c.fillStyle=shade(c,-.28,-.09,1.07,'#8a9160','#29372a');c.fill();
// Split bark ridges follow the spine, with small irregular moss islands.
for(let k=0;k<5;k++){const y=(k-2)*.27;c.beginPath();c.moveTo(-.89,y*.52);c.bezierCurveTo(-.60,y-.09,-.18,y+.07,.30,y*.85);c.strokeStyle='#3b3829';c.lineWidth=.09;c.stroke();c.strokeStyle='#817556';c.lineWidth=.035;c.stroke();}
for(let i=0;i<19;i++){const t=i*2.399,d=.16+(i%6)*.105,x=-.25+Math.cos(t)*d,y=Math.sin(t)*d*.97;patch(c,x,y,.13+(i%3)*.045,.11+(i%4)*.014,['#78864c','#657540','#8a9156'][i%3],i);for(let j=0;j<4;j++)oval(c,x+Math.sin(i+j*4)*.09,y+Math.cos(j*3)*.065,.012,.009,'#bdba7b70');}
// Eyes are narrow glints beneath a projecting brow, not round eyes on the back.
for(const side of [-1,1]){oval(c,.48,side*.23,.11,.055,'#212a20');oval(c,.53,side*.23,.035,.018,'#e7b751');patch(c,.39,side*.23,.15,.075,'#65733f',side);}
// Log lies across the front: cylindrical light, broken bark plates running along its axis.
oval(c,.86,.04,.43,1.0,'#18231c55');
c.beginPath();c.moveTo(.51,-.87);c.lineTo(.66,-.97);c.lineTo(1.06,-.94);c.lineTo(1.25,-.82);c.lineTo(1.23,.87);c.lineTo(1.05,.98);c.lineTo(.65,.96);c.lineTo(.51,.83);c.closePath();const wood=c.createLinearGradient(.5,0,1.25,0);wood.addColorStop(0,'#493d2c');wood.addColorStop(.38,'#b19a72');wood.addColorStop(.72,'#87704e');wood.addColorStop(1,'#403629');c.fillStyle=wood;c.fill();
for(let i=0;i<11;i++){const x=.55+i*.061;c.beginPath();c.moveTo(x,-.85);for(let j=0;j<9;j++)c.lineTo(x+Math.sin(i*3+j*1.3)*.018,-.85+j*.214);c.strokeStyle=['#54452f','#9f8963','#726043'][i%3];c.lineWidth=.018+(i%2)*.008;c.stroke();for(let j=0;j<3;j++){const y=-.65+j*.52+Math.sin(i*7+j)*.10;stroke(c,x,y,x+.048,y+.045,'#4e402d',.012);}}

for(const side of [-1,1]){oval(c,.87,side*.91,.35,.095,'#c0aa7d');oval(c,.87,side*.924,.26,.057,'#2c251d');stroke(c,.56,side*.58,1.18,side*.59,'#46542f',.044);stroke(c,.57,side*.63,1.17,side*.64,'#788046',.023);}
// Only the short gripping pads overlap the sides of the drum.
for(const side of [-1,1]){const l=side===-1?lift:0,x=.78-l*.17,y=side*(.81+l*.12);patch(c,x,y,.23,.16,shade(c,x,y,.28,'#899062','#424b30'),side);for(let j=0;j<3;j++)stroke(c,x-.12+j*.085,y-side*.02,x-.09+j*.085,y-side*.14,'#8b805d',.04);}
for(let k=0;k<3;k++){const x=-.39-k*.16,y=-.25+k*.23;stroke(c,x,y,x-.34,y-.12,'#485b32',.025);for(let j=0;j<5;j++){const u=x-j*.065;stroke(c,u,y-j*.023,u-.085,y-j*.023-.065,'#9ca56c',.025);stroke(c,u,y-j*.023,u-.08,y-j*.023+.045,'#7f914e',.025);}}
if(a!=null&&a>=.6&&a<1){const p=(a-.6)/.4;c.strokeStyle='rgba(204,225,143,'+(1-p)*.6+')';c.lineWidth=.025;c.beginPath();c.ellipse(.85,0,.2+p*1.4,.3+p*1.4,0,0,7);c.stroke();}
c.restore();}

root.GulenBefore={draw,attackProgress,boost,expire,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const ATTACK_DURATION=1.1,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x));
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function boost(f,now,k=.2,duration=4){if(f.dead)return;const old=f.drumFactor||1,next=1+k;if(next>old){f.hp*=next/old;f.hpMax*=next/old;f.drumFactor=next;}f.drumUntil=Math.max(f.drumUntil||0,now+duration);}
function expire(f,now){if(f.drumFactor&&now>=f.drumUntil){f.hp/=f.drumFactor;f.hpMax/=f.drumFactor;f.drumFactor=0;f.drumUntil=0;}}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=col;c.fill()}
function stroke(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function patch(c,x,y,rx,ry,col,seed=0){c.beginPath();for(let i=0;i<18;i++){const a=i*Math.PI/9,d=1+.09*Math.sin(i*2.3+seed);const u=x+Math.cos(a)*rx*d,v=y+Math.sin(a)*ry*d;i?c.lineTo(u,v):c.moveTo(u,v);}c.closePath();c.fillStyle=col;c.fill();}
function shade(c,x,y,r,light,dark){return light;}

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){
const r=(o.size||90)/3,walk=o.state==='walk',ph=(o.distance||0)*8+(o.seed||0),a=o.attack;
const strike=a==null?0:a<.6?clamp((a-.25)/.35):1-clamp((a-.6)/.4),lift=a==null?0:Math.sin(Math.PI*clamp(a/.6)),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.5,y:0};
c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
if(o.state==='attack')c.translate((target.x-1.25)*strike,target.y*strike);
if(o.shadow!==false)oval(c,-.08,.09,1.15,1.03,'#1b271d50');
c.rotate(walk?Math.sin(ph)*.025:0);
// Small root feet peek out behind the heavy back, never radiating like legs.
for(const side of [-1,1]){const x=-.61+(walk?Math.sin(ph)*side*.10:0),y=side*.57;patch(c,x,y,.39,.25,'#3c3828',side);for(let j=0;j<3;j++)stroke(c,x-.19,y+(j-1)*.09,x+.14,y+(j-1)*.08,'#766044',.06);}
// Arms are lower than the back and curve around its sides to cradle the log.
for(const side of [-1,1]){const reach=side===-1?lift:0;c.beginPath();c.moveTo(-.29,side*.61);c.bezierCurveTo(-.12,side*1.03,.42-reach*.12,side*1.05,.79-reach*.17,side*(.78+reach*.12));c.strokeStyle='#302f22';c.lineWidth=.42;c.stroke();c.strokeStyle=shade(c,.1,side*.75,.72,'#697349','#373d2b');c.lineWidth=.34;c.stroke();for(let j=0;j<3;j++)stroke(c,.02,side*(.87+j*.04),.43-reach*.1,side*(.91+j*.025),'#7c714f',.025);}
// One broad pear-shaped back, narrow at the rear, with a low forward brow.
c.beginPath();c.moveTo(-1.02,0);c.bezierCurveTo(-1.05,-.56,-.59,-.88,-.08,-.85);c.bezierCurveTo(.48,-.83,.66,-.44,.59,0);c.bezierCurveTo(.66,.44,.48,.83,-.08,.85);c.bezierCurveTo(-.59,.88,-1.05,.56,-1.02,0);c.closePath();material(c,'#7c8f5e','#afbc7f','#4c6b48',-.23,0,.9,.85);
// Split bark ridges follow the spine, with small irregular moss islands.
for(let k=0;k<2;k++){const y=(k-.5)*.45;c.beginPath();c.moveTo(-.89,y*.52);c.bezierCurveTo(-.60,y-.09,-.18,y+.07,.30,y*.85);c.strokeStyle='#3b3829';c.lineWidth=.05;c.stroke();c.strokeStyle='#a6a474';c.lineWidth=.023;c.stroke();}
for(const [x,y,rx,ry] of [[-.65,-.3,.29,.23],[-.3,-.53,.34,.22],[-.65,.25,.2,.16]]){oval(c,x,y,rx,ry,'#5b793f');oval(c,x-.02,y-.04,rx*.8,ry*.65,'#a3b66c');}
// Eyes are narrow glints beneath a projecting brow, not round eyes on the back.
for(const side of [-1,1]){oval(c,.48,side*.23,.11,.055,'#212a20');oval(c,.53,side*.23,.035,.018,'#e7b751');patch(c,.39,side*.23,.15,.075,'#65733f',side);}
// Log lies across the front: cylindrical light, broken bark plates running along its axis.
oval(c,.86,.04,.43,1.0,'#18231c55');
c.beginPath();c.moveTo(.51,-.87);c.lineTo(.66,-.97);c.lineTo(1.06,-.94);c.lineTo(1.25,-.82);c.lineTo(1.23,.87);c.lineTo(1.05,.98);c.lineTo(.65,.96);c.lineTo(.51,.83);c.closePath();material(c,'#a98b60','#d1b789','#6d583d',.84,0,.4,1.3);
for(const x of [.64,.84,1.06])stroke(c,x,-.78,x+.01,.78,'#745c3e',.04);

for(const side of [-1,1]){oval(c,.87,side*.91,.35,.095,'#c0aa7d');oval(c,.87,side*.924,.26,.057,'#2c251d');stroke(c,.56,side*.58,1.18,side*.59,'#46542f',.044);stroke(c,.57,side*.63,1.17,side*.64,'#788046',.023);}
// Only the short gripping pads overlap the sides of the drum.
for(const side of [-1,1]){const l=side===-1?lift:0,x=.78-l*.17,y=side*(.81+l*.12);patch(c,x,y,.23,.16,shade(c,x,y,.28,'#899062','#424b30'),side);for(let j=0;j<3;j++)stroke(c,x-.12+j*.085,y-side*.02,x-.09+j*.085,y-side*.14,'#8b805d',.04);}
for(let k=0;k<3;k++){const x=-.39-k*.16,y=-.25+k*.23;stroke(c,x,y,x-.34,y-.12,'#485b32',.025);for(let j=0;j<5;j++){const u=x-j*.065;stroke(c,u,y-j*.023,u-.085,y-j*.023-.065,'#9ca56c',.025);stroke(c,u,y-j*.023,u-.08,y-j*.023+.045,'#7f914e',.025);}}
if(a!=null&&a>=.6&&a<1){const p=(a-.6)/.4;c.strokeStyle='rgba(204,225,143,'+(1-p)*.6+')';c.lineWidth=.025;c.beginPath();c.ellipse(.85,0,.2+p*1.4,.3+p*1.4,0,0,7);c.stroke();}
c.restore();}

root.Gulen={draw,attackProgress,boost,expire,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const ATTACK_DURATION=.8,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x));
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),p=clamp(o.progress||0),attack=o.state==='attack';return {flight:o.state==='air'?Math.sin(p*Math.PI):attack?Math.sin(Math.PI*clamp((a-.18)/.42))*.65:0,extend:o.state==='air'?Math.sin(Math.PI*p):attack?Math.sin(Math.PI*clamp((a-.18)/.42)):0,crouch:o.state==='crouch'?p:o.state==='land'?1-p:attack&&a<.18?a/.18:0,strike:attack?(a<.6?clamp((a-.18)/.42):1-clamp((a-.6)/.4)):0,step:o.state==='walk'?Math.sin((o.distance||0)*13+(o.seed||0))*.07:0};}
function stroke(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=col;c.fill()}
function leaf(c,x,y,length,width,angle,light='#98ac50',dark='#354f24'){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(-length*.5,0);c.bezierCurveTo(-length*.10,-width*.70,length*.36,-width*.56,length*.5,0);c.bezierCurveTo(length*.25,width*.50,-length*.23,width*.65,-length*.5,0);c.closePath();const g=c.createLinearGradient(0,-width*.5,0,width*.5);g.addColorStop(0,light);g.addColorStop(1,dark);c.fillStyle=g;c.fill();c.strokeStyle='#b3bd6b';c.lineWidth=.014;c.stroke();stroke(c,-length*.43,0,length*.43,0,'#b5bc6b',.021);for(let j=0;j<5;j++){const u=-length*.32+j*length*.13,w=Math.sin((j+1)/6*Math.PI)*width*.37;for(const s of [-1,1])stroke(c,u,0,u+length*.13,s*w,'#a3b26788',.012);}c.restore()}
function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.6,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.translate((target.x-.88)*p.strike,target.y*p.strike);
if(o.shadow!==false)oval(c,-.09,.09,1.03-p.flight*.15,.71-p.flight*.08,'#20301840');c.save();const size=1+p.flight*.14;c.scale(size*(1-p.crouch*.09),size*(1+p.crouch*.07));
for(const s of [-1,1]){const hip={x:-.23,y:s*.42},knee={x:-.73-p.extend*.28,y:s*(.83-p.crouch*.15)},foot={x:-.13-p.extend*1.47+p.step*s,y:s*(.85-p.extend*.25)};stroke(c,hip.x,hip.y,knee.x,knee.y,'#344728',.18);stroke(c,knee.x,knee.y,foot.x,foot.y,'#69783b',.09);stroke(c,knee.x+.025,knee.y,foot.x,foot.y,'#b0ae61',.025);leaf(c,-.45-p.extend*.15,s*.62,.73,.30,s*.57,'#829d42','#354f26');leaf(c,foot.x,foot.y,.25,.1,.1*s);stroke(c,.32,s*.32,.57+p.step*s,s*.51,'#50662f',.09);}
oval(c,-.07,0,.87,.49,'#314622');
leaf(c,-.16,-.22,1.77,.58,-.09,'#98ad50','#425f29');leaf(c,-.16,.22,1.77,.58,.09,'#829b43','#344e25');stroke(c,-.96,0,.54,0,'#c0be6f',.022);
for(const s of [-1,1]){oval(c,.61,s*.25,.12,.09,'#29351c');oval(c,.66,s*.25,.049,.039,'#d9b546');oval(c,.68,s*.25,.021,.033,'#202b18');}
leaf(c,.57,0,.60,.50,0,'#a7b95c','#48642c');
for(const s of [-1,1]){const bend=Math.sin((o.time||0)*3)*.04-p.extend*.14;c.beginPath();c.moveTo(.73,s*.14);c.quadraticCurveTo(1.10,s*(.27+bend),1.41,s*(.50+bend));c.strokeStyle='#687e39';c.lineWidth=.025;c.stroke();leaf(c,1.42,s*(.50+bend),.23,.10,s*.34,'#a4b354','#506b2c');}
c.restore();c.restore();}
root.SkakunokBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const ATTACK_DURATION=.8,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x));
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),p=clamp(o.progress||0),attack=o.state==='attack';return {flight:o.state==='air'?Math.sin(p*Math.PI):attack?Math.sin(Math.PI*clamp((a-.18)/.42))*.65:0,extend:o.state==='air'?Math.sin(Math.PI*p):attack?Math.sin(Math.PI*clamp((a-.18)/.42)):0,crouch:o.state==='crouch'?p:o.state==='land'?1-p:attack&&a<.18?a/.18:0,strike:attack?(a<.6?clamp((a-.18)/.42):1-clamp((a-.6)/.4)):0,step:o.state==='walk'?Math.sin((o.distance||0)*13+(o.seed||0))*.07:0};}
function stroke(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=col;c.fill()}
function leaf(c,x,y,length,width,angle,light='#98ac50',dark='#354f24'){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(-length*.5,0);c.bezierCurveTo(-length*.10,-width*.70,length*.36,-width*.56,length*.5,0);c.bezierCurveTo(length*.25,width*.50,-length*.23,width*.65,-length*.5,0);c.closePath();c.fillStyle=dark;c.fill();c.beginPath();c.moveTo(-length*.5,0);c.bezierCurveTo(-length*.10,-width*.70,length*.36,-width*.56,length*.5,0);c.closePath();c.fillStyle=light;c.fill();c.restore()}

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.6,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.translate((target.x-.88)*p.strike,target.y*p.strike);
if(o.shadow!==false)oval(c,-.09,.09,1.03-p.flight*.15,.71-p.flight*.08,'#20301840');c.save();const size=1+p.flight*.14;c.scale(size*(1-p.crouch*.09),size*(1+p.crouch*.07));
for(const s of [-1,1]){const hip={x:-.23,y:s*.42},knee={x:-.73-p.extend*.28,y:s*(.83-p.crouch*.15)},foot={x:-.13-p.extend*1.47+p.step*s,y:s*(.85-p.extend*.25)};stroke(c,hip.x,hip.y,knee.x,knee.y,'#344728',.18);stroke(c,knee.x,knee.y,foot.x,foot.y,'#69783b',.09);stroke(c,knee.x+.025,knee.y,foot.x,foot.y,'#b0ae61',.025);leaf(c,-.45-p.extend*.15,s*.62,.73,.30,s*.57,'#829d42','#354f26');leaf(c,foot.x,foot.y,.25,.1,.1*s);stroke(c,.32,s*.32,.57+p.step*s,s*.51,'#50662f',.09);}
oval(c,-.07,0,.87,.49,'#314622');
leaf(c,-.16,-.22,1.77,.58,-.09,'#98ad50','#425f29');leaf(c,-.16,.22,1.77,.58,.09,'#829b43','#344e25');stroke(c,-.96,0,.54,0,'#c0be6f',.022);
for(const s of [-1,1]){oval(c,.61,s*.25,.12,.09,'#29351c');oval(c,.66,s*.25,.049,.039,'#d9b546');oval(c,.68,s*.25,.021,.033,'#202b18');}
leaf(c,.57,0,.60,.50,0,'#a7b95c','#48642c');
for(const s of [-1,1]){const bend=Math.sin((o.time||0)*3)*.04-p.extend*.14;c.beginPath();c.moveTo(.73,s*.14);c.quadraticCurveTo(1.10,s*(.27+bend),1.41,s*(.50+bend));c.strokeStyle='#687e39';c.lineWidth=.025;c.stroke();leaf(c,1.42,s*(.50+bend),.23,.10,s*.34,'#a4b354','#506b2c');}
c.restore();c.restore();}
root.Skakunok={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const clamp=x=>Math.max(0,Math.min(1,x));
function flight(f,now){if(f.seedBornAt==null||f.seedLanded||f.dead||f.siege)return false;const p=now>=f.seedBornAt+.65?1:clamp((now-f.seedBornAt)/.65),k=p*p*(3-2*p);f.d=f.seedFrom+(f.seedTo-f.seedFrom)*k;if(p>=1)f.seedLanded=true;return p<1;}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function draw(c,o={}){const r=(o.size||90)/3,ph=(o.distance||0)*7+(o.seed||0),step=o.state==='walk'?Math.sin(ph):0,release=o.release||0;c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);if(o.shadow!==false)oval(c,-.1,.1,1.12,.9,'#25282044');
for(const s of [-1,1]){oval(c,-.30+step*s*.12,s*.63,.35,.21,'#685334');for(let j=0;j<3;j++){c.beginPath();c.moveTo(-.45+step*s*.12,s*.65+j*.07);c.lineTo(-.11+step*s*.12,s*.65+j*.07);c.strokeStyle='#a28a58';c.lineWidth=.04;c.stroke();}}
c.rotate(step*.055);const core=c.createRadialGradient(-.2,-.2,.02,0,0,.94);core.addColorStop(0,'#b39961');core.addColorStop(1,'#4c432b');oval(c,0,0,.8,.71,core);
for(let i=0;i<11;i++){const a=i*6.283/11;c.save();c.rotate(a);c.beginPath();c.moveTo(.37,-.18);c.quadraticCurveTo(.85,-.43,1.02,-.12);c.quadraticCurveTo(.72,.14,.43,.20);c.closePath();c.fillStyle=['#6a7045','#8d8956','#5c6140'][i%3];c.fill();c.strokeStyle='#b2a36c';c.lineWidth=.015;c.stroke();c.beginPath();c.moveTo(.44,0);c.lineTo(.92,-.12);c.stroke();c.restore();}
for(const s of [-1,1]){oval(c,.64,s*.24,.13,.08,'#2e2c21');oval(c,.69,s*.24,.037,.029,'#dbb564');}
// An asymmetric soft crown, with exposed seed sockets on its forward side.
for(let i=0;i<7;i++){const a=i*2.4,x=.29+Math.cos(a)*.25,y=Math.sin(a)*.32;oval(c,x,y,.11,.09,'#aa8347');oval(c,x,y,.065,.049,'#4d3825');}
c.save();c.translate(-.19,0);c.rotate(-step*.08+Math.sin((o.time||0)*1.8)*.018-release*.08);
for(let i=0;i<14;i++){const a=i*2.399,d=.19+(i%4)*.15,x=-.13+Math.cos(a)*d,y=Math.sin(a)*d;const g=c.createRadialGradient(x-.10,y-.10,.01,x,y,.41);g.addColorStop(0,'#fff5df');g.addColorStop(.6,'#e3dce0');g.addColorStop(1,'#a5a0b680');oval(c,x,y,.38,.26,g,-.35);}
c.lineCap='round';for(let i=0;i<110;i++){const a=i*2.399,d=.16+(i%7)*.09,x=-.15+Math.cos(a)*d,y=Math.sin(a)*d*.92;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-.13,y-.13,x-.32,y-.20,x-.36-(i%4)*.045,y-.12+Math.sin(i)*.14);c.strokeStyle=i%3?'#fff5e5b0':'#c6bbd28a';c.lineWidth=.010+(i%3)*.003;c.stroke();}c.restore();
for(let i=0;i<4;i++)oval(c,.27+i*.095,-.38+i*.20,.095,.035,'#b88a45',-.45);c.restore();}
root.SemyannitsaBefore={draw,flight};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const clamp=x=>Math.max(0,Math.min(1,x));
function flight(f,now){if(f.seedBornAt==null||f.seedLanded||f.dead||f.siege)return false;const p=now>=f.seedBornAt+.65?1:clamp((now-f.seedBornAt)/.65),k=p*p*(3-2*p);f.d=f.seedFrom+(f.seedTo-f.seedFrom)*k;if(p>=1)f.seedLanded=true;return p<1;}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){const r=(o.size||90)/3,ph=(o.distance||0)*7+(o.seed||0),step=o.state==='walk'?Math.sin(ph):0,release=o.release||0;c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);if(o.shadow!==false)oval(c,-.1,.1,1.12,.9,'#25282044');
for(const s of [-1,1]){oval(c,-.30+step*s*.12,s*.63,.35,.21,'#685334');for(let j=0;j<3;j++){c.beginPath();c.moveTo(-.45+step*s*.12,s*.65+j*.07);c.lineTo(-.11+step*s*.12,s*.65+j*.07);c.strokeStyle='#a28a58';c.lineWidth=.04;c.stroke();}}
c.rotate(step*.055);oval(c,0,0,.8,.71,'#ac975e');material(c,'#ac975e','#d1bc82','#766b47',0,0,.8,.71);
for(let i=0;i<7;i++){const a=i*6.283/7;c.save();c.rotate(a);c.beginPath();c.moveTo(.37,-.18);c.quadraticCurveTo(.85,-.43,1.02,-.12);c.quadraticCurveTo(.72,.14,.43,.20);c.closePath();c.fillStyle=['#6a7045','#8d8956','#5c6140'][i%3];c.fill();c.strokeStyle='#b2a36c';c.lineWidth=.015;c.stroke();c.beginPath();c.moveTo(.44,0);c.lineTo(.92,-.12);c.stroke();c.restore();}
for(const s of [-1,1]){oval(c,.64,s*.24,.13,.08,'#2e2c21');oval(c,.69,s*.24,.037,.029,'#dbb564');}
// An asymmetric soft crown, with exposed seed sockets on its forward side.
for(let i=0;i<7;i++){const a=i*2.4,x=.29+Math.cos(a)*.25,y=Math.sin(a)*.32;oval(c,x,y,.11,.09,'#aa8347');oval(c,x,y,.065,.049,'#4d3825');}
c.save();c.translate(-.19,0);c.rotate(-step*.08+Math.sin((o.time||0)*1.8)*.018-release*.08);
oval(c,-.2,0,.87,.72,'#aab1b1');
for(const [x,y,rx,ry] of [[-.62,-.22,.44,.37],[-.35,-.43,.46,.3],[-.2,.05,.55,.43],[-.57,.34,.38,.28]]){oval(c,x,y,rx,ry,'#e9e6d6');oval(c,x-.055,y-.075,rx*.83,ry*.67,'#fff3d9');}c.restore();

for(let i=0;i<4;i++)oval(c,.27+i*.095,-.38+i*.20,.095,.035,'#b88a45',-.45);c.restore();}
root.Semyannitsa={draw,flight};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const ATTACK_DURATION=1,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after):t>=0&&t<=CONTACT?CONTACT-t:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',ph=(o.distance||0)*(o.cracked?14:8)+(o.seed||0),walk=o.state==='walk';return {step:walk?Math.sin(ph):0,roll:walk?Math.sin(ph)*(o.cracked?.045:.10):0,ram:active?(a<CONTACT?ease((a-.28)/.32):1-ease((a-CONTACT)/.4)):0,wind:active&&a<.28?Math.sin(a/.28*Math.PI)*.13:0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function line(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function poly(c,points,col){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=col;c.fill()}
function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.6,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.translate((target.x-1.12)*p.ram-p.wind,target.y*p.ram);
if(o.shadow!==false)oval(c,-.06,.1,1.12,.87,'#24251944');c.rotate(p.roll);
for(const s of [-1,1]){const x=-.25+p.step*s*(o.cracked?.20:.10),y=s*.69;oval(c,x,y,.32,.18,'#54422d');for(let j=0;j<3;j++)line(c,x-.15,y+(j-1)*.07,x+.22,y+(j-1)*.10,'#8e7046',.048);}
const g=c.createRadialGradient(.02,-.30,.03,.10,0,1.15);g.addColorStop(0,'#cf9450');g.addColorStop(.48,'#9d602f');g.addColorStop(1,'#41291d');
c.beginPath();c.moveTo(1.12,0);c.bezierCurveTo(.69,-.79,-.03,-.91,-.65,-.55);c.bezierCurveTo(-1,-.15,-.87,.45,-.46,.65);c.bezierCurveTo(.19,.95,.76,.55,1.12,0);c.closePath();c.fillStyle=g;c.fill();
for(let i=0;i<21;i++){const y=(i-10)*.06;c.beginPath();c.moveTo(-.40,y);c.quadraticCurveTo(.22,y*1.16,1.06-Math.abs(y)*.56,y*.12);c.strokeStyle=i%3?'#e6b06a33':'#40261e55';c.lineWidth=.012;c.stroke();}
if(o.cracked){poly(c,[[.12,-.31],[.33,-.42],[.42,-.28],[.65,-.32],[.60,-.10],[.90,.03],[.69,.18],[.71,.38],[.43,.27],[.25,.44],[.15,.21],[-.03,.17],[.08,-.04],[-.02,-.18]],'#3d291e');poly(c,[[.15,-.25],[.33,-.35],[.40,-.22],[.58,-.25],[.54,-.08],[.80,.03],[.62,.15],[.65,.30],[.42,.20],[.27,.34],[.20,.16],[.06,.13],[.16,-.04],[.05,-.14]],'#e4c587');for(let i=0;i<5;i++)line(c,.22+i*.06,-.18,.40+i*.055,.20,'#fff0bd88',.017);}
// Cap overlaps the shell with layered woody scales, not flat dotted circles.
oval(c,-.50,0,.56,.76,'#392c21');for(let row=0;row<5;row++){const x=-.90+row*.14,span=Math.sqrt(Math.max(0,1-((x+.5)/.58)**2))*.72;for(let j=0;j<7;j++){const y=(j-3)*span/3;poly(c,[[x-.11,y-.10],[x+.08,y-.11],[x+.20,y],[x+.04,y+.12],[x-.12,y+.08]],['#73583b','#8b6a45','#62492f'][(j+row)%3]);line(c,x-.04,y-.06,x+.11,y,'#b1946477',.018);}}
for(const s of [-1,1]){oval(c,-.01,s*.28,.115,.071,'#302519');oval(c,.033,s*.28,.033,.025,'#dca950');}
c.beginPath();c.moveTo(-.72,-.08);c.quadraticCurveTo(-1.18,-.22,-1.21,-.51);c.strokeStyle='#493825';c.lineWidth=.12;c.stroke();line(c,-.79,-.11,-1.12,-.36,'#a08456',.027);
c.save();c.translate(-1.07,-.44);c.rotate(Math.sin((o.time||0)*2)*.06+p.step*.07);poly(c,[[0,0],[.14,-.18],[.26,-.13],[.32,-.30],[.43,-.22],[.56,-.28],[.53,-.11],[.70,0],[.52,.08],[.48,.20],[.34,.14],[.22,.23],[.17,.11],[.04,.10]],'#7e8050');line(c,0,0,.62,-.01,'#bdab71',.02);for(let j=1;j<4;j++){line(c,j*.14,0,j*.14+.04,-.13,'#aaa16b',.012);line(c,j*.14,0,j*.14+.03,.11,'#aaa16b',.012);}c.restore();
if(o.crackAge>=0&&o.crackAge<.5){const t=o.crackAge/.5;for(let i=0;i<5;i++){const a=i*2.4,x=.25+Math.cos(a)*(.45+t*.65),y=Math.sin(a)*(.3+t*.6);c.save();c.translate(x,y);c.rotate(a+t*2);poly(c,[[0,-.07],[.14,0],[.06,.10],[-.06,.06]],'#986036');c.restore();}}
c.restore();}
root.ZheludnikBefore={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';
const ATTACK_DURATION=1,CONTACT=.6,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after):t>=0&&t<=CONTACT?CONTACT-t:null}
function pose(o={}){const a=clamp(o.attack||0),active=o.state==='attack',ph=(o.distance||0)*(o.cracked?14:8)+(o.seed||0),walk=o.state==='walk';return {step:walk?Math.sin(ph):0,roll:walk?Math.sin(ph)*(o.cracked?.045:.10):0,ram:active?(a<CONTACT?ease((a-.28)/.32):1-ease((a-CONTACT)/.4)):0,wind:active&&a<.28?Math.sin(a/.28*Math.PI)*.13:0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fillStyle=col;c.fill()}
function line(c,x,y,u,v,col,w){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function poly(c,points,col){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=col;c.fill()}

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.6,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';c.translate((target.x-1.12)*p.ram-p.wind,target.y*p.ram);
if(o.shadow!==false)oval(c,-.06,.1,1.12,.87,'#24251944');c.rotate(p.roll);
for(const s of [-1,1]){const x=-.25+p.step*s*(o.cracked?.20:.10),y=s*.69;oval(c,x,y,.32,.18,'#54422d');for(let j=0;j<3;j++)line(c,x-.15,y+(j-1)*.07,x+.22,y+(j-1)*.10,'#8e7046',.048);}
c.beginPath();c.moveTo(1.12,0);c.bezierCurveTo(.69,-.79,-.03,-.91,-.65,-.55);c.bezierCurveTo(-1,-.15,-.87,.45,-.46,.65);c.bezierCurveTo(.19,.95,.76,.55,1.12,0);c.closePath();material(c,'#bb8346','#e0b875','#855b36',.05,0,1,.8);
if(o.cracked){poly(c,[[.12,-.31],[.33,-.42],[.42,-.28],[.65,-.32],[.60,-.10],[.90,.03],[.69,.18],[.71,.38],[.43,.27],[.25,.44],[.15,.21],[-.03,.17],[.08,-.04],[-.02,-.18]],'#3d291e');poly(c,[[.15,-.25],[.33,-.35],[.40,-.22],[.58,-.25],[.54,-.08],[.80,.03],[.62,.15],[.65,.30],[.42,.20],[.27,.34],[.20,.16],[.06,.13],[.16,-.04],[.05,-.14]],'#e4c587');for(let i=0;i<5;i++)line(c,.22+i*.06,-.18,.40+i*.055,.20,'#fff0bd88',.017);}
// Cap overlaps the shell with layered woody scales, not flat dotted circles.
oval(c,-.55,0,.57,.76,'#5f4934');oval(c,-.60,-.06,.48,.66,'#a78959');
for(let row=0;row<3;row++)for(let j=0;j<3;j++){const x=-.88+row*.22,y=(j-1)*.39+(row%2)*.08;oval(c,x,y,.18,.21,'#80653f');oval(c,x-.035,y-.04,.14,.14,'#c1a273');}
for(const s of [-1,1]){oval(c,-.01,s*.28,.115,.071,'#302519');oval(c,.033,s*.28,.033,.025,'#dca950');}
c.beginPath();c.moveTo(-.72,-.08);c.quadraticCurveTo(-1.18,-.22,-1.21,-.51);c.strokeStyle='#493825';c.lineWidth=.12;c.stroke();line(c,-.79,-.11,-1.12,-.36,'#a08456',.027);
c.save();c.translate(-1.07,-.44);c.rotate(Math.sin((o.time||0)*2)*.06+p.step*.07);poly(c,[[0,0],[.14,-.18],[.26,-.13],[.32,-.30],[.43,-.22],[.56,-.28],[.53,-.11],[.70,0],[.52,.08],[.48,.20],[.34,.14],[.22,.23],[.17,.11],[.04,.10]],'#7e8050');line(c,0,0,.62,-.01,'#bdab71',.02);for(let j=1;j<4;j++){line(c,j*.14,0,j*.14+.04,-.13,'#aaa16b',.012);line(c,j*.14,0,j*.14+.03,.11,'#aaa16b',.012);}c.restore();
if(o.crackAge>=0&&o.crackAge<.5){const t=o.crackAge/.5;for(let i=0;i<5;i++){const a=i*2.4,x=.25+Math.cos(a)*(.45+t*.65),y=Math.sin(a)*(.3+t*.6);c.save();c.translate(x,y);c.rotate(a+t*2);poly(c,[[0,-.07],[.14,0],[.06,.10],[-.06,.06]],'#986036');c.restore();}}
c.restore();}
root.Zheludnik={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';const ATTACK_DURATION=.9,CONTACT=.55,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),v=clamp(o.veil||0),moving=o.state==='walk';return {veil:v,flow:Math.sin((moving?(o.distance||0)*5:(o.time||0)*1.8)+(o.seed||0))*.075,stretch:moving?1+v*.16:1,dart:o.state==='attack'?(a<CONTACT?ease((a-.20)/.35):1-ease((a-CONTACT)/.45)):0,charge:o.state==='attack'&&a<.2?Math.sin(a/.2*Math.PI)*.12:0};}
function transition(value,hidden,dt){const goal=hidden?1:0,step=Math.max(0,dt)/(hidden?.55:.45);return value<goal?Math.min(goal,value+step):Math.max(goal,value-step);}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=col;c.fill()}
// Swept hooked folds form a compact spirit with an irregular trailing silhouette.
function wisp(c,x,y,length,width,angle,bend,light){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(length*.44,0);c.bezierCurveTo(length*.16,-width*.66,-length*.27,-width*.56,-length*.61,-width*.1+bend);c.quadraticCurveTo(-length*.40,-width*.06,-length*.39,width*.14+bend);c.lineTo(-length*.70,width*.35+bend);c.bezierCurveTo(-length*.24,width*.44,-length*.08,width*.64,length*.44,0);c.closePath();const g=c.createLinearGradient(0,-width*.5,0,width*.5);g.addColorStop(0,light);g.addColorStop(.20,'#513586');g.addColorStop(.50,'#251a40');g.addColorStop(1,'#0c1120');c.fillStyle=g;c.fill();c.strokeStyle='#9c70e095';c.lineWidth=.018;c.stroke();
// A single bright ridge gives thickness, leaving the center in deep shadow.
c.beginPath();c.moveTo(length*.39,-.01);c.bezierCurveTo(length*.12,-width*.52,-length*.25,-width*.47,-length*.58,-width*.11+bend);c.strokeStyle='#bc94ef';c.lineWidth=.021;c.stroke();c.restore();}
function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.7,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.translate((target.x-.82)*p.dart-p.charge,target.y*p.dart);
if(o.shadow!==false)oval(c,-.25,.09,1.10,.70,'#11102355');
// Local halo stays delicate: contrast comes from the dark body and luminous edges.
const halo=c.createRadialGradient(-.08,0,.15,-.08,0,1.15);halo.addColorStop(0,'#7650b329');halo.addColorStop(.65,'#7545bf22');halo.addColorStop(1,'#7341b000');oval(c,-.08,0,1.30,1.05,halo);
// The body collapses into a ground pool, while eyes remain readable above it.
const sink=ease(p.veil);c.save();c.globalAlpha*=sink*.65;const pool=c.createRadialGradient(0,0,.05,0,0,1.3);pool.addColorStop(0,'#171427bb');pool.addColorStop(.65,'#29203977');pool.addColorStop(1,'#29203900');oval(c,-.2,.07,1.3+sink*.2,.42,pool);c.restore();
c.save();c.globalAlpha*=1-sink*.91;c.translate(-sink*.16,sink*.07);c.scale(1+sink*.24,1-sink*.70);
wisp(c,-.42,-.42,1.65,.53,.28,p.flow*1.5,'#7962a8');wisp(c,-.60,.34,1.85,.50,-.22,-p.flow*1.8,'#8064b4');wisp(c,-.58,.05,2.10,.52,.07,p.flow,'#634b96');
const core=c.createRadialGradient(.1,-.24,.02,.06,0,.85);core.addColorStop(0,'#41305a');core.addColorStop(.45,'#201a33');core.addColorStop(1,'#090e19');oval(c,.05,0,.78,.61,core);
wisp(c,-.08,-.27,1.68,.72,.13,p.flow*.6,'#9974ce');wisp(c,-.25,.29,1.63,.58,-.20,-p.flow,'#7156af');
// Off-center raised crest curls into a long pointed tip.
wisp(c,.02,-.09,1.62,.56,-.08,p.flow*.7-.14,'#b292df');
// The forward face is a single dark hollow under the crest, without a mouth.
c.beginPath();c.moveTo(.79,0);c.bezierCurveTo(.75,-.38,.38,-.49,.30,-.21);c.quadraticCurveTo(.37,0,.30,.23);c.bezierCurveTo(.45,.47,.76,.35,.79,0);c.closePath();c.fillStyle='#101020';c.fill();
for(const side of [-1,1]){const x=.59,y=side*.19;const glow=c.createRadialGradient(x,y,.01,x,y,.19);glow.addColorStop(0,'#d0abffb0');glow.addColorStop(1,'#a273ff00');oval(c,x,y,.19,.15,glow);c.beginPath();c.moveTo(x-.09,y-side*.045);c.quadraticCurveTo(x+.045,y-side*.09,x+.095,y);c.quadraticCurveTo(x+.015,y+side*.043,x-.09,y-side*.045);c.fillStyle=o.reveal>0?'#ffffff':'#dfcaff';c.fill();oval(c,x+.025,y,.022,.026,'#fff9ff');}
// Sparse drifting fragments reinforce motion without turning into extra limbs.
for(let i=0;i<3;i++){const q=((o.time||0)*.65+i*.31)%1;c.globalAlpha*=(1-q)*.5;c.beginPath();c.moveTo(-1.03-q*.44,(i-1)*.37+p.flow);c.lineTo(-1.14-q*.44,(i-1)*.37-.045+p.flow);c.lineTo(-1.10-q*.44,(i-1)*.37+.028+p.flow);c.closePath();c.fillStyle='#a47fe2';c.fill();}
c.restore();
// On emergence, the eyes appear before the folded body rises out of the pool.
if(p.veil>0){c.save();c.globalAlpha*=Math.min(1,p.veil*3);for(const side of [-1,1]){const x=.56,y=side*.10+.07;oval(c,x,y,.057,.023,o.reveal>0?'#f3e9ff':'#c2a0ef');}c.restore();}
c.restore();}

root.TennikBefore={draw,pose,transition,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

(function(root){'use strict';const ATTACK_DURATION=.9,CONTACT=.55,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(t,after=0){return after>0?Math.min(1,1-after/ATTACK_DURATION):t>=0&&t<=ATTACK_DURATION*CONTACT?CONTACT-t/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),v=clamp(o.veil||0),moving=o.state==='walk';return {veil:v,flow:Math.sin((moving?(o.distance||0)*5:(o.time||0)*1.8)+(o.seed||0))*.075,stretch:moving?1+v*.16:1,dart:o.state==='attack'?(a<CONTACT?ease((a-.20)/.35):1-ease((a-CONTACT)/.45)):0,charge:o.state==='attack'&&a<.2?Math.sin(a/.2*Math.PI)*.12:0};}
function transition(value,hidden,dt){const goal=hidden?1:0,step=Math.max(0,dt)/(hidden?.55:.45);return value<goal?Math.min(goal,value+step):Math.max(goal,value-step);}
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=col;c.fill()}
// Swept hooked folds form a compact spirit with an irregular trailing silhouette.
function wisp(c,x,y,length,width,angle,bend,light){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(length*.44,0);c.bezierCurveTo(length*.16,-width*.66,-length*.27,-width*.56,-length*.61,-width*.1+bend);c.quadraticCurveTo(-length*.40,-width*.06,-length*.39,width*.14+bend);c.lineTo(-length*.70,width*.35+bend);c.bezierCurveTo(-length*.24,width*.44,-length*.08,width*.64,length*.44,0);c.closePath();material(c,'#594779',light,'#303147',-length*.15,0,length*.68,width*.6);
c.restore();}

// Broad material planes clipped to the silhouette; no surface gradients.
function material(c,base,light,shade,x,y,rx,ry){c.fillStyle=base;c.fill();c.save();c.clip();c.beginPath();c.ellipse(x+rx*.26,y+ry*.48,rx,ry,0,0,Math.PI*2);c.fillStyle=shade;c.fill();c.beginPath();c.ellipse(x-rx*.14,y-ry*.22,rx*.94,ry*.77,0,0,Math.PI*2);c.fillStyle=light;c.fill();c.restore();}

function draw(c,o={}){const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.7,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.translate((target.x-.82)*p.dart-p.charge,target.y*p.dart);
if(o.shadow!==false)oval(c,-.25,.09,1.10,.70,'#11102355');
// Local halo stays delicate: contrast comes from the dark body and luminous edges.
const halo=c.createRadialGradient(-.08,0,.15,-.08,0,1.15);halo.addColorStop(0,'#7650b329');halo.addColorStop(.65,'#7545bf22');halo.addColorStop(1,'#7341b000');oval(c,-.08,0,1.30,1.05,halo);
// The body collapses into a ground pool, while eyes remain readable above it.
const sink=ease(p.veil);c.save();c.globalAlpha*=sink*.65;const pool=c.createRadialGradient(0,0,.05,0,0,1.3);pool.addColorStop(0,'#171427bb');pool.addColorStop(.65,'#29203977');pool.addColorStop(1,'#29203900');oval(c,-.2,.07,1.3+sink*.2,.42,pool);c.restore();
c.save();c.globalAlpha*=1-sink*.91;c.translate(-sink*.16,sink*.07);c.scale(1+sink*.24,1-sink*.70);
wisp(c,-.42,-.42,1.65,.53,.28,p.flow*1.5,'#7962a8');wisp(c,-.60,.34,1.85,.50,-.22,-p.flow*1.8,'#8064b4');
oval(c,.05,0,.78,.61,'#332d49');
wisp(c,-.08,-.27,1.68,.72,.13,p.flow*.6,'#9974ce');wisp(c,-.25,.29,1.63,.58,-.20,-p.flow,'#7156af');
// Off-center raised crest curls into a long pointed tip.
wisp(c,.02,-.09,1.62,.56,-.08,p.flow*.7-.14,'#b292df');
// The forward face is a single dark hollow under the crest, without a mouth.
c.beginPath();c.moveTo(.79,0);c.bezierCurveTo(.75,-.38,.38,-.49,.30,-.21);c.quadraticCurveTo(.37,0,.30,.23);c.bezierCurveTo(.45,.47,.76,.35,.79,0);c.closePath();c.fillStyle='#101020';c.fill();
for(const side of [-1,1]){const x=.59,y=side*.19;const glow=c.createRadialGradient(x,y,.01,x,y,.19);glow.addColorStop(0,'#d0abffb0');glow.addColorStop(1,'#a273ff00');oval(c,x,y,.19,.15,glow);c.beginPath();c.moveTo(x-.09,y-side*.045);c.quadraticCurveTo(x+.045,y-side*.09,x+.095,y);c.quadraticCurveTo(x+.015,y+side*.043,x-.09,y-side*.045);c.fillStyle=o.reveal>0?'#ffffff':'#dfcaff';c.fill();oval(c,x+.025,y,.022,.026,'#fff9ff');}
// Sparse drifting fragments reinforce motion without turning into extra limbs.
for(let i=0;i<3;i++){const q=((o.time||0)*.65+i*.31)%1;c.globalAlpha*=(1-q)*.5;c.beginPath();c.moveTo(-1.03-q*.44,(i-1)*.37+p.flow);c.lineTo(-1.14-q*.44,(i-1)*.37-.045+p.flow);c.lineTo(-1.10-q*.44,(i-1)*.37+.028+p.flow);c.closePath();c.fillStyle='#a47fe2';c.fill();}
c.restore();
// On emergence, the eyes appear before the folded body rises out of the pool.
if(p.veil>0){c.save();c.globalAlpha*=Math.min(1,p.veil*3);for(const side of [-1,1]){const x=.56,y=side*.10+.07;oval(c,x,y,.057,.023,o.reveal>0?'#f3e9ff':'#c2a0ef');}c.restore();}
c.restore();}

root.Tennik={draw,pose,transition,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

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

/* Storybook v03. Rounded mass, moss wrapping the shoulder; established gait. */
(function(root){
'use strict';const TAU=Math.PI*2;
function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill()}
function fill(c,col){c.fillStyle=col;c.fill()}
function boulder(c){c.beginPath();c.moveTo(-1,-.15);c.bezierCurveTo(-1.08,-.58,-.72,-.82,-.30,-.84);c.bezierCurveTo(.05,-.96,.56,-.73,.72,-.47);c.bezierCurveTo(.94,-.23,.91,.18,.65,.44);c.bezierCurveTo(.4,.76,-.04,.83,-.46,.68);c.bezierCurveTo(-.84,.59,-1.02,.24,-1,-.15);c.closePath()}
function pebble(c,x,y,rx,ry){oval(c,x,y,rx,ry,'#536d63');oval(c,x-.025,y-.035,rx*.88,ry*.78,'#9eaf93');oval(c,x-.055,y-.07,rx*.51,ry*.36,'#c6cfaa')}
function draw(c,o={}){const p=root.Kamnespin.pose(o),r=(o.size||80)/2.8,target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.42,y:0};c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.translate((target.x-.9)*p.ram,target.y*p.ram);
if(o.shadow!==false)oval(c,-.02,.12,1.07,.79,'#183c323d');
for(let i=0;i<4;i++){const foot=p.feet[i],side=i%2?1:-1;pebble(c,(i<2?.45:-.64)+foot.x,side*(.66+p.tuck*.07)-foot.lift*.035,.24,.22);}
// A broad low brow, visible snout and tiny amber eyes give the rock a presence.
const head=.86-p.tuck*.27;oval(c,head+.01,.025,.40,.32,'#354f46');pebble(c,head+.04,-.015,.37,.29);
for(const side of [-1,1]){oval(c,head+.19,side*.18,.083,.052,'#304e43');oval(c,head+.215,side*.18,.040,.030,'#edc875');oval(c,head+.225,side*.18-.009,.012,.011,'#fff0bc');}
oval(c,head+.33,0,.10,.11,'#b9c4a1');
c.save();c.translate(-p.tuck*.045,p.weight);c.rotate(p.roll);c.scale(1,1-p.tuck*.035);
boulder(c);fill(c,'#688579');c.save();c.clip();
// Rounded top plane falls away into the shaded lower flank.
c.beginPath();c.moveTo(-1.06,-.22);c.bezierCurveTo(-.95,-.87,-.03,-1.04,.52,-.66);c.bezierCurveTo(.87,-.4,.63,.12,.24,.31);c.bezierCurveTo(-.19,.56,-.77,.3,-1.06,-.22);fill(c,'#a8b99a');
c.beginPath();c.moveTo(-.94,-.28);c.bezierCurveTo(-.88,-.68,-.36,-.87,.05,-.75);c.bezierCurveTo(.35,-.64,.39,-.52,.28,-.38);c.bezierCurveTo(-.05,-.49,-.51,-.48,-.76,-.09);c.quadraticCurveTo(-.91,-.13,-.94,-.28);fill(c,'#c9d2af');
c.beginPath();c.moveTo(-.84,.3);c.bezierCurveTo(-.27,.74,.47,.43,.78,.08);c.bezierCurveTo(.72,.62,.10,.91,-.46,.68);c.closePath();fill(c,'#4f7065');
// Moss grows over the back ridge and curls down the left shoulder.
c.beginPath();c.moveTo(-1.02,-.29);c.bezierCurveTo(-.91,-.62,-.75,-.83,-.38,-.83);c.bezierCurveTo(-.26,-.94,-.05,-.86,.04,-.74);c.bezierCurveTo(.35,-.79,.51,-.6,.38,-.44);c.bezierCurveTo(.3,-.30,.11,-.39,.02,-.30);c.bezierCurveTo(-.13,-.15,-.25,-.34,-.37,-.16);c.bezierCurveTo(-.43,.02,-.65,-.09,-.66,.14);c.bezierCurveTo(-.72,.34,-.96,.25,-1.02,-.29);fill(c,'#4e7042');
c.beginPath();c.moveTo(-1,-.37);c.bezierCurveTo(-.85,-.81,-.53,-.85,-.34,-.83);c.bezierCurveTo(-.2,-.92,-.05,-.83,.02,-.72);c.bezierCurveTo(.26,-.77,.40,-.62,.33,-.51);c.bezierCurveTo(.23,-.43,.06,-.56,-.05,-.42);c.bezierCurveTo(-.2,-.3,-.32,-.45,-.46,-.3);c.bezierCurveTo(-.7,-.14,-.72,-.18,-.81,.03);c.bezierCurveTo(-.93,.08,-1,-.11,-1,-.37);fill(c,'#89a85d');
c.beginPath();c.moveTo(-.91,-.42);c.bezierCurveTo(-.74,-.73,-.53,-.77,-.35,-.72);c.bezierCurveTo(-.25,-.81,-.09,-.73,-.06,-.63);c.bezierCurveTo(-.36,-.59,-.48,-.66,-.66,-.43);c.quadraticCurveTo(-.82,-.27,-.91,-.42);fill(c,'#b8ca80');
// Sparse lichen islands, no outline or scatter of cracks.
oval(c,-.27,.06,.083,.048,'#cfce9e');oval(c,-.15,.09,.038,.028,'#b6c396');oval(c,.30,-.25,.04,.026,'#d5d7b0');
c.restore();c.restore();c.restore();
// Contact feedback stays at the gate while the body recoils.
if(p.impact>0){const k=1-p.impact;c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.globalAlpha*=p.impact;c.strokeStyle='#d9caa3';c.lineWidth=.032;c.beginPath();c.ellipse(target.x,target.y,.09+k*.10,.19+k*.35,0,0,TAU);c.stroke();for(let i=0;i<5;i++){const a=i*TAU/5;oval(c,target.x+Math.cos(a)*(.10+k*.34),target.y+Math.sin(a)*(.10+k*.40),.025+i*.004,.023,'#a8b99a');}c.restore();}
}
root.StorybookKamnespin={draw};
})(typeof module==='object'?module.exports:window);

/* Rosnik: flowing dew spirit, overhead view. Combat owns healing and damage. */
(function(root){
'use strict';const TAU=Math.PI*2,ATTACK_DURATION=1,CONTACT=.6;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const a=clamp(o.attack||0),phase=(o.distance||0)*4+(o.seed||0),active=o.state==='attack';return {flow:o.state==='walk'?Math.sin(phase)*.05:0,reach:active?(a<CONTACT?ease((a-.27)/.33):1-ease((a-CONTACT)/.4)):0,brace:active?(a<.27?ease(a/.27):1-ease((a-.27)/.5)):0,impact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.22):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=col;c.fill()}
function draw(c,o={}){
 const r=(o.size||90)/3,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
 if(o.shadow!==false)oval(c,-.12,.12,1.02,.75,'#204c4333');
 // Low liquid ripples, no feet and no jumping.
 for(let i=0;i<2;i++){const u=((o.distance||0)*.8+i*.5)%1;c.strokeStyle=`rgba(178,244,222,${(1-u)*.20})`;c.lineWidth=.025;c.beginPath();c.ellipse(-.25-u*.26,0,.86+u*.20,.64+u*.09,0,0,TAU);c.stroke()}
 if(p.reach>0){const x=.65+(target.x-.65)*p.reach,y=target.y*p.reach;
  for(const [w,col] of [[.20,'#397d7480'],[.13,'#94e1d6b3'],[.034,'#f0fff4']]){c.beginPath();c.moveTo(.42,0);c.bezierCurveTo(.72,-.28*p.reach,x-.2,y-.20*p.reach,x,y);c.strokeStyle=col;c.lineWidth=w;c.stroke()}oval(c,x,y,.10,.09,'#c6f4e6');}
 c.save();c.scale(1+p.flow-p.brace*.08,1-p.flow+p.brace*.06);
 c.beginPath();c.moveTo(-1.12,-.05);c.bezierCurveTo(-.67,-.37,-.55,-.77,.05,-.76);c.bezierCurveTo(.98,-.76,1.06,.44,.36,.69);c.bezierCurveTo(-.26,.93,-.67,.32,-1.12,-.05);c.closePath();
 const water=c.createRadialGradient(.22,-.24,.04,0,0,1.13);water.addColorStop(0,'#cdf4dfc9');water.addColorStop(.4,'#80cfc6c9');water.addColorStop(.8,'#3d999cae');water.addColorStop(1,'#235c62e6');c.fillStyle=water;c.fill();c.strokeStyle='#a7e8e0';c.lineWidth=.035;c.stroke();
 // Inner spirit sits beneath the watery highlights, not a face on a glass shell.
 const light=c.createRadialGradient(.28,0,0,.28,0,.51);light.addColorStop(0,'#f7ffcbbd');light.addColorStop(1,'#eaffb000');oval(c,.28,0,.53,.47,light);
 c.beginPath();c.moveTo(-.08,-.12);c.bezierCurveTo(.13,-.05,.10,-.35,.39,-.28);c.bezierCurveTo(.74,-.22,.67,.35,.32,.32);c.bezierCurveTo(.02,.29,.16,.03,-.08,-.12);c.fillStyle='#edfac7ce';c.fill();
 for(const side of [-1,1]){oval(c,.48,side*.12,.08,.027,'#708940',side*-.5);oval(c,.51,side*.12,.027,.012,'#faffd8',side*-.5)}
 for(let i=0;i<8;i++){const a=i*2.399,d=.40+(i%3)*.10,x=Math.cos(a)*d,y=Math.sin(a)*d*.83;oval(c,x,y,.025+(i%2)*.012,.029,'#bdf5eb50');oval(c,x-.012,y-.012,.010,.010,'#f3fff6bb')}
 c.beginPath();c.moveTo(-.27,-.62);c.bezierCurveTo(.15,-.85,.58,-.56,.69,-.36);c.strokeStyle='#effff0c4';c.lineWidth=.043;c.stroke();
 c.beginPath();c.moveTo(.23,.60);c.quadraticCurveTo(.65,.53,.78,.19);c.strokeStyle='#c8fff3a8';c.lineWidth=.024;c.stroke();
 // Leaf follows the rear shoulder of the droplet.
 c.beginPath();c.moveTo(-.94,-.02);c.bezierCurveTo(-1.05,-.67,-.39,-.95,-.11,-.59);c.bezierCurveTo(-.16,-.11,-.59,-.24,-.94,-.02);c.closePath();const leaf=c.createLinearGradient(-.7,-.8,-.4,0);leaf.addColorStop(0,'#95aa57');leaf.addColorStop(.5,'#567a3b');leaf.addColorStop(1,'#304f2e');c.fillStyle=leaf;c.fill();c.strokeStyle='#b2bd74';c.lineWidth=.025;c.stroke();
 c.beginPath();c.moveTo(-.94,-.02);c.quadraticCurveTo(-.48,-.55,-.18,-.60);c.strokeStyle='#b9ce7e';c.lineWidth=.025;c.stroke();for(let i=0;i<3;i++){c.beginPath();c.moveTo(-.76+i*.16,-.25-i*.1);c.lineTo(-.80+i*.16,-.52-i*.05);c.strokeStyle='#a0b86888';c.lineWidth=.018;c.stroke()}
 oval(c,-.45,-.59,.076,.059,'#b3ebe7aa');oval(c,-.48,-.61,.022,.016,'#f7fff4');c.restore();
 if(p.impact>0){c.globalAlpha*=p.impact;for(let i=0;i<6;i++){const a=i*TAU/6,d=(1-p.impact)*.4;oval(c,target.x+Math.cos(a)*d,target.y+Math.sin(a)*d,.035,.028,'#d2fff0')}}
 c.restore();
}
function drawHeal(c,o={}){const phase=(o.time||0)*1.3+(o.seed||0),x=o.target.x,y=o.target.y,s=o.size||3;c.save();for(let i=0;i<3;i++){const u=((phase+i/3)%1+1)%1,arc=Math.sin(u*Math.PI)*s*2;oval(c,x*u,y*u-arc,s*(.65+u*.35),s*(.65+u*.35),'#a6efddbb');oval(c,x*u-s*.2,y*u-arc-s*.25,s*.22,s*.18,'#f2fff1');}c.strokeStyle='#baf5df88';c.lineWidth=Math.max(1,s*.3);c.beginPath();c.ellipse(x,y,s*2.2,s*1.5,0,0,TAU);c.stroke();c.restore();}
root.Rosnik={draw,drawHeal,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);

/* Shared overhead puffball and offspring. Rendering never spawns or deals damage. */
(function(root){
'use strict';
const TAU=Math.PI*2,ATTACK_DURATION=.9,CONTACT=.58,BIRTH_DURATION=.45,DEATH_DURATION=.8;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function attackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(CONTACT,1-after/ATTACK_DURATION));return remaining>=0&&remaining<=ATTACK_DURATION*CONTACT?CONTACT-remaining/ATTACK_DURATION:null}
function pose(o={}){const phase=(o.distance||0)*TAU*1.6+(o.seed||0),a=clamp(o.attack||0),active=o.state==='attack';return {rock:o.state==='walk'?Math.sin(phase)*.055:0,squash:o.state==='walk'?Math.cos(phase*2)*.025:0,feet:[Math.sin(phase)*.12,-Math.sin(phase)*.12],brace:active?(a<.32?ease(a/.32):1-ease((a-.32)/.4)):0,jet:active?(a<CONTACT?ease((a-.32)/(CONTACT-.32)):1-ease((a-CONTACT)/.32)):0,contact:active&&a>=CONTACT?Math.max(0,1-(a-CONTACT)/.2):0};}
function oval(c,x,y,rx,ry,col,a=0){c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=col;c.fill()}
function poly(c,points,col){c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle=col;c.fill()}
function shell(c,spore=false){
 const g=c.createRadialGradient(-.32,-.36,.02,0,0,1);g.addColorStop(0,'#fff3d9');g.addColorStop(.55,spore?'#e9ca8f':'#e5d1a7');g.addColorStop(.84,'#b69a66');g.addColorStop(1,'#796348');
 c.beginPath();for(let i=0;i<=48;i++){const a=i*TAU/48,r=.9+.025*Math.sin(a*3+.4)+.012*Math.cos(a*7);const x=Math.cos(a)*r,y=Math.sin(a)*r*.92;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.fillStyle=g;c.fill();c.strokeStyle='#776348';c.lineWidth=.026;c.stroke();
 const count=spore?12:24;
 for(let i=0;i<count;i++){const a=i*2.399,r=.28+(i%5)*.125,x=Math.cos(a)*r,y=Math.sin(a)*r*.92,s=.045+(i%3)*.012;
 poly(c,[[x-s,y+s*.5],[x,y-s],[x+s,y+s*.5],[x,y+s]],'#ad8550');poly(c,[[x-s,y+s*.5],[x,y-s],[x,y+s*.25]],'#eed3a2');}
 for(let i=0;i<(spore?16:40);i++){const a=i*2.399,r=.23+(i%7)*.09;oval(c,Math.cos(a)*r,Math.sin(a)*r*.92,.011+(i%2)*.005,.012,'#8e734b55')}
 for(const side of [-1,1]){oval(c,.67,side*.32,.115,.048,'#594a2f',side*-.55);oval(c,.69,side*.32,.059,.024,'#d9b66c',side*-.55)}
}
function draw(c,o={}){
 const r=(o.size||90)/2.7,p=pose(o),target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:2,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
 if(o.shadow!==false)oval(c,0,.10,1,.85,'#26302133');
 for(const side of [-1,1]){const step=o.state==='walk'?p.feet[side===1?0:1]:0;oval(c,-.12+step,side*.83,.26,.20,'#8d7856');for(let j=0;j<3;j++)oval(c,.02+step-j*.09,side*(.91+j*.018),.075,.075,j%2?'#b59b6b':'#998055')}
 c.save();c.rotate(p.rock);c.scale(1+p.squash-p.brace*.08,1-p.squash+p.brace*.06);shell(c);
 // Star-shaped opening sits on top, visible in every travel direction.
 const star=[];for(let i=0;i<12;i++){const a=i*TAU/12,r=i%2?.14:.27;star.push([-.12+Math.cos(a)*r,Math.sin(a)*r]);}
 poly(c,star,'#a27b43');const inner=star.map(([x,y])=>[-.12+(x+.12)*.72,y*.72]);poly(c,inner,'#493c23');oval(c,-.12,0,.07,.065,'#b2a059');c.restore();
 if(p.jet>0){const reach=p.jet;for(let i=0;i<18;i++){const u=(i+1)/18,x=-.12+(target.x+.12)*u*reach,y=target.y*u*reach+Math.sin(i*2.4)*(.07+u*.14);oval(c,x,y,.025+u*.035,.025+u*.035,`rgba(189,164,91,${.3+.5*(1-u)})`)}
 oval(c,-.12+ (target.x+.12)*reach,target.y*reach,.12,.12,'#dac38499');}
 if(p.contact>0){c.globalAlpha*=p.contact;c.strokeStyle='#efda9b';c.lineWidth=.025;c.beginPath();c.ellipse(target.x,target.y,.1+(1-p.contact)*.16,.18+(1-p.contact)*.25,0,0,TAU);c.stroke()}
 c.restore();
}
function sporeAttackProgress(remaining,after=0){if(after>0)return Math.min(1,Math.max(.5,1-after/.65));return remaining>=0&&remaining<=.325?.5-remaining/.65:null}
function sporePose(o={}){const a=clamp(o.attack||0),active=o.state==='attack';return {dart:active?(a<.5?ease((a-.18)/.32):1-ease((a-.5)/.5)):0,crouch:active?(a<.18?ease(a/.18):1-ease((a-.18)/.32)):0};}
function drawSpore(c,o={}){
 const g=clamp(o.growth||0),p=sporePose(o);
 if(g>0){c.save();draw(c,{...o,state:o.state==='attack'?'idle':o.state});c.restore();}
 c.save();c.globalAlpha*=1-g;
 const r=(o.size||35)/2.7,phase=(o.distance||0)*8+(o.seed||0),birth=o.birth==null?1:clamp(o.birth/BIRTH_DURATION),hop=o.state==='walk'?Math.abs(Math.sin(phase))*.15:0;
 const target=o.target?{x:o.target.x/r,y:o.target.y/r}:{x:1.8,y:0};
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);c.lineCap='round';
 if(o.shadow!==false)oval(c,0,.10,.92,.72,'#26302133');
 c.translate((target.x-.90)*p.dart,target.y*p.dart);
 c.scale(1-p.crouch*.12,1+p.crouch*.09);
 c.scale(.45+.55*ease(birth),.45+.55*ease(birth));c.translate(0,-hop-Math.sin(birth*Math.PI)*.25);
 c.beginPath();c.moveTo(-.70,0);c.quadraticCurveTo(-1.15,Math.sin(phase)*.18,-1.32,.04);c.strokeStyle='#a98a54';c.lineWidth=.08;c.stroke();
 for(const side of [-1,1])oval(c,-.13,side*.79,.17,.13,'#9a7a4c');shell(c,true);
 poly(c,[[-.15,-.12],[-.06,-.23],[.02,-.08],[-.07,.06]],'#a5844f');
 c.restore();c.restore();
}
function drawDeath(c,o={}){
 const t=clamp(o.progress||0),r=(o.size||90)/2.7;
 c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);
 // A dry fungal shell breaks outwards at the same instant as the live spores spawn.
 c.globalAlpha*=1-t;
 for(let i=0;i<8;i++){const a=i*TAU/8,d=.40+ease(t)*1.08,x=Math.cos(a)*d,y=Math.sin(a)*d;
 c.save();c.translate(x,y);c.rotate(a+t*.8);c.scale(1-t*.5,1-t*.5);poly(c,[[-.24,-.12],[-.13,-.31],[.15,-.25],[.22,.09],[-.06,.17]],i%2?'#d9c69b':'#bba376');c.restore();}
 for(let i=0;i<28;i++){const a=i*2.399,d=(.15+(i%7)*.12)*(.4+t*1.8);oval(c,Math.cos(a)*d,Math.sin(a)*d,.025+(i%3)*.012,.025+(i%3)*.012,'#cbb57a99')}
 c.restore();
}
root.Dozhdevik={sporePose,sporeAttackProgress,draw,drawSpore,drawDeath,pose,attackProgress,ATTACK_DURATION,CONTACT,BIRTH_DURATION,DEATH_DURATION};
})(typeof module==='object'?module.exports:window);
