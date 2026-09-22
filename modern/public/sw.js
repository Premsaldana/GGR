const CACHE_NAME = 'ggr-admin-shell-v1';
const APP_SHELL = ['/admin', '/icon.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  // Never cache admin/API responses: reservation, payment, and invoice data must stay fresh.
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/')) {
    event.respondWith(fetch(request).catch(() => caches.match('/admin')));
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
