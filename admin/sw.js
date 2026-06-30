/* Service Worker · Alvatowash Admin (PWA) */
const CACHE = 'alvatowash-admin-v1';
const ASSETS = ['./','./index-pro.html','./manifest.json','./icon.svg','../config.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  // Network-only para llamadas al backend (no cachear datos vivos)
  if (url.includes('script.google.com') || url.includes('script.googleusercontent.com')) return;

  // Network-first con fallback a cache para todo lo demás
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(()=>{});
        }
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index-pro.html')))
  );
});
