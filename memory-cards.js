/* Воспроизводимые карточки и проверка сохранённого прогресса. */
(function(root){
  'use strict';
  const COUNT = 100;
  const ITEMS = [
    {id:'leaf',name:'лист'}, {id:'acorn',name:'жёлудь'},
    {id:'mushroom',name:'гриб'}, {id:'feather',name:'перо'},
    {id:'sun',name:'солнце'}, {id:'moon',name:'луна'},
    {id:'star',name:'звезда'}, {id:'drop',name:'капля'},
    {id:'mountain',name:'гора'}, {id:'flower',name:'цветок'},
    {id:'paw',name:'лапа'}, {id:'lantern',name:'фонарь'}
  ];

  function random(seed){
    let state = seed >>> 0;
    return () => {
      state += 0x6D2B79F5;
      let n = state;
      n = Math.imul(n ^ n >>> 15, n | 1);
      n ^= n + Math.imul(n ^ n >>> 7, n | 61);
      return ((n ^ n >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(values, rng){
    const copy = values.slice();
    for(let i=copy.length-1;i>0;i--){
      const j=Math.floor(rng()*(i+1));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }
  function make(level){
    if(!Number.isInteger(level)||level<1||level>COUNT)throw RangeError('Уровень вне каталога');
    const rng=random((Math.imul(level,0x9E3779B1)^0x4D454D4F)>>>0);
    const slots=shuffle(ITEMS,rng).slice(0,9);
    const count=level<=20?4:level<=50?5:6;
    const questions=shuffle(Array.from({length:9},(_,i)=>i),rng).slice(0,count);
    const seconds=level<=10?14:level<=30?12:level<=60?10:8;
    return {level,slots,questions,seconds};
  }
  function stars(correct,total){
    if(correct===total)return 3;
    if(correct===total-1)return 2;
    return correct>=Math.ceil(total/2)?1:0;
  }
  function restore(value){
    const source=value&&typeof value==='object'?value:{};
    const level=Number.isInteger(source.level)&&source.level>=1&&source.level<=COUNT?source.level:1;
    const best={};
    if(source.best&&typeof source.best==='object'&&!Array.isArray(source.best)){
      for(const [key,score] of Object.entries(source.best)){
        const n=Number(key);
        if(Number.isInteger(n)&&n>=1&&n<=COUNT&&String(n)===key&&Number.isInteger(score)&&score>=1&&score<=3)best[n]=score;
      }
    }
    return {level,best,sound:source.sound!==false,helpSeen:source.helpSeen===true};
  }
  const api={COUNT,ITEMS,make,stars,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MemoryCards=api;
})(globalThis);
