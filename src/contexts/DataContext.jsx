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
            const processed = processData(data || []);
            setSummary(processed);
        } catch (error) {
            toast.error("Chyba při načítání dat zakázek.");
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
                const transformedData = jsonData.map(row => ({ "Delivery No": String(row["Delivery No"] || '').trim(), "Status": Number(row["Status"]), "del.type": row["del.type"], "Loading Date": parseExcelDate(row["Loading Date"]), "Note": row["Note"] || "", "Forwarding agent name": row["Forwarding agent name"], "Name of ship-to party": row["Name of ship-to party"], "Total Weight": row["Total Weight"], "Bill of lading": row["Bill of lading"], "Country ship-to prty": row["Country ship-to prty"], "created_at": new Date().toISOString(), "updated_at": new Date().toISOString() })).filter(row => row["Delivery No"]);

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

    const value = useMemo(() => ({
        allOrdersData,
        summary,
        isLoadingData,
        refetchData: fetchData,
        handleFileUpload,
        selectedOrderDetails,
        setSelectedOrderDetails,
        supabase,
        errorData,
        isLoadingErrorData,
        refetchErrorData: fetchErrorData,
        handleErrorLogUpload,
    }), [allOrdersData, summary, isLoadingData, fetchData, handleFileUpload, selectedOrderDetails, supabase, errorData, isLoadingErrorData, fetchErrorData, handleErrorLogUpload]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};