// Офлайн-кэш. Меняй CACHE при каждом обновлении игры — старая версия сотрётся.
const CACHE = 'games-v44';
/* Все страницы сборника кладём в кэш сразу при установке: переход из меню
   в игру должен работать офлайн с первого раза, а не после того, как игру
   один раз открыли онлайн. Добавляешь игру — дописываешь её сюда и в GAMES
   в index.html. */
const ASSETS = [
  './', './index.html', './shell.css', './icons.svg', './sound.js',
  './water-sort.html', './tower-defense.html',
  './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png'
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

// Страницы: сначала сеть, офлайн — последняя сохранённая копия.
// Иначе первый заход после релиза неизменно показывает предыдущую игру.
// Статические ресурсы по-прежнему мгновенно берём из кэша и обновляем в фоне.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  const page = e.request.mode === 'navigate' || url.pathname.endsWith('.html');
  const cache = caches.open(CACHE);
  const net = fetch(e.request, page ? { cache: 'no-cache' } : undefined);
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
      (page ? await store.match(url.pathname) : undefined);
    if (page){
      try { return await net; }
      catch (error) { const hit = await saved(); if (hit) return hit; throw error; }
    }
    const hit = await saved();
    return hit || net;
  })());
});
