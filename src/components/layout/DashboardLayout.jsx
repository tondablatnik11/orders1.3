"use client";
import React, { useState } from 'react';
import { useUI } from '@/hooks/useUI';
import AppHeader from './AppHeader';
import TabNavigation from './TabNavigation';
import DashboardTab from '@/components/tabs/DashboardTab';
// Budoucí záložky, prozatím zakomentované
// import DelayedOrdersTab from '@/components/tabs/DelayedOrdersTab';
// import OrderSearchTab from '@/components/tabs/OrderSearchTab';

export default function DashboardLayout() {
    const { t, darkMode } = useUI();
    const [activeTab, setActiveTab] = useState(0);

    const renderActiveTab = () => {
        switch (activeTab) {
            case 0: return <DashboardTab />;
            // case 1: return <DelayedOrdersTab />;
            // case 2: return <OrderSearchTab />;
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