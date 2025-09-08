const VERSION = 'v1';
const MAP_CACHE = `map-cache-${VERSION}`;

const CACHE_URL_PATTERNS = [
  'https://maps.geoapify.com/',
  'https://tile.geoapify.com/',
  'https://vector.geoapify.com/',
];

self.addEventListener('install', (event) => {
  // Skip waiting to enable updated SW quickly
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('map-cache-') && k !== MAP_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  if (!CACHE_URL_PATTERNS.some((p) => url.startsWith(p))) {
    return; // ignore other requests
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(MAP_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      // Only cache successful, basic or CORS responses
      if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached); // if network fails, fall back to cache

  return cached || fetchPromise;
}
