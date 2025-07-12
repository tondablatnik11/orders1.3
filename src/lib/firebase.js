// src/lib/firebase.js - ZJEDNODUŠENO
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const isConfigComplete = requiredKeys.every(key => firebaseConfig[key]);

if (!isConfigComplete) {
    console.warn("Firebase (lib): Konfigurace Firebase je neúplná. Firebase funkce nebudou dostupné.");
}

// Exportujeme pouze konfiguraci a flag o její kompletnosti
export { 
  firebaseConfig, 
  isConfigComplete 
};