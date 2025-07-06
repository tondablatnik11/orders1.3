'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext'; // Použijeme AuthContext

export const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth(); // Získáme info o přihlášení

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) { // Načítáme data, jen pokud je uživatel přihlášen
        setAllOrdersData([]);
        setImportHistory([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // ZÍSKÁNÍ KLIENTA: Toto je klíčová změna
        const supabase = getSupabase();

        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from("deliveries")
          .select('*');
        if (deliveriesError) throw deliveriesError;

        const { data: importHistoryData, error: importHistoryError } = await supabase
          .from("imports")
          .select("id, created_at, original_name, date_label")
          .order("created_at", { ascending: false });
        if (importHistoryError) throw importHistoryError;

        setAllOrdersData(deliveriesData || []);
        setImportHistory(importHistoryData || []);
      } catch (error) {
        console.error("Error fetching data from Supabase:", error);
        setAllOrdersData([]);
        setImportHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]); // Znovu načteme data, když se změní uživatel

  const value = {
    allOrdersData,
    importHistory,
    loading,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};