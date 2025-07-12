'use client';
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { processData } from '../lib/dataProcessor';

export const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    timeRange: 'all',
    startDate: '',
    endDate: '',
    deliveryType: 'all',
    status: 'all',
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const { currentUser } = useAuth();
  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setAllOrdersData([]);
      setSummary(null);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    try {
      const { data, error } = await supabase.from("deliveries").select('*');
      if (error) throw error;
      setAllOrdersData(data || []);
    } catch (error) {
      console.error("Error fetching data from Supabase:", error);
      setAllOrdersData([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isLoadingData && allOrdersData && allOrdersData.length > 0) {
      const processed = processData(allOrdersData, filters);
      setSummary(processed);
    } else {
      setSummary(null);
    }
  }, [allOrdersData, filters, isLoadingData]);

  const handleSaveNote = useCallback(async (deliveryNo, newNote) => {
    const { error } = await supabase
        .from('deliveries')
        .update({ Note: newNote })
        .eq('"Delivery No"', deliveryNo.trim());

    if (error) console.error("Error saving note:", error);
    else {
        setAllOrdersData(prev => prev.map(order =>
            (order["Delivery No"] || order["Delivery"])?.trim() === deliveryNo ? { ...order, Note: newNote } : order
        ));
    }
  }, [supabase]);

  const handleFileUpload = async (file) => {
      if (!file) return;
      setIsLoadingData(true);
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
                "Note": row["Note"],
                "Forwarding agent name": row["Forwarding agent name"],
                "Name of ship-to party": row["Name of ship-to party"],
                "Total Weight": row["Total Weight"],
                "Bill of lading": row["Bill of lading"],
            }));

            const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
            if (error) throw error;

            alert('Data byla úspěšně nahrána!');
            fetchData();
          } catch (error) {
            console.error('File upload error:', error);
            alert('Chyba při nahrávání dat.');
            setIsLoadingData(false);
          }
      };
      reader.readAsBinaryString(file);
  };

  const value = {
    allOrdersData,
    summary,
    isLoadingData,
    filters,
    setFilters,
    refetchData: fetchData,
    handleSaveNote,
    handleFileUpload,
    selectedOrderDetails,
    setSelectedOrderDetails
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};