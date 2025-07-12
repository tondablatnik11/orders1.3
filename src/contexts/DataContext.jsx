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
  
  const handleFileUpload = async (file) => {
      if (!file) return;
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
            const bstr = evt.target.result;
            const wb = window.XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = window.XLSX.utils.sheet_to_json(ws);
            const transformedData = jsonData.map(row => ({
                "Delivery No": String(row["Delivery No"] || row["Delivery"]).trim(),
                "Status": Number(row["Status"]),
                "del.type": row["del.type"],
                "Loading Date": new Date((row["Loading Date"] - 25569) * 86400 * 1000).toISOString(),
            }));
            const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
            if (error) throw error;
            alert('Data byla úspěšně nahrána!');
            fetchData();
          } catch (error) {
            console.error('File upload error:', error);
            alert('Chyba při nahrávání dat.');
            setIsLoading(false);
          }
      };
      reader.readAsBinaryString(file);
  };


  const value = { summary, isLoading, allOrdersData, handleFileUpload, fetchData };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};