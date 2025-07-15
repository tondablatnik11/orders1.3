'use client';
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { processData } from '../lib/dataProcessor';
import { processErrorLogData } from '../lib/lvsErrorProcessor.js'; // <-- ZMĚNA IMPORTU
import toast from 'react-hot-toast';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  
  const [errorLogData, setErrorLogData] = useState([]);
  const [errorSummary, setErrorSummary] = useState(null);
  const [isLoadingErrorData, setIsLoadingErrorData] = useState(true);

  const { currentUser, loading: authLoading } = useAuth();
  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase.from("deliveries").select('*').limit(10000);
      if (error) throw error;
      setAllOrdersData(data || []);
      const processed = processData(data || []);
      setSummary(processed);
    } catch (error) {
      toast.error("Chyba při načítání dat zakázek.");
      console.error("DataContext: Chyba při načítání dat:", error);
      setAllOrdersData([]);
      setSummary(null);
    } finally {
      setIsLoadingData(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchData();
    } else if (!currentUser && !authLoading) {
      setAllOrdersData([]);
      setSummary(null);
      setIsLoadingData(false);
    }
  }, [currentUser, authLoading, fetchData]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file || typeof window.XLSX === 'undefined') return;
    toast.loading('Zpracovávám soubor zakázek...');
    
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
                "Country ship-to prty": row["Country ship-to prty"],
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
  
  const handleErrorLogUpload = useCallback(async (file) => {
    if (!file || typeof window.XLSX === 'undefined') return;
    toast.loading('Zpracovávám soubor s chybami...');
    setIsLoadingErrorData(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = XLSX.utils.sheet_to_json(ws);
            
            setErrorLogData(jsonData);
            const processedErrors = processErrorLogData(jsonData);
            setErrorSummary(processedErrors);
            toast.dismiss();
            toast.success('Log s chybami byl úspěšně načten a zpracován.');
        } catch (error) {
            console.error('Chyba při zpracování error logu:', error);
            toast.dismiss();
            toast.error(`Chyba při zpracování souboru: ${error.message}`);
        } finally {
            setIsLoadingErrorData(false);
        }
    };
    reader.readAsBinaryString(file);
  }, []);


  const value = useMemo(() => ({
    allOrdersData,
    summary,
    isLoadingData,
    refetchData: fetchData,
    handleFileUpload,
    selectedOrderDetails,
    setSelectedOrderDetails,
    supabase,
    errorLogData,
    errorSummary,
    isLoadingErrorData,
    handleErrorLogUpload,
  }), [allOrdersData, summary, isLoadingData, fetchData, handleFileUpload, selectedOrderDetails, supabase, errorLogData, errorSummary, isLoadingErrorData, handleErrorLogUpload]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};