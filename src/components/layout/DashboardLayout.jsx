"use client";
import React, { useState, useEffect } from 'react';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import AppHeader from './AppHeader';
import TabNavigation from './TabNavigation';
import DashboardTab from '@/components/tabs/DashboardTab';
import DelayedOrdersTab from '@/components/tabs/DelayedOrdersTab';

export default function DashboardLayout() {
    const { t, darkMode } = useUI();
    const { summary, isLoadingData } = useData(); // Změnil jsem isLoading na isLoadingData
    const [activeTab, setActiveTab] = useState(1); // NASTAVENO NA 1 PRO TESTOVÁNÍ ZPOŽDĚNÝCH ZAKÁZEK

    // Log pro ověření, zda se DashboardLayout vykresluje
    useEffect(() => {
        console.log('DashboardLayout: Vykresluji se.');
    }, []);

    const renderActiveTab = () => {
        console.log('DashboardLayout: renderActiveTab spuštěn, activeTab je:', activeTab);
        if (isLoadingData) { // Používám isLoadingData z DataContextu
            return <p className="text-center p-8">Načítám data...</p>;
        }
        if (!summary) {
            return <p className="text-center p-8">{t.uploadFilePrompt}</p>;
        }
        
        switch (activeTab) {
            case 0:
                console.log('DashboardLayout: Vykresluji DashboardTab.');
                return <DashboardTab />;
            case 1:
                console.log('DashboardLayout: Vykresluji DelayedOrdersTab.');
                return <DelayedOrdersTab />; // ZDE JE DelayedOrdersTab
            default:
                console.log('DashboardLayout: Vykresluji výchozí DashboardTab.');
                return <DashboardTab />;
        }
    };

    return (
        <div className={`p-8 space-y-8 min-h-screen ${darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"}`}>
            <AppHeader />
            {/* Navigaci záložek dočasně zakomentuji, abychom měli jistotu, že se testovací záložka vykresluje */}
            {/* <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} /> */}
            <main>
                {renderActiveTab()}
            </main>
        </div>
    );
}