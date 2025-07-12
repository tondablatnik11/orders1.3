'use client';
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { processData } from '../lib/dataProcessor';

export const DataContext = createContext();
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const { currentUser, loading: authLoading } = useAuth(); // Získáme i stav načítání z AuthContextu
  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    // Nezačneme, dokud se neověří uživatel
    if (authLoading) return; 

    if (!currentUser) {
      setAllOrdersData([]);
      setIsLoadingData(false);
      return;
    }

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
  }, [currentUser, authLoading, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isLoadingData && allOrdersData && allOrdersData.length > 0) {
      const processed = processData(allOrdersData);
      setSummary(processed);
    } else if (!isLoadingData) {
      setSummary(null);
    }
  }, [allOrdersData, isLoadingData]);

  const handleSaveNote = useCallback(async (deliveryNo, newNote) => {
    const { error } = await supabase.from('deliveries').update({ Note: newNote }).eq('"Delivery No"', deliveryNo.trim());
    if (error) {
        console.error("DataContext: Chyba při ukládání poznámky:", error);
    } else {
        fetchData(); 
    }
  }, [supabase, fetchData]);
  
  const value = useMemo(() => ({
    allOrdersData,
    summary,
    isLoadingData,
    refetchData: fetchData,
    handleSaveNote,
    selectedOrderDetails,
    setSelectedOrderDetails,
    supabase,
  }), [allOrdersData, summary, isLoadingData, fetchData, handleSaveNote, selectedOrderDetails, supabase]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
