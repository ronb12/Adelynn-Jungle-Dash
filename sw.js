const CACHE_NAME = 'jungle-dash-v1';
const urlsToCache = [
  '/',
  '/mainmenu.html',
  '/index.html',
  '/style.css',
  '/game.js',
  '/manifest.json',
  '/sprites/coin.png',
  '/sprites/player_run.png',
  '/sprites/obstacle.png',
  '/sprites/obstacle2.png',
  '/sprites/obstacle3.png',
  '/sprites/jungle_bg.png',
  '/sprites/magnet.png',
  '/sprites/shield.png',
  '/sprites/pwa_coin_192.png',
  '/sprites/pwa_coin_512.png',
  '/audio/coin.ogg',
  '/audio/coin.wav',
  '/audio/jump.ogg',
  '/audio/jump.wav'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event
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