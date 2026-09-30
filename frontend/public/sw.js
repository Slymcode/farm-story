/* Farm Story service worker — prototype scope: offline APPLICATION SHELL only.
 * - Precaches the built app (HTML + hashed JS/CSS chunks + icons) so the app opens without a connection.
 * - Navigations: network first, falling back to the cached shell (single-page app).
 * - Hashed static assets: cache first.
 * - /api/* and anything cross-origin (map tiles, etc.) is NEVER cached or intercepted: data always comes from the
 *   network, so no stale farm data is shown and no write is ever queued or replayed offline.
 * The precache list and cache version placeholders below are filled in at build time by the plugin in vite.config.ts.
 */
const VERSION = '__VERSION__';
const CACHE = `farmstory-shell-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('farmstory-shell-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/') || PRECACHE.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
});
