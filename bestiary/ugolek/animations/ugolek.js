/* Top-down Ugolek game renderer. No game-state mutations or damage side effects.
   heading: radians, right=0. distance: travelled cells, not elapsed seconds.
   state: idle | walk | attack. attack: normalized progress 0..1, owned by simulation.
   size: approximate full visible width in CSS pixels. Caller owns canvas DPR.
   Contact is driven by the unchanged siege timer; drawing never causes damage. */
(function(root){
  'use strict';
  const TAU=Math.PI*2, clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const ATTACK_DURATION=.72, CONTACT=.46;
  function pose(o={}){
    const time=o.time||0, seed=o.seed||0, walking=o.state==='walk';
    const phase=(o.distance||0)/.68*TAU+seed;
    const step=walking?Math.sin(phase):0, bob=walking?Math.sin(phase*2):0;
    const active=o.state==='attack', p=clamp(o.attack||0);
    const wind=active?(p<.32?smooth(p/.32):1-smooth((p-.32)/.14)):0;
    const thrust=active?(p<CONTACT?smooth((p-.32)/.14):1-smooth((p-CONTACT)/.38)):0;
    const flash=active?Math.max(0,1-Math.abs(p-CONTACT)/.12):0;
    return {step,bob,wind,thrust,flash,breath:Math.sin(time*2.3+seed),
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
    c.fillStyle='#25202c';c.beginPath();c.moveTo(-.24,0);c.quadraticCurveTo(-.02,-.25,.19,-.09);c.quadraticCurveTo(.26,.02,.13,.16);c.quadraticCurveTo(-.06,.25,-.24,0);c.fill();
    c.fillStyle='#fff0c8';c.beginPath();c.moveTo(-.185,0);c.quadraticCurveTo(-.005,-.17,.135,-.065);c.quadraticCurveTo(.195,.045,.095,.115);c.quadraticCurveTo(-.035,.175,-.185,0);c.fill();
    oval(c,.064,.003,.087,.115,'#e4a73b');oval(c,.091,.004,.049,.087,'#221d29');oval(c,.085,-.047,.027,.032,'#fffcec');
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
    g.addColorStop(0,'#4b4756');g.addColorStop(.60,'#6d6676');g.addColorStop(1,'#8c766f');
    c.fillStyle=g;c.fill();
    // A soft solid thumb highlight gives volume without reading as another arc.
    oval(c,.025,.205,.046,.035,'#a68c78',-.25);
    c.restore();
  }
  function draw(c,o={}){
    const p=pose(o), r=(o.size||40)/2.55;
    const hx=.95-p.wind*.08+p.thrust*.23, hy=p.step*.012;
    c.save();c.translate(o.x||0,o.y||0);c.rotate(o.heading||0);c.scale(r,r);
    if(o.shadow!==false)oval(c,-.02,.1,1.01,.75,'rgba(0,0,0,.20)');
    // Feet follow distance; both tuck in during the wind-up and brace at contact.
    for(const side of [-1,1]){
      const foot=p.step*side*.19;
      oval(c,-.44+foot-p.wind*.05,side*(.76+p.thrust*.07),.28,.15,'#252633',side*.12);
      oval(c,-.42+foot,side*.77,.15,.075,'#616074',side*.12);
    }
    c.save();c.translate(-p.wind*.12+p.thrust*.18,p.step*.065);
    c.rotate(p.lean);c.scale(1-p.wind*.10+p.thrust*.14,1+p.wind*.07-p.thrust*.07+p.breath*.008);
    body(c);c.fillStyle='#252632';c.fill();c.lineWidth=.05;c.strokeStyle='#24232d';c.stroke();
    const g=c.createLinearGradient(-.75,-.7,.65,.65);g.addColorStop(0,'#838197');g.addColorStop(.48,'#555365');g.addColorStop(1,'#35333f');body(c);c.fillStyle=g;c.fill();
    c.fillStyle='rgba(180,174,195,.26)';c.beginPath();c.moveTo(-.72,-.62);c.quadraticCurveTo(-.35,-.76,.15,-.47);c.quadraticCurveTo(-.13,-.57,-.46,-.40);c.quadraticCurveTo(-.59,-.38,-.72,-.62);c.fill();
    // One large fork: readable at 24px, also present on the character's back.
    c.lineJoin=c.lineCap='round';c.strokeStyle='#ec8a35';c.lineWidth=.07+p.wind*.025+p.flash*.02;
    c.beginPath();c.moveTo(-.61,-.42);c.lineTo(-.37,-.14);c.lineTo(-.48,.20);c.lineTo(-.22,.48);c.moveTo(-.37,-.14);c.lineTo(-.10,-.27);c.stroke();
    c.strokeStyle='#ffe2a0';c.lineWidth=.022+p.wind*.02;c.stroke();
    eye(c,-.30,p);eye(c,.30,p);
    c.strokeStyle='#211c27';c.lineWidth=.038;c.beginPath();c.arc(.70,0,.078,-.85,.85);c.stroke();
    c.restore();
    // Counter-motion: hands steady the ember instead of following the body's sway.
    const glow=c.createRadialGradient(hx,hy,0,hx,hy,.55+p.wind*.08+p.flash*.15);
    glow.addColorStop(0,'rgba(255,169,61,'+(.40+p.wind*.16)+')');glow.addColorStop(1,'rgba(255,151,48,0)');
    oval(c,hx,hy,.58,.58,glow);
    oval(c,hx,hy,.205+p.wind*.02+p.flash*.045,.215+p.flash*.02,'#cf652a');
    oval(c,hx+.01,hy,.155+p.flash*.035,.17+p.flash*.03,'#ffb442');
    oval(c,hx+.025,hy-.018,.083+p.wind*.035+p.flash*.025,.10+p.wind*.02,'#fff0b3');
    for(const side of [-1,1]){
      // The root follows the body; the mitten tip steadies the ember.
      const rx=.79*(1-p.wind*.10+p.thrust*.14);
      const ry=side*.36*(1+p.wind*.07-p.thrust*.07+p.breath*.008);
      paw(c,hx,hy,side,{
        x:-p.wind*.12+p.thrust*.18+rx*Math.cos(p.lean)-ry*Math.sin(p.lean),
        y:p.step*.065+rx*Math.sin(p.lean)+ry*Math.cos(p.lean)
      });
    }
    // Short contact flare only. No projectile, range or extra gameplay damage.
    if(p.flash>0){
      c.globalAlpha=p.flash;c.strokeStyle='#ffe0a0';c.lineWidth=.06;
      c.beginPath();c.arc(hx+.20,hy,.25+p.flash*.12,-1.08,1.08);c.stroke();
      for(let i=0;i<3;i++){const a=(i-1)*.55;oval(c,hx+.35+Math.cos(a)*.18,Math.sin(a)*.34,.045,.025,'#ffc46a',a);}
    }
    c.restore();
  }
  function attackProgress(remaining,after=0){
    if(after>0)return clamp(1-after/ATTACK_DURATION,CONTACT,1);
    const before=ATTACK_DURATION*CONTACT;
    return remaining>=0 && remaining<=before ? CONTACT-remaining/ATTACK_DURATION : null;
  }
  root.Ugolek={draw,pose,attackProgress,ATTACK_DURATION,CONTACT};
})(typeof module==='object'?module.exports:window);
