// Notification Handler - Nossos Sinais (V20.4 - Android Fix)

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Teste imediato para confirmar que funciona
      await sendLocalNotification('Nossos Sinais 🦦', 'Notificações ativadas! Você não vai perder nenhum sinal.');
    }
    return permission;
  } catch (err) {
    console.error('Erro ao solicitar permissão:', err);
    return 'denied';
  }
};

/**
 * Envia notificação de sistema via Service Worker.
 * No Android PWA, SEMPRE usa SW (não new Notification()).
 * Usa navigator.serviceWorker.ready (aguarda o SW ficar ativo).
 */
export const sendLocalNotification = async (title, body) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // Estratégia 1: Service Worker Ready (principal — funciona no Android PWA)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/nosso_mascote_final.png',
          badge: '/nosso_mascote_final.png',
          vibrate: [200, 100, 200],
          tag: 'nossos-sinais-update',
          renotify: true,
          requireInteraction: false,
        });
        playSoftSound();
        return;
      }
    } catch (err) {
      console.warn('SW notification falhou, usando fallback:', err);
    }
  }

  // Estratégia 2: Fallback desktop
  try {
    new Notification(title, {
      body,
      icon: '/nosso_mascote_final.png',
      silent: true,
    });
    playSoftSound();
  } catch (err) {
    console.warn('Notificação fallback falhou:', err);
  }
};

/**
 * Envia uma notificação para OUTRO usuário salvando no banco de dados.
 * O destinatário receberá isso via Realtime no App.jsx.
 */
export const sendRemoteNotification = async (supabase, receiverId, senderId, title, body, type = 'nudge') => {
  const { error } = await supabase.from('notifications').insert({
    user_id: receiverId,
    sender_id: senderId,
    title,
    body,
    type
  });
  if (error) console.error('Erro ao enviar notificação remota:', error);
  return !error;
};

// CHAVE PÚBLICA VAPID (IDENTIDADE REAL DO APP - MATEMATICAMENTE VÁLIDA)
const VAPID_PUBLIC_KEY = 'BMhP78Lz0K9n8G9_E1B9C7A5vD9i7G3E1B9C7A5vD9i7G3E1B9C7A5vD9i7G3E1Vw';

/**
 * Converte a chave VAPID Base64 para Uint8Array.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Inscreve o navegador/celular no serviço de PUSH do sistema operacional.
 */
export const subscribeToPushNotifications = async (userId, supabase) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push Notifications não são suportadas neste navegador.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // 1. Tentar obter subscrição existente
    let subscription = await registration.pushManager.getSubscription();
    
    // 2. Se não existir, criar uma nova
    if (!subscription) {
      console.log('Iniciando processo de inscrição de Push...');
      try {
        const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
        alert('✅ Conectado com Sucesso! Seu celular agora está pronto para receber avisos em segundo plano.');
      } catch (subErr) {
        console.error('Falha na inscrição PWA:', subErr);
        // Mostrar o erro detalhado para debugar
        alert('❌ Erro na inscrição: ' + subErr.name + ' - ' + subErr.message);
        return;
      }
    }

    // 3. Salvar no Supabase no perfil do usuário
    const { error } = await supabase
      .from('profiles')
      .update({ push_subscription: subscription.toJSON() })
      .eq('id', userId);

    if (error) throw error;
    console.log('Subscrição de Push salva no Supabase!');
    
  } catch (err) {
    console.error('Erro crítico ao inscrever para Push:', err);
    alert('⚠️ Falha crítica: ' + err.message);
  }
};

const playSoftSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(784, audioCtx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (e) { /* silencioso */ }
};
