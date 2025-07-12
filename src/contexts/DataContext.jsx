// src/contexts/DataContext.jsx
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
      console.log('DataContext: No current user, skipping data fetch.');
      setAllOrdersData([]);
      setSummary(null);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    console.log('DataContext: Starting data fetch from Supabase...');
    try {
      const { data, error } = await supabase.from("deliveries").select('*');
      if (error) {
          console.error("DataContext: Error fetching data from Supabase:", error);
          throw error;
      }
      console.log('DataContext: Successfully fetched data, count:', data ? data.length : 0);
      setAllOrdersData(data || []);
    } catch (error) {
      console.error("DataContext: Caught error during fetchData:", error);
      setAllOrdersData([]);
    } finally {
      setIsLoadingData(false);
      console.log('DataContext: Data fetch process completed.');
    }
  }, [currentUser, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isLoadingData && allOrdersData && allOrdersData.length > 0) {
      console.log('DataContext: Processing allOrdersData for summary...');
      const processed = processData(allOrdersData, filters);
      setSummary(processed);
      console.log('DataContext: Summary processed:', processed);
      if (processed?.delayedOrdersList) {
          console.log('DataContext: Delayed orders list in summary:', processed.delayedOrdersList.length, processed.delayedOrdersList);
          // Zalogujeme konkrétní zakázku, pokud existuje, pro diagnostiku
          const specificOrder = processed.delayedOrdersList.find(o => o.delivery === '4340102207');
          if (specificOrder) {
              console.log('DataContext: Specific order 4340102207 details:', specificOrder);
          }
      }
    } else if (!isLoadingData && (!allOrdersData || allOrdersData.length === 0)) {
        console.log('DataContext: No raw data or data is empty, setting summary to null.');
        setSummary(null);
    }
  }, [allOrdersData, filters, isLoadingData]);

  const handleSaveNote = useCallback(async (deliveryNo, newNote) => {
    console.log(`DataContext: Attempting to save note for delivery ${deliveryNo}: "${newNote}"`);
    const { error } = await supabase
        .from('deliveries')
        .update({ Note: newNote })
        .eq('"Delivery No"', deliveryNo.trim());

    if (error) {
        console.error("DataContext: Error saving note:", error);
    } else {
        console.log(`DataContext: Note for delivery ${deliveryNo} saved successfully. Refreshing data...`);
        // Po uložení poznámky obnovíme všechna data, aby se UI aktualizovalo
        fetchData(); 
    }
  }, [supabase, fetchData]);

  const handleFileUpload = async (file) => {
      if (!file) return;
      console.log('DataContext: File upload initiated for file:', file.name);
      setIsLoadingData(true); 
      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
            const bstr = evt.target.result;
            // Zkontrolujeme, zda je XLSX knihovna načtena PŘED pokusem o čtení
            if (typeof window.XLSX === 'undefined') { 
                console.error("DataContext: XLSX library is not loaded, cannot process file.");
                alert('XLSX knihovna není načtena. Zkuste prosím obnovit stránku.');
                setIsLoadingData(false);
                return;
            }
            const wb = window.XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = window.XLSX.utils.sheet_to_json(ws);
            console.log('DataContext: XLSX file parsed, JSON data rows:', jsonData.length);
            // Zalogujeme ukázku jsonData pro kontrolu struktury
            if (jsonData.length > 0) {
                console.log('DataContext: First row of parsed JSON data:', jsonData[0]);
            }

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
            console.log('DataContext: Transformed data rows for upsert:', transformedData.length);
            if (transformedData.length > 0) {
                console.log('DataContext: First row of transformed data:', transformedData[0]);
            }

            console.log('DataContext: Starting Supabase upsert...');
            const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
            if (error) {
                console.error('DataContext: Error during Supabase upsert:', error);
                throw error;
            }

            alert('Data byla úspěšně nahrána!');
            console.log('DataContext: Data successfully uploaded to Supabase. Refetching all data...');
            fetchData(); // Obnovení všech dat po úspěšném nahrání
          } catch (error) {
            console.error('DataContext: Caught error during file upload process:', error);
            alert('Chyba při nahrávání dat: ' + error.message);
          } finally {
            setIsLoadingData(false);
            console.log('DataContext: File upload process completed.');
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
    setSelectedOrderDetails,
    supabase,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};