/* Chess Clock service worker: caches the app so it works offline once installed.
   */
const C = 'chess-clock-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C).then(c => c.addAll(['./']).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const fonts = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !fonts) return;
  // Stale-while-revalidate: answer from cache instantly, refresh in the background.
  e.respondWith(caches.open(C).then(async c => {
    const hit = await c.match(r);
    const net = fetch(r)
      .then(res => { if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; })
      .catch(() => hit || c.match('./'));
    return hit || net;
  }));
});
