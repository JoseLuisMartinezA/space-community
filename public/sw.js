const CACHE_NAME = 'space-community-v2';

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete all old caches
                    return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim()) // Become the active service worker for all open clients
    );
});

self.addEventListener('fetch', (event) => {
    // Bypass cache and go straight to network to ensure fresh assets
    event.respondWith(fetch(event.request));
});
