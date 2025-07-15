'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';

// Importujte VŠECHNY vaše komponenty pro záložky
import DashboardTab from '../tabs/DashboardTab';
import ErrorMonitorTab from '../tabs/ErrorMonitorTab';
import OrderSearchTab from '../tabs/OrderSearchTab';
import AnnouncedLoadingsTab from '../tabs/AnnouncedLoadingsTab';
import DelayedOrdersTab from '../tabs/DelayedOrdersTab';
import DailySummaryTab from '../tabs/DailySummaryTab';
import WarehouseActivitiesTab from '../tabs/WarehouseActivitiesTab';
import ChatTab from '../tabs/ChatTab';
import SettingsTab from '../tabs/SettingsTab';

const DashboardLayout = () => {
    // Tento stav ('state') drží informaci o tom, která záložka je právě aktivní.
    // Výchozí hodnota je 'dashboard'.
    const [activeTab, setActiveTab] = useState('dashboard'); 

    // Tato funkce rozhoduje, která komponenta se má zobrazit na základě
    // hodnoty ve stavu `activeTab`.
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab />;
            case 'delayedOrders': 
                return <DelayedOrdersTab />;
            case 'orderSearch':
                return <OrderSearchTab />;
            case 'announcedLoadings':
                return <AnnouncedLoadingsTab />;
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
        <div className="flex h-screen bg-tremor-background-muted dark:bg-dark-tremor-background-muted">
            {/* Sidebar nyní dostává dvě klíčové informace (props):
              1. activeTab: Aby věděl, kterou položku v menu má vizuálně zvýraznit.
              2. onTabChange: Funkci, kterou má zavolat, když uživatel klikne na jinou položku.
                 V tomto případě je to `setActiveTab`, která změní stav v tomto souboru (`DashboardLayout`).
            */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="flex flex-col flex-1">
                <AppHeader />
                <main className="flex-1 overflow-y-auto">
                    {renderActiveTab()}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;