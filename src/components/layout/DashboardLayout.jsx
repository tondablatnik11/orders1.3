"use client";
import React, { useState, useEffect } from 'react';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import AppHeader from './AppHeader';
import TabNavigation from './TabNavigation'; 
import DashboardTab from '@/components/tabs/DashboardTab';
import DelayedOrdersTab from '@/components/tabs/DelayedOrdersTab';
import OrderSearchTab from '@/components/tabs/OrderSearchTab'; // NOVÝ IMPORT

export default function DashboardLayout() {
    const { t, darkMode } = useUI();
    const { summary, isLoadingData } = useData(); 
    const [activeTab, setActiveTab] = useState(0); 

    // Načtení knihovny XLSX dynamicky při mountu komponenty
    useEffect(() => {
        const loadXLSXScript = () => {
            if (typeof window.XLSX === 'undefined') {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
                script.async = true;
                script.onload = () => {
                    console.log('XLSX library loaded successfully.');
                };
                script.onerror = () => {
                    console.error('Failed to load XLSX library.');
                };
                document.body.appendChild(script);
            }
        };
        loadXLSXScript();

    }, []);

    const renderActiveTab = () => {
        if (isLoadingData) {
            return <p className="text-center p-8">Načítám data...</p>;
        }
        if (!summary) {
            return <p className="text-center p-8">{t.uploadFilePrompt}</p>;
        }
        
        switch (activeTab) {
            case 0:
                return <DashboardTab />;
            case 1:
                return <DelayedOrdersTab />;
            case 2: // NOVÁ ZÁLOŽKA PRO VYHLEDÁVÁNÍ
                return <OrderSearchTab />; 
            // Přidejte další záložky, pokud je máte definované v TabNavigation
            default:
                return <DashboardTab />;
        }
    };

    return (
        <div className={`p-8 space-y-8 min-h-screen ${darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"}`}>
            <AppHeader />
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <main>
                {renderActiveTab()}
            </main>
        </div>
    );
}