'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';

// Import všech komponent záložek
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
    const [activeTab, setActiveTab] = useState('dashboard'); 

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardTab />;
            case 'delayedOrders': return <DelayedOrdersTab />;
            case 'orderSearch': return <OrderSearchTab />;
            case 'announcedLoadings': return <AnnouncedLoadingsTab />;
            case 'dailySummary': return <DailySummaryTab />;
            case 'warehouseActivities': return <WarehouseActivitiesTab />;
            case 'errorMonitor': return <ErrorMonitorTab />;
            case 'chat': return <ChatTab />;
            case 'settings': return <SettingsTab />;
            default: return <DashboardTab />;
        }
    };

    return (
        <div className="flex h-screen bg-tremor-background-muted dark:bg-dark-tremor-background-muted">
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