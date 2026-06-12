import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const activeConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || firebaseConfig?.appId,
  firestoreDatabaseId: (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || firebaseConfig?.firestoreDatabaseId || '(default)'
};

let firebaseApp;
let firestoreDb: any = null;
let firebaseAuth: any = null;
let isConfigured = false;

if (activeConfig && activeConfig.apiKey && activeConfig.projectId && activeConfig.projectId !== 'placeholder-id') {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    firestoreDb = getFirestore(firebaseApp, activeConfig.firestoreDatabaseId === '(default)' ? undefined : activeConfig.firestoreDatabaseId);
    firebaseAuth = getAuth(firebaseApp);
    isConfigured = true;
    console.log('Firebase successfully initialized with active config.');
  } catch (err) {
    console.warn('Firebase initialization error, operating in sandbox mode:', err);
  }
} else {
  console.log('Firebase operating in Sandbox Mode. Local storage fallback is enabled.');
}

export const app = firebaseApp;
export const db = firestoreDb;
export const auth = firebaseAuth;
export const isFirebaseConfigured = isConfigured;
export const rawConfig = activeConfig;
