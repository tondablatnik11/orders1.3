'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
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
                const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, user.uid);
                const userProfileSnap = await getDoc(userProfileRef);
                
                let profileData = null;
                if (userProfileSnap.exists()) {
                    profileData = { uid: user.uid, ...userProfileSnap.data() };
                } else {
                    // Vytvoření nového profilu, pokud neexistuje
                    const newProfile = { email: user.email, displayName: user.email.split('@')[0], function: '', isAdmin: false, createdAt: new Date().toISOString() };
                    await setDoc(userProfileRef, newProfile);
                    profileData = { uid: user.uid, ...newProfile };
                }
                setCurrentUser(user);
                setCurrentUserProfile(profileData);
            } else {
                setCurrentUser(null);
                setCurrentUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [appId]);

    useEffect(() => {
        if (currentUserProfile?.isAdmin) {
            const usersColRef = collection(db, `artifacts/${appId}/public/data/user_profiles`);
            const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
                setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
            });
            return () => unsubscribeUsers();
        } else {
            setAllUsers([]);
        }
    }, [currentUserProfile, appId]);

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
    
    // Zjednodušená hodnota kontextu bez useMemo pro maximální robustnost
    const value = {
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
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};