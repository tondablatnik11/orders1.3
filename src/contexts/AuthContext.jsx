'use client';
import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, user.uid);
                
                try {
                    const userProfileSnap = await getDoc(userProfileRef);
                    if (userProfileSnap.exists()) {
                        setCurrentUserProfile({ uid: user.uid, ...userProfileSnap.data() });
                    } else {
                        const newProfile = { email: user.email, displayName: user.email.split('@')[0], function: '', isAdmin: false, createdAt: new Date().toISOString() };
                        await setDoc(userProfileRef, newProfile);
                        setCurrentUserProfile(newProfile);
                    }
                } catch (error) {
                    console.error("Chyba při načítání nebo vytváření profilu:", error);
                    setCurrentUserProfile(null); // V případě chyby nastavíme profil na null
                }
            } else {
                setCurrentUser(null);
                setCurrentUserProfile(null);
                setAllUsers([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []); // Závislost je prázdná, aby se listener spustil jen jednou

    useEffect(() => {
        if (!currentUser || !currentUserProfile?.isAdmin) {
             setAllUsers([]);
             return;
        };

        const usersColRef = collection(db, `artifacts/${appId}/public/data/user_profiles`);
        const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
            setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Chyba při načítání seznamu uživatelů:", error);
        });
        return () => unsubscribeUsers();
    }, [currentUser, currentUserProfile]); // Spustí se znovu, když se změní uživatel nebo jeho admin status

    const updateUserProfile = useCallback(async (uid, profileData) => {
        const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, uid);
        await updateDoc(userProfileRef, profileData, { merge: true });

        // Pokud admin mění svůj vlastní profil, aktualizujeme stav
        if (currentUser?.uid === uid) {
             const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()) {
                setCurrentUserProfile({ uid, ...userProfileSnap.data() });
            }
        }
    }, [appId, currentUser?.uid]);

    const value = useMemo(() => ({
        currentUser,
        user: currentUser,
        currentUserProfile,
        loading,
        allUsers,
        db,
        appId,
        auth,
        supabase,
        login: (email, password) => signInWithEmailAndPassword(auth, email, password),
        register: (email, password) => createUserWithEmailAndPassword(auth, email, password),
        googleSignIn: () => {
            const provider = new GoogleAuthProvider();
            return signInWithPopup(auth, provider);
        },
        logout: () => signOut(auth),
        updateUserProfile
    }), [currentUser, currentUserProfile, loading, allUsers, appId, auth, supabase, updateUserProfile]);

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : <div className="flex items-center justify-center min-h-screen">Načítání...</div>}
        </AuthContext.Provider>
    );
};