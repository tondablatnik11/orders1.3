// src/contexts/DataContext.jsx
'use client';
import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { processData } from '../lib/dataProcessor';
import { processArrayForDisplay, processErrorDataForSupabase } from '../lib/errorMonitorProcessor';
import toast from 'react-hot-toast';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [allOrdersData, setAllOrdersData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [previousSummary, setPreviousSummary] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [errorData, setErrorData] = useState(null);
    const [isLoadingErrorData, setIsLoadingErrorData] = useState(true);

    const { user, loading: authLoading } = useAuth();
    const supabase = getSupabase();

    const fetchErrorData = useCallback(async () => {
        setIsLoadingErrorData(true);
        try {
            const { data, error } = await supabase.from("errors").select('*').order('timestamp', { ascending: false }).limit(1000);
            if (error) throw error;
            
            const processedErrors = processArrayForDisplay(data || []);
            setErrorData(processedErrors);
        } catch (error) {
            console.error("Chyba ve funkci fetchErrorData:", error);
            // Chybu již hlásí ostatní funkce, zde není potřeba toast
        } finally {
            setIsLoadingErrorData(false);
        }
    }, [supabase]);

    const fetchAndSetSummaries = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const { data: snapshotData, error: snapshotError } = await supabase
                .from('summary_snapshots')
                .select('summary_data')
                .eq('id', 1)
                .single();
            
            if (snapshotError && snapshotError.code !== 'PGRST116') {
                // Ignorujeme chybu, pouze pokud řádek neexistuje, jiné chyby logujeme
                console.warn("Chyba při načítání snapshotu:", snapshotError.message);
            } else {
                 setPreviousSummary(snapshotData ? snapshotData.summary_data : null);
            }
            
            const { data: currentData, error: dataError } = await supabase.from("deliveries").select('*').limit(20000);
            if (dataError) throw dataError;
            
            const currentSummary = processData(currentData || []);
            setAllOrdersData(currentData || []);
            setSummary(currentSummary);

        } catch (error) {
             if (!error.message.includes('security policy')) {
               toast.error("Chyba při inicializaci dat.");
            }
        } finally {
            setIsLoadingData(false);
        }
    }, [supabase]);
    
    useEffect(() => {
        if (user && !authLoading) {
            fetchAndSetSummaries();
            fetchErrorData();
        }
    }, [user, authLoading, fetchAndSetSummaries, fetchErrorData]);

    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;
        toast.loading('Zpracovávám soubor...');
        
        const XLSX = await import('xlsx');

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);
                
                const parseExcelDate = (excelDate) => excelDate ? new Date(excelDate).toISOString() : null;

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
                    "order_type": row["order type"],
                    "updated_at": new Date().toISOString() 
                })).filter(row => row["Delivery No"]);

                if (transformedData.length > 0) {
                    setPreviousSummary(summary);
                    
                    toast.loading('Nahrávám nová data...');
                    const { error: upsertError } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
                    if (upsertError) throw upsertError;
                    
                    const { data: newData, error: dataError } = await supabase.from("deliveries").select('*').limit(20000);
                    if(dataError) throw dataError;

                    const newSummary = processData(newData || []);
                    
                    setAllOrdersData(newData || []);
                    setSummary(newSummary);

                    await supabase
                        .from('summary_snapshots')
                        .upsert({ id: 1, summary_data: newSummary, updated_at: new Date().toISOString() }, { onConflict: 'id' });

                    toast.dismiss();
                    toast.success('Data byla úspěšně nahrána a synchronizována!');

                } else {
                    toast.dismiss();
                    toast.error('Nenalezena žádná platná data v souboru.');
                }
            } catch (error) {
                toast.dismiss();
                toast.error(`Chyba při nahrávání: ${error.message}`);
            }
        };
        reader.readAsBinaryString(file);
    }, [supabase, summary]);

    const handleErrorLogUpload = useCallback(async (file) => {
        if (!file) return;
        toast.loading('Ověřuji přihlášení a zpracovávám soubor...');
        try {
            // 1. Vynutíme si obnovení session, abychom měli jistotu platného tokenu.
            const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

            if (sessionError) {
              throw new Error(`Chyba obnovení session: ${sessionError.message}`);
            }
            if (!session) {
                throw new Error("Chyba autentizace. Zkuste se prosím znovu přihlásit.");
            }

            // 2. Explicitně nastavíme novou session pro klienta.
            supabase.auth.setSession(session);

            // 3. Pokračujeme v nahrávání souboru.
            const dataForSupabase = await processErrorDataForSupabase(file);
            if (dataForSupabase && dataForSupabase.length > 0) {
                const { error } = await supabase.from('errors').upsert(dataForSupabase, { onConflict: 'unique_key' });
                if (error) throw error;
            } else {
                 throw new Error("Soubor neobsahuje žádná platná data ke zpracování.");
            }
            toast.dismiss();
            toast.success('Log chyb byl úspěšně nahrán!');
            await fetchErrorData();
        } catch (error) {
            toast.dismiss();
            toast.error(`Chyba při nahrávání logu: ${error.message}`);
        }
    }, [supabase, fetchErrorData]);

    const value = useMemo(() => ({
        allOrdersData,
        summary,
        previousSummary,
        isLoadingData,
        refetchData: fetchAndSetSummaries,
        handleFileUpload,
        handleErrorLogUpload,
        errorData,
        isLoadingErrorData,
        refetchErrorData: fetchErrorData,
    }), [allOrdersData, summary, previousSummary, isLoadingData, fetchAndSetSummaries, handleFileUpload, handleErrorLogUpload, errorData, isLoadingErrorData, fetchErrorData]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};