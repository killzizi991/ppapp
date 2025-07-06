const CACHE_NAME = 'finance-tracker-v2';
const BASE_PATH = '/ppapp/';
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'styles.css',
  BASE_PATH + 'app.js',
  BASE_PATH + 'manifest.webmanifest',
  BASE_PATH + 'calendar.js',
  BASE_PATH + 'modal.js',
  BASE_PATH + 'report.js',
  BASE_PATH + 'storage.js',
  'https://cdnjs.cloudflare.com/ajax/libs/date-fns/2.29.3/date_fns.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэширование основных ресурсов');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Пропускаем запросы к другим источникам
  if (requestUrl.origin !== location.origin) return;
  
  // Для навигационных запросов
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(BASE_PATH + 'index.html'))
    );
    return;
  }
  
  // Для остальных запросов
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
