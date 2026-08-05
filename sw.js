/* sw.js - Gold Squirrel Service Worker */

// ─── VERSION CONTROL ───
// Increment this version number every time you make changes
const CACHE_VERSION = 'v2'; // ← CHANGE THIS NUMBER FOR UPDATES
const CACHE_NAME = `gold-squirrel-scanner-${CACHE_VERSION}`;

// Assets to cache (be selective - don't cache HTML)
const ASSETS_TO_CACHE = [
    './manifest.json',
    './logo.png'
    // NOTE: index.html is NOT cached to ensure updates are always fetched
];

// ─── INSTALL ───
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // Force activation
});

// ─── ACTIVATE ───
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Delete all old caches
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            return caches.delete(key);
                        }
                    })
                );
            }),
            // Claim clients immediately
            self.clients.claim()
        ])
    );
});

// ─── FETCH: Network First Strategy ───
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // DON'T cache HTML files - always fetch from network
    if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Return fresh response
                    return response;
                })
                .catch(() => {
                    // Only fallback to cache if network fails
                    return caches.match(request);
                })
        );
        return;
    }

    // For assets (CSS, JS, images, etc.) - try cache first, then network
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached version, but update in background
                fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, networkResponse);
                            });
                        }
                    })
                    .catch(() => {});
                return cachedResponse;
            }

            // Not in cache - fetch from network
            return fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                    });
                }
                return networkResponse;
            });
        })
    );
});

// ─── BACKGROUND SYNC ───
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-scans') {
        event.waitUntil(syncScansToBackend());
    }
});

async function syncScansToBackend() {
    console.log('🔁 Background sync: sending queued scans to backend...');
    // TODO: read from IndexedDB or localStorage, POST to your Laravel API
}
