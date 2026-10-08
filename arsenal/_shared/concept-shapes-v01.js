/* Shape studies only. All shapes use the same elevated three-quarter camera.
   No combat hooks, textures or production replacement. */
(function(root){
'use strict';
const TAU=Math.PI*2;
const studies={
 gun:[['Дозорный жёлудь','Короткий ствол выступает из округлого корпуса; широкие щёки дают опору.'],['Лесной лафет','Длинный ствол на двух низких полозьях. Открытая конструкция и направленный силуэт.'],['Каменный страж','Компактная пушка в тяжёлом расколотом камне. Ствол и валун образуют одну массу.']],
 mortar:[['Осадный котёл','Приземистая чаша с огромным жерлом и двумя короткими опорами.'],['Полая колода','Наклонный толстый ствол в развилке корня. Тяжесть сосредоточена у земли.'],['Трёхлапый гром','Круглая мортирная чаша на трёх широко расставленных лапах.']],
 frost:[['Ледяной цветок','Один высокий бутон и три низких лепестка; лёд растёт прямо из чаши.'],['Морозный веер','Низкий широкий веер клиньев. Расходящийся силуэт передаёт замедляющий импульс.'],['Зимняя почка','Закрытый вытянутый кристалл между двумя обнимающими его каменными листьями.']],
 tesla:[['Грозовое семя','Один крупный светящийся плод в раскрытой вилке. Энергия важнее мелкой механики.'],['Разрядный камертон','Два толстых рога и свободный промежуток между ними. Узнаётся по отрицательному пространству.'],['Грозовой колокол','Подвешенный сердечник внутри арки. Колокольная форма добавляет сказочный характер.']]
};
function draw(c,type,variant,size=120,sil=false){
const P=sil?{d:'#243c35',m:'#243c35',l:'#243c35',h:'#243c35',hole:'#f0eddf'}:{d:'#465951',m:'#89968a',l:'#bdc6b5',h:'#e4e6d5',hole:'#263d35'};
c.save();c.scale(size/120,size/120);
const ellipse=(x,y,rx,ry,col)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=col;c.fill()};
const path=(pts,col)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=col;c.fill()};
const box=(x,y,w,h,r,col)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=col;c.fill()};
const curve=(start,segments,col)=>{c.beginPath();c.moveTo(...start);for(const a of segments)c.bezierCurveTo(...a);c.closePath();c.fillStyle=col;c.fill()};
const foot=(x,y,w=14)=>{ellipse(x,y+3,w,8,P.d);ellipse(x-2,y,w,7,P.m);ellipse(x-4,y-2,w*.55,3,P.l)};
const stone=(x,y,w,h)=>{curve([x-w,y],[[x-w,y-h*.8,x-w*.4,y-h,x,y-h],[x+w*.8,y-h,x+w,y-h*.2,x+w,y],[x+w,y+h*.5,x-w*.7,y+h*.6,x-w,y]],P.m);curve([x-w,y],[[x-w,y-h*.7,x-w*.3,y-h,x,y-h],[x+w*.7,y-h,x+w*.4,y-h*.4,x,y-h*.35],[x-w*.3,y-h*.2,x-w*.6,y,x-w,y]],P.l);};
const crystal=(x,y,w,h)=>{path([[x,y-h],[x-w,y-7],[x,y+8],[x+w,y-7]],P.m);path([[x,y-h],[x-w,y-7],[x,y+8]],P.h);path([[x,y-h],[x+w,y-7],[x,y+8],[x+w*.25,y-7]],P.d);};
// A barrel points diagonally toward the upper-right in the shared camera.
const barrel=(x,y,w,len)=>{c.save();c.translate(x,y);c.rotate(-.48);box(-len,-w,len,w*2,w*.5,P.d);box(-len,-w,len,w*1.4,w*.45,P.m);box(-len+4,-w+2,len-6,w*.4,3,P.l);ellipse(0,0,w*.42,w,P.l);ellipse(1,0,w*.29,w*.76,P.hole);c.restore()};
if(type==='gun'){
 if(variant===0){foot(-22,26);foot(24,26);ellipse(0,15,35,22,P.d);stone(0,8,33,39);ellipse(-7,-15,22,9,P.h);barrel(46,-18,10,43);box(-27,8,12,17,5,P.m);box(21,7,12,18,5,P.m);}
 if(variant===1){path([[-40,21],[-28,13],[26,18],[42,30],[27,38],[-38,29]],P.d);path([[-37,-2],[-25,-10],[28,-4],[39,6],[25,11],[-38,6]],P.m);box(-19,-8,14,35,6,P.d);box(8,-7,14,35,6,P.d);barrel(53,-25,8,85);ellipse(-22,5,14,15,P.m);ellipse(-25,1,9,11,P.l);}
 if(variant===2){stone(-6,17,40,51);path([[-42,14],[-24,-28],[-11,-35],[-15,9]],P.h);path([[7,-27],[32,-17],[34,29],[13,22]],P.d);barrel(44,-14,12,35);}
}
if(type==='mortar'){
 if(variant===0){foot(-28,28,15);foot(29,28,15);curve([-35,-10],[[-45,13,-26,36,0,36],[28,36,44,10,35,-10]],P.d);curve([-33,-12],[[-34,12,-15,27,0,28],[19,24,29,7,31,-12]],P.m);ellipse(0,-12,38,23,P.l);ellipse(0,-13,29,16,P.hole);if(!sil)ellipse(-6,-18,17,5,P.d);box(-43,-2,10,16,4,P.m);box(33,-2,10,16,4,P.m);}
 if(variant===1){foot(-28,28,19);foot(24,29,21);path([[-35,24],[-26,-6],[-15,-8],[1,20],[31,-8],[41,-5],[36,32],[0,38]],P.d);barrel(23,-24,25,57);path([[-30,25],[-23,1],[-15,-1],[-4,27]],P.l);}
 if(variant===2){for(const [x,y] of [[-33,24],[32,25],[0,42]]){path([[x*.3,7],[x+9,y-4],[x+10,y+8],[x-10,y+8],[x-8,y-3]],P.d);ellipse(x,y,12,6,P.m);}ellipse(0,6,29,23,P.m);ellipse(0,-7,33,22,P.l);ellipse(0,-9,24,15,P.hole);}
}
if(type==='frost'){
 if(variant===0){ellipse(0,25,25,12,P.d);crystal(-22,15,11,37);crystal(21,13,12,43);crystal(0,14,16,67);path([[-28,16],[-10,22],[0,34],[12,22],[29,14],[22,35],[0,42],[-22,34]],P.m);path([[-28,16],[-10,22],[0,34],[-22,34]],P.l);}
 if(variant===1){ellipse(0,26,32,10,P.d);for(const [x,y,a,h] of [[-23,18,-.65,46],[23,18,.65,46],[-10,18,-.3,57],[10,18,.3,57]]){c.save();c.translate(x,y);c.rotate(a);crystal(0,0,9,h);c.restore();}crystal(0,21,10,45);ellipse(0,29,22,8,P.m);}
 if(variant===2){crystal(0,16,21,73);curve([-4,36],[[-36,35,-40,-1,-27,-17],[-14,-5,-8,7,-4,36]],P.m);curve([4,36],[[36,35,40,-1,27,-17],[14,-5,8,7,4,36]],P.d);curve([-7,28],[[-27,21,-32,3,-27,-11],[-19,1,-12,14,-7,28]],P.l);}
}
if(type==='tesla'){
 if(variant===0){stone(0,27,21,17);curve([-5,21],[[-39,6,-36,-24,-20,-35],[-26,-6,-17,4,-5,7]],P.m);curve([5,21],[[39,6,36,-24,20,-35],[26,-6,17,4,5,7]],P.d);ellipse(0,-23,21,27,P.m);ellipse(-4,-28,16,21,P.l);ellipse(-8,-34,9,12,P.h);}
 if(variant===1){stone(0,29,27,16);curve([-8,22],[[-12,-2,-34,-4,-34,-35],[-34,-52,-21,-50,-19,-37],[-21,-12,-4,-11,-1,22]],P.m);curve([8,22],[[12,-2,34,-4,34,-35],[34,-52,21,-50,19,-37],[21,-12,4,-11,1,22]],P.d);ellipse(-27,-36,9,10,P.l);ellipse(27,-36,9,10,P.l);box(-10,11,20,16,4,P.l);}
 if(variant===2){foot(-29,31,13);foot(29,31,13);curve([-35,29],[[-38,-14,-31,-52,0,-52],[31,-52,38,-14,35,29],[31,31,27,30,25,28],[28,-7,21,-39,0,-39],[-21,-39,-28,-7,-25,28],[-27,31,-31,31,-35,29]],P.m);box(-4,-42,8,16,3,P.d);curve([-19,9],[[-14,-5,-17,-26,0,-26],[17,-26,14,-5,19,9]],P.l);ellipse(0,9,22,7,P.d);ellipse(0,5,23,6,P.h);ellipse(0,16,5,7,P.m);}
}
c.restore();}
root.ArsenalShapes={studies,draw};
})(typeof module==='object'?module.exports:window);
