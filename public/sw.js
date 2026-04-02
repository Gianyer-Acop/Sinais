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

// ESCUTAR NOTIFICAÇÕES PUSH EM SEGUNDO PLANO (SISTEMA)
self.addEventListener('push', (event) => {
  console.log('SW: Push Evento Disparado!');
  
  // DICA DO MENTOR: Este fallback garante que vejamos algo mesmo se a criptografia falhar.
  const title = 'Gian enviou um sinal 🦦';
  let body = 'O sinal está sendo processado...';
  
  try {
    if (event.data) {
      const data = event.data.json();
      body = data.body || body;
    }
  } catch (e) {
    console.warn('SW: Erro ao ler payload (Criptografia pode estar ok, mas o JSON falhou)');
  }

  const options = {
    body: data.body,
    icon: '/nosso_mascote_final.png',
    badge: '/nosso_mascote_final.png',
    vibrate: [300, 100, 300],
    data: {
      url: '/'
    },
    actions: [
      { action: 'open', title: 'Ver Agora' }
    ],
    tag: 'nossos-sinais-push',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
