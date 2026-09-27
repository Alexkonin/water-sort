/* Новая раскладка для каждого показа и проверка сохранённого прогресса. */
(function(root){
  'use strict';
  const COUNT = 100;
  const ITEMS = [
    {id:'leaf',name:'лист',group:'plant'}, {id:'acorn',name:'жёлудь',group:'plant'},
    {id:'mushroom',name:'гриб',group:'plant'}, {id:'feather',name:'перо',group:'animal'},
    {id:'sun',name:'солнце',group:'sky'}, {id:'moon',name:'луна',group:'sky'},
    {id:'star',name:'звезда',group:'sky'}, {id:'drop',name:'капля',group:'sky'},
    {id:'mountain',name:'гора',group:'sky'}, {id:'flower',name:'цветок',group:'plant'},
    {id:'paw',name:'лапа',group:'animal'}, {id:'lantern',name:'фонарь',group:'object'},
    {id:'tree',name:'дерево',group:'plant'}, {id:'pinecone',name:'шишка',group:'plant'},
    {id:'clover',name:'клевер',group:'plant'}, {id:'fern',name:'папоротник',group:'plant'},
    {id:'berry',name:'ягоды',group:'plant'}, {id:'sprout',name:'росток',group:'plant'},
    {id:'apple',name:'яблоко',group:'plant'}, {id:'pumpkin',name:'тыква',group:'plant'},
    {id:'fox',name:'лиса',group:'animal'}, {id:'owl',name:'сова',group:'animal'},
    {id:'rabbit',name:'заяц',group:'animal'}, {id:'butterfly',name:'бабочка',group:'animal'},
    {id:'fish',name:'рыба',group:'animal'}, {id:'bee',name:'пчела',group:'animal'},
    {id:'snail',name:'улитка',group:'animal'}, {id:'bird',name:'птица',group:'animal'},
    {id:'cloud',name:'облако',group:'sky'}, {id:'snowflake',name:'снежинка',group:'sky'},
    {id:'rainbow',name:'радуга',group:'sky'}, {id:'fire',name:'огонь',group:'sky'},
    {id:'wave',name:'волна',group:'sky'}, {id:'comet',name:'комета',group:'sky'},
    {id:'compass',name:'компас',group:'object'}, {id:'key',name:'ключ',group:'object'},
    {id:'bell',name:'колокольчик',group:'object'}, {id:'tent',name:'палатка',group:'object'},
    {id:'book',name:'книга',group:'object'}, {id:'clock',name:'часы',group:'object'}
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
  function make(level,deal=0){
    if(!Number.isInteger(level)||level<1||level>COUNT)throw RangeError('Уровень вне каталога');
    if(!Number.isSafeInteger(deal)||deal<0)throw RangeError('Неверный номер карточки');
    const rng=random((Math.imul(level,0x9E3779B1)^Math.imul(deal,0x85EBCA6B)^0x4D454D4F)>>>0);
    const slots=shuffle(ITEMS,rng).slice(0,9);
    const count=level<=20?4:level<=50?5:6;
    const questions=shuffle(Array.from({length:9},(_,i)=>i),rng).slice(0,count);
    const seconds=level<=10?14:level<=30?12:level<=60?10:8;
    return {level,deal,slots,questions,seconds};
  }
  function fresh(level,afterDeal,previous){
    const seen=new Set(previous?.slots?.map(item=>item.id)||[]);
    let deal=afterDeal,card;
    do{
      deal=deal>=0xFFFFFFFF?1:deal+1;
      card=make(level,deal);
    }while(seen.size&&card.slots.filter(item=>seen.has(item.id)).length>4);
    return {deal,card};
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
    const deal=Number.isSafeInteger(source.deal)&&source.deal>=0&&source.deal<=0xFFFFFFFF?source.deal:0;
    return {level,deal,best,sound:source.sound!==false,helpSeen:source.helpSeen===true};
  }
  const api={COUNT,ITEMS,make,fresh,stars,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MemoryCards=api;
})(globalThis);
