"use client";
import React, { useState } from 'react';
import { useUI } from '@/hooks/useUI';
import AppHeader from './AppHeader';
import TabNavigation from './TabNavigation';
import DashboardTab from '@/components/tabs/DashboardTab';
import { useData } from '@/hooks/useData';

export default function DashboardLayout() {
    const { t, darkMode } = useUI();
    const [activeTab, setActiveTab] = useState(0);
    const { summary } = useData();

    const renderActiveTab = () => {
        if (!summary && activeTab !== 0) {
             return <p className="text-center p-8">{t.uploadFilePrompt}</p>;
        }
        
        switch (activeTab) {
            case 0: return <DashboardTab />;
            // Zde budou další záložky
            // case 1: return <DelayedOrdersTab />; 
            default: return <DashboardTab />;
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