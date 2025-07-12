'use client';
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { currentUser } = useAuth();
  const supabase = getSupabase();

  useEffect(() => {
    // Pokud není přihlášený uživatel, nenačítáme data.
    if (!currentUser) {
      setAllOrdersData([]);
      setIsLoadingData(false);
      return;
    }

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const { data, error } = await supabase.from("deliveries").select('*');
        if (error) throw error;
        setAllOrdersData(data || []);
      } catch (error) {
        console.error("DataContext: Chyba při načítání dat:", error);
        setAllOrdersData([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [currentUser, supabase]);

  const value = useMemo(() => ({
    allOrdersData,
    isLoadingData,
  }), [allOrdersData, isLoadingData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
