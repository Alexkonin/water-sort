/* Правила и поиск кратчайшего решения. Одни и те же функции использует игра,
   генератор каталога и проверки. Состояние — восемь цифр, 0 означает пустое место. */
(function(root){
  'use strict';
  function step(s, move){
    if(move === 'L') return s.slice(1) + s[0];
    if(move === 'R') return s[7] + s.slice(0,7);
    if(move === 'T') return s.slice(0,3) + s[5] + s[3] + s[4] + s.slice(6);
    if(move === 'U') return s.slice(0,3) + s[4] + s[5] + s[3] + s.slice(6);
    throw new Error('Unknown move');
  }
  function valid(s, target){
    return typeof s === 'string' && /^[0-7]{8}$/.test(s) &&
      typeof target === 'string' && /^[0-7]{8}$/.test(target) &&
      [...s].sort().join('') === [...target].sort().join('');
  }
  // Обратный BFS: у T есть направленный обратный ход U. Он нужен только поиску.
  // Записанный в таблице ход всегда один из трёх доступных игроку: L, R, T.
  function search(target){
    const seen = new Map([[target, {depth:0, move:null}]]), queue=[target];
    for(let head=0;head<queue.length;head++){
      const state=queue[head], depth=seen.get(state).depth+1;
      for(const [reverse,move] of [['R','L'],['L','R'],['U','T']]){
        const prev=step(state,reverse);
        if(!seen.has(prev)){seen.set(prev,{depth,move});queue.push(prev);}
      }
    }
    return seen;
  }
  function solution(start, target, table=search(target)){
    const moves=[];
    for(let s=start;s!==target;){
      const entry=table.get(s);
      if(!entry || !entry.move) throw new Error('Unreachable state');
      moves.push(entry.move);s=step(s,entry.move);
    }
    return moves.join('');
  }
  // При обновлении каталога продолжаем с того же номера. Старые достижения
  // сохраняются, а состояние и рекорд чужой комбинации в новую не переносятся.
  function restoreProgress(saved, levels, version){
    if(!saved || typeof saved!=='object')saved={};
    const level=Number.isInteger(saved.level)&&saved.level>=1&&saved.level<=levels.length?saved.level:1;
    const puzzle=levels[level-1],same=saved.catalogVersion===version;
    const resume=same&&valid(saved.state,puzzle.target)&&Number.isSafeInteger(saved.moves)&&saved.moves>=0&&
      (saved.state!==puzzle.target||saved.moves>=puzzle.par);
    const state=resume?saved.state:puzzle.start,moves=resume?saved.moves:0;
    const history=resume&&moves&&Array.isArray(saved.history)?saved.history.slice(-Math.min(256,moves)).filter(s=>valid(s,puzzle.target)):[];
    const best={},completed={},legacyBest={};
    const goodKey=k=>/^\d+$/.test(k)&&+k>=1&&+k<=levels.length;
    for(const [key,value] of Object.entries(saved.completed||{}))if(goodKey(key)&&value===true)completed[key]=true;
    for(const [key,value] of Object.entries(saved.legacyBest||{}))if(goodKey(key)&&Number.isSafeInteger(value)&&value>0)legacyBest[key]=value;
    for(const [key,value] of Object.entries(saved.best||{})){
      if(!goodKey(key)||!Number.isSafeInteger(value)||value<1)continue;
      completed[key]=true;
      if(same&&value>=levels[+key-1].par)best[key]=value;
      else if(!same)legacyBest[key]=value;
    }
    return {level,state,moves,history,best,completed,legacyBest};
  }
  const api={step,valid,search,solution,restoreProgress};
  if(typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.ForestLights=api;
})(globalThis);
