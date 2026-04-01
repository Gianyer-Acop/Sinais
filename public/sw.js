// Service Worker - Nossos Sinais (V19.7)
const CACHE_NAME = 'nossos-sinais-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Estratégia: Network First (sempre tenta buscar do servidor)
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET e do Supabase/API
  if (event.request.method !== 'GET' || event.request.url.includes('supabase')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Notificações via Push (enviadas pelo showNotification do app principal)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se o app já está aberto, focar nele
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // Senão, abrir uma nova aba
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// ESCUTAR O COMANDO DE ATUALIZAÇÃO (SKIP_WAITING)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW: Ativando nova versão agora...');
    self.skipWaiting();
  }
});
