// Офлайн-кэш. Меняй CACHE при каждом обновлении игры — старая версия сотрётся.
const CACHE = 'games-v25';
/* Все страницы сборника кладём в кэш сразу при установке: переход из меню
   в игру должен работать офлайн с первого раза, а не после того, как игру
   один раз открыли онлайн. Добавляешь игру — дописываешь её сюда и в GAMES
   в index.html. */
const ASSETS = [
  './', './index.html', './shell.css',
  './water-sort.html', './tower-defense.html',
  './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// cache-first + фоновое обновление
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
