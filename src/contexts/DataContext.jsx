'use client';
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { processData } from '../lib/dataProcessor';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
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
      // Místo plného refetch, bychom v produkční aplikaci aktualizovali jen lokální stav.
      // Pro jednoduchost a zaručení konzistence ponecháváme refetch.
      fetchData();
    }
  }, [supabase, fetchData]);
  
  // Přesunuto z UI komponent pro centralizaci logiky
  const handleFileUpload = useCallback(async (file) => {
    if (!file || typeof XLSX === 'undefined') return;

    // Funkce pro parsování data z Excelu
    const parseExcelDate = (excelDate) => {
        if (typeof excelDate === 'number') {
            return new Date((excelDate - 25569) * 86400 * 1000).toISOString();
        }
        return null; // Vrací null, pokud formát není číslo
    };

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = XLSX.utils.sheet_to_json(ws);

            const transformedData = jsonData.map(row => ({
                "Delivery No": String(row["Delivery No"] || row["Delivery"] || '').trim(),
                "Status": Number(row["Status"]),
                "del.type": row["del.type"],
                "Loading Date": parseExcelDate(row["Loading Date"]), // Použití bezpečné parsovací funkce
                "Note": row["Note"] || "",
                "Forwarding agent name": row["Forwarding agent name"],
                "Name of ship-to party": row["Name of ship-to party"],
                "Total Weight": row["Total Weight"],
                "Bill of lading": row["Bill of lading"],
            })).filter(row => row["Delivery No"]); // Odstranění řádků bez čísla dodávky

            if (transformedData.length > 0) {
              const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
              if (error) throw error;
              alert('Data byla úspěšně nahrána!');
              fetchData(); // Znovu načteme data pro aktualizaci UI
            } else {
              alert('Nenalezena žádná platná data k nahrání.');
            }
        } catch (error) {
            console.error('Chyba při nahrávání souboru:', error);
            alert(`Chyba při nahrávání dat: ${error.message}`);
        }
    };
    reader.readAsBinaryString(file);
  }, [supabase, fetchData]);

  const value = useMemo(() => ({
    allOrdersData,
    summary,
    isLoadingData, // Přejmenováno z isLoading na isLoadingData pro konzistenci
    refetchData: fetchData,
    handleSaveNote,
    handleFileUpload, // Poskytnutí funkce pro nahrávání
    selectedOrderDetails,
    setSelectedOrderDetails,
    supabase,
  }), [allOrdersData, summary, isLoadingData, fetchData, handleSaveNote, handleFileUpload, selectedOrderDetails, supabase]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};