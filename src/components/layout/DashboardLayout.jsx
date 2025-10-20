// src/components/layout/DashboardLayout.jsx
'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import { useData } from '@/hooks/useData';
import OrderDetailsModal from '../modals/OrderDetailsModal';
import StatusHistoryModal from '../modals/StatusHistoryModal';
import * as XLSX from 'xlsx';
import GlobalStyles from './GlobalStyles';

// Import komponent
import DashboardTab from '../tabs/DashboardTab';
import ErrorMonitorTab from '../tabs/ErrorMonitorTab';
import OrderSearchTab from '../tabs/OrderSearchTab';
import AnnouncedLoadingsTab from '../tabs/AnnouncedLoadingsTab';
import DelayedOrdersTab from '../tabs/DelayedOrdersTab';
import PickingTab from '../tabs/PickingTab';
import FaultyLabelsTab from '../tabs/FaultyLabelsTab';
import WarehouseOverviewTab from '../tabs/WarehouseOverviewTab';
import TicketsTab from '../tabs/TicketsTab';
import SettingsTab from '../tabs/SettingsTab';
import ToBeProcessedTab from '../tabs/ToBeProcessedTab';
import CustomerMaterialTab from '../tabs/CustomerMaterialTab'; // <-- NOVÝ IMPORT

const DashboardLayout = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const { selectedOrderDetails, setSelectedOrderDetails, statusHistory, setStatusHistory, fetchStatusHistory } = useData();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.XLSX = XLSX;
        }
    }, []);

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardTab setActiveTab={setActiveTab} />;
            case 'delayedOrders': return <DelayedOrdersTab />;
            case 'orderSearch': return <OrderSearchTab initialQuery={globalSearchQuery} clearInitialQuery={() => setGlobalSearchQuery('')} />;
            
            // Záložky ze skupiny Operativa
            case 'processing': return <ToBeProcessedTab />;
            case 'announcedLoadings': return <AnnouncedLoadingsTab />;
            case 'faultyLabels': return <FaultyLabelsTab />;
            case 'tickets': return <TicketsTab />;

            case 'picking': return <PickingTab />;
            case 'warehouseOverview': return <WarehouseOverviewTab />;
            case 'errorMonitor': return <ErrorMonitorTab />;

            // Nová záložka pro analýzu
            case 'customerAnalysis': return <CustomerMaterialTab />; // <-- NOVÁ POLOŽKA

            case 'settings': return <SettingsTab />;
            default: return <DashboardTab setActiveTab={setActiveTab} />;
        }
    };
    
    const handleShowHistory = (deliveryNo) => {
        fetchStatusHistory(deliveryNo);
    }

    return (
        <div className="flex h-screen bg-transparent text-slate-200">
            <GlobalStyles />
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"></div>}
            
            <Sidebar 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                isOpen={isSidebarOpen} 
                isCollapsed={isSidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
            />
            
            <div className="flex flex-col flex-1 min-w-0">
                <AppHeader 
                    onSearchSubmit={(query) => {
                        setGlobalSearchQuery(query);
                        setActiveTab('orderSearch');
                    }} 
                    activeTab={activeTab}
                    onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 h-full">
                    <div className="animate-fadeInUp h-full">
                        {renderActiveTab()}
                    </div>
                </main>
            </div>
            
            {selectedOrderDetails && (
                <OrderDetailsModal 
                    order={selectedOrderDetails}
                    onClose={() => setSelectedOrderDetails(null)}
                    onShowHistory={() => handleShowHistory(selectedOrderDetails["Delivery No"])}
                />
            )}

            {statusHistory.isVisible && (
                <StatusHistoryModal
                    history={statusHistory.data}
                    onClose={() => setStatusHistory({ isVisible: false, data: [] })}
                />
            )}
        </div>
    );
};

export default DashboardLayout;