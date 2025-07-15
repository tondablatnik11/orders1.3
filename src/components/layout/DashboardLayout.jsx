'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';// Importujte VŠECHNY vaše komponenty pro záložky
import DashboardTab from '../tabs/DashboardTab';
import ErrorMonitorTab from '../tabs/ErrorMonitorTab';
import OrderSearchTab from '../tabs/OrderSearchTab';
import AnnouncedLoadingsTab from '../tabs/AnnouncedLoadingsTab';
import DelayedOrdersTab from '../tabs/DelayedOrdersTab';
import DailySummaryTab from '../tabs/DailySummaryTab';
import WarehouseActivitiesTab from '../tabs/WarehouseActivitiesTab';
import ChatTab from '../tabs/ChatTab'; // Ujistěte se, že tento soubor existuje
import SettingsTab from '../tabs/SettingsTab'; // Ujistěte se, že tento soubor existujeconst DashboardLayout = () => {
const [activeTab, setActiveTab] = useState('dashboard');const renderActiveTab = () =&gt; {
    switch (activeTab) {
        case 'dashboard':
            return &lt;DashboardTab /&gt;;
        case 'orderSearch':
            return &lt;OrderSearchTab /&gt;;
        case 'announcedLoadings':
            return &lt;AnnouncedLoadingsTab /&gt;;
        case 'delayedOrders':
            return &lt;DelayedOrdersTab /&gt;;
        case 'dailySummary':
            return &lt;DailySummaryTab /&gt;;
        case 'warehouseActivities':
            return &lt;WarehouseActivitiesTab /&gt;;
        case 'errorMonitor':
            return &lt;ErrorMonitorTab /&gt;;
        case 'chat':
            return &lt;ChatTab /&gt;;
        case 'settings':
            return &lt;SettingsTab /&gt;;
        default:
            return &lt;DashboardTab /&gt;;
    }
};

return (
    &lt;div className=&quot;flex h-screen bg-white dark:bg-slate-900&quot;&gt;
        &lt;Sidebar activeTab={activeTab} onTabChange={setActiveTab} /&gt;
        &lt;main className=&quot;flex-1 overflow-y-auto&quot;&gt;
            {renderActiveTab()}
        &lt;/main&gt;
    &lt;/div&gt;
);
};