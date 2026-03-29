const CACHE_VERSION = 'bluestock-v6';
const STATIC_CACHE  = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const PRECACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== STATIC_CACHE && k !== RUNTIME_CACHE) ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Network-first for all API endpoints
  const url = e.request.url;
  if (url.includes('/sync') || url.includes('/leaderboard') || url.includes('/user') || url.includes('/health')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        // Clone BEFORE doing anything else — body can only be consumed once
        if (res && res.status === 200) {
          const toCache = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(e.request, toCache));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('/index.html');
        return new Response('', { status: 503 });
      });
      return cached || network;
    })
  );
});

self.addEventListener('sync', e => {
  if (e.tag === 'bluestock-sync') {
    e.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: 'TRIGGER_SYNC' }))
      )
    );
  }
});
