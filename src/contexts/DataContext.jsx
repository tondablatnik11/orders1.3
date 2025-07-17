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
    const [allOrdersData, setAllOrdersData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [previousSummary, setPreviousSummary] = useState(null); // Bude uchovávat stav před posledním importem
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    
    const [errorData, setErrorData] = useState(null);
    const [isLoadingErrorData, setIsLoadingErrorData] = useState(true);

    const { user, loading: authLoading } = useAuth();
    const supabase = getSupabase();

    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            // Načítáme všechny zakázky pro správné fungování logiky "Smazané"
            const { data, error } = await supabase.from("deliveries").select('*').limit(20000); // Zvýšený limit pro jistotu
            if (error) throw error;
            
            // Zpracujeme data pro zobrazení (tato funkce nyní odfiltruje smazané)
            setSummary(processData(data || []));
            setAllOrdersData(data || []);
        } catch (error) {
            toast.error("Chyba při načítání dat zakázek.");
            setAllOrdersData([]);
            setSummary(null);
        } finally {
            setIsLoadingData(false);
        }
    }, [supabase]);

    const fetchErrorData = useCallback(async () => {
        setIsLoadingErrorData(true);
        try {
            const { data, error } = await supabase.from("errors").select('*').order('timestamp', { ascending: false }).limit(1000);
            if (error) throw error;
            
            const processedErrors = processArrayForDisplay(data || []);
            setErrorData(processedErrors);
        } catch (error) {
            console.error("Chyba ve funkci fetchErrorData:", error);
            toast.error("Chyba při načítání dat pro Error Monitor.");
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

    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;
        toast.loading('Zpracovávám soubor a porovnávám data...');
        const parseExcelDate = (excelDate) => excelDate ? new Date((excelDate - 25569) * 86400 * 1000).toISOString() : null;

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
                    "order_type": row["order type"],
                    "created_at": new Date().toISOString(), 
                    "updated_at": new Date().toISOString() 
                })).filter(row => row["Delivery No"]);

                if (transformedData.length > 0) {
                    // **KROK 1: Uložíme aktuální souhrn jako "předchozí"**
                    setPreviousSummary(summary);

                    // **KROK 2: Najdeme zakázky, které mají být označeny jako "Smazané"**
                    const newDeliveryNos = new Set(transformedData.map(o => o["Delivery No"]));
                    const ordersToMarkAsDeleted = allOrdersData.filter(
                        order => !newDeliveryNos.has(order["Delivery No"]) && order.Status !== 'Smazané' && order.Status === 10
                    );
                    
                    if (ordersToMarkAsDeleted.length > 0) {
                        toast.loading(`Označuji ${ordersToMarkAsDeleted.length} zakázek jako smazané...`);
                        const updates = ordersToMarkAsDeleted.map(order =>
                            supabase.from('deliveries')
                                .update({ Status: 'Smazané', updated_at: new Date().toISOString() })
                                .eq('Delivery No', order["Delivery No"])
                        );
                        await Promise.all(updates);
                    }

                    // **KROK 3: Nahrajeme nová a aktualizovaná data**
                    toast.loading('Nahrávám nová data do databáze...');
                    const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
                    if (error) throw error;
                    
                    toast.dismiss();
                    toast.success('Data byla úspěšně nahrána a synchronizována!');
                    
                    // **KROK 4: Znovu načteme všechna data pro aktualizaci UI**
                    fetchData();
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
    }, [supabase, fetchData, summary, allOrdersData]);
    
    const handleErrorLogUpload = useCallback(async (file) => {
        if (!file) return;
        toast.loading('Zpracovávám a ukládám log chyb...');
        try {
            const dataForSupabase = await processErrorDataForSupabase(file);
            if (dataForSupabase && dataForSupabase.length > 0) {
                const { error } = await supabase.from('errors').upsert(dataForSupabase, { onConflict: 'unique_key' });
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
            fetchData();
        } catch (error) {
            toast.error(`Chyba při ukládání poznámky: ${error.message}`);
        }
    }, [supabase, fetchData]);

    const handleUpdateStatus = useCallback(async (deliveryNo, status) => {
        try {
            const { data, error } = await supabase
                .from('deliveries')
                .update({ Status: status, updated_at: new Date().toISOString() })
                .eq('Delivery No', deliveryNo)
                .select(); 

            if (error) throw error;
            
            if (data && data.length > 0) {
                 fetchData();
                 return { success: true };
            } else {
                throw new Error("Aktualizace se neprovedla. Zkontrolujte RLS politiku v Supabase nebo zda existuje zakázka s daným číslem.");
            }
        } catch (error) {
            console.error("Chyba při aktualizaci statusu:", error);
            return { success: false, error: error.message || "Došlo k neznámé chybě." };
        }
    }, [supabase, fetchData]);

    const value = useMemo(() => ({
        allOrdersData,
        summary,
        previousSummary, // <-- Zpřístupníme previousSummary
        isLoadingData,
        refetchData: fetchData,
        handleFileUpload,
        selectedOrderDetails,
        setSelectedOrderDetails,
        handleSaveNote,
        handleUpdateStatus,
        supabase,
        errorData,
        isLoadingErrorData,
        refetchErrorData: fetchErrorData,
        handleErrorLogUpload,
    }), [allOrdersData, summary, previousSummary, isLoadingData, fetchData, handleFileUpload, selectedOrderDetails, supabase, errorData, isLoadingErrorData, fetchErrorData, handleErrorLogUpload, handleSaveNote, handleUpdateStatus]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};