'use client';
import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { processData } from '../lib/dataProcessor';
import { processArrayForDisplay, processErrorDataForSupabase } from '../lib/errorMonitorProcessor';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    // Stavy pro data zakázek (původní funkčnost)
    const [allOrdersData, setAllOrdersData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [previousSummary, setPreviousSummary] = useState(null); // <-- PŘIDÁNO: Stav pro předchozí souhrn
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    
    // Stavy pro data z Error Monitoru
    const [errorData, setErrorData] = useState(null);
    const [isLoadingErrorData, setIsLoadingErrorData] = useState(true);

    const { user, loading: authLoading } = useAuth();
    const supabase = getSupabase();

    // Načítání dat zakázek
    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const { data, error } = await supabase.from("deliveries").select('*').limit(10000);
            if (error) throw error;
            setAllOrdersData(data || []);

            // <-- ZMĚNA: Uložíme aktuální souhrn do předchozího a vypočítáme nový
            setSummary(currentSummary => {
                setPreviousSummary(currentSummary); // Uložíme starý souhrn
                const processed = processData(data || []);
                return processed; // Nastavíme nový
            });
        } catch (error) {
            toast.error("Chyba při načítání dat zakázek.");
            setAllOrdersData([]);
            setSummary(null);
        } finally {
            setIsLoadingData(false);
        }
    }, [supabase]);

    // Načítání dat chyb
    const fetchErrorData = useCallback(async () => {
        setIsLoadingErrorData(true);
        try {
            const { data, error } = await supabase.from("errors").select('*').order('timestamp', { ascending: false }).limit(1000);
            if (error) throw error;
            const processedErrors = processArrayForDisplay(data || []);
            setErrorData(processedErrors);
        } catch (error) {
            toast.error("Chyba při načítání logu chyb.");
            setErrorData(null);
        } finally {
            setIsLoadingErrorData(false);
        }
    }, [supabase]);

    useEffect(() => {
        if (user && !authLoading) {
            fetchData();
            fetchErrorData();
        }
    }, [user, authLoading, fetchData, fetchErrorData]);

    // --- ZDE JE OPRAVA ---
    // Původní funkce pro nahrávání souboru se zakázkami
    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;
        toast.loading('Zpracovávám soubor zakázek...');
        const parseExcelDate = (excelDate) => excelDate ? new Date((excelDate - 25569) * 86400 * 1000).toISOString() : null;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);
                
                // Vylepšené mapování dat - je odolnější vůči mírným změnám v názvech sloupců
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
                    "updated_at": new Date().toISOString() 
                })).filter(row => row["Delivery No"]);

                if (transformedData.length > 0) {
                    const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
                    if (error) throw error;
                    toast.dismiss();
                    toast.success('Data byla úspěšně nahrána!');
                    fetchData();
                } else {
                    toast.dismiss();
                    toast.error('Nenalezena žádná platná data.');
                }
            } catch (error) {
                toast.dismiss();
                toast.error(`Chyba při nahrávání: ${error.message}`);
            }
        };
        reader.readAsBinaryString(file);
    }, [supabase, fetchData]);
    
    // Nová funkce pro nahrání souboru s chybami
    const handleErrorLogUpload = useCallback(async (file) => {
        if (!file) return;
        toast.loading('Zpracovávám a ukládám log chyb...');
        try {
            const dataForSupabase = await processErrorDataForSupabase(file);
            if (dataForSupabase && dataForSupabase.length > 0) {
                const { error } = await supabase.from('errors').insert(dataForSupabase);
                if (error) throw error;
            }
            toast.dismiss();
            toast.success('Log chyb byl úspěšně nahrán!');
            fetchErrorData();
        } catch (error) {
            toast.dismiss();
            toast.error(`Chyba při nahrávání logu: ${error.message}`);
        }
    }, [supabase, fetchErrorData]);

    const handleSaveNote = useCallback(async (deliveryNo, note) => {
        try {
            const { error } = await supabase
                .from('deliveries')
                .update({ Note: note, updated_at: new Date().toISOString() })
                .eq('Delivery No', deliveryNo);
            if (error) throw error;
            toast.success('Poznámka uložena.');
            fetchData(); // Znovu načte data pro aktualizaci
        } catch (error) {
            toast.error(`Chyba při ukládání poznámky: ${error.message}`);
        }
    }, [supabase, fetchData]);

    // Funkce pro aktualizaci statusu z Admin panelu
    const handleUpdateStatus = useCallback(async (deliveryNo, status) => {
        try {
            const { data, error } = await supabase
                .from('deliveries')
                .update({ Status: status, updated_at: new Date().toISOString() })
                .eq('Delivery No', deliveryNo)
                .select(); // Přidáno .select() pro vrácení updatovaných řádků

            if (error) throw error;
            
            if (data && data.length > 0) {
                 fetchData(); // Znovu načteme data, aby se změna projevila
                 return { success: true };
            } else {
                return { success: false };
            }
        } catch (error) {
            console.error("Chyba při aktualizaci statusu:", error);
            return { success: false, error: error.message };
        }
    }, [supabase, fetchData]);

    const value = useMemo(() => ({
        allOrdersData,
        summary,
        previousSummary, // <-- PŘIDÁNO: Zpřístupníme předchozí souhrn
        isLoadingData,
        refetchData: fetchData,
        handleFileUpload,
        selectedOrderDetails,
        setSelectedOrderDetails,
        handleSaveNote, // Přidáno pro ukládání poznámek
        handleUpdateStatus, // Přidáno pro admin nástroje
        supabase,
        errorData,
        isLoadingErrorData,
        refetchErrorData: fetchErrorData,
        handleErrorLogUpload,
    }), [allOrdersData, summary, previousSummary, isLoadingData, fetchData, handleFileUpload, selectedOrderDetails, supabase, errorData, isLoadingErrorData, fetchErrorData, handleErrorLogUpload, handleSaveNote, handleUpdateStatus]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};