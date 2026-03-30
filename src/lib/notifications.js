// Notification Handler for Nossos Sinais (V19.7 - Mobile Fix)

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error("Erro ao solicitar permissão:", err);
    return "denied";
  }
};

/**
 * Envia notificação via Service Worker (funciona no mobile/PWA)
 * Fallback para new Notification() se SW não estiver disponível
 */
export const sendLocalNotification = async (title, body) => {
  if (Notification.permission !== "granted") return;

  // Mobile (PWA): usar Service Worker para exibir a notificação
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/nosso_mascote_final.png',
        badge: '/nosso_mascote_final.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
        tag: 'nossos-sinais-update', // evita spam de notificações empilhadas
        renotify: true
      });
      playSoftSound();
      return;
    } catch (err) {
      console.warn("Falha ao usar SW para notificação, tentando fallback:", err);
    }
  }

  // Desktop / Fallback
  try {
    new Notification(title, {
      body,
      icon: '/nosso_mascote_final.png',
      silent: true
    });
    playSoftSound();
  } catch (err) {
    console.warn("Não foi possível exibir notificação:", err);
  }
};

const playSoftSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523, audioCtx.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(784, audioCtx.currentTime + 0.3); // G5

    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    // Silencioso - contexto de áudio pode não estar disponível
  }
};
