'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchData = async () => {
    if (!currentUser) {
      setAllOrdersData([]);
      setImportHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data: deliveriesData, error: deliveriesError } = await supabase.from("deliveries").select('*');
      if (deliveriesError) throw deliveriesError;

      const { data: importHistoryData, error: importHistoryError } = await supabase.from("imports").select("id, created_at, original_name, date_label").order("created_at", { ascending: false });
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

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const value = {
    allOrdersData,
    importHistory,
    loading,
    refetchData: fetchData, // Přidána funkce pro znovunačtení dat
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};