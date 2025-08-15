'use client';
import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { processData } from '@/lib/dataProcessor';
import { processArrayForDisplay, processErrorDataForSupabase } from '@/lib/errorMonitorProcessor';
import toast from 'react-hot-toast';
import { collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [allOrdersData, setAllOrdersData] = useState([]);
    const [pickingData, setPickingData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [previousSummary, setPreviousSummary] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [errorData, setErrorData] = useState(null);
    const [isLoadingErrorData, setIsLoadingErrorData] = useState(true);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [statusHistory, setStatusHistory] = useState({ isVisible: false, data: [] });

    const { user, loading: authLoading, db, appId } = useAuth();
    const supabase = getSupabase();

    const fetchAllApplicationData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const { data: ordersData, error: ordersError } = await supabase.from('orders_view').select('*');
            if (ordersError) throw ordersError;

            const { data: picking, error: pickingError } = await supabase.from('picking_data').select('*');
            if (pickingError) throw pickingError;
            
            setAllOrdersData(ordersData || []);
            setPickingData(picking || []);
            
            const newSummary = processData(ordersData, picking);
            setSummary(prev => {
                if(prev) setPreviousSummary(prev);
                return newSummary;
            });
            
        } catch (error) {
            console.error("Chyba při načítání aplikačních dat:", error);
            toast.error("Nepodařilo se načíst data objednávek.");
            setAllOrdersData([]);
            setPickingData([]);
            setSummary(null);
        } finally {
            setIsLoadingData(false);
        }
    }, [supabase]);
    
    const refetchErrorData = useCallback(async () => {
        setIsLoadingErrorData(true);
        try {
            const { data, error } = await supabase.from('scan_errors_log').select('*');
            if (error) throw error;
            const processed = processArrayForDisplay(data);
            setErrorData(processed);
        } catch (error) {
            console.error("Chyba při načítání dat z error monitoru:", error);
            setErrorData(null);
            toast.error("Nepodařilo se načíst data z error monitoru.");
        } finally {
            setIsLoadingErrorData(false);
        }
    }, [supabase]);

    useEffect(() => {
        // TATO ČÁST JE OPRAVENA
        // Správně čeká na dokončení ověřování a existenci uživatele,
        // než spustí načítání veškerých dat.
        if (!authLoading && user) {
            fetchAllApplicationData();
            refetchErrorData(); // <-- Přidáno sem pro načtení po přihlášení
        } else if (!authLoading && !user) {
            // Pokud není uživatel přihlášen, ukončíme všechny načítací stavy
            setIsLoadingData(false);
            setIsLoadingErrorData(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user]);


    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;
        const toastId = toast.loading('Zpracovávám soubor...');
        try {
            const XLSX = await import('xlsx');
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    
                    const { error } = await supabase.from('orders_data').upsert(json, { onConflict: 'Delivery No' });
                    if (error) throw error;
                    
                    toast.success('Data byla úspěšně nahrána a aktualizována.', { id: toastId });
                    await fetchAllApplicationData();
                } catch (err) {
                     toast.error(`Chyba při zpracování souboru: ${err.message}`, { id: toastId });
                }
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            toast.error(`Chyba: ${error.message}`, { id: toastId });
        }
    }, [supabase, fetchAllApplicationData]);

    const handleErrorLogUpload = useCallback(async (file) => {
        if (!file) return;
        const toastId = toast.loading('Zpracovávám soubor s chybami...');
        setIsLoadingErrorData(true);
        try {
            const dataForSupabase = await processErrorDataForSupabase(file);
            
            if (dataForSupabase && dataForSupabase.length > 0) {
                const { error: deleteError } = await supabase.from('scan_errors_log').delete().neq('id', 0);
                if (deleteError) throw new Error(`Nepodařilo se smazat stará data: ${deleteError.message}`);

                const { error: insertError } = await supabase.from('scan_errors_log').insert(dataForSupabase);
                if (insertError) throw new Error(`Chyba při nahrávání dat: ${insertError.message}`);
            }

            toast.success('Data chyb byla úspěšně nahrána. Obnovuji zobrazení...', { id: toastId });
            await refetchErrorData();
        } catch (error) {
            console.error("Chyba při nahrávání logu chyb:", error);
            toast.error(`Chyba: ${error.message}`, { id: toastId });
            setIsLoadingErrorData(false); // Zajistíme vypnutí i při chybě
        }
    }, [supabase, refetchErrorData]);


    const fetchStatusHistory = useCallback(async (deliveryNo) => {
        try {
            const { data, error } = await supabase
                .from('delivery_status_log')
                .select('status, timestamp')
                .eq('delivery', deliveryNo)
                .order('timestamp', { ascending: false });
            
            if (error) throw error;
            setStatusHistory({ isVisible: true, data: data });
        } catch (error) {
            console.error("Chyba při načítání historie statusů:", error);
            toast.error("Nepodařilo se načíst historii.");
        }
    }, [supabase]);

    const fetchOrderComments = useCallback(async (deliveryNo) => {
        if (!db || !appId) return [];
        try {
            const commentsColRef = collection(db, `artifacts/${appId}/public/data/order_comments`);
            const q = query(commentsColRef, where("delivery_no", "==", deliveryNo), orderBy("created_at", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Chyba při načítání komentářů:", error);
            return [];
        }
    }, [db, appId]);

    const addOrderComment = useCallback(async (deliveryNo, commentText) => {
        if (!db || !appId || !user) return null;
        try {
            const commentsColRef = collection(db, `artifacts/${appId}/public/data/order_comments`);
            const docRef = await addDoc(commentsColRef, {
                delivery_no: deliveryNo,
                text: commentText,
                author_id: user.uid,
                author_name: user.displayName || user.email,
                created_at: new Date().toISOString(),
            });
            return { id: docRef.id, text: commentText, author_name: user.displayName || user.email, created_at: new Date().toISOString() };
        } catch (error) {
            console.error("Chyba při přidávání komentáře:", error);
            toast.error("Komentář se nepodařilo uložit.");
            return null;
        }
    }, [db, appId, user]);

    const handleSaveNote = useCallback(async (deliveryNo, note) => {
        const { data, error } = await supabase.from('orders_data').update({ Note: note }).eq('Delivery No', deliveryNo).select();
        if (error) {
            toast.error(`Chyba při ukládání poznámky: ${error.message}`);
            return { success: false };
        }
        if(data && data.length > 0) {
            toast.success("Poznámka byla uložena.");
            setAllOrdersData(prev => prev.map(o => o['Delivery No'] === deliveryNo ? { ...o, Note: note } : o));
            return { success: true, updatedOrder: data[0] };
        }
        return { success: false };
    }, [supabase]);

    const handleUpdateStatus = useCallback(async (deliveryNo, status) => {
        const { data, error } = await supabase.from('orders_data').update({ Status: status }).eq('Delivery No', deliveryNo).select();
        if (error) {
            toast.error(`Chyba při aktualizaci statusu: ${error.message}`);
            return { success: false };
        }
        if (data && data.length > 0) {
            toast.success(`Status pro zakázku ${deliveryNo} byl aktualizován.`);
            await fetchAllApplicationData();
            return { success: true };
        }
        return { success: false };
    }, [supabase, fetchAllApplicationData]);

    const value = useMemo(() => ({
        allOrdersData, 
        pickingData,
        summary, 
        previousSummary, 
        isLoadingData, 
        refetchData: fetchAllApplicationData, 
        handleFileUpload, 
        handleErrorLogUpload, 
        errorData, 
        isLoadingErrorData,
        refetchErrorData,
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
        refetchErrorData,
        selectedOrderDetails, handleSaveNote, handleUpdateStatus,
        statusHistory, fetchStatusHistory, fetchOrderComments, addOrderComment
    ]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};