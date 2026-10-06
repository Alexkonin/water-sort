/* Traditional Chinese faces, redrawn as SVG from the Yellow Mountain Imports
 * Rouge Prestige reference selected by the user (FX-CM002-A, gallery image 7).
 * Original vector drawing, not a photographic crop. Tile IDs match mahjong.js v1/v2.
 */
(function(root){
  'use strict';
  const BLACK='#18242a',GREEN='#245438',RED='#b12e38',PAPER='#fff9e9';
  const circle=(x,y,r,fill,stroke='',width=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}"`:''}/>`;
  const path=(d,color,width=1.5,fill='none')=>`<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const GLYPHS=typeof module!=='undefined'&&module.exports?require('./mahjong-glyphs.js'):root.MahjongGlyphs;
  // Keep the font's em and advance: short strokes (一) must not be stretched to a full square.
  const glyph=(char,x,y,size,color)=>{
    const {d,advance}=GLYPHS[char],scale=size/1000;
    return `<path d="${d}" fill="${color}" transform="translate(${x-advance*scale/2} ${y}) scale(${scale} ${-scale})"/>`;
  };
  const inkGlyph=(char,x,y,size,color,weight=16)=>glyph(char,x,y,size,color)
    .replace(' fill=',` stroke="${color}" stroke-width="${weight}" stroke-linejoin="round" paint-order="stroke fill" fill=`);
  // Taper the crown of 萬 while preserving its broad lower enclosure.
  const wanOutline=GLYPHS['萬'].d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,(_,xs,ys)=>{
    const x=Number(xs),y=Number(ys),t=Math.max(0,Math.min(1,(y-350)/300));
    return `${(500+(x-500)*(1-.3*t)).toFixed(2)} ${ys}`;
  });
  function characterFace(n){
    const rank=n===1?path('M11 19Q19 19.8 28 17.7Q33 16.6 37 18L36 21Q29 20.4 19 22L12 22Z',BLACK,0,BLACK)
      :n===2?path('M15 11Q24 12 31 9.8L33 12.4Q24 14.4 15 13.5Z M10 22Q23 22.8 35 19.5L38 22.3Q24 25.4 11 25Z',BLACK,0,BLACK)
      :n===3?path('M14 7.8Q24 8.6 32 6.6L34 9Q23 11 15 10.5Z M17 15.5Q25 16 30 14.2L32 16.5Q24 18.4 17 18Z M10 24Q24 24.5 35 21.8L38 24.6Q24 27.1 11 27Z',BLACK,0,BLACK)
      :n===4?`<path d="M9 10Q22 9 35 6L33 23Q25 25 13 25ZM13 12L16 22L30 20L31 10Z" fill="${BLACK}" fill-rule="evenodd"/>`
        +path('M20 11Q22 17 17 21M26 10Q24 17 26 19L30 18',BLACK,2.4)
      :n===5?`<g transform="translate(0 3.2) scale(1 .82)">${inkGlyph('伍',24,28,28,BLACK,24)}${path('M18.5 28.8Q28 28.2 36.5 28.3M16.2 16V29',BLACK,.9)}</g>`
      :n===6?path('M21 4Q27 4 28 9Q25 11 21 4Z M11 13Q24 13.5 35 11L37 14Q24 16 12 16Z M20 17.5Q23 20 20 23L12 29Q16 23 18 18Z M28 18Q33 20 36 26L34 29Q30 23 26 20Z',BLACK,0,BLACK)
      :n===7?path('M10 14Q24 13 35 9L37 12Q24 17 11 17Z M19 5L23 5L22 22Q23 25 31 24L33 23L34 18L35 18L36 25Q32 29 23 28Q18 27 18.5 22Z',BLACK,0,BLACK)
      :n===8?path('M18 12L21 13Q19 23 11 28L9 28Q16 20 18 12Z M24 6L27 7Q29 18 37 24L40 26L35 28Q28 24 26 17Z',BLACK,0,BLACK)
      :n===9?inkGlyph('九',24,28,28,BLACK,16)+path('M28.8 26.8Q27.8 29.8 32.5 29.8Q36.1 29.8 36.6 27.6',BLACK,1.15)
      :inkGlyph(['一','二','三','四','伍','六','七','八','九'][n-1],24,28,28,BLACK,16);
    return rank+inkGlyph('萬',24,58,28,RED,18).replace(GLYPHS['萬'].d,wanOutline);
  }
  function eastWind(){
    return path('M20 8Q27 10 28 15L24 17Q22 12 20 8Z M17 18Q25 19 32 17L33 20Q24 22 17 21Z',BLACK,0,BLACK)
      +`<path d="M13 25Q23 25 34 22Q38 26 36 32L33 38Q23 40 15 39L12 34ZM16 28L17 36L31 34L33 27Q25 27 16 28Z" fill="${BLACK}" fill-rule="evenodd"/>`
      +path('M15 32L34 30',BLACK,2.6)
      +path('M24 20L28 20L26 54Q25 59 19 55L15 52L22 53Z M24 37Q18 46 5 53L9 54Q20 47 25 41Z M26 38Q33 46 43 48L41 53Q30 49 24 40Z',BLACK,0,BLACK);
  }
  function southWind(){
    return path('M24 8Q30 11 27 17L25 29L22 29L24 15Z M14 21Q23 21 33 18L34 21Q23 25 15 25Z M9 30Q20 29 37 26L40 30L36 56Q31 56 28 50L32 52L35 31L14 34L17 51L13 54Q10 42 9 30Z M18 34L22 35L23 38L20 39Z M29 33L31 34L27 39L25 39Z M18 41Q25 40 31 39L32 42L18 44Z M18 47Q25 46 31 45.5L31 48L18 49Z M23 37L27 38L26 51L23 53Z',BLACK,0,BLACK);
  }
  function westWind(){
    return path('M11 15Q24 15 33 12L36 16Q22 20 12 19Z M25 18L29 20L27 38L23 40Z M16 23Q20 24 21 29Q19 38 14 42L13 39Q17 33 16 23Z',BLACK,0,BLACK)
      +`<path d="M7 31Q24 30 37 26L40 31L34 50L30 51L29 48Q20 49 11 51Q7 43 7 31ZM12 35L15 46L30 43L34 33Z" fill="${BLACK}" fill-rule="evenodd"/>`;
  }
  const northOutline=GLYPHS['北'].d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,(_,xs,ys)=>{
    const x=Number(xs),y=Number(ys);
    return `${xs} ${x<500?(400+(y-400)*.73).toFixed(2):ys}`;
  });
  function redDragon(){
    return `<path d="M9 24L34 20L37 24L33 39L14 41ZM14 27L17 37L30 34L32 25Z" fill="${RED}" fill-rule="evenodd"/>`
      +path('M20 8Q26 10 26 17L24.5 57Q24.4 59 22.5 59Q21 59 21 57L21 24Z',RED,0,RED);
  }
  const greenOutline=GLYPHS['發'].d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,(_,xs,ys)=>{
    const x=Number(xs),y=Number(ys),t=Math.max(0,Math.min(1,(y-550)/200));
    const shoulder=Math.max(0,1-Math.abs(y-425)/150)*Math.max(0,(x-700)/250);
    return `${(500+(x-500)*(1-.12*t)+80*shoulder).toFixed(2)} ${(y-40*shoulder).toFixed(2)}`;
  });
  function greenDragon(){
    return `<g transform="translate(24 34) scale(.9 1.1) translate(-24 -34)">`
      +inkGlyph('發',24,49,40,GREEN,18).replace(GLYPHS['發'].d,greenOutline)+'</g>';
  }
  function coin(x,y,color,r=5.6){
    // Four tapered ivory petals leave a compact cross between the engraved lobes.
    const petal='M-.13-.20C-.29-.31-.42-.48-.36-.62Q0-.86.36-.62C.42-.48.29-.31.13-.20Q0-.13-.13-.20Z';
    return `<g transform="translate(${x} ${y}) scale(${r})">`
      +circle(0,0,1,color)
      +[0,90,180,270].map(a=>`<path d="${petal}" fill="${PAPER}" transform="rotate(${a+45}) scale(.88)"/>`).join('')+'</g>';
  }
  function dots(n){
    if(n===1){
      // Ten broad U-shaped loops and a six-petal flower with an ivory centre, per user feedback.
      const petals=Array.from({length:10},(_,i)=>`<path d="M22.1 24.55C21.85 23.4 20.65 21.75 21.15 20.5C21.85 18.65 25.95 18.65 26.7 20.35C27.3 21.65 25.8 23.3 25.9 24.55" fill="none" stroke="${PAPER}" stroke-width="1.25" stroke-linecap="round" transform="rotate(${i*36} 24 34)"/>`).join('');
      const heart=Array.from({length:6},(_,i)=>`<path d="M24 32.3C23.6 31.7 22.5 30.8 22.55 29.8C22.6 28.65 23.35 28.3 24 28.7C24.65 28.3 25.4 28.65 25.45 29.8C25.5 30.8 24.4 31.7 24 32.3Z" fill="${PAPER}" transform="rotate(${i*60} 24 34)"/>`).join('');
      return circle(24,34,18,GREEN)+circle(24,34,16.6,'none',PAPER,.85)+petals
        +circle(24,34,8.65,'none',PAPER,1.05)+circle(24,34,7.25,RED,PAPER,.65)+heart+circle(24,34,.85,PAPER);
    }
    if(n>=2&&n<=9){
      // Individually reviewed rosettes with pointed inner petals and a solid coloured rim.
      const petal='M0-.18C-.16-.30-.39-.38-.36-.60Q-.29-.81 0-.79Q.29-.81.36-.60C.39-.38.16-.30 0-.18Z';
      const rosettes=n===2?[[24,20,GREEN],[24,48,BLACK]]:n===3?[[12,15,BLACK],[24,34,RED],[36,53,GREEN]]:n===4?[[13,20,GREEN],[35,20,BLACK],[13,48,BLACK],[35,48,GREEN]]:n===5?[[15,18,GREEN],[33,18,BLACK],[24,34,RED],[15,50,BLACK],[33,50,GREEN]]:n===6?[[15,15,GREEN],[33,15,GREEN],[15,39,RED],[33,39,RED],[15,55,RED],[33,55,RED]]:n===7?[[12,11,GREEN],[24,20,GREEN],[36,29,GREEN],[15,44,RED],[33,44,RED],[15,58,RED],[33,58,RED]]:n===8?Array.from({length:4},(_,i)=>[[15,12+i*14.5,BLACK],[33,12+i*14.5,BLACK]]).flat():Array.from({length:3},(_,i)=>[[10.5,16+i*18,[GREEN,RED,BLACK][i]],[24,16+i*18,[GREEN,RED,BLACK][i]],[37.5,16+i*18,[GREEN,RED,BLACK][i]]]).flat();
      return rosettes.map(([x,y,color])=>`<g transform="translate(${x} ${y}) scale(${n===2?10:n===3?8.5:n===6?7.2:n===7?6.3:n===8?6.5:n===9?5.8:8})">`
        +circle(0,0,1,color)+[45,135,225,315].map(angle=>`<path d="${petal}" fill="${PAPER}" transform="rotate(${angle}) scale(.88)"/>`).join('')+'</g>').join('');
    }
    const layouts={
      2:[[24,20,GREEN],[24,48,BLACK]],
      3:[[12,15,BLACK],[24,34,RED],[36,53,GREEN]],
      4:[[13,20,GREEN],[35,20,BLACK],[13,48,BLACK],[35,48,GREEN]],
      5:[[13,15,GREEN],[35,15,BLACK],[24,34,RED],[13,53,BLACK],[35,53,GREEN]],
      6:[[14,14,GREEN],[34,14,GREEN],[14,39,RED],[34,39,RED],[14,55,RED],[34,55,RED]],
      7:[[11,11,GREEN],[24,19,GREEN],[37,27,GREEN],[14,43,RED],[34,43,RED],[14,57,RED],[34,57,RED]],
      8:[...Array.from({length:4},(_,i)=>[[14,11+i*15,BLACK],[34,11+i*15,BLACK]]).flat()],
      9:[...Array.from({length:3},(_,i)=>[[11,14+i*20,[GREEN,RED,BLACK][i]],[24,14+i*20,[GREEN,RED,BLACK][i]],[37,14+i*20,[GREEN,RED,BLACK][i]]]).flat()]
    };
    return layouts[n].map(([x,y,color])=>coin(x,y,color,n<=3?7:n>=7?5.1:5.8)).join('');
  }
  function stick(x,y,color,length=18,angle=0){
    // Overlapping hollow links reproduce the scalloped outline of the engraved bamboo.
    const count=length>=23?5:length>=17?4:3,radius=2.8,step=(length-2*radius)/(count-1);
    const centers=Array.from({length:count},(_,i)=>y-length/2+radius+i*step);
    return `<g transform="rotate(${angle} ${x} ${y})">`
      +centers.map(cy=>circle(x,cy,radius,color)).join('')
      +centers.map(cy=>`<ellipse cx="${x}" cy="${cy}" rx="1.15" ry="1.3" fill="${PAPER}"/>`).join('')+'</g>';
  }
  function reviewedStick(x,y,color,length=20,angle=0,nodeCount=0,bridgeWidth=2.1){
    const count=nodeCount||(length>=26?5:length>=17?4:3),radius=3,step=(length-2*radius)/(count-1);
    const centers=Array.from({length:count},(_,i)=>y-length/2+radius+i*step);
    return `<g transform="rotate(${angle} ${x} ${y})">`
      +path(`M${x} ${centers[0]}V${centers[count-1]}`,color,bridgeWidth)
      +centers.map(cy=>circle(x,cy,radius,color)).join('')
      +centers.map(cy=>`<ellipse cx="${x}" cy="${cy}" rx="1.2" ry="1.4" fill="${PAPER}"/>`).join('')+'</g>';
  }
  function bird(){
    // Compact upright feather mass from the reference; the neck stays outside it.
    let art='';
    for(let i=0;i<8;i++){
      const x=16+i*2.2,y=8+Math.pow((i-3.5)/3.5,2)*4,endX=29+i*1.25;
      const endY=[0,2,4,7].includes(i)?43:31;
      const tipX=x+(endX-x)*(endY-y)/(43-y);
      art+=path(`M${x} ${y}Q${x+3} 25 ${tipX} ${endY}`,GREEN,.85);
      for(let j=1;j<=4;j++){
        if(j===4&&i%2===1)continue;
        const t=j/7,px=x+(endX-x)*t,py=y+(43-y)*t,span=1.8-t*.6;
        art+=path(`M${px-span} ${py-1.8}l${span} 2.5 ${span}-2.5`,j%3===0?BLACK:GREEN,.85);
      }
    }
    art+=path('M34 43q5-4 7-2m-9-2q5-5 7-4m-9-1q6-6 8-5',GREEN,1.25);
    art+=path('M11 27q4-4 7 1q1 3-1 8q-2 5 3 8q7 4 15 0l5 3-8 3q-7 6-16 1q-8-4-5-12l3-8-3-4Z',RED,1.8,PAPER);
    art+=path('M12 28l-6 2 6 1m2-6-1-5m3 6 2-5M19 43q2-6 6-4q6 2 8 6q-6 4-12 1',RED,1.35);
    art+=circle(14.5,28.5,.85,BLACK)+path('M20 42q2-3 4 0q2-3 4 1m-8 1q2-2 4 1q2-2 4 1m-9 0q3 3 7 2M32 48l8 1m-9 2 7 1',RED,1.15);
    art+=path('M19 53l-1 5-6 2m6-2 4 3m4-8-2 5-3 3m3-3 5 2m-5-2 5-2',BLACK,1.5);
    return art;
  }
  function bamboo(n){
    if(n===1)return bird();
    if(n===8){
      // Eight linked stems surround one diamond-shaped opening, as in the reference.
      const segments=[
        [10,14,10,34,GREEN],[10,34,24,20,GREEN],[24,20,38,34,GREEN],[38,34,38,14,GREEN],
        [10,34,10,54,BLACK],[10,34,24,48,BLACK],[24,48,38,34,BLACK],[38,34,38,54,BLACK]
      ];
      return segments.map(([ax,ay,bx,by,color])=>reviewedStick((ax+bx)/2,(ay+by)/2,color,
        Math.hypot(bx-ax,by-ay)+5.6,-Math.atan2(bx-ax,by-ay)*180/Math.PI,3,3.8)).join('');
    }
    const layouts={
      2:[[24,19,GREEN],[24,49,BLACK]],
      3:[[24,17,GREEN],[13,48,GREEN],[35,48,BLACK]],
      4:[[14,18,GREEN],[34,18,BLACK],[14,49,GREEN],[34,49,BLACK]],
      5:[[12,17,GREEN],[36,17,BLACK],[24,34,RED],[12,51,GREEN],[36,51,BLACK]],
      6:[[12,18,GREEN],[24,18,GREEN],[36,18,GREEN],[12,49,BLACK],[24,49,BLACK],[36,49,BLACK]],
      7:[[24,12,RED],[12,33,GREEN],[24,33,BLACK],[36,33,GREEN],[12,55,GREEN],[24,55,BLACK],[36,55,GREEN]],
      9:[...Array.from({length:3},(_,i)=>[[12,13+i*21,GREEN],[24,13+i*21,RED],[36,13+i*21,BLACK]]).flat()]
    };
    return layouts[n].map(([x,y,c])=>reviewedStick(x,y,c,n>=7?18:n<=4?24:n<=6?22:18)).join('');
  }
  function blossom(x,y,r=4,color=RED){
    return Array.from({length:5},(_,i)=>`<ellipse cx="${x}" cy="${y-r*.65}" rx="${r*.46}" ry="${r*.65}" fill="none" stroke="${color}" stroke-width="1" transform="rotate(${i*72} ${x} ${y})"/>`).join('')+circle(x,y,1.2,color);
  }
  // Eight independent silhouettes. Flowers and seasons deliberately share no plant drawing.
  function plant(n){
    const ink=GREEN;
    const leaf=d=>path(d,ink,1,n===2?'none':ink);
    switch(n){
      case 0: // Plum engraving: woody branch, an open flower and a turned bloom.
        return `<path d="M7 63L16 56L22 49L25 43L28 39L31 32L36 27L33 32L30 40L27 44L25 50L18 58L9 64Z" fill="${GREEN}"/>`
          +path('M23 50L20 44L14 39M27 45L33 46L37 42M29 38L25 33L24 28',GREEN,1.05)
          +`<path d="M15 40C10 40 7 37 10 34C12 32 15 34 16 36C16 31 20 30 22 33C24 35 21 38 19 39C23 38 27 41 24 44C22 46 19 43 18 42C22 47 18 51 14 48C11 47 12 44 14 42C10 48 5 45 7 42C8 40 12 40 15 40Z" fill="${PAPER}" stroke="${RED}" stroke-width=".95"/>`
          +path('M13 37l2 2M20 36l-2 3M16 45l.5-2',RED,.5)
          +circle(16.8,40.5,.8,RED)
          +`<path d="M29 33C26 30 27 26 30 27C33 25 36 27 35 30C39 29 40 32 36 35C33 38 28 37 27 34Z" fill="${PAPER}" stroke="${RED}" stroke-width=".9"/>`
          +path('M28 33Q31 30 32 34Q32 36 33 36M35 29Q33 31 32 34M37 32l-3 2',RED,.55)
          +path('M31 35l2 2 2-1',GREEN,.65)
          +`<path d="M36 42C34 39 37 36 39 37C42 39 40 42 38 43Z" fill="${RED}"/>`
          +path('M35.5 41l2 2.5 2-1.5',GREEN,1);
      case 1: // Orchid: arching strap leaves, two turned flowers on a fine stem.
        return path('M22 62Q20 45 29 32M24 46l6-3',GREEN,1.15)
          +path('M21 62Q10 47 7 36Q17 43 21 62Z M22 62Q15 37 22 28Q18 45 22 62Z M23 62Q27 42 39 39Q29 46 23 62Z M24 62Q34 50 41 53Q31 53 24 62Z',GREEN,.6,GREEN)
          +`<path d="M29 33Q25 29 27 26Q30 25 31 30Q32 26 34 27Q36 30 33 32Q39 28 41 32Q42 37 34 35Q37 41 32 42Q27 42 29 35Q23 38 22 34Q22 30 29 33Z" fill="${PAPER}" stroke="${RED}" stroke-width=".9"/>`
          +path('M30 34Q33 32 34 36Q35 39 31 39Q28 38 30 34Z',RED,.6,RED)
          +`<path d="M30 44Q25 42 27 39Q30 38 32 42Q35 38 37 41Q38 44 33 45Q34 49 31 49Q28 48 30 44Z" fill="${PAPER}" stroke="${RED}" stroke-width=".85"/>`
          +path('M31 44l1 2',RED,.75);
      case 2: // Chrysanthemum: dense irregular petals, a simple stem and lobed leaves.
        return path('M21 63Q24 53 28 44M24 55l-8-6M23 59l10-6',GREEN,1.4)
          +path('M18 51Q13 53 12 49Q7 49 9 46Q8 42 12 44Q11 39 16 43Q21 44 20 49Z M30 55Q31 49 35 51Q39 46 40 49Q42 52 38 53Q42 56 38 57Q36 60 33 56Z',GREEN,.7,GREEN)
          +`<path d="M18 34C12 32 17 26 23 30C20 23 28 24 29 29C32 23 38 28 34 32C41 28 43 36 37 37C44 40 39 45 34 42C36 48 29 49 28 43C24 50 17 46 21 41C13 45 12 38 18 36Z" fill="${PAPER}" stroke="${RED}" stroke-width=".9"/>`
          +path('M20 31Q24 29 27 34M31 29Q35 32 31 35M38 35Q36 38 32 37M33 43Q30 44 29 39M23 44Q21 41 26 39M18 37Q21 34 25 36',RED,.55)
          +path('M26 35Q30 33 32 36Q32 40 28 40Q24 39 26 35Z',RED,.7)
          +circle(28.5,37,1,RED);
      case 3: // Bamboo: two jointed culms and sparse tapered lanceolate leaves.
        return path('M16 63Q19 46 18 29L20 28Q22 45 18 64Z M28 63Q30 43 31 25L33 25Q33 46 30 64Z',GREEN,.35,GREEN)
          +path('M18 39h3M17 51h3M30 36h3M29 48h3M28 58h3',PAPER,.7)
          +path('M18 38l3 .4M17 50l3 .4M30 35l3 .4M29 47l3 .4',GREEN,.8)
          +path('M20 40Q13 36 8 34M31 36Q36 32 41 31M29 49Q24 44 21 43M18 53Q13 49 8 49',GREEN,.75)
          +path('M15 37Q7 37 5 29Q12 31 15 37Z M13 37Q7 39 5 45Q12 43 13 37Z M20 40Q24 32 23 28Q18 32 20 40Z M35 33Q35 25 40 23Q40 29 35 33Z M36 33Q43 33 44 39Q38 38 36 33Z M25 46Q22 39 17 37Q18 44 25 46Z M28 49Q33 44 38 44Q35 50 28 49Z M13 50Q7 45 4 47Q7 52 13 50Z M18 54Q24 51 25 46Q18 48 18 54Z',GREEN,.5,GREEN);
      case 4: // Spring: a young shoot with leaves at different stages of unfolding.
        return path('M13 63Q21 57 23 47Q26 39 25 33',GREEN,1.45)
          +path('M23 50Q17 44 11 41M25 43Q31 39 35 34M20 56l9-4',GREEN,.8)
          +path('M19 48C11 49 7 44 7 37C13 39 19 40 19 48Z',GREEN,.5,GREEN)
          +`<path d="M26 42C25 33 31 30 40 29C37 37 32 42 26 42Z" fill="${PAPER}" stroke="${GREEN}" stroke-width=".95"/>`
          +path('M28 39Q32 35 36 33',GREEN,.5)
          +path('M25 34C20 31 21 26 25 24C28 27 29 31 25 34Z',GREEN,.5,GREEN)
          +path('M26 53C28 48 33 47 36 48C34 53 30 55 26 53Z',GREEN,.45,GREEN);
      case 5: // Summer: a side-view lotus with overlapping petals and a tilted leaf.
        return path('M24 63Q18 54 26 45M22 59l-6-3',GREEN,1.25)
          +path('M20 57C19 51 13 47 8 50C3 53 6 60 15 61L20 60L16 57Z',GREEN,.6,GREEN)
          +path('M16 57Q11 55 9 53',PAPER,.45)
          +`<path d="M27 43C18 42 12 36 11 31C19 30 25 36 27 43Z" fill="${PAPER}" stroke="${RED}" stroke-width=".95"/>`
          +`<path d="M25 44C25 37 30 29 37 28C42 28 41 34 37 38C34 41 30 44 25 44Z" fill="${PAPER}" stroke="${RED}" stroke-width=".95"/>`
          +`<path d="M11 36C18 39 22 40 27 37Q28 36 29 38L34 35L40 33C40 40 34 45 26 46C19 46 14 42 11 36Z" fill="${PAPER}" stroke="${RED}" stroke-width=".95"/>`
          +path('M27 37Q29 40 26 42M17 39l3 2',RED,.55)
          +path('M23 46q4 2 7-1',GREEN,.7);
      case 6: // Autumn: a turned maple leaf with a long curved petiole.
        return path('M14 63Q21 59 24 50',GREEN,1.25)
          +path('M23 53Q19 50 15 51L16 48L9 47L11 44L7 40L15 41L12 35L14 36L12 29L19 34L20 32L23 38L24 31L26 32L29 25L30 34L33 32L32 40L38 36L37 40L42 40L37 46L39 47L31 50L32 52L26 51Z',RED,.5,RED)
          +path('M24 50Q26 42 28 32M25 46Q20 40 16 35M25 46Q32 45 36 42M24 48l-8-3',PAPER,.65);
      case 7: // Winter: a bare branching silhouette with two resting snow caps.
        return path('M6 62L17 56L24 51L30 41L36 38L43 37L42 39L35 41L32 43L26 53L18 59L8 64Z',GREEN,.25,GREEN)
          +path('M30 43L25 36L24 29M24 52L16 46L12 45M36 40l3 5',GREEN,1.05)
          +`<path d="M9 58Q9 54 13 55Q15 51 19 52Q21 49 24 50Q26 52 23 53L17 57L11 60Q9 60 9 58Z M32 38Q32 34 35 35Q37 32 39 34Q42 33 41 36L36 38L33 39Z" fill="${PAPER}" stroke="${GREEN}" stroke-width=".65"/>`;
      default:throw Error('Invalid botanical motif');
    }
  }
  function bonus(type){
    const flower=type<38,n=flower?type-34:type-38;
    // Bonus faces keep their calligraphic names; numeric indices are omitted.
    return (type<=41?inkGlyph:glyph)((flower?['梅','蘭','菊','竹']:['春','夏','秋','冬'])[n],flower?15:34,21,18,flower?BLACK:RED)+plant(type-34);
  }
  function whiteDragon(){
    // Solid dark frame with ivory key fretwork, a broad unmarked centre and square corners.
    let art=`<path d="M9 8H39V60H9ZM16 16V52H32V16Z" fill="${BLACK}" fill-rule="evenodd"/>`;
    art+=`<path d="M10.5 9.5H37.5V58.5H10.5ZM14.5 14.5H33.5V53.5H14.5Z" fill="none" stroke="${PAPER}" stroke-width=".95"/>`;
    const top='M11.5 12H20V10.5H22V14.5M36.5 12H28V10.5H26V14.5';
    art+=path(top,PAPER,1)+`<g transform="rotate(180 24 34)">${path(top,PAPER,1)}</g>`;
    const side='M12.5 15V27H10.5M12.5 17H14.5V29H10.5M10.5 32H14.5M12.5 34V46H10.5M12.5 36H14.5V48H10.5M10.5 51H14.5';
    art+=path(side,PAPER,.95)+`<g transform="rotate(180 24 34)">${path(side,PAPER,.95)}</g>`;
    return art;
  }
  function face(type){
    if(!Number.isInteger(type)||type<0||type>=42)throw Error('Invalid Mahjong face');
    const dot=type<6?type+1:type>=18&&type<=20?type-11:0;
    const bam=type>=6&&type<12?type-5:type>=21&&type<=23?type-14:0;
    let art;
    if(dot)art=dots(dot);
    else if(bam)art=bamboo(bam);
    else if(type>=24&&type<=32)art=characterFace(type-23);
    else if(type>=24&&type<=32)art=glyph(['一','二','三','四','伍','六','七','八','九'][type-24],24,28,28,BLACK)+glyph('萬',24,58,28,RED);
    else if(type===33)art=whiteDragon();
    else if(type>=34)art=bonus(type);
    else if(type===12)art=eastWind();
    else if(type===13)art=southWind();
    else if(type===14)art=westWind();
    else if(type===15)art=inkGlyph('北',24,49,40,BLACK,22).replace(GLYPHS['北'].d,northOutline);
    else if(type===16)art=redDragon();
    else if(type===17)art=greenDragon();
    else art=glyph(['東','南','西','北','中','發'][type-12],24,49,40,type===16?RED:type===17?GREEN:BLACK);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 68" aria-hidden="true" focusable="false">${art}</svg>`;
  }
  const api={face};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MahjongArt=api;
})(globalThis);
