const CACHE_NAME = ‘apex-v2’;
const ASSETS = [’./index.html’, ‘./manifest.json’];

// Install — cache core files
self.addEventListener(‘install’, (e) => {
e.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
);
self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener(‘activate’, (e) => {
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
)
);
self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener(‘fetch’, (e) => {
e.respondWith(
caches.match(e.request).then(cached => cached || fetch(e.request))
);
});

// Push notifications
self.addEventListener(‘push’, (e) => {
const data = e.data ? e.data.json() : { title: ‘APEX’, body: ‘Time to train.’ };
e.waitUntil(
self.registration.showNotification(data.title, {
body: data.body,
icon: ‘./icon-192.png’,
badge: ‘./icon-192.png’,
vibrate: [200, 100, 200],
tag: ‘apex-reminder’,
renotify: true,
})
);
});

// Notification click — open app
self.addEventListener(‘notificationclick’, (e) => {
e.notification.close();
e.waitUntil(
clients.matchAll({ type: ‘window’ }).then(clientList => {
for (const client of clientList) {
if (client.url.includes(‘index.html’) && ‘focus’ in client) return client.focus();
}
if (clients.openWindow) return clients.openWindow(’./index.html’);
})
);
});

// Scheduled reminder logic via periodic sync (if supported)
// Falls back to in-app toast reminders when app is open
self.addEventListener(‘periodicsync’, (e) => {
if (e.tag === ‘apex-reminders’) {
e.waitUntil(checkAndNotify());
}
});

async function checkAndNotify() {
const h = new Date().getHours();
const day = new Date().getDay();
let msg = null;
if (h === 10 || h === 15 || h === 20) msg = { title: ‘APEX’, body: ‘💧 Drink water’ };
if (h === 18) msg = { title: ‘APEX’, body: ‘🚶 Go for a walk’ };
if (day === 0 && h === 9) msg = { title: ‘APEX’, body: ‘📏 Log your measurements’ };
if (msg) {
await self.registration.showNotification(msg.title, {
body: msg.body,
icon: ‘./icon-192.png’,
tag: ‘apex-reminder’,
renotify: true,
});
}
}
