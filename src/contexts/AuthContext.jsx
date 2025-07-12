'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore'; 
import { firebaseConfig } from '../lib/firebase'; // Získání konfigurace
import { getSupabase } from '../lib/supabaseClient'; 

// --- AGRESIVNÍ INICIALIZACE NA ÚROVNI MODULU ---
// Cílem je zjistit, zda se Auth instance inicializuje, i když useEffect nefunguje
let appInstance = null;
let authInstance = null;
let dbInstance = null;
let appIDValue = null;

try {
    const isConfigComplete = ['apiKey', 'authDomain', 'projectId', 'appId'].every(key => firebaseConfig[key]);
    if (isConfigComplete) {
        if (!getApps().length) {
            appInstance = initializeApp(firebaseConfig);
            console.log("AuthContext (Modul): NOVÁ Firebase aplikace inicializována.");
        } else {
            appInstance = getApps()[0];
            console.log("AuthContext (Modul): POUŽÍVÁM EXISTUJÍCÍ instanci Firebase aplikace.");
        }
        authInstance = getAuth(appInstance);
        dbInstance = getFirestore(appInstance);
        appIDValue = firebaseConfig.appId;
        console.log("AuthContext (Modul): Auth instance je:", authInstance ? 'OK' : 'NULL');
        console.log("AuthContext (Modul): Firestore instance je:", dbInstance ? 'OK' : 'NULL');
    } else {
        console.error("AuthContext (Modul): Konfigurace Firebase je NEÚPLNÁ.");
    }
} catch (e) {
    console.error("AuthContext (Modul): FATÁLNÍ CHYBA při inicializaci Firebase na úrovni modulu:", e);
    // Explicitně vynulovat instance v případě chyby
    appInstance = null;
    authInstance = null;
    dbInstance = null;
    appIDValue = null;
}
// --- KONEC AGRESIVNÍ INICIALIZACE ---


export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const supabase = getSupabase(); 

  // Funkce pro aktualizaci profilu (používá lokální firestoreDb)
  const updateUserProfile = async (uid, updates) => {
    if (!dbInstance || !appIDValue) { // Používáme instance inicializované na úrovni modulu
        console.error("updateUserProfile: Firestore nebo App ID není k dispozici.");
        throw new Error("Firestore or App ID not available for profile update.");
    }
    const userProfileRef = doc(dbInstance, `artifacts/${appIDValue}/public/data/user_profiles`, uid);
    await updateDoc(userProfileRef, updates);
    setCurrentUserProfile(prev => ({ ...prev, ...updates }));
  };

  // KLÍČOVÝ useEffect pro nastavení listenerů
  useEffect(() => {
    console.log('AuthContext: useEffect spuštěn, registruji onAuthStateChanged listener.'); 
    let unsubscribeAuthListener, unsubscribeUsersListener; 

    // Kontrola, zda jsou instance Firebase inicializovány
    if (!authInstance || !dbInstance || !appIDValue) {
        console.error("AuthContext: Instance Auth/DB/App ID není dostupná. Přeskakuji nastavení listeneru.");
        setLoading(false); // Okamžité ukončení načítání, pokud instance chybí
        return;
    }

    try {
        // Setup onAuthStateChanged listener
        unsubscribeAuthListener = onAuthStateChanged(authInstance, async (user) => {
            console.log('AuthContext: onAuthStateChanged callback spuštěn. Uživatel:', user ? user.email : 'null (odhlášen)');
            try {
                if (user) {
                    setCurrentUser(user);
                    console.log('AuthContext: Uživatel přihlášen, UID:', user.uid);

                    const userProfileRef = doc(dbInstance, `artifacts/${appIDValue}/public/data/user_profiles`, user.uid);
                    console.log('AuthContext: Pokus o načtení profilu uživatele...');
                    const userProfileSnap = await getDoc(userProfileRef);

                    if (userProfileSnap.exists()) {
                        setCurrentUserProfile({ uid: user.uid, ...userProfileSnap.data() });
                        console.log('AuthContext: Profil uživatele načten.');
                    } else {
                        console.log('AuthContext: Profil uživatele nenalezen, vytvářím nový...');
                        const newProfile = { email: user.email, displayName: user.email.split('@')[0], function: '', isAdmin: false, createdAt: new Date().toISOString() };
                        await setDoc(userProfileRef, newProfile);
                        setCurrentUserProfile(newProfile);
                        console.log('AuthContext: Nový profil uživatele vytvořen.');
                    }

                    console.log('AuthContext: Spouštím načítání všech uživatelů...');
                    const usersColRef = collection(dbInstance, `artifacts/${appIDValue}/public/data/user_profiles`);
                    unsubscribeUsersListener = onSnapshot(usersColRef, (snapshot) => {
                        const fetchedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
                        setAllUsers(fetchedUsers);
                        console.log("AuthContext: Načten počet uživatelů pro allUsers:", fetchedUsers.length);
                    }, (error) => {
                        console.error("AuthContext: Chyba při načítání všech uživatelů:", error);
                        setAllUsers([]); 
                    });
                } else {
                    console.log('AuthContext: Žádný uživatel není přihlášen.');
                    setCurrentUser(null);
                    setCurrentUserProfile(null);
                    setAllUsers([]); 
                }
            } catch (error) {
                console.error("AuthContext: Chyba uvnitř onAuthStateChanged callbacku (profil/uživatelé):", error);
            } finally {
                console.log('AuthContext: onAuthStateChanged callback dokončen, nastavuji loading na false.');
                setLoading(false); 
            }
        });

    } catch (error) {
        console.error("AuthContext: Hlavní chyba v useEffectu při nastavování listeneru:", error);
        setLoading(false); 
    }

    return () => {
      console.log('AuthContext: odhlašuji listenery (cleanup).');
      if (unsubscribeAuthListener) unsubscribeAuthListener();
      if (unsubscribeUsersListener) unsubscribeUsersListener();
    };
  }, []); // Prázdné pole závislostí: spustí se jen jednou při mountu


  const login = (email, password) => signInWithEmailAndPassword(authInstance, email, password); // Používá instanci inicializovanou na úrovni modulu
  const register = (email, password) => createUserWithEmailAndPassword(authInstance, email, password); // Používá instanci inicializovanou na úrovni modulu
  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(authInstance, provider); // Používá instanci inicializovanou na úrovni modulu
  };

  const logout = async () => {
    console.log('AuthContext: Pokus o odhlášení. Instance Firebase auth:', authInstance);
    try {
      if (authInstance) { 
        await signOut(authInstance);
        console.log('AuthContext: signOut úspěšné.');
      } else {
        console.error('AuthContext: Instance Firebase auth je undefined, nelze se odhlásit.');
      }
    } catch (error) {
      console.error('AuthContext: Chyba během signOut:', error);
    }
  };

  const value = { currentUser, currentUserProfile, loading, login, register, googleSignIn, logout, db: dbInstance, appId: appIDValue, allUsers, updateUserProfile, supabase };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};