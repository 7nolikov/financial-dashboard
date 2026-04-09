// Financial Life Tracker — Service Worker
// Strategy: Cache-first for static assets, network-first for HTML (ensures updates land).
const CACHE = 'flt-v1';
const STATIC_ASSETS = [
  '/financial-dashboard/',
  '/financial-dashboard/index.html',
  '/financial-dashboard/manifest.json',
  '/financial-dashboard/og-image.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only intercept same-origin requests.
  if (url.origin !== location.origin) return;

  // HTML: network-first so the app always gets fresh code on reload.
  if (request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request)
        .then((res) => { caches.open(CACHE).then((c) => c.put(request, res.clone())); return res; })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Everything else: cache-first (JS/CSS bundles have hashed filenames).
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
        return res;
      });
    }),
  );
});
