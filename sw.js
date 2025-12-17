const CACHE_NAME = 'done-app-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './services/storage.ts',
  './services/i18n.ts',
  './services/geminiService.ts',
  './services/supabaseService.ts',
  './components/Timeline.tsx',
  './components/LogItem.tsx',
  './components/InputArea.tsx',
  './components/ExportModal.tsx',
  './components/ImportModal.tsx',
  './components/TrashModal.tsx',
  './components/SearchModal.tsx',
  './components/SyncConfigModal.tsx',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://aistudiocdn.com/lucide-react@^0.555.0',
  'https://aistudiocdn.com/react@^19.2.0/',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/@google/genai@^1.30.0',
  'https://esm.sh/@supabase/supabase-js@2.39.3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentionally use individual add calls so one failure doesn't break the whole PWA
      const promises = ASSETS_TO_CACHE.map(url => 
        cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
      );
      return Promise.all(promises);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests that aren't in our allowed list or basic gets
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Basic check for valid response
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors' && response.type !== 'opaque') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
            cache.put(event.request, responseToCache);
          } catch (e) {
            // Quota exceeded or other error, ignore
          }
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});