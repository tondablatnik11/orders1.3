// src/contexts/AuthContext.jsx
'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore'; 
import { auth, db, appId } from '../lib/firebase'; 
import { getSupabase } from '../lib/supabaseClient'; 

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true); // Inicializováno na true
  const supabase = getSupabase(); 

  const updateUserProfile = async (uid, updates) => {
    if (!db || !appId) throw new Error("Firestore or App ID not available.");
    const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, uid);
    await updateDoc(userProfileRef, updates);
    setCurrentUserProfile(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: onAuthStateChanged - uživatelský stav se změnil:', user ? user.email : 'null (uživatel odhlášen)');
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

        const usersColRef = collection(db, `artifacts/${appId}/public/data/user_profiles`);
        const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
          const fetchedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
          setAllUsers(fetchedUsers);
          console.log("AuthContext: Načten počet uživatelů:", fetchedUsers.length);
        }, (error) => {
          console.error("AuthContext: Chyba při načítání všech uživatelů:", error);
          setAllUsers([]); 
        });
        setLoading(false); // Nastavit na false, když je uživatel přihlášen
        return () => unsubscribeUsers(); 
      } else {
        setCurrentUser(null);
        setCurrentUserProfile(null);
        setAllUsers([]); 
        setLoading(false); // Nastavit na false, když je uživatel odhlášen
      }
    });
    return () => unsubscribeAuth(); 
  }, [db, appId]); 

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = async () => {
    console.log('AuthContext: Pokus o odhlášení. Instance Firebase auth:', auth);
    try {
      if (auth) { 
        await signOut(auth);
        console.log('AuthContext: signOut úspěšné.');
      } else {
        console.error('AuthContext: Instance Firebase auth je undefined, nelze se odhlásit.');
      }
    } catch (error) {
      console.error('AuthContext: Chyba během signOut:', error);
    }
  };

  const value = { currentUser, currentUserProfile, loading, login, register, googleSignIn, logout, db, appId, allUsers, updateUserProfile, supabase };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};