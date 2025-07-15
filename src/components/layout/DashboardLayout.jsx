'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';

// Importujte VŠECHNY vaše komponenty pro záložky
import DashboardTab from '../tabs/DashboardTab';
import ErrorMonitorTab from '../tabs/ErrorMonitorTab';
import OrderSearchTab from '../tabs/OrderSearchTab';
import AnnouncedLoadingsTab from '../tabs/AnnouncedLoadingsTab';
import DelayedOrdersTab from '../tabs/DelayedOrdersTab';
import DailySummaryTab from '../tabs/DailySummaryTab';
import WarehouseActivitiesTab from '../tabs/WarehouseActivitiesTab';
// Budeme potřebovat i soubory pro Chat a Nastavení
import ChatTab from '../tabs/ChatTab';
import SettingsTab from '../tabs/SettingsTab';


const DashboardLayout = () => {
    const [activeTab, setActiveTab] = useState('dashboard'); 

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab />;
            case 'orderSearch':
                return <OrderSearchTab />;
            case 'announcedLoadings':
                return <AnnouncedLoadingsTab />;
            case 'delayedOrders':
                return <DelayedOrdersTab />;
            case 'dailySummary':
                return <DailySummaryTab />;
            case 'warehouseActivities':
                return <WarehouseActivitiesTab />;
            case 'errorMonitor':
                return <ErrorMonitorTab />;
            case 'chat':
                return <ChatTab />;
            case 'settings':
                return <SettingsTab />;
            default:
                return <DashboardTab />;
        }
    };

    return (
        <div className="flex h-screen bg-white dark:bg-slate-900">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="flex-1 overflow-y-auto">
                {renderActiveTab()}
            </main>
        </div>
    );
};

export default DashboardLayout;