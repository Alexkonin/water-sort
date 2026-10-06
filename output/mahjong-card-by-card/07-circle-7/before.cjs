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
    if(n>=2&&n<=6){
      // Individually reviewed rosettes with pointed inner petals and a solid coloured rim.
      const petal='M0-.18C-.16-.30-.39-.38-.36-.60Q-.29-.81 0-.79Q.29-.81.36-.60C.39-.38.16-.30 0-.18Z';
      const rosettes=n===2?[[24,20,GREEN],[24,48,BLACK]]:n===3?[[12,15,BLACK],[24,34,RED],[36,53,GREEN]]:n===4?[[13,20,GREEN],[35,20,BLACK],[13,48,BLACK],[35,48,GREEN]]:n===5?[[15,18,GREEN],[33,18,BLACK],[24,34,RED],[15,50,BLACK],[33,50,GREEN]]:[[15,15,GREEN],[33,15,GREEN],[15,39,RED],[33,39,RED],[15,55,RED],[33,55,RED]];
      return rosettes.map(([x,y,color])=>`<g transform="translate(${x} ${y}) scale(${n===2?10:n===3?8.5:n===6?7.2:8})">`
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
  function bird(){
    // Compact upright feather mass from the reference; the neck stays outside it.
    let art='';
    for(let i=0;i<8;i++){
      const x=17+i*2.25,y=7+Math.abs(i-3)*.9;
      art+=path(`M${x} ${y}Q${x+4} 24 34 43`,GREEN,1.15);
      for(let j=0;j<6;j++){
        const t=j/7,px=x+(34-x)*t,py=y+(43-y)*t;
        art+=path(`M${px-2.1} ${py-2.8}l2.5 3.8 2.2-3.3`,j%3===0?BLACK:GREEN,1.05);
      }
    }
    art+=path('M34 43q5-4 7-2m-9-2q5-5 7-4m-9-1q6-6 8-5',GREEN,1.25);
    art+=path('M11 27q4-4 7 1q1 3-1 8q-2 5 3 8q7 4 15 0l5 3-8 3q-7 6-16 1q-8-4-5-12l3-8-3-4Z',RED,1.8,PAPER);
    art+=path('M12 28l-6 2 6 1m2-6-1-5m3 6 2-5M19 43q2-6 6-4q6 2 8 6q-6 4-12 1',RED,1.35);
    art+=circle(14.5,28.5,.85,BLACK)+path('M21 41l2 2m3-2 2 3m-8 1 2 2m4-1 2 1M32 48l8 1m-9 2 7 1',RED,1.15);
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
      return segments.map(([ax,ay,bx,by,color])=>stick((ax+bx)/2,(ay+by)/2,color,
        Math.hypot(bx-ax,by-ay)+5.6,-Math.atan2(bx-ax,by-ay)*180/Math.PI)).join('');
    }
    const layouts={
      2:[[24,19,GREEN],[24,49,BLACK]],
      3:[[24,17,GREEN],[13,48,GREEN],[35,48,BLACK]],
      4:[[14,18,GREEN],[34,18,BLACK],[14,49,GREEN],[34,49,BLACK]],
      5:[[12,17,GREEN],[36,17,BLACK],[24,34,RED],[12,51,GREEN],[36,51,BLACK]],
      6:[[12,18,GREEN],[24,18,GREEN],[36,18,GREEN],[12,49,BLACK],[24,49,BLACK],[36,49,BLACK]],
      7:[[24,12,RED],[12,33,GREEN],[24,33,GREEN],[36,33,GREEN],[12,55,BLACK],[24,55,BLACK],[36,55,BLACK]],
      9:[...Array.from({length:3},(_,i)=>[[12,13+i*21,GREEN],[24,13+i*21,RED],[36,13+i*21,BLACK]]).flat()]
    };
    return layouts[n].map(([x,y,c])=>stick(x,y,c,n>=7?13:18)).join('');
  }
  function blossom(x,y,r=4,color=RED){
    return Array.from({length:5},(_,i)=>`<ellipse cx="${x}" cy="${y-r*.65}" rx="${r*.46}" ry="${r*.65}" fill="none" stroke="${color}" stroke-width="1" transform="rotate(${i*72} ${x} ${y})"/>`).join('')+circle(x,y,1.2,color);
  }
  // Eight independent silhouettes. Flowers and seasons deliberately share no plant drawing.
  function plant(n){
    const ink=GREEN;
    const leaf=d=>path(d,ink,1,n===2?'none':ink);
    switch(n){
      case 0: // Plum: angular low branch, one dominant bloom, upward right twig.
        return path('M6 59l9-4 8 3 9-1 10 4M11 55l-3-7 8 2 5 5m7 2 3-11-2-5 6-7 2-7M32 47l8-6m-7-3 7-5M9 61l8-3 9 3 9-2 7 3',BLACK,1.45)
          +leaf('M34 39q-1-9 4-10q1 7-4 10Z')+leaf('M33 49q8-9 10-6q-1 6-10 6Z')
          +blossom(22,48,7)+circle(22,48,2,'none',RED,1.2)+path('M20 47l4 2m-3-4 1 6',RED,.8);
      case 1: // Orchid: sweeping narrow leaves, no invented red flowers.
        return path('M29 62Q20 45 25 27M28 61Q27 38 33 25M29 60Q35 40 41 36M27 59Q18 34 12 36Q18 40 23 53M28 58Q11 43 6 47Q17 44 25 58M27 60Q14 48 7 53M30 60Q36 44 40 48Q40 53 36 57M27 61Q22 43 18 29',ink,1.45)
          +path('M28 61Q29 39 33 31M26 59Q15 40 9 40M31 60Q38 50 42 54',BLACK,.85);
      case 2: // Chrysanthemum: central red head nestled inside compact jagged foliage.
        return path('M24 61l1-16m-2 13-11-7m13 4 11-8',ink,1.3)
          +leaf('M20 56l-8-1 2-3-6-3 5-1-3-5 6 2-1-5 5 4 1 5Z')
          +leaf('M28 55l10-2-2-3 5-4-5 1 2-6-5 3-1-5-4 7Z')
          +leaf('M19 41l-7-4 4-1-1-5 5 3 1-5 3 6Z')
          +leaf('M28 40l4-8 1 4 6-2-3 5 5 1-8 3Z')
          +Array.from({length:10},(_,i)=>`<ellipse cx="25" cy="41" rx="1.5" ry="4" fill="none" stroke="${RED}" stroke-width="1.05" transform="rotate(${i*36} 25 46)"/>`).join('')+circle(25,46,2.1,RED);
      case 3: // Bamboo flower tile: clustered shoots and narrow downward leaves.
        return path('M8 61q16 2 32-1M13 60l-3-21m9 22-1-30m6 30 2-32m3 32 5-24m-13 21 1-19',ink,1.4)
          +[['M10 38q-7 1-5 11q5-3 5-11Z'],['M11 40q7-3 5 9q-4-1-5-9Z'],['M18 31q-6 1-6 12q6-3 6-12Z'],['M19 32q6-1 4 12q-4-4-4-12Z'],['M27 29q-5 0-4 12q5-3 4-12Z'],['M29 32q7 2 4 12q-5-4-4-12Z'],['M34 37q8 1 6 12q-5-3-6-12Z']].map(([d])=>path(d,ink,1.25)).join('')
          +path('M9 59l5-10 2 11m3 0 3-13 2 13m5 0 6-9-2 10',ink,1.1);
      case 4: // Spring: red horizontal blossom cluster below a curled green branch.
        return path('M9 31q-3 7 3 10q8 1 9 7m-9-8q5-5 8 0m-1 4q8-8 11-2q2 5 10 5M8 60q8-7 16-2q8 3 17-1',ink,1.2)
          +leaf('M14 39q-6-5-6-10q6 2 6 10Z')+leaf('M25 43q3-9 7-7q0 6-7 7Z')
          +path('M11 51q3-6 8-2q5-6 9-1q6-3 9 2q-2 5-8 4q-5 5-10 1q-5 2-8-4Z',RED,1.35)
          +path('M16 50q-3 4 3 3m5-4q-4 3 1 5m6-5q4 2 1 4M17 56l-6 3 8 2 5-3m4-2 5 3 8-1',RED,1.05);
      case 5: // Summer: diagonal red elongated motif, separated green sprigs above/below.
        return path('M8 34q6 7 13 8l14 4M10 62q12-8 28-2',ink,1.35)
          +leaf('M15 40q-7 0-9-6q7 0 9 6Z')+leaf('M22 43q-3-10 1-11q3 6-1 11Z')
          +leaf('M30 45q0-8 4-9q2 6-4 9Z')+leaf('M18 58q-1-8 3-9q2 7-3 9Z')
          +path('M15 56Q22 44 38 45Q34 52 20 58Z',RED,1.5)
          +path('M20 53l3 1m1-4 3 1m1-4 3 1m1-3 2 1M13 57l-3 3m14-3 1 4',RED,1.1);
      case 6: // Autumn: looping stem around a small low red flower.
        return path('M13 29q-4 8 2 11q8 3 11-4q2-5-3-5q-5 0-3 5q5 1 11 8q8 12 1 17q-6 3-10-2M8 54q8-11 15-6m8 10q-4-7-1-12',ink,1.35)
          +leaf('M13 42q-9-2-7-7q6 0 7 7Z')+leaf('M33 45q9 2 8 8q-7 0-8-8Z')
          +path('M15 54q-1-6 4-6q2-5 6-2q5-2 7 3l-3 6-4-3-3 5-4-3Z',RED,1.25)
          +path('M20 51q3-4 6-1m-3 0-1 4M9 59q7-3 12 0',RED,1.1);
      case 7: // Winter: low red spray with dark green basal strokes, ample space above.
        return path('M9 30q10 3 14 12m-2-2q8-8 14-3M8 61q14-3 31 1',ink,1.3)
          +leaf('M18 40q-9-1-10-8q7 0 10 8Z')+leaf('M24 41q0-9 5-10q2 6-5 10Z')
          +path('M9 48q7-3 13 1q7-4 17-1M9 52q7 3 14-1q5 5 15 2M13 57l8-5 4 5 8-1M24 47l-2 8',RED,1.55)
          +path('M11 62l3-6m4 6 1-5m7 6 1-4m6 3 2-5',ink,1.15);
      default:throw Error('Invalid botanical motif');
    }
  }
  function bonus(type){
    const flower=type<38,n=flower?type-34:type-38;
    // Small 1–4 indices belong to the original bonus tiles, not to the numbered suits.
    return glyph((flower?['梅','蘭','菊','竹']:['春','夏','秋','冬'])[n],flower?15:34,21,18,flower?BLACK:RED)+glyph(String(n+1),flower?37:10,19,15,flower?RED:BLACK)+plant(type-34);
  }
  function whiteDragon(){
    // Solid dark frame with ivory key fretwork, a broad unmarked centre and square corners.
    let art=`<path d="M9 8H39V60H9ZM16 16V52H32V16Z" fill="${BLACK}" fill-rule="evenodd"/>`;
    art+=`<path d="M10.5 9.5H37.5V58.5H10.5ZM14.5 14.5H33.5V53.5H14.5Z" fill="none" stroke="${PAPER}" stroke-width=".7"/>`;
    const top='M11.5 12H20V10.5H22V14.5M36.5 12H28V10.5H26V14.5';
    art+=path(top,PAPER,.8)+`<g transform="rotate(180 24 34)">${path(top,PAPER,.8)}</g>`;
    const side='M12.5 15V27H10.5M12.5 17H14.5V29H10.5M10.5 32H14.5M12.5 34V46H10.5M12.5 36H14.5V48H10.5M10.5 51H14.5';
    art+=path(side,PAPER,.75)+`<g transform="rotate(180 24 34)">${path(side,PAPER,.75)}</g>`;
    return art;
  }
  function face(type){
    if(!Number.isInteger(type)||type<0||type>=42)throw Error('Invalid Mahjong face');
    const dot=type<6?type+1:type>=18&&type<=20?type-11:0;
    const bam=type>=6&&type<12?type-5:type>=21&&type<=23?type-14:0;
    let art;
    if(dot)art=dots(dot);
    else if(bam)art=bamboo(bam);
    else if(type>=24&&type<=32)art=glyph(['一','二','三','四','伍','六','七','八','九'][type-24],24,28,28,BLACK)+glyph('萬',24,58,28,RED);
    else if(type===33)art=whiteDragon();
    else if(type>=34)art=bonus(type);
    else art=glyph(['東','南','西','北','中','發'][type-12],24,49,40,type===16?RED:type===17?GREEN:BLACK);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 68" aria-hidden="true" focusable="false">${art}</svg>`;
  }
  const api={face};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MahjongArt=api;
})(globalThis);
