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

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const isConfigComplete = requiredKeys.every(key => firebaseConfig[key]);

let app;
let auth;
let db;
let appId; // Declare appId here to be exported

if (isConfigComplete) {
    // Prevence re-inicializace na straně klienta (kvůli Next.js Fast Refresh)
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        console.log("Firebase: Aplikace inicializována.");
    } else {
        app = getApps()[0];
        console.log("Firebase: Aplikace již inicializována (používám existující instanci).");
    }
    auth = getAuth(app);
    db = getFirestore(app);
    appId = firebaseConfig.appId; // Assign appId here

    console.log("Firebase: Auth instance:", auth ? 'OK' : 'NULL/UNDEFINED');
    console.log("Firebase: Firestore instance:", db ? 'OK' : 'NULL/UNDEFINED');
    console.log("Firebase: App ID:", appId);

} else {
    console.warn("Firebase: Konfigurace je neúplná. Firebase funkce nebudou dostupné.");
    // Zde je důležité zajistit, že auth a db jsou undefined, pokud konfigurace chybí
    // Nicméně, let deklarace to již zajistí, pokud nejsou inicializovány.
}

export { auth, db, appId, isConfigComplete };