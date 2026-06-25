import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyCDejic-EpLsE4pcdJiLw_VGwisPM4JtC8',
  authDomain: 'handygo-f675f.firebaseapp.com',
  projectId: 'handygo-f675f',
  storageBucket: 'handygo-f675f.firebasestorage.app',
  messagingSenderId: '782326444154',
  appId: '1:782326444154:web:aaefdd30a94a14b4ee0bc3',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Lazily initialise Firebase Messaging only in supported environments
 * (requires HTTPS + service-worker support).
 */
export const getFirebaseMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) return getMessaging(app);
  } catch (err) {
    console.warn('[Firebase] Messaging not supported in this environment:', err);
  }
  return null;
};

export default app;
