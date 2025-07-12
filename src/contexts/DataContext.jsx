'use client';
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export const DataContext = createContext();
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [allOrdersData, setAllOrdersData] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const { currentUser, loading: authLoading } = useAuth(); // Získáme i stav načítání z AuthContextu
    const supabase = getSupabase();

    useEffect(() => {
        const fetchData = async () => {
            if (authLoading) return; // Nezačneme, dokud se neověří uživatel

            if (!currentUser) {
                setAllOrdersData([]);
                setIsLoadingData(false);
                return;
            }

            setIsLoadingData(true);
            try {
                const { data, error } = await supabase.from("deliveries").select('*');
                if (error) throw error;
                setAllOrdersData(data || []);
            } catch (error) {
                console.error("DataContext: Chyba při načítání dat:", error);
                setAllOrdersData([]);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [currentUser, authLoading, supabase]);

    const value = useMemo(() => ({
        allOrdersData,
        isLoadingData,
    }), [allOrdersData, isLoadingData]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};