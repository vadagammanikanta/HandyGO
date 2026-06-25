// Firebase Cloud Messaging background message handler.
// This file MUST live at public/firebase-messaging-sw.js so the browser can
// register it as a service worker from the site root.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCDejic-EpLsE4pcdJiLw_VGwisPM4JtC8',
  authDomain: 'handygo-f675f.firebaseapp.com',
  projectId: 'handygo-f675f',
  storageBucket: 'handygo-f675f.firebasestorage.app',
  messagingSenderId: '782326444154',
  appId: '1:782326444154:web:aaefdd30a94a14b4ee0bc3',
});

const messaging = firebase.messaging();

// Handle messages received when the app is in the background / closed
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background FCM message received:', payload);

  const notificationTitle = payload.notification?.title || 'HandyGO';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update.',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data,
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Clicking the notification focuses or opens the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/home');
    })
  );
});
