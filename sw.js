// 4ty PWA - v4: korlátozott, biztonságos statikus cache
const CACHE_NAME = '4ty-static-v4';
const PRECACHE = ['/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(PRECACHE.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('4ty-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Külső API-k, bejelentkezés, admin, dinamikus HTML és navigáció: mindig hálózat.
  if (url.origin !== self.location.origin || request.mode === 'navigate' ||
      url.pathname.startsWith('/admin') ||
      url.pathname.includes('/rest/v1/') || url.pathname.includes('/functions/v1/')) return;
  // Csak saját statikus fájlok: hálózat elsőbbsége, offline esetben korábbi példány.
  if (!/^\/(?:js|css|images)\//.test(url.pathname) &&
      !['/manifest.json', '/logo.png'].includes(url.pathname)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      return Response.error();
    }
  })());
});
