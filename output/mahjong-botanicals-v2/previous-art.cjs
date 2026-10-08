/* Traditional Chinese faces, redrawn as SVG from the Yellow Mountain Imports
 * Rouge Prestige reference selected by the user (FX-CM002-A, gallery image 7).
 * Original vector drawing, not a photographic crop. Tile IDs match mahjong.js v1/v2.
 */
(function(root){
  'use strict';
  const BLACK='#18242a',GREEN='#245438',RED='#b12e38',PAPER='#fff9e9';
  const circle=(x,y,r,fill,stroke='',width=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}"`:''}/>`;
  const path=(d,color,width=1.5,fill='none')=>`<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const glyph=(char,x,y,size,color)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Kaiti SC,Kaiti TC,STKaiti,KaiTi,Songti SC,Noto Serif CJK SC,serif" font-size="${size}" font-weight="600" fill="${color}">${char}</text>`;
  function coin(x,y,color,r=5.6){
    // Four pale petals retain the engraved coin motif without fine concentric noise.
    return circle(x,y,r,color)+[0,90,180,270].map(a=>`<ellipse cx="${x}" cy="${y-r*.47}" rx="${r*.22}" ry="${r*.30}" fill="${PAPER}" transform="rotate(${a} ${x} ${y})"/>`).join('');
  }
  function dots(n){
    if(n===1){
      return circle(24,34,17,GREEN)+circle(24,34,14.5,'none',PAPER,1)+Array.from({length:12},(_,i)=>`<ellipse cx="24" cy="23" rx="1.6" ry="2.6" fill="${PAPER}" transform="rotate(${i*30} 24 34)"/>`).join('')+circle(24,34,8,RED,PAPER,1.4)+Array.from({length:6},(_,i)=>`<ellipse cx="24" cy="30" rx="1.25" ry="2" fill="${PAPER}" transform="rotate(${i*60} 24 34)"/>`).join('');
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
    const top=y-length/2;
    return `<g transform="rotate(${angle} ${x} ${y})">`+path(`M${x} ${top+1}v${length-2}`,color,4.5)+[top+1,y,top+length-1].map(cy=>circle(x,cy,2.4,color)+circle(x,cy,.8,PAPER)).join('')+'</g>';
  }
  function bird(){
    let art='';
    // A peacock: green/black fan, red neck and body, black feet.
    for(let i=0;i<9;i++){
      const x=10+i*3.3,y=10+Math.abs(i-4)*2.3;
      art+=path(`M25 43Q${x-4} 24 ${x} ${y}`,i%2?BLACK:GREEN,1.5)+circle(x,y,2.2,GREEN)+circle(x,y,.8,PAPER);
    }
    art+=path('M13 27Q7 28 10 34L14 40Q11 48 17 52Q28 58 36 46Q24 49 22 41L18 33Q20 27 17 25Q13 23 13 27Z',RED,1.8);
    art+=path('M10 29L5 30L10 32M15 24l-2-4m4 4 1-4',RED,1.2)+circle(14.5,28,1,BLACK);
    art+=path('M17 46q8 5 14-1m-10 8-2 7m5-7 2 6m-7 1-5 1m5-1 3 1m4-2 5 1',BLACK,1.4);
    art+=path('M19 38q0 6 5 7m-3-7q2 4 6 5',RED,1.2);
    return art;
  }
  function bamboo(n){
    if(n===1)return bird();
    if(n===8){
      // Two mirrored chevrons, the distinctive traditional eight-bamboo silhouette.
      return [[10,16,GREEN,0],[19,19,GREEN,40],[29,19,GREEN,-40],[38,16,GREEN,0],[10,51,BLACK,0],[19,48,BLACK,-40],[29,48,BLACK,40],[38,51,BLACK,0]].map(([x,y,c,a])=>stick(x,y,c,18,a)).join('');
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
  function plant(n){
    if(n===0)return path('M10 58Q24 49 30 28M21 47l-10-8m15-2 11-4M9 61q15-4 31-2',GREEN,1.6)+blossom(12,39)+blossom(30,29)+blossom(30,48)+path('M18 52q-5-8-9-6q2 7 9 6M28 42q8-4 10-1q-3 5-10 1',GREEN,1,GREEN);
    if(n===1)return path('M25 60Q10 28 10 43Q13 55 25 60M25 60Q32 29 37 39Q33 52 25 60M25 60Q21 23 18 36M25 60Q38 47 40 50M24 59Q16 47 8 49',GREEN,1.6)+blossom(20,35,4.3)+blossom(33,42,3.5);
    if(n===2)return path('M22 61Q22 46 28 34M24 50l-10-7M23 54l12-8',GREEN,1.5)+Array.from({length:12},(_,i)=>`<ellipse cx="28" cy="29" rx="1.6" ry="5" fill="none" stroke="${RED}" stroke-width="1" transform="rotate(${i*30} 28 34)"/>`).join('')+circle(28,34,2,RED)+path('M22 51q-12 0-11-9q8 0 11 9M24 54q10 0 12-9q-9 0-12 9',GREEN,1,GREEN);
    return path('M19 61V31m10 30V27m-13 14h6m-6 11h6m4-16h6m-6 13h6',GREEN,1.7)+path('M19 38Q7 26 9 37q3 5 10 1M29 33q6-12 10-9q0 8-10 9M29 44q12-9 11-1q-5 5-11 1M19 51q-10-9-12-4q2 7 12 4',GREEN,1,GREEN);
  }
  function bonus(type){
    const flower=type<38,n=flower?type-34:type-38;
    // Small 1–4 indices belong to the original bonus tiles, not to the numbered suits.
    return glyph((flower?['梅','蘭','菊','竹']:['春','夏','秋','冬'])[n],flower?15:34,21,18,flower?BLACK:RED)+`<text x="${flower?37:10}" y="19" text-anchor="middle" font-family="serif" font-size="15" font-weight="700" fill="${flower?RED:BLACK}">${n+1}</text>`+plant(n);
  }
  function whiteDragon(){
    let art=path('M10 9h28v50H10Z M14 13h20v42H14Z M18 19h12v30H18Z',BLACK,1.6);
    for(const y of [15,25,35,45])art+=path(`M10 ${y}h4v5h-4m24-5h4v5h-4`,BLACK,1);
    for(const x of [17,25])art+=path(`M${x} 9v4h4V9m-4 46v4h4v-4`,BLACK,1);
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
