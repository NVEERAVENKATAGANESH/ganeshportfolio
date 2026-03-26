'use strict';
const CACHE = 'portfolio-v2';
const OFFLINE = [
  '/',
  '/index.html',
  '/gallery.html',
  '/404.html',
  '/css/tokens.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/main.js',
  '/js/gallery.js',
  '/js/nav.js',
  '/js/animations.js',
  '/js/background.js',
  '/manifest.webmanifest',
  '/images/Headshot.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isNavigation = e.request.mode === 'navigate';
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Server returned 404 or error for a page navigation → serve 404.html
        if (isNavigation && (!res || res.status === 404 || res.status >= 500)) {
          return caches.match('/404.html');
        }
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Network failure — serve 404.html for page navigations, nothing for assets
        if (isNavigation) return caches.match('/404.html');
      });
    })
  );
});
