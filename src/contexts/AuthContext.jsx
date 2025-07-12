'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase'; // Ujisti se, že tato cesta je správná
import { getSupabase } from '../lib/supabaseClient'; // Ujisti se, že tato cesta je správná

export const AuthContext = createContext(null);

// Vlastní hook pro snazší použití kontextu
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    // Stavy pro data
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true); // Začínáme s načítáním

    // Stavy pro Firebase instance
    const [authInstance, setAuthInstance] = useState(null);
    const [dbInstance, setDbInstance] = useState(null);
    const [appId, setAppId] = useState(null);
    
    const supabase = getSupabase();

    // Tento useEffect se spustí jen jednou na klientovi
    useEffect(() => {
        // Inicializace Firebase aplikace
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        
        // Získání a nastavení instancí
        const auth = getAuth(app);
        const db = getFirestore(app);
        setAuthInstance(auth);
        setDbInstance(db);
        setAppId(firebaseConfig.appId);

        // Listener na změnu stavu přihlášení
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                const userProfileRef = doc(db, `artifacts/${firebaseConfig.appId}/public/data/user_profiles`, user.uid);
                const userProfileSnap = await getDoc(userProfileRef);

                if (userProfileSnap.exists()) {
                    setCurrentUserProfile({ uid: user.uid, ...userProfileSnap.data() });
                } else {
                    const newProfile = { email: user.email, displayName: user.email.split('@')[0], function: '', isAdmin: false, createdAt: new Date().toISOString() };
                    await setDoc(userProfileRef, newProfile);
                    setCurrentUserProfile(newProfile);
                }
            } else {
                setCurrentUser(null);
                setCurrentUserProfile(null);
            }
            // Až po ověření stavu přihlášení ukončíme načítání
            setLoading(false);
        });

        // Cleanup funkce pro odhlášení listeneru při odmontování komponenty
        return () => unsubscribe();
    }, []); // Prázdné pole závislostí zajistí spuštění pouze jednou

    // Listener pro načítání všech uživatelů (spustí se po úspěšném přihlášení)
    useEffect(() => {
        if (currentUser && dbInstance && appId) {
            const usersColRef = collection(dbInstance, `artifacts/${appId}/public/data/user_profiles`);
            const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
                const fetchedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
                setAllUsers(fetchedUsers);
            });
            return () => unsubscribeUsers();
        } else {
            setAllUsers([]); // Vyčistit uživatele při odhlášení
        }
    }, [currentUser, dbInstance, appId]);

    // Funkce pro aktualizaci profilu
    const updateUserProfile = async (uid, updates) => {
        if (!dbInstance) throw new Error("Firestore není inicializováno.");
        const userProfileRef = doc(dbInstance, `artifacts/${appId}/public/data/user_profiles`, uid);
        await updateDoc(userProfileRef, updates);
        setCurrentUserProfile(prev => ({ ...prev, ...updates }));
    };

    // Definuje funkce, které bude kontext poskytovat
    const value = {
        currentUser,
        currentUserProfile,
        loading,
        allUsers,
        db: dbInstance,
        appId,
        supabase,
        login: (email, password) => signInWithEmailAndPassword(authInstance, email, password),
        register: (email, password) => createUserWithEmailAndPassword(authInstance, email, password),
        googleSignIn: () => {
            const provider = new GoogleAuthProvider();
            return signInWithPopup(authInstance, provider);
        },
        logout: () => signOut(authInstance),
        updateUserProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};