"use client";
import React, { useState, useEffect } from 'react';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import AppHeader from './AppHeader';
import TabNavigation from './TabNavigation'; 
import DashboardTab from '@/components/tabs/DashboardTab';
import DelayedOrdersTab from '@/components/tabs/DelayedOrdersTab';
import OrderSearchTab from '@/components/tabs/OrderSearchTab';
import AnnouncedLoadingsTab from '@/components/tabs/AnnouncedLoadingsTab';
import TicketsTab from '@/components/tabs/TicketsTab';
import SettingsTab from '@/components/tabs/SettingsTab';

export default function DashboardLayout() {
    const { t, darkMode } = useUI();
    const { summary, isLoadingData } = useData(); 
    const [activeTab, setActiveTab] = useState(0); 

    useEffect(() => {
        const loadXLSXScript = () => {
            if (typeof window.XLSX === 'undefined') {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
                script.async = true;
                script.onload = () => console.log('XLSX library loaded successfully.');
                script.onerror = () => console.error('Failed to load XLSX library.');
                document.body.appendChild(script);
            }
        };
        loadXLSXScript();
    }, []);

    const renderActiveTab = () => {
        // Logika pro zobrazení záložky Nastavení (id 5)
        if (activeTab === 5) {
            return <SettingsTab />;
        }

        if (isLoadingData) {
            return <p className="text-center p-8">Načítám data...</p>;
        }
        if (!summary) {
            return <p className="text-center p-8">{t.uploadFilePrompt}</p>;
        }
        
        switch (activeTab) {
            case 0: return <DashboardTab />;
            case 1: return <DelayedOrdersTab />;
            case 2: return <OrderSearchTab />; 
            case 3: return <AnnouncedLoadingsTab />; 
            case 4: return <TicketsTab />;
            default: return <DashboardTab />;
        }
    };

    return (
        <div className={`p-8 space-y-8 min-h-screen ${darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"}`}>
            {/* UPRAVENO: Předáváme funkci setActiveTab do hlavičky */}
            <AppHeader setActiveTab={setActiveTab} />
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <main>
                {renderActiveTab()}
            </main>
        </div>
    );
}