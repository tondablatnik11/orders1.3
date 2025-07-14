'use client';
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { processData } from '../lib/dataProcessor';
import toast from 'react-hot-toast';

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
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase.from("deliveries").select('*').limit(10000);
      if (error) throw error;
      setAllOrdersData(data || []);
    } catch (error) {
      toast.error("Chyba při načítání dat zakázek.");
      console.error("DataContext: Chyba při načítání dat:", error);
      setAllOrdersData([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchData();
    } else if (!currentUser && !authLoading) {
      setAllOrdersData([]);
      setIsLoadingData(false);
    }
  }, [currentUser, authLoading, fetchData]);

  useEffect(() => {
    if (!isLoadingData && allOrdersData) {
      const processed = processData(allOrdersData);
      setSummary(processed);
    }
  }, [allOrdersData, isLoadingData]);

  const handleSaveNote = useCallback(async (deliveryNo, newNote) => {
    const { error } = await supabase.from('deliveries').update({ Note: newNote, updated_at: new Date().toISOString() }).eq('"Delivery No"', deliveryNo.trim());
    if (error) {
        toast.error("Chyba při ukládání poznámky.");
    } else {
        toast.success("Poznámka uložena.");
        fetchData();
    }
  }, [supabase, fetchData]);
  
  const handleUpdateStatus = useCallback(async (deliveryNo, newStatus) => {
    const { data, error } = await supabase
        .from('deliveries')
        .update({ Status: newStatus, updated_at: new Date().toISOString() })
        .eq('"Delivery No"', deliveryNo.trim())
        .select();

    if (error) {
        toast.error("Chyba při aktualizaci statusu.");
        throw error;
    }
    
    if (data && data.length > 0) {
        toast.success('Status byl úspěšně aktualizován!');
        fetchData();
        return { success: true, message: 'Status byl úspěšně aktualizován!' };
    } else {
        return { success: false, message: 'Zakázka s tímto číslem nebyla nalezena.' };
    }
  }, [supabase, fetchData]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file || typeof window.XLSX === 'undefined') return;
    toast.loading('Zpracovávám soubor...');
    
    const parseExcelDate = (excelDate) => {
        if (typeof excelDate === 'number') {
            return new Date((excelDate - 25569) * 86400 * 1000).toISOString();
        }
        return null;
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
                "Loading Date": parseExcelDate(row["Loading Date"]),
                "Note": row["Note"] || "",
                "Forwarding agent name": row["Forwarding agent name"],
                "Name of ship-to party": row["Name of ship-to party"],
                "Total Weight": row["Total Weight"],
                "Bill of lading": row["Bill of lading"],
                // --- TOTO JE OPRAVENÝ ŘÁDEK ---
                "Country ship-to prty": row["Country ship-to prty"],
                // --------------------------------
                "created_at": new Date().toISOString(),
                "updated_at": new Date().toISOString(),
            })).filter(row => row["Delivery No"]);

            if (transformedData.length > 0) {
              const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
              if (error) throw error;
              toast.dismiss();
              toast.success(`Data byla úspěšně nahrána! (${transformedData.length} záznamů)`);
              fetchData();
            } else {
              toast.dismiss();
              toast.error('Nenalezena žádná platná data k nahrání.');
            }
        } catch (error) {
            console.error('Chyba při nahrávání souboru:', error);
            toast.dismiss();
            toast.error(`Chyba při nahrávání dat: ${error.message}`);
        }
    };
    reader.readAsBinaryString(file);
  }, [supabase, fetchData]);

  const value = useMemo(() => ({
    allOrdersData,
    summary,
    isLoadingData,
    refetchData: fetchData,
    handleSaveNote,
    handleFileUpload,
    handleUpdateStatus,
    selectedOrderDetails,
    setSelectedOrderDetails,
    supabase,
  }), [allOrdersData, summary, isLoadingData, fetchData, handleSaveNote, handleFileUpload, handleUpdateStatus, selectedOrderDetails, supabase]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};