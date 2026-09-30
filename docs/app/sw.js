// Offline support: the app shell is cached up front, pet photos the first time they're shown.
const VERSION = '1.2.0-munjqfx7';
const SHELL = `petdock-shell-${VERSION}`;
const PHOTOS = 'petdock-photos';
const FILES = [
  './', 'index.html', 'app.css', 'app.js', 'pet-engine.js', 'store.js', 'config.js', 'manifest.webmanifest',
  'shared/pets.js', 'shared/phrases.js', 'shared/feelings.js', 'shared/paper.js', 'pets/manifest.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((k) => k.startsWith('petdock-shell-') && k !== SHELL).map((k) => caches.delete(k)),
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // the catalog and downloads always go to the network (they have their own checks)
  if (/\/(catalog|latest)\.json$|\.pdpet$/.test(url.pathname)) return;
  if (url.pathname.includes('/pets/') && url.pathname.endsWith('.webp')) {
    e.respondWith(caches.open(PHOTOS).then(async (c) => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
