const CACHE_NAME = 'jungle-dash-v2';
const urlsToCache = [
  '/',
  '/mainmenu.html',
  '/index.html',
  '/style.css',
  '/game.js',
  '/manifest.json',
  '/favicon.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Add files one by one with error handling
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.log(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(err => {
          console.log('Fetch failed for:', event.request.url, err);
          // Return a fallback response for failed requests
          if (event.request.destination === 'image') {
            return new Response('', { status: 404 });
          }
          return new Response('', { status: 404 });
        });
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