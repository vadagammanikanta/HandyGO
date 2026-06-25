import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * FCMManager — a render-less component that:
 *  1. Requests notification permission after the user logs in.
 *  2. Retrieves the FCM device token and sends it to the backend.
 *  3. Listens for foreground push messages.
 *
 * Render this component once inside the provider tree in App.jsx.
 */
const FCMManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let unsubscribeForeground = null;

    const initFCM = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      try {
        // 1. Ask for notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.info('[FCM] Notification permission denied.');
          return;
        }

        // 2. Register the service worker explicitly so Vite doesn't conflict
        const registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' }
        );

        // 3. Get the FCM device token
        const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

        if (token) {
          console.info('[FCM] Token obtained:', token.slice(0, 20) + '…');
          // Send token to backend so server can target this device
          await api.post('/users/fcm-token', { token }).catch(() => {
            // Non-critical — don't throw if backend endpoint isn't ready yet
            console.warn('[FCM] Backend /users/fcm-token endpoint not ready.');
          });
        }

        // 4. Handle foreground push messages (app is open)
        unsubscribeForeground = onMessage(messaging, (payload) => {
          console.log('[FCM] Foreground message:', payload);
          // Dispatch a browser Notification manually since service worker
          // won't intercept foreground messages automatically
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'HandyGO', {
              body: payload.notification?.body,
              icon: '/icon-192.png',
            });
          }
        });
      } catch (err) {
        console.error('[FCM] Initialisation error:', err);
      }
    };

    initFCM();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, [user]);

  return null;
};

export default FCMManager;
