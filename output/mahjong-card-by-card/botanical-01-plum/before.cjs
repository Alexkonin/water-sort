/* Traditional Chinese faces, redrawn as SVG from the Yellow Mountain Imports
 * Rouge Prestige reference selected by the user (FX-CM002-A, gallery image 7).
 * Original vector drawing, not a photographic crop. Tile IDs match mahjong.js v1/v2.
 */
(function(root){
  'use strict';
  const BLACK='#18242a',GREEN='#245438',RED='#b12e38',PAPER='#fff9e9';
  const circle=(x,y,r,fill,stroke='',width=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}"`:''}/>`;
  const path=(d,color,width=1.5,fill='none')=>`<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const GLYPHS=typeof module!=='undefined'&&module.exports?require('../../../mahjong-glyphs.js'):root.MahjongGlyphs;
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
      case 0: // Plum: irregular flower, branched ground line and a low right leaf loop.
        return path('M7 59Q16 53 24 58Q32 62 41 60M12 56l-5-5m9 4-4-7M26 58q6-7 14-4q-1 6-11 4M29 55l2-11-2-5 5-7 2-7M32 45l9-5m-8-3 7-6',GREEN,1.5)
          +path('M33 39l-1-6 6-5-2 8Z M32 48l7-6 3 2-8 6Z M11 49l-4-5m8 7-1-7',GREEN,1.15)
          +path('M17 46Q18 42 22 44Q26 41 29 45L28 50Q30 54 25 55Q21 57 18 53Q14 50 17 46Z',RED,1.3)
          +circle(23,49.5,2.5,'none',RED,1.15)+circle(23,49.5,.7,RED);
      case 1: // Orchid: mid-height crossing with stems continuing below the knot.
        return path('M20 63Q19 45 26 33Q31 24 28 21M17 60Q17 43 23 29M24 46Q36 35 38 26M24 47Q35 41 42 38M24 43Q13 34 7 40M23 47Q11 40 5 49M23 50Q12 45 7 51M25 46Q40 44 44 55M26 49Q36 48 39 52M25 47Q31 55 28 62L35 65M30 59Q33 52 39 55L30 61',GREEN,1.7)
          +path('M20 62Q21 43 26 34M9 42Q15 40 22 45M9 49Q15 47 22 50M27 52l7 3m-6 0 5 3',BLACK,.8);
      case 2: // Chrysanthemum: uneven foliage curls around a compact tilted flower.
        return path('M8 58Q16 51 24 55L37 63M23 55Q34 53 35 41L39 34L32 30M23 36Q30 30 38 34M29 34l-5-5-3-6m5 9 2-8m5 8 6-5M35 39l7-2-5 7 6-1-7 7M30 54l7 5-3 1 6 3M24 55l4 7m2-5 2 6',GREEN,1.6)
          +path('M15 50L6 47L10 42L17 41L14 45L18 48M23 54Q10 52 6 58L15 58L12 62',GREEN,1.5)
          +path('M18 42Q21 39 23 42Q27 39 29 43Q32 46 28 48Q30 52 26 54Q22 56 20 52Q15 53 16 49Q13 45 18 42Z M20 44l4-1 3 4-4 4-3-2Z M17 46l3 1m5-5-1 2m3 5 2 2m-9 1 1-3',RED,1.25);
      case 3: // Bamboo plant: three jointed shoots, pointed leaf clusters and a dense base.
        return path('M6 63Q22 59 41 62M14 60L12 35M25 61L23 29M31 61L35 39Q34 36 31 36M19 61L18 47M10 44h5m-3 8h5m4-13h5m-4 10h5m5-1h5m-6 9h5',GREEN,1.65)
          +path('M13 35Q7 33 4 45Q10 43 13 35Z M13 36Q20 37 17 46Q14 43 13 36Z M24 29Q16 25 18 41Q23 38 24 29Z M25 30Q30 33 28 43Q24 38 25 30Z M31 36Q29 25 35 24Q39 30 31 36Z M35 39Q44 41 43 51Q38 47 35 39Z M35 40Q29 43 30 53Q34 48 35 40Z M14 49Q7 48 5 58Q11 55 14 49Z M14 49Q21 51 17 61Q15 57 14 49Z',GREEN,1.4)
          +path('M21 61l1-9m6 9 2-10m-14 9-1-5m19 7 2-7',GREEN,1.35);
      case 4: // Spring: red horizontal blossom cluster below a curled green branch.
        return path('M10 28Q5 33 12 34Q22 30 21 42M21 42Q12 38 6 44Q12 49 22 44M24 44Q28 36 34 40Q40 42 41 49M30 41L32 34L35 40M21 39l-7-2M39 47Q34 44 35 51Q39 54 41 49',GREEN,1.65)
          +path('M23 45v9M23 49Q17 44 14 48Q15 53 23 50Q30 54 32 49Q29 45 23 49M5 59Q13 57 19 59Q24 54 29 57Q36 55 41 64M28 58Q32 63 35 58',RED,1.7)
          +circle(23,61,1.3,RED);
      case 5: // Summer: diagonal red elongated motif, separated green sprigs above/below.
        return path('M8 28Q18 34 17 41L40 44M17 39Q8 39 5 35Q12 31 17 39M13 34l-3-6m5 8 3-6M23 40l-2-7m5 9 1-8m3 9 3-6m1 8 4-4M6 63Q20 58 40 61M10 62L9 53Q7 47 4 48M10 55l-5-3m6 9 6-3m3 4 2-5m4 4 2-5m3 7 3-5m3 5 4 1',GREEN,1.8)
          +path('M12 57Q21 47 34 45Q40 44 38 48Q32 54 19 58Q12 61 12 57Z',RED,1.85)
          +path('M18 55Q17 51 23 50Q28 50 25 54Q22 57 18 55M27 51Q25 47 31 47Q36 47 33 50Q30 53 27 51',RED,1.35);
      case 6: // Autumn: looping stem around a small low red flower.
        return path('M17 25Q11 34 17 43Q25 38 24 36Q31 35 33 44Q42 46 40 54Q34 60 13 59M17 43Q10 38 4 45Q8 49 17 43M16 43Q6 47 8 51Q14 54 17 43M16 41Q11 37 13 30Q18 33 16 41M24 40Q23 34 30 36Q30 41 24 40M34 46Q35 41 39 44Q42 48 38 50M18 59Q18 62 23 62Q27 61 29 61M29 62Q33 65 40 65M20 59l-1-4m7 7 2-5m4 4 4-3',GREEN,1.75)
          +path('M17 54Q13 48 20 46Q23 41 27 45Q34 46 32 54Q29 57 25 51Q22 55 17 54Z',RED,1.75)
          +path('M18 51Q17 47 22 47M24 46Q24 50 21 53M27 46Q31 49 29 52',RED,1.35);
      case 7: // Winter: low red spray with dark green basal strokes, ample space above.
        return path('M6 39Q15 39 23 43Q31 39 38 40M23 43Q13 38 16 28Q24 32 23 43M22 43Q14 36 8 40Q11 45 22 43M24 44Q28 37 36 40Q33 45 24 44M4 60Q20 56 41 60M9 59l-3-4m7 4-2-5m8 5-3-6m8 7-1-6m3 8 3-5m0 4 6-4M7 64l11-4m5 4 2-4m6 3 6-3',GREEN,1.75)
          +path('M10 46Q18 45 23 48Q28 46 32 48L40 49Q35 53 28 52Q33 55 36 54M9 54Q15 52 21 54Q29 55 36 56M11 49Q18 48 21 52M10 52l7-1M23 48Q19 51 23 54Q27 55 27 50Q25 46 23 48M30 46v6',RED,1.8);
      default:throw Error('Invalid botanical motif');
    }
  }
  function bonus(type){
    const flower=type<38,n=flower?type-34:type-38;
    // Small 1–4 indices belong to the original bonus tiles, not to the numbered suits.
    return (type<=41?inkGlyph:glyph)((flower?['梅','蘭','菊','竹']:['春','夏','秋','冬'])[n],flower?15:34,21,18,flower?BLACK:RED)+glyph(String(n+1),flower?37:10,19,15,flower?RED:BLACK)+plant(type-34);
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
