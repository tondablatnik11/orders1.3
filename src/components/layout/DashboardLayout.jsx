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

const DashboardLayout = () => {
    // Tento stav (`useState`) řídí, která záložka je právě aktivní.
    // Výchozí hodnota je 'dashboard'.
    const [activeTab, setActiveTab] = useState('dashboard'); 

    // Tato funkce rozhoduje, která komponenta se má zobrazit na základě
    // hodnoty ve stavu `activeTab`.
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab />;
            case 'errorMonitor':
                return <ErrorMonitorTab />;
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
            // Pokud byste přidal další záložky, přidejte je i sem.
            default:
                return <DashboardTab />;
        }
    };

    return (
        <div className="flex h-screen bg-white dark:bg-slate-900">
            {/* Sidebar nyní dostává dvě klíčové informace:
              1. activeTab: Aby věděl, kterou položku zvýraznit.
              2. onTabChange: Funkci, kterou má zavolat, když uživatel klikne na jinou položku.
                 V tomto případě je to `setActiveTab`, která změní stav v tomto souboru.
            */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            
            <main className="flex-1 overflow-y-auto">
                {renderActiveTab()}
            </main>
        </div>
    );
};

export default DashboardLayout;