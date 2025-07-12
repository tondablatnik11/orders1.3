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
    if (allOrdersData) {
      const processed = processData(allOrdersData);
      setSummary(processed);
    } else {
      setSummary(null);
    }
  }, [allOrdersData]);

  const value = { summary, isLoading, allOrdersData, fetchData };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};