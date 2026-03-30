// Basic Service Worker for PWA - Nossos Sinais
const CACHE_NAME = 'nossos-sinais-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through strategy - apenas para permitir funcionamento offline básico
  event.respondWith(fetch(event.request));
});

// Listener para Push (Futuro)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'Nossos Sinais', body: 'Alguém está pensando em você! ❤️' };
  
  const options = {
    body: data.body,
    icon: '/nosso_mascote_final.png',
    badge: '/nosso_mascote_final.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
