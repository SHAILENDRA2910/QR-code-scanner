/* sw.js - Gold Squirrel Service Worker */

const CACHE_NAME = 'gold-squirrel-scanner-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './logo.png'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // activate immediately
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// ─── Background Sync for offline scans (ready for backend) ───
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-scans') {
        event.waitUntil(syncScansToBackend());
    }
});

// Example function - replace with your actual backend API later
async function syncScansToBackend() {
    // This runs when the device comes back online
    console.log('🔁 Background sync: sending queued scans to backend...');
    // TODO: read from IndexedDB or localStorage, POST to your Laravel API
}