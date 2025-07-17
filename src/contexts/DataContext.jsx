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
            toast.error("Chyba při načítání dat pro Error Monitor.");
            setErrorData(null);
        } finally {
            setIsLoadingErrorData(false);
        }
    }, [supabase]);

    const fetchAndSetSummaries = useCallback(async () => {
        setIsLoadingData(true);
        try {
            // KLÍČOVÁ ZMĚNA: Načtení posledního uloženého souhrnu z databáze
            const { data: snapshot, error: snapshotError } = await supabase
                .from('summary_snapshots')
                .select('summary_data')
                .eq('id', 1)
                .single();
            
            if (snapshotError) {
                console.warn("Snapshot nenalezen, indikátory nebudou dostupné.", snapshotError.message);
                setPreviousSummary(null);
            } else {
                // Nastavení načteného snapshotu jako "předchozího" stavu
                setPreviousSummary(snapshot.summary_data);
            }
            
            const { data: currentData, error: dataError } = await supabase.from("deliveries").select('*').limit(20000);
            if (dataError) throw dataError;
            
            const processed = processData(currentData || []);
            setAllOrdersData(currentData || []);
            setSummary(processed);

        } catch (error) {
            toast.error("Chyba při inicializaci dat.");
            setAllOrdersData([]);
            setSummary(null);
            setPreviousSummary(null);
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
                    // KLÍČOVÁ ZMĚNA: Uchování aktuálního souhrnu PŘED nahráním nových dat
                    const currentSummary = processData(allOrdersData);
                    setPreviousSummary(currentSummary);

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
                    
                    toast.loading('Nahrávám nová data...');
                    const { error: upsertError } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
                    if (upsertError) throw upsertError;
                    
                    const { data: newData, error: dataError } = await supabase.from("deliveries").select('*').limit(20000);
                    if(dataError) throw dataError;

                    const newSummary = processData(newData || []);
                    
                    setAllOrdersData(newData || []);
                    setSummary(newSummary);

                    // KLÍČOVÁ ZMĚNA: Uložení nového souhrnu do databáze jako snapshot pro příští načtení
                    await supabase.from('summary_snapshots').upsert({ id: 1, summary_data: newSummary, updated_at: new Date().toISOString() }, { onConflict: 'id' });

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
    }, [supabase, allOrdersData, summary]);

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
            await fetchErrorData();
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
            await fetchAndSetSummaries();
        } catch (error) {
            toast.error(`Chyba při ukládání poznámky: ${error.message}`);
        }
    }, [supabase, fetchAndSetSummaries]);

    const handleUpdateStatus = useCallback(async (deliveryNo, status) => {
        try {
            const { data, error } = await supabase
                .from('deliveries')
                .update({ Status: status, updated_at: new Date().toISOString() })
                .eq('Delivery No', deliveryNo)
                .select(); 

            if (error) throw error;
            
            if (data && data.length > 0) {
                 await fetchAndSetSummaries();
                 return { success: true };
            } else {
                throw new Error("Aktualizace se neprovedla.");
            }
        } catch (error) {
            console.error("Chyba při aktualizaci statusu:", error);
            return { success: false, error: error.message || "Došlo k neznámé chybě." };
        }
    }, [supabase, fetchAndSetSummaries]);

    const value = useMemo(() => ({
        allOrdersData,
        summary,
        previousSummary,
        isLoadingData,
        refetchData: fetchAndSetSummaries,
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
    }), [allOrdersData, summary, previousSummary, isLoadingData, fetchAndSetSummaries, handleFileUpload, selectedOrderDetails, supabase, errorData, isLoadingErrorData, fetchErrorData, handleErrorLogUpload, handleSaveNote, handleUpdateStatus]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};