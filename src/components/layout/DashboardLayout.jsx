'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';

// Importujte všechny vaše existující záložky
import DashboardTab from '../tabs/DashboardTab';
import ErrorMonitorTab from '../tabs/ErrorMonitorTab';
import OrderSearchTab from '../tabs/OrderSearchTab';
import AnnouncedLoadingsTab from '../tabs/AnnouncedLoadingsTab';
import DelayedOrdersTab from '../tabs/DelayedOrdersTab';
import DailySummaryTab from '../tabs/DailySummaryTab';
import WarehouseActivitiesTab from '../tabs/WarehouseActivitiesTab';

// Dočasné prázdné komponenty pro nové záložky
const PlaceholderTab = ({ title }) => (
    <div className="p-6 bg-slate-900 min-h-full text-white">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-slate-400">Tato stránka je ve vývoji.</p>
    </div>
);

const DashboardLayout = () => {
    const [activeTab, setActiveTab] = useState('dashboard'); 

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardTab />;
            case 'orderSearch': return <OrderSearchTab />;
            case 'announcedLoadings': return <AnnouncedLoadingsTab />;
            case 'delayedOrders': return <DelayedOrdersTab />;
            case 'dailySummary': return <DailySummaryTab />;
            case 'warehouseActivities': return <WarehouseActivitiesTab />;
            case 'errorMonitor': return <ErrorMonitorTab />;
            // Přidána logika pro nové záložky
            case 'chat': return <PlaceholderTab title="Chat" />;
            case 'settings': return <PlaceholderTab title="Nastavení" />;
            default: return <DashboardTab />;
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