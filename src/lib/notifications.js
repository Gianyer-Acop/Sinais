/**
 * NOSSASINAIS - Módulo de Notificações Híbrido (Camaleão)
 * ========================================================
 * Detecta automaticamente se está no APK (Capacitor) ou Web (PWA)
 * e usa a tecnologia certa para cada plataforma.
 *
 * ⚠️ IMPORTANTE: LocalNotifications é importado de forma LAZY (sob demanda)
 * para evitar crash no browser quando o plugin nativo não está disponível.
 */

import { Capacitor } from '@capacitor/core';

// Chave pública VAPID para Web Push
export const VAPID_PUBLIC_KEY = 'BBTNWQcJCboY1aCKaVFi1CObff-1VyGQaYLy5umIleop4OVb31Tx8Krw4iYJmvfcKnY0PAiTwIEOLX6jjnBpPN0';

/** Verifica se está rodando como APK nativo */
export const isNativePlatform = () => {
  const result = Capacitor.isNativePlatform();
  console.log('[Plataforma] É nativa?', result);
  return result;
};

/**
 * Envia notificação remota ao parceiro via Supabase Edge Function
 */
export async function sendRemoteNotification(supabase, recipientId, senderId, title, body, type = 'signal') {
  try {
    const { error } = await supabase.functions.invoke('send-push', {
      body: { record: { user_id: recipientId, sender_id: senderId, title, body, type } }
    });
    if (error) console.error('[Push Remoto] Erro:', error);
    else console.log('[Push Remoto] Enviado com sucesso.');
  } catch (err) {
    console.error('[Push Remoto] Erro inesperado:', err);
  }
}

/**
 * Solicita permissão de notificação — Web ou Nativo
 */
export async function requestNotificationPermission() {
  try {
    if (isNativePlatform()) {
      // Modo APK: importação lazy do plugin nativo
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.requestPermissions();
      console.log('[APK] Permissão:', result.display);
      return result.display === 'granted' ? 'granted' : 'denied';
    } else {
      // Modo Web
      if (typeof Notification === 'undefined') return 'denied';
      const permission = await Notification.requestPermission();
      console.log('[Web] Permissão:', permission);
      return permission;
    }
  } catch (err) {
    console.error('[Notificação] Erro ao solicitar permissão:', err);
    return 'denied';
  }
}

/**
 * Envia notificação local — Web ou Nativo
 */
export async function sendLocalNotification(title, body, options = {}) {
  try {
    if (isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          title, body,
          id: Math.floor(Math.random() * 100000),
          extra: options.data || null,
        }]
      });
      console.log('[APK] Notificação local enviada.');
    } else {
      if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return;
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/nosso_mascote_final.png',
        badge: '/nosso_mascote_final.png',
        vibrate: [500, 100, 500],
        tag: 'sinais-alerta-v34',
        renotify: true,
        requireInteraction: true,
        ...options
      });
      console.log('[Web] Notificação via Service Worker enviada.');
    }
  } catch (err) {
    console.error('[Notificação] Erro ao enviar:', err);
  }
}

/**
 * Registra listeners de toque na notificação nativa (APK only)
 */
export async function setupNativeNotificationListeners(onNotificationClicked) {
  if (!isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('[APK] Notificação clicada:', notification);
      if (onNotificationClicked) onNotificationClicked(notification);
    });
  } catch (err) {
    console.error('[APK] Erro ao configurar listeners:', err);
  }
}

/**
 * Subscrição Push Web (Web/PWA only)
 */
export async function subscribeToPushNotifications(userId, supabase) {
  if (isNativePlatform()) {
    console.log('[APK] Push Web não necessário no modo nativo.');
    return;
  }
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ push_subscription: subscription })
      .eq('id', userId);

    if (error) console.error('[Web] Erro ao salvar subscription:', error);
    else console.log('[Web] Push subscription salva com sucesso!');
  } catch (err) {
    console.error('[Web] Erro ao subscrever push:', err);
  }
}
