import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Zkontrolujeme, zda jsou všechny klíče přítomny
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const isConfigComplete = requiredKeys.every(key => firebaseConfig[key]);

let appInstance = null;
let authInstance = null;
let dbInstance = null;
let appIDValue = null;

if (isConfigComplete) {
    try {
        if (!getApps().length) {
            appInstance = initializeApp(firebaseConfig);
            console.log("Firebase (lib): Nová aplikace inicializována.");
        } else {
            appInstance = getApps()[0];
            console.log("Firebase (lib): Používám existující instanci aplikace.");
        }

        authInstance = getAuth(appInstance);
        dbInstance = getFirestore(appInstance);
        appIDValue = firebaseConfig.appId;

        console.log("Firebase (lib): Auth instance je:", authInstance ? 'OK' : 'NULL');
        console.log("Firebase (lib): Firestore instance je:", dbInstance ? 'OK' : 'NULL');
        console.log("Firebase (lib): App ID je:", appIDValue);

    } catch (error) {
        console.error("Firebase (lib): Chyba při inicializaci Firebase:", error);
        // Ensure instances are explicitly null on error
        appInstance = null;
        authInstance = null;
        dbInstance = null;
        appIDValue = null;
    }
} else {
    console.warn("Firebase (lib): Konfigurace Firebase je neúplná. Firebase funkce nebudou dostupné.");
}

// Exportujeme pojmenované instance
export { 
  authInstance as auth, 
  dbInstance as db, 
  appIDValue as appId, 
  isConfigComplete 
};