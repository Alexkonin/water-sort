/* Локальная история запусков для порядка игр в меню. */
(function(root){
  'use strict';
  const KEY = 'games.launches.v1';
  const LIMIT = 30;
  const FILES = ['tower-defense.html','water-sort.html','sand-trucks.html','forest-lights.html','mahjong.html','memory-cards.html'];
  const known = new Set(FILES);

  function clean(value){
    return Array.isArray(value) ? value.map(file => file === 'arrow-escape.html' ? 'sand-trucks.html' : file).filter(file => known.has(file)).slice(-LIMIT) : [];
  }
  function read(storage){
    try { return clean(JSON.parse((storage || root.localStorage).getItem(KEY) || '[]')); }
    catch { return []; }
  }
  function record(file, storage){
    if (!known.has(file)) return read(storage);
    const recent = [...read(storage), file].slice(-LIMIT);
    try { (storage || root.localStorage).setItem(KEY, JSON.stringify(recent)); }
    catch {} // В приватном режиме или при переполненном хранилище игры работают как прежде.
    return recent;
  }
  function rank(games, history = read()){
    const counts = new Map(FILES.map(file => [file, 0]));
    for (const file of clean(history)) counts.set(file, counts.get(file) + 1);
    return games.map((game, index) => ({game, index}))
      .sort((a, b) => (counts.get(b.game.file) || 0) - (counts.get(a.game.file) || 0) || a.index - b.index)
      .map(entry => entry.game);
  }

  const api = {KEY, LIMIT, FILES, read, record, rank};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.GameLaunches = api;
    const file = root.location.pathname.split('/').pop();
    if (known.has(file)) record(file);
  }
})(globalThis);
