const CACHE_NAME = 'done-app-v2-prod';
// For a simple Vite app, we cache the shell. 
// The built JS/CSS files have hashes and will be cached by the browser's HTTP cache effectively.
// A more advanced setup would use vite-plugin-pwa to inject the precache manifest here.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached response if found
      if (cached) return cached;

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Optional: Cache runtime requests (like the built JS/CSS files)
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone and cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});