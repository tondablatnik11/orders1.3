'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import { useData } from '@/hooks/useData';
import OrderDetailsModal from '../modals/OrderDetailsModal';
import StatusHistoryModal from '../modals/StatusHistoryModal';
import * as XLSX from 'xlsx';

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
import TicketsTab from '../tabs/TicketsTab';
// --- ZDE JE FINÁLNÍ IMPORT ---
import PickingTab from '../tabs/PickingTab';

const DashboardLayout = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
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
            case 'announcedLoadings': return <AnnouncedLoadingsTab />;
            case 'dailySummary': return <DailySummaryTab />;
            case 'warehouseActivities': return <WarehouseActivitiesTab />;
            // --- ZDE JE FINÁLNÍ PODMÍNKA ---
            case 'picking': return <PickingTab />;
            case 'errorMonitor': return <ErrorMonitorTab />;
            case 'tickets': return <TicketsTab />;
            case 'chat': return <ChatTab />;
            case 'settings': return <SettingsTab />;
            default: return <DashboardTab setActiveTab={setActiveTab} />;
        }
    };
    
    const handleShowHistory = (deliveryNo) => {
        fetchStatusHistory(deliveryNo);
    }

    return (
        <div className="flex h-screen bg-slate-900 text-slate-200">
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden"></div>}
            
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={isSidebarOpen} />
            
            <div className="flex flex-col flex-1 min-w-0">
                <AppHeader 
                    onSearchSubmit={(query) => {
                        setGlobalSearchQuery(query);
                        setActiveTab('orderSearch');
                    }} 
                    activeTab={activeTab}
                    onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="animate-fadeInUp">
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