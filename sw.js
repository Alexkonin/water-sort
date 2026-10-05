// Офлайн-кэш. Меняй CACHE при каждом обновлении игры — старая версия сотрётся.
const CACHE = 'games-v127';
/* Все страницы сборника кладём в кэш сразу при установке: переход из меню
   в игру должен работать офлайн с первого раза, а не после того, как игру
   один раз открыли онлайн. Добавляешь игру — дописываешь её сюда и в GAMES
   в index.html. */
const ASSETS = [
  './', './index.html', './shell.css', './palette.css', './icons.svg', './sound.js', './launch-history.js', './focus-mode.js',
  './heroes/dobrynya/animations/dobrynya-topdown.js', './heroes/dobrynya/combat.js',
  './water-sort.html', './tower-defense.html', './bestiary/ugolek/animations/ugolek.js', './bestiary/vihrek/animations/vihrek.js', './bestiary/kamnespin/animations/kamnespin.js', './bestiary/pushinka/animations/pushinka.js', './bestiary/tumannik/animations/tumannik.js', './bestiary/dreven/animations/dreven.js', './bestiary/dozhdevik/animations/dozhdevik.js', './bestiary/fonarnik/animations/svetlyachok.js', './bestiary/rosnik/animations/rosnik.js', './bestiary/kroten/animations/kroten.js', './bestiary/solomennik/animations/solomennik.js', './bestiary/gulen/animations/gulen.js', './bestiary/skakunok/animations/skakunok.js', './bestiary/semyannitsa/animations/semyannitsa.js', './bestiary/zheludnik/animations/zheludnik.js', './bestiary/tennik/animations/tennik.js', './bestiary/hranitel/skins/forest-lord/animations/forest-lord.js', './bestiary/hranitel/skins/white-mask/animations/white-mask.js', './bestiary/hranitel/skins/river-serpent/animations/river-serpent.js', './bestiary/hranitel/skins/thunder-bull/animations/thunder-bull.js',
  './forest-lights.html', './forest-lights.js', './forest-lights-levels.js',
  './arrow-escape.html', './arrow-escape.js', './arrow-escape-ui.js',
  './mahjong.html', './mahjong.css', './mahjong.js', './mahjong-ui.js',
  './memory-cards.html', './memory-cards.js',
  './manifest.json', './icon-192.png?v=lukomorye1', './icon-512.png?v=lukomorye1', './icon-180.png?v=lukomorye1', './icon-maskable-512.png?v=lukomorye1', './favicon.ico?v=lukomorye1'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('games-v') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// HTML, CSS, JS и SVG должны обновляться вместе: сначала сеть, затем кэш.
// Иначе новый HTML на первом открытии получает CSS/JS от предыдущего релиза.
// Изображения и прочую статику по-прежнему сразу берём из кэша.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  const page = e.request.mode === 'navigate' || url.pathname.endsWith('.html');
  const fresh = page || /\.(css|js|svg)$/.test(url.pathname);
  const cache = caches.open(CACHE);
  const net = fetch(e.request, fresh ? { cache: 'no-cache' } : undefined);
  // Продлеваем жизнь worker до записи, но ошибка кэша не ломает ответ сети.
  e.waitUntil(net.then(async res => {
    if (res && res.status === 200 && res.type === 'basic'){
      const copy = res.clone();
      await (await cache).put(e.request, copy);
    }
  }).catch(() => {}));
  e.respondWith((async () => {
    const store = await cache;
    const saved = async () => (await store.match(e.request)) ||
      (fresh ? await store.match(url.pathname) : undefined);
    if (fresh){
      try { return await net; }
      catch (error) { const hit = await saved(); if (hit) return hit; throw error; }
    }
    const hit = await saved();
    return hit || net;
  })());
});
