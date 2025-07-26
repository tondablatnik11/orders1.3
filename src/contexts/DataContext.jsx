'use client';
import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { getSupabase } from '@/lib/supabaseClient'; // Opravená cesta
import { useAuth } from '@/hooks/useAuth';
import { processData } from '@/lib/dataProcessor'; // Opravená cesta
import { processArrayForDisplay, processErrorDataForSupabase } from '@/lib/errorMonitorProcessor'; // Opravená cesta
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [allOrdersData, setAllOrdersData] = useState([]);
    const [pickingData, setPickingData] = useState([]); // <-- NOVÝ STAV PRO PICKING DATA
    const [summary, setSummary] = useState(null);
    const [previousSummary, setPreviousSummary] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [errorData, setErrorData] = useState(null);
    const [isLoadingErrorData, setIsLoadingErrorData] = useState(true);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [statusHistory, setStatusHistory] = useState({ isVisible: false, data: [] });

    const { user, loading: authLoading, db, appId } = useAuth();
    const supabase = getSupabase();

    // PŘEJMENOVÁNO A ROZŠÍŘENO: Načte VŠECHNA potřebná data pro aplikaci
    const fetchAllApplicationData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            // Paralelně načteme data o zakázkách, pickování i chybách
            const [deliveriesResult, pickingResult, errorsResult, snapshotResult] = await Promise.all([
                supabase.from("deliveries").select('*').limit(20000),
                supabase.from('picking_dashboard_data').select('*'),
                supabase.from("errors").select('*').order('timestamp', { ascending: false }).limit(1000),
                supabase.from('summary_snapshots').select('summary_data').eq('id', 1).single()
            ]);

            if (deliveriesResult.error) throw deliveriesResult.error;
            if (pickingResult.error) throw pickingResult.error;
            if (errorsResult.error) throw errorsResult.error;

            // Zpracování dat o zakázkách
            const currentOrders = deliveriesResult.data || [];
            const currentSummary = processData(currentOrders);
            setAllOrdersData(currentOrders);
            setSummary(currentSummary);
            if (snapshotResult.data) {
                setPreviousSummary(snapshotResult.data.summary_data);
            }

            // Zpracování ostatních dat
            setPickingData(pickingResult.data || []);
            setErrorData(processArrayForDisplay(errorsResult.data || []));

        } catch (error) {
             if (error && !error.message.includes('security policy') && error.code !== 'PGRST116') {
                toast.error("Chyba při inicializaci dat.");
                console.error("Data fetch error:", error);
             }
        } finally {
            setIsLoadingData(false);
        }
    }, [supabase]);
    
    useEffect(() => {
        if (user && !authLoading) {
            fetchAllApplicationData();
        }
    }, [user, authLoading, fetchAllApplicationData]);
    
    // Zbytek vašich původních, funkčních metod
    const handleSaveNote = useCallback(async (deliveryNo, note) => {
        const { error } = await supabase.from('deliveries').update({ Note: note, updated_at: new Date().toISOString() }).eq('Delivery No', deliveryNo);
        if (error) {
            toast.error('Chyba při ukládání poznámky.');
            console.error("Note save error:", error);
        } else {
            toast.success('Poznámka uložena.');
            setAllOrdersData(prevData => prevData.map(order => order['Delivery No'] === deliveryNo ? { ...order, Note: note } : order));
        }
    }, [supabase]);
    
    const fetchStatusHistory = useCallback(async (deliveryNo) => {
        if (!deliveryNo) return;
        const { data, error } = await supabase.from('delivery_status_log').select('*').eq('delivery', deliveryNo).order('timestamp', { ascending: false });
        if (error) {
            toast.error("Nepodařilo se načíst historii stavů.");
            return;
        }
        setStatusHistory({ isVisible: true, data: data });
    }, [supabase]);

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

    const fetchOrderComments = useCallback(async (deliveryNo) => {
        if (!deliveryNo) return [];
        const { data, error } = await supabase.from('order_comments').select('*').eq('delivery_no', deliveryNo).order('created_at', { ascending: true });
        if (error) {
            console.error("Error fetching comments:", error);
            return [];
        }
        return data;
    }, [supabase]);

    const addOrderComment = useCallback(async (deliveryNo, text, authorId, authorName, mentionedUsers) => {
        const { data, error } = await supabase.from('order_comments').insert([{ delivery_no: deliveryNo, text, author_id: authorId, author_name: authorName }]).select();
        if (error) {
            toast.error("Chyba při ukládání komentáře.");
            return null;
        }
        if (mentionedUsers && mentionedUsers.length > 0) {
            const message = `${authorName} vás zmínil/a v komentáři u objednávky ${deliveryNo}.`;
            mentionedUsers.forEach(userId => { sendNotification(userId, message); });
        }
        return data[0];
    }, [supabase, sendNotification]);

    const handleFileUpload = useCallback(async (file) => {
        if (!file || !user) {
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
                    await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
                    toast.dismiss();
                    toast.success('Data byla úspěšně nahrána! Obnovuji přehled...');
                    await fetchAllApplicationData();
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
    }, [supabase, user, fetchAllApplicationData]);
    
    const handleErrorLogUpload = useCallback(async (file) => {
        if (!file || !user) {
            toast.error("Pro nahrání souboru musíte být přihlášen.");
            return;
        }
        toast.loading('Zpracovávám soubor...');
        try {
            const dataForSupabase = await processErrorDataForSupabase(file);
            if (dataForSupabase && dataForSupabase.length > 0) {
                await supabase.from('errors').upsert(dataForSupabase, { onConflict: 'unique_key' });
            } else {
                 throw new Error("Soubor neobsahuje žádná platná data.");
            }
            toast.dismiss();
            toast.success('Log chyb byl úspěšně nahrán!');
            await fetchAllApplicationData();
        } catch (error) {
            toast.dismiss();
            toast.error(`Chyba při nahrávání logu: ${error.message}`);
        }
    }, [supabase, user, fetchAllApplicationData]);
    
    const handleUpdateStatus = useCallback(async (deliveryNo, newStatus) => {
        const { data, error } = await supabase.from('deliveries').update({ Status: newStatus, updated_at: new Date().toISOString() }).eq('Delivery No', deliveryNo).select();
        if (error) {
            toast.error(`Chyba při aktualizaci statusu: ${error.message}`);
            return { success: false };
        }
        if (data && data.length > 0) {
            toast.success(`Status pro zakázku ${deliveryNo} byl aktualizován.`);
            fetchAllApplicationData();
            return { success: true };
        }
        return { success: false };
    }, [supabase, fetchAllApplicationData]);

    const value = useMemo(() => ({
        allOrdersData, 
        pickingData, // <-- PŘIDÁNO
        summary, 
        previousSummary, 
        isLoadingData, 
        refetchData: fetchAllApplicationData, 
        handleFileUpload, 
        handleErrorLogUpload, 
        errorData, 
        isLoadingErrorData,
        selectedOrderDetails, 
        setSelectedOrderDetails, 
        handleSaveNote, 
        handleUpdateStatus,
        statusHistory, 
        fetchStatusHistory, 
        setStatusHistory,
        fetchOrderComments, 
        addOrderComment,
    }), [
        allOrdersData, pickingData, summary, previousSummary, isLoadingData,
        fetchAllApplicationData, handleFileUpload, handleErrorLogUpload, errorData, isLoadingErrorData,
        selectedOrderDetails, handleSaveNote, handleUpdateStatus,
        statusHistory, fetchStatusHistory, fetchOrderComments, addOrderComment
    ]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};