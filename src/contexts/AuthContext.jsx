'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db, appId } from '../lib/firebase';
import { getSupabase } from '../lib/supabaseClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Nový, robustnější systém stavů
    const [authState, setAuthState] = useState({
        status: 'loading', // 'loading', 'authenticated', 'unauthenticated'
        currentUser: null,
        currentUserProfile: null,
    });

    const [allUsers, setAllUsers] = useState([]);
    const supabase = getSupabase();
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, user.uid);
                try {
                    const userProfileSnap = await getDoc(userProfileRef);
                    
                    let profileData = null;
                    if (userProfileSnap.exists()) {
                        profileData = { uid: user.uid, ...userProfileSnap.data() };
                    } else {
                        const newProfile = { email: user.email, displayName: user.email.split('@')[0] || 'Nový uživatel', function: '', isAdmin: false, createdAt: new Date().toISOString() };
                        await setDoc(userProfileRef, newProfile);
                        profileData = { uid: user.uid, ...newProfile };
                    }
                    setAuthState({ status: 'authenticated', currentUser: user, currentUserProfile: profileData });

                } catch (error) {
                    console.error("Kritická chyba při načítání profilu:", error);
                    setAuthState({ status: 'unauthenticated', currentUser: null, currentUserProfile: null });
                }
            } else {
                setAuthState({ status: 'unauthenticated', currentUser: null, currentUserProfile: null });
            }
        });

        return () => unsubscribe();
    }, [appId]);

    useEffect(() => {
        // Načítáme všechny uživatele, pokud je někdo přihlášen
        if (authState.status === 'authenticated') {
            const usersColRef = collection(db, `artifacts/${appId}/public/data/user_profiles`);
            const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
                setAllUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })));
            });
            return () => unsubscribeUsers();
        }
    }, [authState.status, appId]);


    const updateUserProfile = async (uid, profileData) => {
        const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, uid);
        await updateDoc(userProfileRef, profileData, { merge: true });
        if (authState.currentUser?.uid === uid) {
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()) {
                setAuthState(prev => ({ ...prev, currentUserProfile: { uid, ...userProfileSnap.data() } }));
            }
        }
    };
    
    const value = {
        ...authState,
        user: authState.currentUser, // pro zpětnou kompatibilitu
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
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};