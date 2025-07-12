'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app'; // NOVÝ IMPORT
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // NOVÝ IMPORT
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore'; // NOVÝ IMPORT
import { firebaseConfig, isConfigComplete } from '../lib/firebase'; // Získání konfigurace
import { getSupabase } from '../lib/supabaseClient'; 

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const supabase = getSupabase(); 

  // Nové lokální stavy pro Firebase instance
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [firebaseAuth, setFirebaseAuth] = useState(null);
  const [firestoreDb, setFirestoreDb] = useState(null);
  const [firebaseAppId, setFirebaseAppId] = useState(null);


  // Funkce pro aktualizaci profilu (používá lokální firestoreDb)
  const updateUserProfile = async (uid, updates) => {
    if (!firestoreDb || !firebaseAppId) throw new Error("Firestore or App ID not available.");
    const userProfileRef = doc(firestoreDb, `artifacts/${firebaseAppId}/public/data/user_profiles`, uid);
    await updateDoc(userProfileRef, updates);
    setCurrentUserProfile(prev => ({ ...prev, ...updates }));
  };

  // KLÍČOVÝ useEffect pro inicializaci Firebase a nastavení listenerů
  useEffect(() => {
    let app, authInstance, dbInstance, currentAppId;
    let unsubscribeAuthListener, unsubscribeUsersListener; // Pro správný cleanup

    if (!isConfigComplete) {
        console.error("AuthContext: Firebase konfigurace je neúplná, nelze inicializovat.");
        setLoading(false); // Okamžité ukončení načítání, pokud chybí konfigurace
        return;
    }

    try {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
            console.log("AuthContext: Firebase aplikace inicializována.");
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

        console.log('AuthContext: Firebase instance nastaveny. Registruji onAuthStateChanged listener.');
        
        // Setup onAuthStateChanged listener
        unsubscribeAuthListener = onAuthStateChanged(authInstance, async (user) => {
            console.log('AuthContext: onAuthStateChanged callback spuštěn. Uživatel:', user ? user.email : 'null (odhlášen)');
            try {
                if (user) {
                    setCurrentUser(user);
                    console.log('AuthContext: Uživatel přihlášen, UID:', user.uid);

                    const userProfileRef = doc(dbInstance, `artifacts/${currentAppId}/public/data/user_profiles`, user.uid);
                    const userProfileSnap = await getDoc(userProfileRef);

                    if (userProfileSnap.exists()) {
                        setCurrentUserProfile({ uid: user.uid, ...userProfileSnap.data() });
                        console.log('AuthContext: Profil uživatele načten.');
                    } else {
                        const newProfile = { email: user.email, displayName: user.email.split('@')[0], function: '', isAdmin: false, createdAt: new Date().toISOString() };
                        await setDoc(userProfileRef, newProfile);
                        setCurrentUserProfile(newProfile);
                        console.log('AuthContext: Nový profil uživatele vytvořen.');
                    }

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
                console.error("AuthContext: Chyba uvnitř onAuthStateChanged callbacku (uživatelský profil/uživatelé):", error);
            } finally {
                console.log('AuthContext: onAuthStateChanged callback dokončen, nastavuji loading na false.');
                setLoading(false); // VŽDY se přepne na false na konci
            }
        });

    } catch (error) {
        console.error("AuthContext: Hlavní chyba v useEffectu při inicializaci Firebase/nastavení listeneru:", error);
        setLoading(false); // Zajistit, že loading se přepne na false i při chybě inicializace
    }

    // Cleanup funkce pro odhlášení listenerů při unmountu komponenty
    return () => {
        console.log('AuthContext: odhlašuji listenery.');
        if (unsubscribeAuthListener) unsubscribeAuthListener();
        if (unsubscribeUsersListener) unsubscribeUsersListener();
    };
  }, []); // Prázdné pole závislostí: spustí se jen jednou při mountu

  const login = (email, password) => signInWithEmailAndPassword(firebaseAuth, email, password); // Používá lokální firebaseAuth
  const register = (email, password) => createUserWithEmailAndPassword(firebaseAuth, email, password); // Používá lokální firebaseAuth
  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(firebaseAuth, provider); // Používá lokální firebaseAuth
  };

  const logout = async () => {
    console.log('AuthContext: Pokus o odhlášení. Instance Firebase auth:', firebaseAuth);
    try {
      if (firebaseAuth) { // Používá lokální firebaseAuth
        await signOut(firebaseAuth);
        console.log('AuthContext: signOut úspěšné.');
      } else {
        console.error('AuthContext: Instance Firebase auth je undefined, nelze se odhlásit.');
      }
    } catch (error) {
      console.error('AuthContext: Chyba během signOut:', error);
    }
  };

  const value = { currentUser, currentUserProfile, loading, login, register, googleSignIn, logout, db: firestoreDb, appId: firebaseAppId, allUsers, updateUserProfile, supabase }; // Exportujeme lokální instance

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};