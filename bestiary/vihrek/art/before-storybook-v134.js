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
