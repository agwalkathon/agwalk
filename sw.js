// Arcgate Walkathon 2026 - Service Worker v6 (network-only, no cache)
var CACHE_NAME = 'agwalk-v6';

self.addEventListener('install', function(event) {
  // Delete all old caches and activate immediately
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Network only - never serve from cache (bypasses browser cache for HTML documents)
self.addEventListener('fetch', function(event) {
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    try {
      var url = new URL(event.request.url);
      url.searchParams.set('_cb', Date.now());
      event.respondWith(
        fetch(url.toString()).catch(function() {
          return fetch(event.request);
        })
      );
    } catch (e) {
      event.respondWith(fetch(event.request));
    }
  } else {
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) { data = { title: 'Walkathon Alert', body: event.data ? event.data.text() : '' }; }
  var title   = data.title || 'Walkathon Alert';
  
  var origin = self.location.origin;
  var basePath = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/'));
  var iconUrl = origin + basePath + '/logo-icon.png';
  var fallbackUrl = origin + basePath + '/app.html';

  var options = {
    body:    data.body || '',
    icon:    iconUrl,
    badge:   iconUrl,
    vibrate: [200, 100, 200],
    data:    { url: data.url || fallbackUrl },
    actions: [{ action: 'open', title: 'View' }]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var origin = self.location.origin;
  var basePath = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/'));
  var fallbackUrl = origin + basePath + '/app.html';
  var url = (event.notification.data && event.notification.data.url) || fallbackUrl;
  event.waitUntil(clients.openWindow(url));
});
