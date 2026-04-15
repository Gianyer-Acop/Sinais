/**
 * NOSSASINAIS - Módulo de Notificações Nativas
 * =============================================
 * "Camaleão": Detecta automaticamente se está rodando como APK ou Web
 * e usa a tecnologia certa para cada plataforma.
 *
 * - WEB/PWA: usa o Service Worker + Web Push API (o que já tínhamos)
 * - APK/NATIVO: usa o @capacitor/local-notifications (acesso direto ao Android)
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Chave pública VAPID para Web Push
export const VAPID_PUBLIC_KEY = 'BBTNWQcJCboY1aCKaVFi1CObff-1VyGQaYLy5umIleop4OVb31Tx8Krw4iYJmvfcKnY0PAiTwIEOLX6jjnBpPN0';

/**
 * Verifica se está rodando como APK nativo (Android/iOS)
 */
export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Envia uma notificação remota via Supabase Edge Function
 * (Utilizada para notificar o PARCEIRO, funciona no Web e no APK)
 */
export async function sendRemoteNotification(supabase, recipientId, senderId, title, body, type = 'signal') {
  try {
    const { error } = await supabase.functions.invoke('send-push', {
      body: { 
        record: { 
          user_id: recipientId, 
          sender_id: senderId,
          title, 
          body,
          type
        } 
      }
    });
    if (error) console.error('[Push Remoto] Erro ao chamar Edge Function:', error);
    else console.log('[Push Remoto] Notificação enviada ao parceiro com sucesso.');
  } catch (err) {
    console.error('[Push Remoto] Erro inesperado:', err);
  }
}

/**
 * Solicita permissão de notificação - Web ou Nativo
 */
export async function requestNotificationPermission() {
  if (isNativePlatform()) {
    // Modo APK: usar a API nativa do Android
    const result = await LocalNotifications.requestPermissions();
    console.log('[Nativo] Permissão de notificação:', result.display);
    return result.display === 'granted' ? 'granted' : 'denied';
  } else {
    // Modo Web/PWA: usar a Web Notifications API
    const permission = await Notification.requestPermission();
    console.log('[Web] Permissão de notificação:', permission);
    return permission;
  }
}

/**
 * Envia uma notificação local imediata - Web ou Nativo
 * Esta é a função "Camaleão" principal do sistema
 */
export async function sendLocalNotification(title, body, options = {}) {
  if (isNativePlatform()) {
    // Modo APK: Notificação completamente nativa com vibração garantida
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: body,
            id: Math.floor(Math.random() * 100000),
            sound: options.sound || null,
            attachments: null,
            actionTypeId: '',
            extra: options.data || null,
            // No Android nativo, a vibração SEMPRE funciona
          }
        ]
      });
      console.log('[Nativo] Notificação local enviada com sucesso.');
    } catch (err) {
      console.error('[Nativo] Erro ao enviar notificação:', err);
    }
  } else {
    // Modo Web/PWA: usar o Service Worker
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body: body,
          icon: '/nosso_mascote_final.png',
          badge: '/nosso_mascote_final.png',
          vibrate: [500, 100, 500],
          tag: 'sinais-alerta-v34',
          renotify: true,
          requireInteraction: true,
          ...options
        });
        console.log('[Web] Notificação via Service Worker enviada.');
      } catch (err) {
        console.error('[Web] Erro no Service Worker:', err);
      }
    }
  }
}

/**
 * Registra listener de toque na notificação nativa
 * Quando o usuário toca no alerta, o App abre
 */
export function setupNativeNotificationListeners(onNotificationClicked) {
  if (!isNativePlatform()) return;

  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    console.log('[Nativo] Notificação clicada:', notification);
    if (onNotificationClicked) onNotificationClicked(notification);
  });
}

/**
 * Subscrição Push Web (só aplicável no modo Web/PWA)
 */
export async function subscribeToPushNotifications(userId, supabase) {
  if (isNativePlatform()) {
    console.log('[Nativo] No APK, as notificações são locais. Push Web não necessário.');
    return;
  }

  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Web] Push não suportado neste navegador.');
      return;
    }

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

    if (error) console.error('[Web] Erro ao salvar subscription no Supabase:', error);
    else console.log('[Web] Push subscription salva no Supabase com sucesso!');

  } catch (err) {
    console.error('[Web] Erro ao subscrever push:', err);
  }
}
