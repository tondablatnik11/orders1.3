"use client";
import React, { useState } from 'react';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import AppHeader from './AppHeader';
import TabNavigation from './TabNavigation';
import DashboardTab from '@/components/tabs/DashboardTab';
import DelayedOrdersTab from '@/components/tabs/DelayedOrdersTab';

export default function DashboardLayout() {
    const { t, darkMode } = useUI();
    const { summary, isLoading } = useData();
    const [activeTab, setActiveTab] = useState(0);

    const renderActiveTab = () => {
        if (isLoading) return <p className="text-center p-8">Načítám data...</p>;
        if (!summary) return <p className="text-center p-8">{t.uploadFilePrompt}</p>;
        
        switch (activeTab) {
            case 0: return <DashboardTab />;
            case 1: return <DelayedOrdersTab />;
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