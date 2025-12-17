const CACHE_NAME = 'done-app-v2';
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

// Install event: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache:', CACHE_NAME);
      // We use addAll but catch errors for individual files to prevent entire installation failure
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
            return cache.add(url).catch(err => console.warn('Failed to cache:', url, err));
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network first, then Cache (Stale-while-revalidate strategy for source files might be better, but Network First is safer for development)
self.addEventListener('fetch', (event) => {
  // Handle cross-origin requests or non-GET requests gracefully
  if (event.request.method !== 'GET') return;
  // Ignore unsupported schemes
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone and cache it
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors' && response.type !== 'opaque') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
             cache.put(event.request, responseToCache);
          } catch (err) {
             // Ignore cache errors
          }
        });

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});