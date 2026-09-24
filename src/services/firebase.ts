import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import bundledConfig from '../../firebase-applet-config.json';

const activeConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || bundledConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || bundledConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || bundledConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || bundledConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || bundledConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || bundledConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (bundledConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)'
};

const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
const firestoreDbId = activeConfig.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, firestoreDbId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

export default app;
