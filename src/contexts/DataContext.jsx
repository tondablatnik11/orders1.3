// src/contexts/DataContext.jsx
'use client';
import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { processData } from '../lib/dataProcessor';
import { processArrayForDisplay, processErrorDataForSupabase } from '../lib/errorMonitorProcessor';
import toast from 'react-hot-toast';
// NOVÉ: Import pro práci s databází Firestore pro notifikace
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [allOrdersData, setAllOrdersData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [previousSummary, setPreviousSummary] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [errorData, setErrorData] = useState(null);
    const [isLoadingErrorData, setIsLoadingErrorData] = useState(true);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [statusHistory, setStatusHistory] = useState({ isVisible: false, data: [] });

    // NOVÉ: Přidáváme db a appId z Auth kontextu pro notifikace
    const { user, loading: authLoading, db, appId } = useAuth();
    const supabase = getSupabase();

    const fetchErrorData = useCallback(async () => {
        setIsLoadingErrorData(true);
        try {
            const { data, error } = await supabase.from("errors").select('*').order('timestamp', { ascending: false }).limit(1000);
            if (error) throw error;
            setErrorData(processArrayForDisplay(data || []));
        } catch (error) {
            console.error("Chyba ve funkci fetchErrorData:", error);
        } finally {
            setIsLoadingErrorData(false);
        }
    }, [supabase]);

    const handleSaveNote = useCallback(async (deliveryNo, note) => {
        const { error } = await supabase
            .from('deliveries')
            .update({ Note: note, updated_at: new Date().toISOString() })
            .eq('Delivery No', deliveryNo);

        if (error) {
            toast.error('Chyba při ukládání poznámky.');
            console.error("Note save error:", error);
        } else {
            toast.success('Poznámka uložena.');
            setAllOrdersData(prevData =>
                prevData.map(order =>
                    order['Delivery No'] === deliveryNo ? { ...order, Note: note } : order
                )
            );
        }
    }, [supabase]);
    
     const fetchStatusHistory = useCallback(async (deliveryNo) => {
        if (!deliveryNo) return;
        const { data, error } = await supabase
            .from('delivery_status_log')
            .select('*')
            .eq('delivery', deliveryNo)
            .order('timestamp', { ascending: false });

        if (error) {
            toast.error("Nepodařilo se načíst historii stavů.");
            return;
        }
        setStatusHistory({ isVisible: true, data: data });
    }, [supabase]);

    // NOVÉ: Funkce pro odeslání notifikace
    const sendNotification = useCallback(async (recipientUid, message) => {
        if (!db || !appId || !recipientUid) return;
        try {
            const notificationsRef = collection(db, `artifacts/${appId}/public/data/notifications`);
            await addDoc(notificationsRef, {
                recipient_uid: recipientUid,
                message: message,
                read: false,
                created_at: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    }, [db, appId]);

    // NOVÉ: Funkce pro načtení komentářů k objednávce
    const fetchOrderComments = useCallback(async (deliveryNo) => {
        if (!deliveryNo) return [];
        const { data, error } = await supabase
            .from('order_comments')
            .select('*')
            .eq('delivery_no', deliveryNo)
            .order('created_at', { ascending: true });
        if (error) {
            console.error("Error fetching comments:", error);
            return [];
        }
        return data;
    }, [supabase]);

    // NOVÉ: Funkce pro přidání komentáře k objednávce
    const addOrderComment = useCallback(async (deliveryNo, text, authorId, authorName, mentionedUsers) => {
        const { data, error } = await supabase
            .from('order_comments')
            .insert([{ delivery_no: deliveryNo, text, author_id: authorId, author_name: authorName }])
            .select();

        if (error) {
            toast.error("Chyba při ukládání komentáře.");
            return null;
        }

        // Odeslání notifikací zmíněným uživatelům
        if (mentionedUsers && mentionedUsers.length > 0) {
            const message = `${authorName} vás zmínil/a v komentáři u objednávky ${deliveryNo}.`;
            mentionedUsers.forEach(userId => {
                sendNotification(userId, message);
            });
        }

        return data[0];
    }, [supabase, sendNotification]);

    const fetchAndSetSummaries = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const { data: snapshotData, error: snapshotError } = await supabase.from('summary_snapshots').select('summary_data').eq('id', 1).single();
            if (snapshotError && snapshotError.code !== 'PGRST116') {
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
        if (!user) {
            toast.error("Pro nahrání souboru musíte být přihlášen.");
            return;
        }
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
                const transformedData = jsonData.map(row => ({ "Delivery No": String(row["Delivery No"] || row["Delivery"] || '').trim(), "Status": Number(row["Status"]), "del.type": row["del.type"], "Loading Date": parseExcelDate(row["Loading Date"]), "Note": row["Note"] || "", "Forwarding agent name": row["Forwarding agent name"], "Name of ship-to party": row["Name of ship-to party"], "Total Weight": row["Total Weight"], "Bill of lading": row["Bill of lading"], "Country ship-to prty": row["Country ship-to prty"], "order_type": row["order type"], "updated_at": new Date().toISOString() })).filter(row => row["Delivery No"]);
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
    }, [supabase, summary, user]);
    
    const handleErrorLogUpload = useCallback(async (file) => {
        if (!file) return;
        if (!user) {
            toast.error("Pro nahrání souboru musíte být přihlášen.");
            return;
        }
        toast.loading('Zpracovávám soubor...');
        try {
            const dataForSupabase = await processErrorDataForSupabase(file);
            if (dataForSupabase && dataForSupabase.length > 0) {
                const { error } = await supabase.from('errors').upsert(dataForSupabase, { onConflict: 'unique_key' });
                if (error) throw new Error(error.message);
            } else {
                 throw new Error("Soubor neobsahuje žádná platná data ke zpracování.");
            }
            toast.dismiss();
            toast.success('Log chyb byl úspěšně nahrán!');
            await fetchErrorData();
        } catch (error) {
            toast.dismiss();
            toast.error(`Chyba při nahrávání logu: ${error.message}`);
            console.error("Detail chyby při nahrávání logu:", error);
        }
    }, [supabase, fetchErrorData, user]);
    
    const handleUpdateStatus = useCallback(async (deliveryNo, newStatus) => {
         const { data, error } = await supabase
            .from('deliveries')
            .update({ Status: newStatus, updated_at: new Date().toISOString() })
            .eq('Delivery No', deliveryNo)
            .select()
            
        if (error) {
            toast.error(`Chyba při aktualizaci statusu: ${error.message}`);
            return { success: false };
        }
        if (data && data.length > 0) {
            toast.success(`Status pro zakázku ${deliveryNo} byl aktualizován.`);
            fetchAndSetSummaries();
            return { success: true };
        }
        return { success: false };
    }, [supabase, fetchAndSetSummaries]);

    // UPRAVENO: Přidány nové funkce do kontextu
    const value = useMemo(() => ({
        allOrdersData, summary, previousSummary, isLoadingData, refetchData: fetchAndSetSummaries, handleFileUpload, handleErrorLogUpload, errorData, isLoadingErrorData, refetchErrorData: fetchErrorData,
        selectedOrderDetails, setSelectedOrderDetails, handleSaveNote, handleUpdateStatus,
        statusHistory, fetchStatusHistory, setStatusHistory,
        fetchOrderComments, addOrderComment,
    }), [allOrdersData, summary, previousSummary, isLoadingData, fetchAndSetSummaries, handleFileUpload, handleErrorLogUpload, errorData, isLoadingErrorData, fetchErrorData, selectedOrderDetails, handleSaveNote, handleUpdateStatus, statusHistory, fetchStatusHistory, fetchOrderComments, addOrderComment]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};