'use client';

import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { processData } from '../lib/dataProcessor';
// Opravený import pro zpracování chyb
import { processErrorData } from '../lib/errorMonitorProcessor';
import toast from 'react-hot-toast';

// Ujistěte se, že máte knihovnu pro práci s XLSX soubory, pokud ji ještě nemáte
// npm install xlsx
import * as XLSX from 'xlsx';


export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    // Stavy pro data objednávek (deliveries)
    const [allOrdersData, setAllOrdersData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    
    // Stavy pro data z Error Monitoru
    const [errorLogData, setErrorLogData] = useState(null); // Změněno na null pro konzistenci
    const [isLoadingErrorData, setIsLoadingErrorData] = useState(true);

    const { currentUser, loading: authLoading } = useAuth();
    const supabase = getSupabase();

    // Načítání dat objednávek
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
    
    // Načítání dat chyb
    const fetchErrorData = useCallback(async () => {
        setIsLoadingErrorData(true);
        try {
            const { data, error } = await supabase.from("errors").select('*').limit(1000);
            if (error) throw error;
            const processedErrors = await processErrorData(data || []);
            setErrorLogData(processedErrors);
        } catch (error) {
            toast.error("Chyba při načítání logu chyb.");
            console.error("DataContext: Chyba při načítání chyb:", error);
            setErrorLogData(null);
        } finally {
            setIsLoadingErrorData(false);
        }
    }, [supabase]);


    useEffect(() => {
        if (currentUser && !authLoading) {
            fetchData();
            fetchErrorData(); // Načteme i data chyb
        } else if (!currentUser && !authLoading) {
            // Resetování stavů po odhlášení
            setAllOrdersData([]);
            setSummary(null);
            setErrorLogData(null);
            setIsLoadingData(false);
            setIsLoadingErrorData(false);
        }
    }, [currentUser, authLoading, fetchData, fetchErrorData]);

    // Funkce pro nahrání souboru s objednávkami (zůstává z vašeho kódu)
    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;
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
                    fetchData(); // Znovu načteme data po nahrání
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
    
    // Memoizovaná hodnota pro context
    const value = useMemo(() => ({
        allOrdersData,
        summary,
        isLoadingData,
        refetchData: fetchData,
        handleFileUpload,
        selectedOrderDetails,
        setSelectedOrderDetails,
        supabase,
        // Poskytujeme data a stavy pro Error Monitor
        errorLogData,
        isLoadingErrorData,
        refetchErrorData: fetchErrorData
    }), [allOrdersData, summary, isLoadingData, fetchData, handleFileUpload, selectedOrderDetails, supabase, errorLogData, isLoadingErrorData, fetchErrorData]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};