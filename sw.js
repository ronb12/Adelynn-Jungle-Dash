const CACHE_NAME = 'jungle-dash-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/mainmenu.html',
  '/game.html',
  '/style.css',
  '/game.js',
  '/manifest.json',
  '/sprites/jungle_girl.png',
  '/sprites/monkey_sidekick.png',
  '/sprites/coin.png',
  '/sprites/obstacle_log.png',
  '/sprites/jungle_bg.png',
  '/audio/jump.wav',
  '/audio/coin.wav',
  '/audio/gameover.wav',
  '/audio/bg_music.mp3',
  '/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
}); 