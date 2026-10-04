/* Shared projection for drawing and input. World simulation stays in cells. */
(function(root){
  'use strict';
  const depth=.74, padX=.45, padTop=1.05, padBottom=.38;
  const width=9+2*padX, height=13*depth+padTop+padBottom;
  function project(x,y,z=0,cell=1){return {x:(padX+x)*cell,y:(padTop+y*depth-z)*cell};}
  function cellAt(x,y,w,h){return {x:Math.floor(x/w*width-padX),y:Math.floor((y/h*height-padTop)/depth)};}
  function direction(heading){return ((Math.round(heading/(Math.PI/4))%8)+8)%8;}
  function muzzle(x,y,heading,type='gun',tier=1){
    const length=type==='mortar'?.28:.43+(tier-1)*.015;
    return {x:x+Math.cos(heading)*length,y:y+Math.sin(heading)*length,z:type==='mortar'?.73:.49};
  }
  const api={depth,padX,padTop,padBottom,width,height,project,cellAt,direction,muzzle};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DioramaGeometry=api;
})(globalThis);
