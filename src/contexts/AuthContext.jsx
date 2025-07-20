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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    const token = await user.getIdToken(true);
                    await supabase.auth.setSession({
                        access_token: token,
                        refresh_token: user.refreshToken,
                    });

                    const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, user.uid);
                    const userProfileSnap = await getDoc(userProfileRef);
                    
                    if (userProfileSnap.exists()) {
                        setCurrentUserProfile({ uid: user.uid, ...userProfileSnap.data() });
                    } else {
                        const newProfile = { 
                            email: user.email, 
                            displayName: user.displayName || user.email.split('@')[0], 
                            function: '', 
                            isAdmin: false, 
                            createdAt: new Date().toISOString(),
                            avatar_url: user.photoURL || null
                        };
                        await setDoc(userProfileRef, newProfile);
                        setCurrentUserProfile({ uid: user.uid, ...newProfile });
                    }
                    setCurrentUser(user);
                } else {
                    await supabase.auth.signOut();
                    setCurrentUser(null);
                    setCurrentUserProfile(null);
                }
            } catch (error) {
                console.error("Chyba při synchronizaci autentifikace:", error);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [appId, supabase]);

    useEffect(() => {
        if (currentUser) {
            const usersColRef = collection(db, `artifacts/${appId}/public/data/user_profiles`);
            const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
                setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
            });
            return () => unsubscribeUsers();
        }
    }, [currentUser, appId]);

    const updateUserProfile = async (uid, profileData) => {
        const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, uid);
        await updateDoc(userProfileRef, profileData, { merge: true });
    };

    // NOVÉ: Funkce pro aktualizaci URL avatara
    const updateAvatarUrl = async (uid, newAvatarUrl) => {
        await updateUserProfile(uid, { avatar_url: newAvatarUrl });
        // Okamžitá aktualizace stavu pro rychlou odezvu v UI
        if (currentUser?.uid === uid) {
            setCurrentUserProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
        }
        setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, avatar_url: newAvatarUrl } : u));
    };
    
    const value = useMemo(() => ({
        loading, currentUser, user: currentUser, userProfile: currentUserProfile, allUsers, updateUserProfile, db, auth, appId, supabase,
        updateAvatarUrl, // <-- Přidána nová funkce
        login: (email, password) => signInWithEmailAndPassword(auth, email, password),
        googleSignIn: () => { const provider = new GoogleAuthProvider(); return signInWithPopup(auth, provider); },
        logout: () => signOut(auth),
    }), [currentUser, currentUserProfile, loading, allUsers, appId, auth, supabase]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};