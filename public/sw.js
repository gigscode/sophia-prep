// Sophia Prep Service Worker - Enhanced Caching Strategy
const CACHE_NAME = 'sophia-prep-v3';
const RUNTIME_CACHE = 'sophia-prep-runtime-v3';
const IMAGE_CACHE = 'sophia-prep-images-v3';
const STATIC_CACHE = 'sophia-prep-static-v3';

// Cache duration in milliseconds
const CACHE_DURATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 days
  RUNTIME: 24 * 60 * 60 * 1000, // 1 day
};

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/icons/icon-16x16.png',
  '/icons/icon-32x32.png',
  '/icons/icon-48x48.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/sophiahero2.png',
  '/sophialogo1.png',
  '/sophialogo2.png',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching essential assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return !currentCaches.includes(cacheName);
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine cache strategy
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Images - long-term cache
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    return { cacheName: IMAGE_CACHE, duration: CACHE_DURATION.IMAGES };
  }
  
  // Static assets (JS, CSS, fonts) - medium-term cache
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
    return { cacheName: STATIC_CACHE, duration: CACHE_DURATION.STATIC };
  }
  
  // Runtime cache for everything else
  return { cacheName: RUNTIME_CACHE, duration: CACHE_DURATION.RUNTIME };
}

// Helper function to check if cached response is still fresh
function isCacheFresh(response, duration) {
  if (!response) return false;
  
  const cachedTime = response.headers.get('sw-cache-time');
  if (!cachedTime) return true; // If no timestamp, assume fresh
  
  const age = Date.now() - parseInt(cachedTime, 10);
  return age < duration;
}

// Fetch event - enhanced caching strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const strategy = getCacheStrategy(event.request);
      
      // Check if cached response is still fresh
      if (cachedResponse && isCacheFresh(cachedResponse, strategy.duration)) {
        return cachedResponse;
      }

      // Fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response before caching
        const responseToCache = response.clone();
        
        // Add timestamp header for cache freshness check
        const headers = new Headers(response.headers);
        headers.append('sw-cache-time', Date.now().toString());
        
        const modifiedResponse = new Response(responseToCache.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers,
        });

        // Cache the response
        caches.open(strategy.cacheName).then((cache) => {
          cache.put(event.request, modifiedResponse);
        });

        return response;
      }).catch(() => {
        // Return cached response even if stale, or offline page
        if (cachedResponse) {
          return cachedResponse;
        }
        
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

