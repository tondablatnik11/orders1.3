'use client';
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore'; 
import { firebaseConfig } from '../lib/firebase';
import { getSupabase } from '../lib/supabaseClient';

export const AuthContext = createContext(null);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [allUsers, setAllUsers] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const supabase = getSupabase(); 

    // Instance Firebase budou uloženy zde, abychom je mohli použít v celém kontextu
    const [firebaseInstances, setFirebaseInstances] = useState({
        auth: null,
        db: null,
        appId: null
    });

    useEffect(() => {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);
        const appId = firebaseConfig.appId;

        setFirebaseInstances({ auth, db, appId });

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, user.uid);
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
                setAllUsers([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!firebaseInstances.db || !firebaseInstances.appId) return;

        const usersColRef = collection(firebaseInstances.db, `artifacts/${firebaseInstances.appId}/public/data/user_profiles`);
        const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
            setAllUsers(fetchedUsers);
        });

        return () => unsubscribeUsers();
    }, [firebaseInstances.db, firebaseInstances.appId]);


    const updateUserProfile = async (uid, updates) => {
        const { db, appId } = firebaseInstances;
        if (!db || !appId) throw new Error("Firestore or App ID not available.");
        const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, uid);
        await updateDoc(userProfileRef, updates);
        setCurrentUserProfile(prev => ({ ...prev, ...updates }));
    };

    // Memoizovaná hodnota kontextu, aby se předešlo zbytečným re-renderům
    const value = useMemo(() => ({
        currentUser,
        currentUserProfile,
        loading,
        allUsers,
        db: firebaseInstances.db,
        appId: firebaseInstances.appId,
        auth: firebaseInstances.auth,
        supabase,
        login: (email, password) => signInWithEmailAndPassword(firebaseInstances.auth, email, password),
        register: (email, password) => createUserWithEmailAndPassword(firebaseInstances.auth, email, password),
        googleSignIn: () => {
            const provider = new GoogleAuthProvider();
            return signInWithPopup(firebaseInstances.auth, provider);
        },
        logout: () => signOut(firebaseInstances.auth),
        updateUserProfile
    }), [currentUser, currentUserProfile, loading, allUsers, firebaseInstances, supabase]);

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};