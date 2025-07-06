'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { firestore } from '../lib/firebase'; // Ujistěte se, že cesta je správná
import { processData } from '../lib/dataProcessor';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      const unsubscribe = firestore.collection('data')
        .where('userId', '==', user.uid)
        .onSnapshot(snapshot => {
          const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const processedData = processData(rawData);
          setData(processedData);
          setLoading(false);
        });

      return () => unsubscribe();
    }
  }, [user]);

  return (
    <DataContext.Provider value={{ data, loading }}>
      {children}
    </DataContext.Provider>
  );
};