const CACHE_NAME = 'jungle-dash-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/game.js',
  '/manifest.json',
  '/sprites/player.png',
  '/sprites/player_run.png',
  '/sprites/coin.png',
  '/sprites/obstacle.png',
  '/sprites/obstacle2.png',
  '/sprites/obstacle3.png',
  '/sprites/jungle_bg.png',
  '/sprites/magnet.png',
  '/sprites/shield.png',
  '/audio/coin.ogg',
  '/audio/jump.ogg'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
}); 