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
    const [previousSummary, setPreviousSummary] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    
    const [errorData, setErrorData] = useState(null);
    const [isLoadingErrorData, setIsLoadingErrorData] = useState(true);

    const { user, loading: authLoading } = useAuth();
    const supabase = getSupabase();

    const fetchData = useCallback(async () => {
        // Tento useCallback nyní pouze načítá data, logika pro souhrny je oddělena
        try {
            const { data, error } = await supabase.from("deliveries").select('*').limit(20000);
            if (error) throw error;
            return data || [];
        } catch (error) {
            toast.error("Chyba při načítání dat zakázek.");
            return [];
        }
    }, [supabase]);
    
    // Nová funkce pro načtení a nastavení obou souhrnů při startu
    const fetchAndSetSummaries = useCallback(async () => {
        setIsLoadingData(true);
        try {
            // 1. Načteme poslední uložený souhrn z DB -> stane se z něj "předchozí"
            const { data: snapshot, error: snapshotError } = await supabase
                .from('summary_snapshots')
                .select('summary_data')
                .eq('id', 1)
                .single();

            if (snapshotError) {
                console.warn("Nepodařilo se načíst snapshot souhrnu, indikátory nebudou dostupné.", snapshotError.message);
                setPreviousSummary(null);
            } else {
                setPreviousSummary(snapshot.summary_data);
            }

            // 2. Načteme aktuální data o zakázkách a vytvoříme z nich "současný" souhrn
            const currentData = await fetchData();
            setAllOrdersData(currentData);
            setSummary(processData(currentData));

        } catch (error) {
            toast.error("Kompletní inicializace dat selhala.");
            setAllOrdersData([]);
            setSummary(null);
            setPreviousSummary(null);
        } finally {
            setIsLoadingData(false);
        }
    }, [supabase, fetchData]);

    useEffect(() => {
        if (user && !authLoading) {
            fetchAndSetSummaries();
            fetchErrorData();
        }
    }, [user, authLoading, fetchAndSetSummaries, fetchErrorData]);

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
                    "updated_at": new Date().toISOString() 
                })).filter(row => row["Delivery No"]);

                if (transformedData.length > 0) {
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
                    
                    toast.loading('Nahrávám nová data do databáze...');
                    const { error: upsertError } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
                    if (upsertError) throw upsertError;

                    // Po úspěšném nahrání aktualizujeme stavy pro zobrazení indikátorů
                    setPreviousSummary(summary); // Aktuální se stává předchozím

                    const newData = await fetchData(); // Načteme nová data
                    const newSummary = processData(newData); // Zpracujeme je

                    setAllOrdersData(newData);
                    setSummary(newSummary);

                    // A uložíme nový souhrn do DB pro příští načtení stránky
                    const { error: snapshotError } = await supabase
                        .from('summary_snapshots')
                        .upsert({ id: 1, summary_data: newSummary });
                    if(snapshotError) throw snapshotError;

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
    }, [supabase, fetchData, summary, allOrdersData]);
    
    const fetchErrorData = useCallback(async () => {
        // ... (beze změny)
    }, [supabase]);

    const handleSaveNote = useCallback(async (deliveryNo, note) => {
        // ... (beze změny)
    }, [supabase, fetchData]);

    const handleUpdateStatus = useCallback(async (deliveryNo, status) => {
       // ... (beze změny)
    }, [supabase, fetchData]);

    const value = useMemo(() => ({
        allOrdersData,
        summary,
        previousSummary,
        isLoadingData,
        refetchData: fetchAndSetSummaries, // <-- Měníme na novou funkci
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