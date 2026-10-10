/* Sand picture authoring: bold silhouettes and broad color planes on a 96 × 80
   artboard. All marks become collectible grains; no extra rendering layer. */
const themes=['Воздушный шар','Горный перевал','Замок на холме','Лунная бухта','Сад тюльпанов','Домик-гриб','Кит в волнах','Песчаные дюны','Паровозик','Мост над рекой','Сова на ветке','Звёздная башня','Морской краб','Чайник у окна','Цветущий кактус'];
const moods=['Рассвет','Тёплый день','Золотой час','Вечерний свет','Синие дали','Тихая ночь'];
function canvas(width,height,background,mirror=false){
 const rows=Array.from({length:height},()=>Array(width).fill(background));
 function paint(c,inside){for(let y=0;y<height;y++)for(let x=0;x<width;x++){const u=(x+.5)*96/width,v=(y+.5)*80/height;if(inside(mirror?96-u:u,v))rows[y][x]=c;}}
 function ellipse(x,y,rx,ry,c){paint(c,(u,v)=>((u-x)/rx)**2+((v-y)/ry)**2<=1);}
 function box(x,y,w,h,c){paint(c,(u,v)=>u>=x&&u<x+w&&v>=y&&v<y+h);}
 function poly(points,c){paint(c,(x,y)=>{let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const[a,b]=points[i],[d,e]=points[j];if((b>y)!==(e>y)&&x<(d-a)*(y-b)/(e-b)+a)inside=!inside;}return inside;});}
 function line(x,y,xx,yy,r,c){const dx=xx-x,dy=yy-y,len=dx*dx+dy*dy;paint(c,(u,v)=>{const t=len?Math.max(0,Math.min(1,((u-x)*dx+(v-y)*dy)/len)):0;return(u-x-t*dx)**2+(v-y-t*dy)**2<=r*r;});}
 function ribbon(x1,x2,y,amp,thick,c,phase=0){paint(c,(x,v)=>x>=x1&&x<=x2&&Math.abs(v-y-Math.sin((x-x1)/(x2-x1)*Math.PI*2+phase)*amp)<thick/2);}
 function star(x,y,r,c){poly(Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,q=i%2?r*.43:r;return[x+Math.cos(a)*q,y+Math.sin(a)*q];}),c);}
 function leaf(x,y,dx,dy,c){poly([[x,y],[x+dx*.05-dy*.25,y+dy*.05+dx*.25],[x+dx*.6-dy*.2,y+dy*.6+dx*.2],[x+dx,y+dy],[x+dx*.6+dy*.2,y+dy*.6-dx*.2]],c);}
 return{paint,ellipse,box,poly,line,ribbon,star,leaf,rows:()=>rows.map(row=>row.join(''))};
}
function picture(n,width=48,height=40){
 if(n<4||n>100)throw Error('Campaign art expects levels 4–100');
 const family=n<11?n-4:(n-11)%15,v=n<11?0:Math.floor((n-11)/15),night=v===5;
 const limit=n<11?6:n<31?3:n<61?4:5;
 // Deliberate roles keep silhouettes separate even in the three-color chapter.
 const warm=n%2?0:5,cool=n%3?3:4;
 const p=limit===6?{sky:2,ink:4,body:5,accent:1,light:2,land:0,sea:3}:
  limit===3?{sky:2,ink:cool,body:warm,accent:2,light:2,land:warm,sea:cool}:
  limit===4?{sky:2,ink:cool,body:warm,accent:1,light:2,land:warm,sea:cool}:
  {sky:night?4:2,ink:4,body:warm,accent:1,light:2,land:warm,sea:3};
 // Keep the two introductory five-color palettes and their working limits.
 if(n===4)p.ink=3;
 if(n===5)p.body=0;
 const {sky,ink,body,accent,light,land,sea}=p,outline=night?sea:ink;
 const a=canvas(width,height,sky,v===1||v===4),{paint,ellipse,box,poly,line,ribbon,star,leaf}=a;
 const cx=[44,51,39,48,43,54][v],horizon=[59,62,57,61,58,63][v];
 function cloud(x,y,s=1){ellipse(x,y,10*s,2.7*s,light);ellipse(x-4*s,y-2*s,4*s,4*s,light);ellipse(x+2*s,y-4*s,5*s,5*s,light);}
 function skyMarks(){
  const sx=[77,18,78,18,77,19][v],sy=[17,15,20,18,16,17][v];
  ellipse(sx,sy,night?8:6,night?8:6,accent===sky?body:accent);
  if(night){ellipse(sx+4,sy-3,7,7,sky);for(const[x,y]of[[8,7],[35,9],[82,30],[72,7]])star(x,y,2,light);}
  else if(limit>3){cloud(sx>48?16:79,21,.7);}
 }
 function hills(y=horizon){paint(sea,(x,v)=>v>y+3*Math.sin(x/19));poly([[0,y+12],[20,y+5],[42,y+11],[70,y+7],[96,y+12],[96,80],[0,80]],land);}
 function water(y=horizon){paint(sea,(x,v)=>v>y+1.5*Math.sin(x/13));ribbon(4,24,y+8,.8,2,light);ribbon(67,91,y+12,1,2,light);ribbon(30,57,y+17,.6,2,accent);}
 function gull(x,y,s=1,c=ink){poly([[x-8*s,y-3*s],[x-3*s,y-2*s],[x,y+s],[x+4*s,y-2*s],[x+9*s,y-2*s],[x+4*s,y],[x,y+4*s],[x-4*s,y]],c);}
 function flower(x,y,r,c){for(let i=0;i<5;i++){const t=i*Math.PI*2/5;ellipse(x+Math.cos(t)*r*.65,y+Math.sin(t)*r*.65,r*.48,r*.48,c);}ellipse(x,y,r*.4,r*.4,accent);}
 function house(x,y,s=1,mushroom=false){
  const X=q=>x+q*s,Y=q=>y+q*s;
  poly([[X(-15),Y(-2)],[X(14),Y(-2)],[X(17),Y(24)],[X(-17),Y(24)]],light);
  poly([[X(7),Y(-2)],[X(14),Y(-2)],[X(17),Y(24)],[X(9),Y(24)]],accent);
  line(X(-15),Y(1),X(-17),Y(24),.9*s,ink);
  if(mushroom){ellipse(x,Y(-3),27*s,17*s,body);box(X(-28),Y(-3),56*s,8*s,body);poly([[X(-26),Y(4)],[X(26),Y(4)],[X(18),Y(9)],[X(-17),Y(8)]],land);for(const[dx,dy,r]of[[-14,-5,4],[0,-13,5],[14,-4,4]])ellipse(X(dx),Y(dy),r*s,r*s,light);}
  else{poly([[X(-24),Y(0)],[X(-2),Y(-23)],[X(24),Y(-2)],[X(20),Y(3)],[X(-2),Y(-16)],[X(-20),Y(5)]],body);box(X(12),Y(-21),6*s,13*s,body);}
  ellipse(X(-4),Y(15),5*s,7*s,ink);box(X(-9),Y(15),10*s,9*s,ink);ellipse(X(-2),Y(18),1*s,1*s,accent);
  box(X(7),Y(9),6*s,7*s,ink);line(X(10),Y(9),X(10),Y(16),.6*s,light);line(X(7),Y(12),X(13),Y(12),.6*s,light);
 }
 function lighthouse(x,y,s=1){
  poly([[x-8*s,y],[x+8*s,y],[x+12*s,y+39*s],[x-12*s,y+39*s]],light);
  line(x-8*s,y,x-12*s,y+39*s,.9*s,ink);line(x+8*s,y,x+12*s,y+39*s,.9*s,ink);
  for(const yy of[12,27])poly([[x-(8+yy*.1)*s,y+yy*s],[x+(8+yy*.1)*s,y+yy*s],[x+(9+yy*.1)*s,y+(yy+6)*s],[x-(9+yy*.1)*s,y+(yy+6)*s]],body);
  box(x-10*s,y-11*s,20*s,12*s,ink);box(x-6*s,y-9*s,12*s,8*s,accent);line(x,y-10*s,x,y-1*s,.8*s,ink);
  poly([[x-14*s,y-11*s],[x,y-21*s],[x+14*s,y-11*s]],body);box(x-14*s,y,28*s,3*s,ink);
  ellipse(x,y+33*s,3*s,5*s,ink);box(x-3*s,y+33*s,6*s,6*s,ink);
 }
 if(n<11){
  switch(family){
  case 0: // Keeper's cottage: roof overhang, lit side wall, curving path.
   skyMarks();water(57);poly([[0,80],[0,65],[20,59],[53,58],[76,67],[86,80]],land);
   house(39,37,1);poly([[35,61],[43,61],[46,68],[34,74],[41,80],[26,80],[27,72],[37,66]],light);
   line(75,65,75,44,1.6,ink);leaf(75,55,-8,-11,sea);leaf(75,58,9,-9,sea);gull(76,36,.6);break;
  case 1: // Seaside garden, interleaved leaves and flower heads.
   skyMarks();water(46);paint(land,(x,y)=>y>68+2*Math.sin(x/14));
   for(const[x,y,r,c]of[[20,36,8,body],[45,26,10,accent],[71,40,9,body]]){line(x,73,x,y+4,1.8,ink);leaf(x,62,-12,-17,sea);leaf(x,55,13,-14,ink);flower(x,y,r,c);}
   ribbon(3,17,58,.6,2,light);ribbon(77,94,62,.6,2,light);break;
  case 2: // Turtle: flippers lead the eye along a diagonal swim.
   paint(sea,()=>true);ribbon(4,37,13,1.1,2,light);ribbon(63,92,19,.7,2,accent);
   poly([[39,36],[20,21],[14,23],[25,42]],land);poly([[49,50],[38,68],[44,70],[61,55]],land);
   poly([[67,35],[78,28],[79,33],[69,43]],land);poly([[63,53],[75,61],[79,58],[73,46]],land);
   ellipse(24,50,11,8,accent);ellipse(19,48,1.8,2,ink);
   ellipse(49,43,25,19,ink);ellipse(49,41,22,17,land);
   poly([[42,27],[55,27],[63,39],[56,53],[42,54],[34,41]],accent);
   line(35,40,63,39,1,ink);line(43,28,42,53,1,ink);line(54,28,56,52,1,ink);
   line(33,32,27,31,1,ink);line(64,33,69,30,1,ink);line(62,48,67,53,1,ink);
   for(const[x,y]of[[10,35],[15,24]]){ellipse(x,y,3,3,light);ellipse(x,y,1.5,1.5,sea);}break;
  case 3: // Scallop shell with ribs converging into a broad hinge.
   paint(ink,()=>true);paint(sea,(x,y)=>y>47+3*Math.sin(x/18));paint(land,(x,y)=>y>70+2*Math.sin(x/12));
   for(let i=0;i<7;i++){const t=Math.PI+(i+.5)*Math.PI/7;ellipse(48+Math.cos(t)*26,48+Math.sin(t)*25,9,11,i%2?accent:light);}
   poly([[19,38],[77,38],[72,53],[57,65],[39,65],[24,52]],light);
   for(const[x,y]of[[24,29],[36,22],[48,19],[60,22],[73,30]])poly([[45,63],[x-2,y],[x+2,y],[51,63]],body);
   poly([[36,61],[59,61],[64,69],[31,69]],accent);ellipse(80,72,5,2,light);star(15,68,6,body);break;
  case 4: // Windmill: tapered tower and four broad canvas vanes.
   skyMarks();hills(57);poly([[37,33],[57,33],[64,65],[31,65]],light);poly([[50,34],[57,33],[64,65],[53,65]],accent);
   poly([[31,34],[47,19],[64,34]],body);ellipse(46,60,4,6,ink);box(42,60,8,6,ink);
   for(let i=0;i<4;i++){const t=i*Math.PI/2+.3,pt=(x,y)=>[47+Math.cos(t)*x-Math.sin(t)*y,35+Math.sin(t)*x+Math.cos(t)*y];poly([pt(3,-2),pt(30,-2),pt(29,6),pt(11,6)],ink);poly([pt(11,0),pt(28,0),pt(27,4),pt(11,4)],light);}
   ellipse(47,35,3,3,body);poly([[42,65],[48,65],[59,80],[44,80]],accent);break;
  case 5: // Lighthouse on a low rock ledge, balanced by gulls.
   skyMarks();water(59);poly([[10,71],[21,62],[43,60],[57,69],[63,78],[9,78]],land);lighthouse(35,24,1);
   gull(76,32,.8);gull(67,43,.5);ribbon(64,91,70,.8,2,light);break;
  case 6: // Island light: the beam is part of the sand picture.
   paint(ink,()=>true);ellipse(18,17,8,8,accent);ellipse(22,14,7,7,ink);
   for(const[x,y]of[[37,10],[72,12],[86,29]])star(x,y,2,light);
   poly([[58,29],[96,17],[96,35]],accent);water(59);
   poly([[12,73],[25,62],[54,57],[76,67],[86,76]],land);lighthouse(52,31,.7);
   ribbon(34,66,70,.5,2,accent);ribbon(43,59,76,.3,2,accent);break;
  }
 }else{
  // Each family keeps a recognisable silhouette; variants change staging,
  // horizon, secondary objects and light instead of scattering extra pixels.
  switch(family){
  case 0: { // Balloon: striped envelope tapering into a suspended basket.
   skyMarks();hills(horizon+4);const y=24+(v%3)*2;
   ellipse(cx,y,22,24,body);poly([[cx-19,y+11],[cx+19,y+11],[cx+7,y+30],[cx-7,y+30]],body);
   ellipse(cx,y-1,9,23,accent);poly([[cx-7,y+16],[cx+7,y+16],[cx+3,y+28],[cx-3,y+28]],accent);
   if(v%2)for(const sign of[-1,1])ellipse(cx+sign*13,y-3,2.5,15,light);
   line(cx-7,y+27,cx-6,y+35,1,night?light:ink);line(cx+7,y+27,cx+6,y+35,1,night?light:ink);
   poly([[cx-10,y+34],[cx+10,y+34],[cx+8,y+44],[cx-7,y+44]],body);box(cx-9,y+34,18,3,light);
   if(v%2===0)gull(79,42,.55);else cloud(18,40,.7);break;
  }
  case 1: // Mountain: asymmetric ridge, snow fingers, winding pass.
   skyMarks();poly([[0,59],[17,28],[32,49],[67,19],[96,57],[96,80],[0,80]],sea);
   poly([[7,70],[cx,12],[83,71]],body);poly([[cx,12],[cx-13,33],[cx-5,29],[cx,37],[cx+5,31],[cx+15,37]],light);
   line(cx,12,cx-13,33,1,body);line(cx,12,cx+15,37,1,body);
   poly([[cx,29],[cx+4,40],[cx+3,68],[83,71]],ink);
   paint(land,(x,y)=>y>69+3*Math.sin(x/15));poly([[cx-2,52],[cx+2,53],[cx-8,65],[cx+2,71],[cx+15,80],[cx+3,80],[cx-16,67]],accent);break;
  case 2: // Castle with unequal towers and an arched open gate.
   skyMarks();hills(62);ellipse(cx,82,40,18,land);
   box(cx-22,37,44,29,body);box(cx-29,27,12,40,body);box(cx+17,30,13,37,body);box(cx-8,20,16,46,body);
   for(const[x,y]of[[cx-29,23],[cx-21,23],[cx+17,26],[cx+26,26]])box(x,y,4,7,body);
   poly([[cx-13,20],[cx,7],[cx+13,20]],outline);line(cx,7,cx,2,1,outline);poly([[cx,2],[cx+13,5],[cx,8]],body);
   ellipse(cx,56,7,10,ink);box(cx-7,56,14,11,ink);box(cx-2,26,4,7,light);
   for(const x of[cx-25,cx+21]){ellipse(x+2,39,2,3,light);box(x,39,4,6,light);}
   poly([[cx-5,67],[cx+5,67],[cx+20,80],[cx-13,80]],accent);break;
  case 3: { // Moon bay: a crescent and a long interrupted reflection.
   paint(ink,()=>true);const moonX=v%2?64:33,moonY=23+(v%3)*2;
   ellipse(moonX,moonY,16,16,accent);ellipse(moonX+7,moonY-5,15,15,ink);
   for(const[x,y,r]of[[10,13,2],[77,10,3],[56,15,2],[85,35,2],[14,40,2]])star(x,y,r,light);
   water(53);poly([[0,53],[14,46],[27,56],[14,61],[0,61]],body);poly([[96,48],[81,54],[74,62],[96,61]],body);
   for(let j=0;j<4;j++)ribbon(moonX-12+j*2,moonX+14-j*2,58+j*5,.6,2.5,accent);
   if(v>1){poly([[73,58],[84,58],[80,62],[75,62]],ink);poly([[78,57],[78,46],[85,57]],light);}break;
  }
  case 4: // Tulip garden: three large, staggered blooms and pointed leaves.
   skyMarks();paint(land,(x,y)=>y>71+2*Math.sin(x/14));
   for(let i=0;i<3;i++){const x=22+i*26+(v%2)*2,y=31+((i+v)%3)*7,c=i===1?body:(accent===sky?body:accent);
    line(x,75,x,y+10,1.8,outline);leaf(x,65,-14,-20,sea);leaf(x,58,12,-16,outline);
    ellipse(x,y+2,10,12,c);poly([[x-10,y],[x-10,y-10],[x-3,y-4],[x,y-12],[x+4,y-4],[x+10,y-10],[x+10,y]],c);
    poly([[x-6,y+1],[x-3,y+8],[x+1,y+11],[x-4,y+9],[x-8,y+3]],light);
   }break;
  case 5: // Mushroom cottage with a scalloped cap, porch and footpath.
   skyMarks();hills(65);house(cx,37,1,true);
   poly([[cx-7,61],[cx+1,61],[cx+10,70],[cx+3,80],[cx-8,80],[cx+1,71]],accent);
   for(const[x,y]of[[13,60],[83,66]]){line(x,y+10,x,y,1,ink);ellipse(x,y,6,4,body);box(x-6,y,12,2,light);}break;
  case 6: { // Whale: curved back, lifted flukes and a split fountain.
   skyMarks();water(57);const x=cx-4,y=48,whale=night?light:ink;
   poly([[x+19,y],[x+34,y-13],[x+44,y-16],[x+41,y-5],[x+32,y+4],[x+23,y+12]],whale);
   poly([[x+31,y-7],[x+25,y-21],[x+32,y-19],[x+36,y-10]],whale);
   ellipse(x,y,28,17,whale);ellipse(x-6,y+7,19,8,night?sea:light);ellipse(x+1,y,24,11,whale);
   leaf(x+1,y+4,14,13,body);ellipse(x-18,y-2,2,2,night?ink:accent);
   line(x-12,y-18,x-12,y-29,1.4,sea);line(x-12,y-27,x-20,y-33,1.4,sea);line(x-12,y-27,x-5,y-34,1.4,sea);
   ellipse(x-21,y-32,2,3,sea);ellipse(x-4,y-34,2,3,sea);ribbon(3,22,70,.5,2,light);break;
  }
  case 7: // Dunes with broad crests; small caravan makes the scale readable.
   skyMarks();paint(body,(x,y)=>y>39+8*Math.sin(x/27));paint(accent,(x,y)=>y>55+7*Math.sin(x/21+1));paint(land,(x,y)=>y>69+7*Math.sin(x/25+3));
   poly([[0,58],[22,45],[36,48],[18,50]],light);
   const x=cx+12,y=55;line(x,y+13,x,y-13,2,outline);line(x,y+1,x-9,y+1,2,outline);line(x-9,y+1,x-9,y-7,2,outline);line(x,y-4,x+8,y-4,2,outline);line(x+8,y-4,x+8,y-11,2,outline);
   poly([[12,66],[16,61],[20,63],[25,62],[29,67],[26,67],[25,72],[23,72],[23,67],[18,67],[16,72],[14,72],[14,67]],ink);break;
  case 8: // Engine: cab roof, round boiler, cowcatcher and rhythmic wheels.
   skyMarks();hills(69);box(0,69,96,3,ink);
   for(let x=3;x<96;x+=12)box(x,72,7,3,light);
   const shift=v%3*2;box(13+shift,34,23,29,body);poly([[10+shift,33],[14+shift,28],[35+shift,28],[40+shift,34]],outline);
   box(18+shift,36,13,12,light);box(35+shift,47,24,15,body);ellipse(58+shift,54,7,8,body);box(47+shift,32,7,16,outline);box(44+shift,31,12,4,outline);
   poly([[62+shift,57],[72+shift,65],[62+shift,65]],ink);box(74,43,18,19,body);box(72,41,22,4,accent);line(64,61,76,61,1,ink);
   for(const x of[21+shift,43+shift,59+shift,81,90]){ellipse(x,65,5,5,ink);ellipse(x,65,2,2,accent);}
   for(let i=0;i<3;i++)ellipse(50-i*9,23-i*5,4+i,3+i,light===sky?body:light);break;
  case 9: // Stone bridge: a rising deck, three deep arches and reeds.
   skyMarks();water(54);poly([[0,46],[22,39],[49,35],[75,39],[96,47],[96,63],[0,63]],body);
   for(const[x,y]of[[18,52],[48,47],[78,53]]){ellipse(x,y,10,12,sea);box(x-10,y,20,18,sea);}
   poly([[0,45],[23,38],[49,34],[76,38],[96,46],[96,49],[76,41],[49,37],[23,41],[0,48]],accent);
   for(let x=6;x<96;x+=14){const y=35+Math.abs(49-x)*.2;line(x,y,x,y+6,1,ink);}
   line(7,79,7,64,1,ink);leaf(7,74,7,-10,ink);line(91,79,90,62,1,ink);leaf(90,72,-7,-9,ink);break;
  case 10: // Owl: ear tufts, paired facial discs and hanging tail feathers.
   skyMarks();line(0,67,96,61,2.5,land);leaf(78,62,10,-11,sea);leaf(85,62,9,8,sea);
   poly([[cx-10,59],[cx+10,59],[cx+7,75],[cx,69],[cx-7,74]],body);
   ellipse(cx,40,21,27,body);poly([[cx-20,28],[cx-22,9],[cx-7,18],[cx+7,18],[cx+22,9],[cx+20,29]],body);
   ellipse(cx,46,15,18,accent);ellipse(cx-9,31,10,12,light);ellipse(cx+9,31,10,12,light);
   for(const x of[cx-9,cx+9]){ellipse(x,32,4,5,ink);ellipse(x-1,30,1.3,1.5,light);}
   poly([[cx-4,41],[cx+4,41],[cx,48]],ink);leaf(cx-17,37,3,20,ink);leaf(cx+17,37,-3,20,ink);
   line(cx-9,61,cx-9,66,1,ink);line(cx+9,61,cx+9,66,1,ink);break;
  case 11: // Star tower on a rocky rise; spiral window rhythm.
   skyMarks();hills(68);poly([[cx-12,30],[cx+11,30],[cx+15,68],[cx-15,68]],body);
   poly([[cx-19,31],[cx,11],[cx+19,31]],outline);poly([[cx,14],[cx+14,29],[cx+4,29]],accent);star(cx,8,7,accent===sky?body:accent);
   for(const[x,y]of[[cx-5,38],[cx+5,49]]){ellipse(x,y,3,4,light);box(x-3,y,6,4,light);}
   ellipse(cx-2,63,4,6,ink);box(cx-6,63,8,6,ink);poly([[cx-7,69],[cx+1,69],[cx+14,80],[cx-4,80]],accent);break;
  case 12: { // Crab with open pincers and splayed jointed legs.
   water(24);paint(accent,(x,y)=>y>42+2*Math.sin(x/13));const y=50+(v%2)*3;
   for(const sign of[-1,1]){
    for(let k=0;k<3;k++){line(cx+sign*15,y+k*4,cx+sign*(27+k*2),y+k*6-1,1.6,body);line(cx+sign*(27+k*2),y+k*6-1,cx+sign*(31+k*2),y+k*6+6,1.6,body);}
    line(cx+sign*16,y-4,cx+sign*26,y-13,2,body);ellipse(cx+sign*27,y-20,9,10,body);
    poly([[cx+sign*27,y-31],[cx+sign*25,y-20],[cx+sign*35,y-25]],accent);
    line(cx+sign*7,y-9,cx+sign*9,y-16,1.5,body);ellipse(cx+sign*9,y-17,3,3,ink);
   }
   ellipse(cx,y,20,12,body);ellipse(cx-3,y-4,11,3,light);ribbon(cx-5,cx+5,y+5,1,2,ink);ellipse(13,75,4,2,land);break;
  }
  case 13: { // Teapot: open handle, rising spout, lid and soft steam.
   box(8,5,80,44,body);box(12,9,72,36,ink);ellipse(v%2?26:70,20,7,7,accent);box(46,8,4,38,body);box(11,29,74,3,body);
   paint(land,(x,y)=>y>68);ellipse(cx+23,50,12,13,body);ellipse(cx+23,50,7,8,sky);
   poly([[cx-16,48],[cx-34,39],[cx-30,52],[cx-19,63],[cx-12,62]],body);poly([[cx-31,40],[cx-25,44],[cx-30,45]],light);
   ellipse(cx,55,23,17,body);ellipse(cx-6,51,12,10,accent);ellipse(cx,70,26,3,ink);
   ellipse(cx,39,19,4,light);box(cx-17,37,34,4,body);ellipse(cx,34,4,3,body);
   ribbon(cx-8,cx+2,26,2,2,light);ribbon(cx+1,cx+11,18,2,2,light);break;
  }
  case 14: // Flowering cactus: scalloped arms, wide pot rim and cut leaves.
   skyMarks();hills(72);poly([[cx-16,58],[cx+17,58],[cx+12,77],[cx-11,77]],body);box(cx-19,56,38,6,accent);poly([[cx-12,64],[cx-6,64],[cx-3,75],[cx-8,75]],light);
   line(cx,55,cx,23,5,outline);line(cx,41,cx-15,41,4,outline);line(cx-15,41,cx-15,31,4,outline);line(cx,47,cx+16,47,4,outline);line(cx+16,47,cx+16,32,4,outline);
   line(cx-1,28,cx-1,52,1,sea===outline?light:sea);flower(cx,20,7,body);flower(cx+16,29,5,accent);break;
  }
 }
 return{title:n>=11?themes[family]+' · '+moods[v]:undefined,rows:a.rows()};
}
module.exports={picture,canvas};
