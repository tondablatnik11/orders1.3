'use client';
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { processData } from '../lib/dataProcessor';
import toast from 'react-hot-toast';

export const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = getSupabase();

  useEffect(() => {
    if (authLoading || !currentUser) {
        if (!authLoading) setIsLoadingData(false);
        setAllOrdersData([]);
        return;
    }

    setIsLoadingData(true);
    supabase.from("deliveries").select('*').limit(10000)
        .then(({ data, error }) => {
            if (error) {
                toast.error("Chyba při načítání dat zakázek.");
                console.error("DataContext initial fetch error:", error);
                setAllOrdersData([]);
            } else {
                setAllOrdersData(data || []);
            }
            setIsLoadingData(false);
        });

    const channel = supabase.channel('public:deliveries')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'deliveries' },
            (payload) => {
                console.log('Realtime změna:', payload);
                if (payload.eventType === 'INSERT') {
                    setAllOrdersData(prevData => [...prevData, payload.new]);
                    toast.success('Nová zakázka přidána!');
                }
                if (payload.eventType === 'UPDATE') {
                    setAllOrdersData(prevData =>
                        prevData.map(row =>
                            row['Delivery No'] === payload.new['Delivery No'] ? payload.new : row
                        )
                    );
                }
                if (payload.eventType === 'DELETE') {
                    setAllOrdersData(prevData =>
                        prevData.filter(row => row['Delivery No'] !== payload.old['Delivery No'])
                    );
                    toast.error('Zakázka byla smazána.');
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [currentUser, authLoading, supabase]);

  useEffect(() => {
    if (!isLoadingData && allOrdersData && allOrdersData.length > 0) {
      const processed = processData(allOrdersData);
      setSummary(processed);
    } else if (!isLoadingData) {
      setSummary(null);
    }
  }, [allOrdersData, isLoadingData]);

  const handleSaveNote = useCallback(async (deliveryNo, newNote) => {
    const originalData = [...allOrdersData];
    
    const updatedData = allOrdersData.map(order => 
        order['Delivery No'] === deliveryNo ? { ...order, Note: newNote } : order
    );
    setAllOrdersData(updatedData);

    const { error } = await supabase.from('deliveries').update({ Note: newNote }).eq('"Delivery No"', deliveryNo.trim());
    
    if (error) {
        toast.error("Chyba při ukládání poznámky.");
        console.error("DataContext: Chyba při ukládání poznámky:", error);
        setAllOrdersData(originalData);
    } else {
        toast.success("Poznámka uložena.");
    }
  }, [supabase, allOrdersData]);

  const handleUpdateStatus = useCallback(async (deliveryNo, newStatus) => {
    // ---- ZDE JE KLÍČOVÁ OPRAVA ----
    const trimmedDeliveryNo = deliveryNo.trim();
    if (!trimmedDeliveryNo) {
        toast.error('Číslo dodávky nemůže být prázdné.');
        return { success: false, message: 'Číslo dodávky nemůže být prázdné.' };
    }

    const originalData = [...allOrdersData];
    let orderFound = false;

    const updatedData = allOrdersData.map(order => {
        if (order && typeof order['Delivery No'] === 'string' && order['Delivery No'].trim() === trimmedDeliveryNo) {
            orderFound = true;
            return { ...order, Status: newStatus, updated_at: new Date().toISOString() };
        }
        return order;
    });

    if (!orderFound) {
        toast.error('Zakázka s tímto číslem nebyla nalezena v načtených datech.');
        return { success: false, message: 'Zakázka s tímto číslem nebyla nalezena.' };
    }
    
    setAllOrdersData(updatedData);

    const { data, error } = await supabase
        .from('deliveries')
        .update({ Status: newStatus, updated_at: new Date().toISOString() })
        .eq('"Delivery No"', trimmedDeliveryNo) // Používáme oříznuté číslo
        .select();

    if (error) {
        toast.error('Chyba při aktualizaci statusu v databázi.');
        console.error("DataContext: Chyba při aktualizaci statusu:", error);
        setAllOrdersData(originalData);
        return { success: false, message: error.message };
    }
    
    toast.success('Status byl úspěšně aktualizován!');
    return { success: true, message: 'Status byl úspěšně aktualizován!' };

  }, [supabase, allOrdersData]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file || typeof window.XLSX === 'undefined') return;

    toast.loading('Zpracovávám soubor...');

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
                "updated_at": new Date().toISOString(),
            })).filter(row => row["Delivery No"]);

            if (transformedData.length > 0) {
              const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
              if (error) throw error;
              toast.dismiss();
              toast.success(`Data byla úspěšně nahrána! (${transformedData.length} záznamů)`);
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
  }, [supabase]);

  const value = useMemo(() => ({
    allOrdersData,
    summary,
    isLoadingData,
    handleSaveNote,
    handleFileUpload,
    handleUpdateStatus,
    selectedOrderDetails,
    setSelectedOrderDetails,
    supabase,
  }), [allOrdersData, summary, isLoadingData, handleSaveNote, handleFileUpload, handleUpdateStatus, selectedOrderDetails, supabase]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
