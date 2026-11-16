/* ========================================================
   GULASAL AI — SERVICE WORKER 2026
   Offline Caching • PWA Fast Shell
   ======================================================== */

const CACHE_NAME = 'gulasal-ai-v2026-01';

const PRECACHE_ASSETS = [
  '/',
  '/public/index.html',
  '/public/manifest.json',
  '/public/icon-192.svg',
  '/public/icon-512.svg',
  '/client/styles/main.css',
  '/client/styles/luxury-vibes.css',
  '/client/styles/curriculum.css',
  '/client/styles/premium-features.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell');
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW Precache Warn]', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching API requests or non-GET requests
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/public/index.html') || caches.match('/');
          }
        });
      })
  );
});
