'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// Importujeme instance, které se díky úpravě v kroku 1 bezpečně vytvoří
import { auth, db } from '../lib/firebase';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tento kód se spustí až na klientovi, takže `auth` objekt bude vždy připraven
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
              const userProfileRef = doc(db, 'user_profiles', user.uid);
              const userProfileSnap = await getDoc(userProfileRef);
              if (userProfileSnap.exists()) {
                setCurrentUserProfile({ uid: user.uid, ...userProfileSnap.data() });
              } else {
                const newProfile = {
                  email: user.email,
                  displayName: user.displayName || user.email.split('@')[0],
                  isAdmin: false,
                };
                await setDoc(userProfileRef, newProfile);
                setCurrentUserProfile({ uid: user.uid, ...newProfile });
              }
              setCurrentUser(user);
            } else {
              setCurrentUser(null);
              setCurrentUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    currentUserProfile,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};