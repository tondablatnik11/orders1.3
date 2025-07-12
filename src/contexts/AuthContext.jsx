'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db, appId } from '../lib/firebase';
import { getSupabase } from '../lib/supabaseClient';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    console.log("AuthContext: useEffect se spouští."); // KONTROLNÍ VÝPIS 1
    if (auth) {
      setIsFirebaseReady(true);
      console.log("AuthContext: Firebase auth je připraveno."); // KONTROLNÍ VÝPIS 2
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log("AuthContext: onAuthStateChanged listener se spustil."); // KONTROLNÍ VÝPIS 3
        if (user) {
          console.log("AuthContext: Uživatel je přihlášen:", user.email); // KONTROLNÍ VÝPIS 4
          setCurrentUser(user);
          // ... zbytek kódu pro načtení profilu
          const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, user.uid);
          const userProfileSnap = await getDoc(userProfileRef);
          if (userProfileSnap.exists()) {
            setCurrentUserProfile({ uid: user.uid, ...userProfileSnap.data() });
          } else {
            const newProfile = { email: user.email, displayName: user.displayName || user.email.split('@')[0], isAdmin: false, function: '' };
            await setDoc(userProfileRef, newProfile);
            setCurrentUserProfile({ uid: user.uid, ...newProfile });
          }

        } else {
          console.log("AuthContext: Žádný uživatel není přihlášen."); // KONTROLNÍ VÝPIS 5
          setCurrentUser(null);
          setCurrentUserProfile(null);
        }
        setLoading(false);
      });

      // ... zbytek useEffectu
      const usersCollectionRef = collection(db, `artifacts/${appId}/public/data/user_profiles`);
      const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        setAllUsers(usersList);
      });

      return () => {
        unsubscribe();
        unsubscribeUsers();
      };
    } else {
      console.error("AuthContext: Firebase auth NENÍ k dispozici!"); // KONTROLNÍ VÝPIS 6
      setLoading(false);
    }
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const googleSignIn = () => {
      const provider = new GoogleAuthProvider();
      return signInWithPopup(auth, provider);
  };
  const updateUserProfile = (uid, data) => {
      const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, uid);
      return updateDoc(userProfileRef, data);
  };

  const value = {
    currentUser,
    currentUserProfile,
    allUsers,
    loading,
    isFirebaseReady,
    login,
    register,
    logout,
    googleSignIn,
    updateUserProfile,
    db,
    appId,
    supabase: getSupabase(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};