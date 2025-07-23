// Service Worker for Adelynn's Jungle Dash
const CACHE_NAME = 'adelynn-jungle-dash-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/game.js',
  '/style.css',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/sprites/player_run.png',
  '/sprites/coin.png',
  '/sprites/obstacle.png',
  '/sprites/obstacle2.png',
  '/sprites/obstacle3.png',
  '/sprites/jungle_bg.png',
  '/sprites/magnet.png',
  '/sprites/shield.png',
  '/audio/coin.wav',
  '/audio/jump.wav'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Cache files individually to avoid failures
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn('Failed to cache:', url, err);
              return null;
            })
          )
        );
      })
      .catch(err => {
        console.warn('Cache installation failed:', err);
      })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, return a fallback
        if (event.request.destination === 'image') {
          return new Response('', { status: 404 });
        }
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 