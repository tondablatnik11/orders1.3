'use client';
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { processData } from '../lib/dataProcessor';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [allOrdersData, setAllOrdersData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setAllOrdersData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("deliveries").select('*');
      if (error) throw error;
      setAllOrdersData(data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setAllOrdersData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSummary(processData(allOrdersData));
  }, [allOrdersData]);

  const handleSaveNote = useCallback(async (deliveryNo, newNote) => {
    const { error } = await supabase
        .from('deliveries')
        .update({ Note: newNote })
        .eq('Delivery No', deliveryNo.trim());

    if (error) {
        console.error("Error saving note:", error);
    } else {
        setAllOrdersData(prev => 
            prev.map(order => 
                order["Delivery No"] === deliveryNo ? { ...order, Note: newNote } : order
            )
        );
    }
  }, [supabase]);

  const value = { summary, isLoading, fetchData, handleSaveNote };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};