// Cambiá la versión para invalidar caché cuando actualices assets
const CACHE = 'gj-v1';

// Precaché de la “app shell”
const APP_SHELL = [
  './loginv2.html',
  './dashboardv3.html',
  './index-bbdd.html',
  './offline.html',

  // CSS
  './css/Loginv2.css',
  './css/Dashboardv3.css',
  './css/bbdd.css',

  // JS
  './js/Loginv2.js',
  './js/Dashboardv3.js',
  './js/scheduler-controller.js',
  './js/scheduler-modal.js',
  './js/scheduler-api.js',
  './js/bbdd.js',

  // Íconos PWA
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estrategia:
// - HTML → network-first, fallback a caché y luego offline.html
// - Assets (css/js/img locales) → stale-while-revalidate
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Controlamos solo recursos del mismo origen (tu repo)
  if (url.origin !== self.location.origin) return;

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(async () => {
        const cached = await caches.match(req);
        return cached || caches.match('./offline.html');
      })
    );
    return;
  }

  // Assets locales
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchProm = fetch(req).then(res => {
        caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fetchProm;
    })
  );
});
