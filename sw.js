// Service Worker for Adelynn's Jungle Dash
const CACHE_NAME = 'adelynn-jungle-dash-v2';
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
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Try to cache files but don't fail if some don't work
        const cachePromises = urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.log(`Skipping cache for ${url}: ${err.message}`);
            return null; // Don't fail the entire cache operation
          });
        });
        return Promise.allSettled(cachePromises);
      })
      .then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`Cache installation complete: ${successful} successful, ${failed} failed`);
      })
      .catch(err => {
        console.log('Cache installation failed, but continuing:', err.message);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, just fetch from network
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
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
  // Take control immediately
  event.waitUntil(self.clients.claim());
}); 