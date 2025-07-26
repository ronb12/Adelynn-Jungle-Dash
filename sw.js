const CACHE_NAME = 'jungle-dash-v4';

// Install event - simplified caching
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Don't try to cache anything during install - let fetch handle it
        return Promise.resolve();
      })
      .catch(err => {
        console.log('Cache open failed:', err);
        return Promise.resolve();
      })
  );
});

// Fetch event - cache on demand
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                console.log('Failed to cache response:', err);
              });

            return response;
          })
          .catch(err => {
            console.log('Fetch failed for:', event.request.url, err);
            // Return a fallback response for failed requests
            if (event.request.destination === 'image') {
              return new Response('', { status: 404 });
            }
            return new Response('', { status: 404 });
          });
      })
  );
});

// Activate event
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
}); 