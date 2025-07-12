'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore'; 
import { firebaseConfig } from '../lib/firebase'; // Získání konfigurace z nového zjednodušeného souboru
import { getSupabase } from '../lib/supabaseClient'; 

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const supabase = getSupabase(); 

  // Lokální stavy pro Firebase instance
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [firebaseAuth, setFirebaseAuth] = useState(null);
  const [firestoreDb, setFirestoreDb] = useState(null);
  const [firebaseAppId, setFirebaseAppId] = useState(null);

  // Funkce pro aktualizaci profilu (používá lokální firestoreDb)
  const updateUserProfile = async (uid, updates) => {
    if (!firestoreDb || !firebaseAppId) {
        console.error("updateUserProfile: Firestore nebo App ID není k dispozici.");
        throw new Error("Firestore or App ID not available for profile update.");
    }
    const userProfileRef = doc(firestoreDb, `artifacts/${firebaseAppId}/public/data/user_profiles`, uid);
    await updateDoc(userProfileRef, updates);
    setCurrentUserProfile(prev => ({ ...prev, ...updates }));
  };

  // KLÍČOVÝ useEffect pro inicializaci Firebase a nastavení listenerů
  useEffect(() => {
    console.log('AuthContext: useEffect inicializace spuštěn.'); // Zcela na začátku useEffectu
    let app, authInstance, dbInstance, currentAppId;
    let unsubscribeAuthListener, unsubscribeUsersListener; // Pro správný cleanup

    // Zkontrolujeme, zda je konfigurace kompletní (kvůli proměnným prostředí)
    const isConfigComplete = ['apiKey', 'authDomain', 'projectId', 'appId'].every(key => firebaseConfig[key]);
    if (!isConfigComplete) {
        console.error("AuthContext: Firebase konfigurace je neúplná (chybí ENV proměnné). Nelze inicializovat Firebase.");
        setLoading(false); // Okamžité ukončení načítání, pokud chybí konfigurace
        return;
    }

    try {
        console.log('AuthContext: Pokus o inicializaci Firebase aplikace.');
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
            console.log("AuthContext: Nová Firebase aplikace inicializována.");
        } else {
            app = getApps()[0];
            console.log("AuthContext: Používám existující instanci Firebase aplikace.");
        }

        authInstance = getAuth(app);
        dbInstance = getFirestore(app);
        currentAppId = firebaseConfig.appId;

        setFirebaseApp(app);
        setFirebaseAuth(authInstance);
        setFirestoreDb(dbInstance);
        setFirebaseAppId(currentAppId);

        console.log('AuthContext: Firebase instance nastaveny (auth, db, appId).');
        console.log('AuthContext: Registruji onAuthStateChanged listener.');
        
        // Setup onAuthStateChanged listener
        unsubscribeAuthListener = onAuthStateChanged(authInstance, async (user) => {
            console.log('AuthContext: onAuthStateChanged callback spuštěn. Uživatel:', user ? user.email : 'null (odhlášen)');
            try {
                if (user) {
                    setCurrentUser(user);
                    console.log('AuthContext: Uživatel přihlášen, UID:', user.uid);

                    const userProfileRef = doc(dbInstance, `artifacts/${currentAppId}/public/data/user_profiles`, user.uid);
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
                    const usersColRef = collection(dbInstance, `artifacts/${currentAppId}/public/data/user_profiles`);
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
                // KLÍČOVÁ ZMĚNA: setLoading(false) je voláno VŽDY na konci, i při chybách,
                // aby se aplikace neodsekla ve stavu "Načítání..."
                console.log('AuthContext: onAuthStateChanged callback dokončen, nastavuji loading na false.');
                setLoading(false); 
            }
        });

    } catch (error) {
        console.error("AuthContext: Hlavní chyba v useEffectu při inicializaci Firebase/nastavení listeneru (zachycelo try-catch):", error);
        setLoading(false); // Zajistit, že loading se přepne na false i při chybě inicializace
    }

    // Odstraníme timeout, který se zasekával, protože useEffect se nespustil.
    // Nyní by se měl setLoading(false) spustit v 'finally' bloku onAuthStateChanged.
    // Můžeme ho znovu přidat, pokud se ukáže, že onAuthStateChanged stále nedoběhne.

    return () => {
      console.log('AuthContext: odhlašuji listenery (cleanup).');
      if (unsubscribeAuthListener) unsubscribeAuthListener();
      if (unsubscribeUsersListener) unsubscribeUsersListener();
    };
  }, []); // Prázdné pole závislostí: spustí se jen jednou při mountu


  const login = (email, password) => signInWithEmailAndPassword(firebaseAuth, email, password); 
  const register = (email, password) => createUserWithEmailAndPassword(firebaseAuth, email, password); 
  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(firebaseAuth, provider); 
  };

  const logout = async () => {
    console.log('AuthContext: Pokus o odhlášení. Instance Firebase auth:', firebaseAuth);
    try {
      if (firebaseAuth) { 
        await signOut(firebaseAuth);
        console.log('AuthContext: signOut úspěšné.');
      } else {
        console.error('AuthContext: Instance Firebase auth je undefined, nelze se odhlásit.');
      }
    } catch (error) {
      console.error('AuthContext: Chyba během signOut:', error);
    }
  };

  const value = { currentUser, currentUserProfile, loading, login, register, googleSignIn, logout, db: firestoreDb, appId: firebaseAppId, allUsers, updateUserProfile, supabase };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};