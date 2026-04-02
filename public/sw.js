const CACHE_NAME = 'nosso-sinal-v34';
const ASSETS = [
  '/',
  '/index.html',
  '/nosso_mascote_final.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Cache Aberto');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  const promise = (async () => {
    console.log('SW: Push detectado no fundo (V.34)');

    let title = 'Nossos Sinais 🦦';
    let body = 'Seu amor te enviou um sinal especial.';
    
    try {
      if (event.data) {
        const data = event.data.json();
        title = data.title || title;
        body = data.body || body;
      }
    } catch (e) {
      console.warn('SW: Usando fallback padrão.');
    }

    const options = {
      body: body,
      icon: '/nosso_mascote_final.png',
      badge: '/nosso_mascote_final.png',
      vibrate: [500, 100, 500],
      tag: 'sinais-alerta-v34', // NOVA TAG: Força o Android a resetar a categoria
      renotify: true,
      requireInteraction: true,
      priority: 'max',
      actions: [
        { action: 'open', title: 'Ver Agora 📱' },
        { action: 'love', title: 'Mandar Carinho ❤️' }
      ],
      data: { url: self.location.origin }
    };

    return self.registration.showNotification(title, options);
  })();

  event.waitUntil(promise);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'love') {
    event.waitUntil(clients.openWindow('/?action=love'));
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});
