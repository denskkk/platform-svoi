// Мінімальний service worker: лише показує сторінку "немає зв'язку" замість білого екрана
// або сірої сторінки браузера, коли сервер недоступний (нема інтернету, перезапуск при оновленні).
// Нічого іншого не кешує, тому не може показати застарілу версію сайту.
const OFFLINE_URL = '/offline.html';
const CACHE = 'sviy-offline-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.mode !== 'navigate' || request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 502/503/504 — nginx або Next.js тимчасово недоступні (наприклад, йде перезапуск)
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          return caches.match(OFFLINE_URL).then((offline) => offline || response);
        }
        return response;
      })
      .catch(() => caches.match(OFFLINE_URL).then((offline) => offline || Response.error()))
  );
});
