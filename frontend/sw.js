const CACHE_NAME = 'desencurta-v4';
const STATIC_ASSETS = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(() => {}) // ignora falha no cache sem quebrar
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Nunca faz cache de chamadas para a API
  if (e.request.url.includes('/expand') ||
      e.request.url.includes('/preview') ||
      e.request.url.includes('microlink') ||
      e.request.url.includes('img.youtube')) return;

  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request).catch(() => cached))
  );
});