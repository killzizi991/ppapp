const CACHE_NAME = 'work-calendar-final-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  console.log('Установка новой версии Service Worker v4');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кеширование ресурсов');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Все ресурсы успешно кешированы');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
      .catch(() => {
        if (event.request.url.endsWith('.html')) {
          return caches.match('/index.html');
        }
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncCalendarData());
  }
});

function syncCalendarData() {
  return Promise.resolve();
}

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
