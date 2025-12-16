// Use timestamp for cache versioning - updates on each deploy
const CACHE_VERSION = 'byu-virtual-card-' + Date.now();
const CACHE_NAME = 'byu-virtual-card-v2';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Opened cache:', CACHE_NAME);
        // Don't cache HTML/JS/CSS aggressively - use network-first
        return cache.addAll(['/manifest.json']);
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
      })
  );
  // Force activation immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old caches
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
  // Force immediate control
  self.clients.claim();
});

// Fetch event - network-first strategy for HTML/JS/CSS, cache for static assets
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isJS = url.pathname.endsWith('.js') || url.pathname.includes('/assets/');
  const isCSS = url.pathname.endsWith('.css');
  const isStatic = url.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/);

  // For HTML, JS, CSS - use network-first (always get fresh version)
  if (isHTML || isJS || isCSS) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network succeeds, return fresh response
          if (response && response.status === 200) {
            // Don't cache HTML/JS/CSS - always fetch fresh
            return response;
          }
          // Fallback to cache only if network fails
          return caches.match(event.request);
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Last resort: offline page
            if (isHTML) {
              return caches.match('/offline.html');
            }
          });
        })
    );
    return;
  }

  // For static assets - cache-first strategy
  if (isStatic) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // For API calls - network only, no caching
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Default: network-first
  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request))
  );
});

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncRequests());
  }
});

async function syncRequests() {
  // Implement background sync logic here
  console.log('Syncing requests...');
}

// Push notification support
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'BYU Payment System';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});

// Handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


