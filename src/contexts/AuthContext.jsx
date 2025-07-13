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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed. User:", user); // LOG 1: Zjistíme, zda se uživatel přihlásil
            if (user) {
                setCurrentUser(user);
                const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, user.uid);
                console.log("Pokouším se načíst profil z cesty:", userProfileRef.path); // LOG 2: Zkontrolujeme cestu k dokumentu

                try {
                    const userProfileSnap = await getDoc(userProfileRef);
                    console.log("Existuje profil v databázi?", userProfileSnap.exists()); // LOG 3: Zjistíme, zda dokument existuje

                    if (userProfileSnap.exists()) {
                        const profileData = userProfileSnap.data();
                        console.log("Načtená data profilu:", profileData); // LOG 4: Vypíšeme data profilu
                        setCurrentUserProfile({ uid: user.uid, ...profileData });
                    } else {
                        console.log("Profil neexistuje, vytvářím nový."); // LOG 5: Pokud neexistuje, vytvoříme nový
                        const newProfile = { email: user.email, displayName: user.email.split('@')[0], function: '', isAdmin: false, createdAt: new Date().toISOString() };
                        await setDoc(userProfileRef, newProfile);
                        setCurrentUserProfile(newProfile);
                    }
                } catch (error) {
                    console.error("!!! Chyba při načítání nebo vytváření profilu:", error); // LOG 6: Zachytíme případnou chybu
                }
            } else {
                setCurrentUser(null);
                setCurrentUserProfile(null);
                setAllUsers([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!db || !appId) return;
        const usersColRef = collection(db, `artifacts/${appId}/public/data/user_profiles`);
        const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
            setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("!!! Chyba při načítání seznamu uživatelů:", error); // LOG 7: Zachytíme chybu i zde
        });
        return () => unsubscribeUsers();
    }, [db, appId]);

    const updateUserProfile = async (uid, profileData) => {
        const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, uid);
        await updateDoc(userProfileRef, profileData);
        const userProfileSnap = await getDoc(userProfileRef);
        if (userProfileSnap.exists()) {
            setCurrentUserProfile({ uid, ...userProfileSnap.data() });
        }
    };

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
    }), [currentUser, currentUserProfile, loading, allUsers, db, appId, auth, supabase]);

    return <AuthContext.Provider value={value}>{!loading ? children : null}</AuthContext.Provider>;
};