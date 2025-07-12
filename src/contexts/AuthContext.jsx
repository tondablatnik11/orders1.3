'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore'; // Přidáno collection, onSnapshot, updateDoc
import { auth, db, appId } from '../lib/firebase'; // Zajištění importu appId
import { getSupabase } from '../lib/supabaseClient'; // Import supabaseClient

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]); // ZAJIŠTĚNO, ŽE JE POLE
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase(); // Inicializace Supabase

  // Přidáno: Funkce pro aktualizaci profilu, aby ji TicketsTab mohl použít
  const updateUserProfile = async (uid, updates) => {
    if (!db || !appId) throw new Error("Firestore or App ID not available.");
    const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, uid);
    await updateDoc(userProfileRef, updates);
    setCurrentUserProfile(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userProfileRef = doc(db, `artifacts/${appId}/public/data/user_profiles`, user.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        if (userProfileSnap.exists()) {
          setCurrentUserProfile({ uid: user.uid, ...userProfileSnap.data() });
        } else {
          const newProfile = { email: user.email, displayName: user.displayName || user.email.split('@')[0], function: '', isAdmin: false, createdAt: new Date().toISOString() };
          await setDoc(userProfileRef, newProfile);
          setCurrentUserProfile({ uid: user.uid, ...newProfile });
        }
        setCurrentUser(user);

        // Načítání všech uživatelů pro přiřazení ticketů
        const usersColRef = collection(db, `artifacts/${appId}/public/data/user_profiles`);
        // Zajistit, že onSnapshot je správně odhlášen, aby se zabránilo únikům paměti
        const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
          const fetchedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
          setAllUsers(fetchedUsers);
          console.log("AuthContext: Fetched all users count:", fetchedUsers.length); // Ladicí log
        }, (error) => {
          console.error("AuthContext: Error fetching all users:", error);
          setAllUsers([]); // Zajistit, že allUsers je pole i při chybě
        });
        return () => { // Cleanup funkce
            unsubscribeUsers();
            unsubscribeAuth(); // Také se odhlásí od auth listeneru
        };
      } else {
        setCurrentUser(null);
        setCurrentUserProfile(null);
        setAllUsers([]); // Resetovat allUsers při odhlášení
        setLoading(false); // Zastavit loading zde, pokud není uživatel
      }
    });
    // return () => unsubscribeAuth(); // Přesunuto do vnitřní funkce pro správný cleanup
  }, [db, appId]); 

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };
  const logout = () => signOut(auth);

  const value = { currentUser, currentUserProfile, loading, login, register, googleSignIn, logout, db, appId, allUsers, updateUserProfile, supabase }; // Exportujeme allUsers a supabase

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};