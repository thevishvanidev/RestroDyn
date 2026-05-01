// ── RestroDyn Service Worker ──

const CACHE_NAME = 'restrodyn-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/menu.html',
  '/admin.html',
  '/kitchen.html',
  '/css/global.css',
  '/css/landing.css',
  '/css/menu.css',
  '/css/admin.css',
  '/css/kitchen.css',
  '/manifest.json',
];

// Install — cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(() => {
      console.log('SW: Cache failed during install (expected in dev)');
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // For static assets (CSS, JS, Fonts, Images)
  const isStaticAsset = ASSETS_TO_CACHE.includes(url.pathname) || 
                        url.pathname.startsWith('/css/') || 
                        url.pathname.startsWith('/js/') || 
                        url.pathname.startsWith('/assets/') ||
                        url.hostname.includes('fonts.googleapis.com') ||
                        url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // For other requests (like dynamic data/API), use Network First
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || new Response('Offline', { status: 503 })))
    );
  }
});
