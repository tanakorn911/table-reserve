/**
 * Service Worker for TableReserve PWA
 * Provides offline caching and improved performance
 */

const CACHE_NAME = 'tablereserve-v1';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/landing-page',
    '/reservation-form',
    '/check-status',
    '/manifest.json',
    '/logo.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // Take control immediately
    self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API requests (always fetch from network)
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response for caching
                const responseToCache = response.clone();

                // Cache successful responses
                if (response.status === 200) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Return offline fallback for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }

                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable',
                    });
                });
            })
    );
});

// Push notification event (for future use)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'มีการแจ้งเตือนใหม่',
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/',
            },
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'TableReserve', options)
        );
    }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            // Focus existing window if available
            for (const client of clients) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});

console.log('[SW] Service Worker loaded');
