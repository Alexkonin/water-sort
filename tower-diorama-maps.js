/* Art and ground occupancy are authored together. Coordinates are logical cells,
   after image registration, not pixels or the elevated silhouettes of objects.
   A footprint reserves the whole cell, including clearance for a tower base. */
(function(root){
  'use strict';
  const firstTrail={
    image:'diorama-art/v02/first-trail.png', offsetY:.037,
    objects:[
      {id:'north-forest',kind:'forest',label:'Деревья и корни',cells:[[0,0],[3,0],[4,0],[7,0],[8,0],[0,1],[8,1]]},
      {id:'north-stones',kind:'rock',label:'Камни',cells:[[1,0],[2,0],[5,0],[6,0]]},
      {id:'upper-clearing-stones',kind:'rock',label:'Камни и кустарник',cells:[[4,1],[5,1]]},
      {id:'east-log',kind:'wood',label:'Поваленное дерево',cells:[[8,2],[8,3]]},
      {id:'west-stump',kind:'wood',label:'Пень и корни',cells:[[0,3],[0,4]]},
      {id:'middle-clearing-stones',kind:'rock',label:'Камни',cells:[[3,3],[4,3],[3,4],[4,4]]},
      {id:'west-boulder',kind:'rock',label:'Валун',cells:[[0,5],[1,5]]},
      {id:'east-boulder',kind:'rock',label:'Валун',cells:[[8,4],[8,5]]},
      {id:'east-roots',kind:'wood',label:'Поваленное дерево и корни',cells:[[8,6]]},
      {id:'west-fence',kind:'wood',label:'Ограда и заросли',cells:[[0,6],[0,7]]},
      {id:'middle-small-stone',kind:'rock',label:'Камень',cells:[[2,6]]},
      {id:'west-lower-rocks',kind:'rock',label:'Камни и заросли',cells:[[0,8],[1,8],[0,9],[1,9],[0,10],[1,10],[0,11],[1,11]]},
      {id:'east-lower-rocks',kind:'rock',label:'Скалы',cells:[[8,7],[7,8],[8,8],[7,9],[8,9]]},
      {id:'lower-clearing-stone',kind:'rock',label:'Камень',cells:[[6,9]]},
      {id:'lower-left-stone',kind:'rock',label:'Камень',cells:[[3,10]]},
      {id:'south-forest',kind:'forest',label:'Деревья и корни',cells:[[0,12],[8,12]]},
      {id:'south-stones',kind:'rock',label:'Камни',cells:[[1,12],[4,12],[7,12]]},
      {id:'south-stumps',kind:'wood',label:'Пни и поваленное дерево',cells:[[2,12],[3,12]]}
    ]
  };
  function occupancy(map){
    const cells=new Map();
    const objects=[...(map.environment?.objects||[]),
      ...(map.blocked||[]).map(([x,y])=>({id:`rock-${x}-${y}`,kind:'rock',label:'Камень',cells:[[x,y]]}))];
    for(const object of objects)for(const [x,y] of object.cells){
      if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>=9||y<0||y>=13)
        throw new Error(`Invalid footprint: ${object.id} (${x},${y})`);
      if(!cells.has(`${x},${y}`))cells.set(`${x},${y}`,object);
    }
    return cells;
  }
  const api={firstTrail,occupancy};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DioramaMaps=api;
})(globalThis);
