// src/contexts/AuthContext.jsx
'use client';
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db, appId } from '../lib/firebase';
import { getSupabase } from '../lib/supabaseClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = getSupabase();

    useEffect(() => {
        // Tato funkce sleduje změny v přihlášení přes Firebase
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    // --- ZAČÁTEK FINÁLNÍ OPRAVY ---
                    // 1. Získáme čerstvý Firebase token. Funkce getIdToken se postará o jeho případné obnovení.
                    const token = await user.getIdToken(true);
                    
                    // 2. Nastavíme session pro Supabase klienta s tímto tokenem.
                    // Tímto krokem se Supabase dozví, že uživatel je přihlášený.
                    await supabase.auth.setSession({
                        access_token: token,
                        refresh_token: user.refreshToken,
                    });
                    // --- KONEC FINÁLNÍ OPRAVY ---

                    // Načítání profilu z Firestore (tato část je v pořádku)
                    const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, user.uid);
                    const userProfileSnap = await getDoc(userProfileRef);
                    
                    if (userProfileSnap.exists()) {
                        setCurrentUserProfile({ uid: user.uid, ...userProfileSnap.data() });
                    } else {
                        const newProfile = { email: user.email, displayName: user.email.split('@')[0], function: '', isAdmin: false, createdAt: new Date().toISOString() };
                        await setDoc(userProfileRef, newProfile);
                        setCurrentUserProfile({ uid: user.uid, ...newProfile });
                    }
                    setCurrentUser(user);

                } else {
                    // Pokud se uživatel odhlásí, vyčistíme i session v Supabase
                    await supabase.auth.signOut();
                    setCurrentUser(null);
                    setCurrentUserProfile(null);
                }
            } catch (error) {
                console.error("Chyba při synchronizaci autentifikace:", error);
                // V případě chyby se bezpečně odhlásíme všude
                await supabase.auth.signOut();
                setCurrentUser(null);
                setCurrentUserProfile(null);
            } finally {
                setLoading(false);
            }
        });

        // Tento listener se stará o automatické obnovování tokenu pro Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'TOKEN_REFRESHED') {
                console.log('Supabase token byl obnoven.');
            }
        });

        // Při odpojení komponenty zrušíme listenery, abychom předešli memory leakům
        return () => {
            unsubscribe();
            subscription?.unsubscribe();
        };
    }, [appId, supabase]);

    // Zbytek souboru zůstává stejný...
    useEffect(() => {
        if (currentUserProfile?.isAdmin || currentUser) {
            const usersColRef = collection(db, `artifacts/${appId}/public/data/user_profiles`);
            const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
                setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
            });
            return () => unsubscribeUsers();
        }
    }, [currentUser, currentUserProfile, appId]);

    const updateUserProfile = async (uid, profileData) => {
        const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, uid);
        await updateDoc(userProfileRef, profileData, { merge: true });
        if (currentUser?.uid === uid) {
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()) {
                setCurrentUserProfile({ uid, ...userProfileSnap.data() });
            }
        }
    };
    
    const value = useMemo(() => ({
        loading,
        currentUser,
        user: currentUser,
        userProfile: currentUserProfile,
        currentUserProfile,
        allUsers,
        updateUserProfile,
        db,
        auth,
        appId,
        supabase,
        login: (email, password) => signInWithEmailAndPassword(auth, email, password),
        register: (email, password) => createUserWithEmailAndPassword(auth, email, password),
        googleSignIn: () => {
            const provider = new GoogleAuthProvider();
            return signInWithPopup(auth, provider);
        },
        logout: () => signOut(auth),
    }), [currentUser, currentUserProfile, loading, allUsers, appId, auth, supabase]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};