'use client';
import React, { useState, useEffect } from 'react';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';

import DashboardTab from '@/components/tabs/DashboardTab';
import DelayedOrdersTab from '@/components/tabs/DelayedOrdersTab';
import OrderSearchTab from '@/components/tabs/OrderSearchTab';
import AnnouncedLoadingsTab from '@/components/tabs/AnnouncedLoadingsTab';
import TicketsTab from '@/components/tabs/TicketsTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import ChatTab from '@/components/tabs/ChatTab';
import WarehouseActivitiesTab from '@/components/tabs/WarehouseActivitiesTab';
import ErrorMonitorTab from '@/components/tabs/ErrorMonitorTab';


export default function DashboardLayout() {
    const { t, activeTab } = useUI(); // <-- PŘIDÁN activeTab z kontextu
    const { summary, isLoadingData } = useData();
    const { userProfile, loading: authLoading } = useAuth();
    // const [activeTab, setActiveTab] = useState(0); // <-- ODSTRANĚNO
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const loadXLSXScript = () => {
            if (typeof window.XLSX === 'undefined') {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
                script.async = true;
                document.body.appendChild(script);
            }
        };
        loadXLSXScript();
    }, []);

    if (authLoading || !userProfile) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Načítání profilu...</div>;
    }

    const renderActiveTab = () => {
        if (activeTab === 5) return <SettingsTab initialProfile={userProfile} />;
        if (activeTab === 6) return <ChatTab />;
        if (activeTab === 7) return <WarehouseActivitiesTab />;
        if (activeTab === 8) return <ErrorMonitorTab />;


        if (isLoadingData) {
            return <div className="text-center p-8 text-lg">Načítám data objednávek...</div>;
        }

        if (!summary) {
            return (
                <div className="text-center mt-12">
                    <h2 className="text-2xl font-semibold mb-4">Vítejte v Hellmann-Connect!</h2>
                    <p className="mb-6 text-xl text-gray-400">{t.uploadFilePrompt}</p>
                </div>
            );
        }

        switch (activeTab) {
            case 0: return <DashboardTab />;
            case 1: return <DelayedOrdersTab />;
            case 2: return <OrderSearchTab />;
            case 3: return <AnnouncedLoadingsTab />;
            case 4: return <TicketsTab />;
            default: return <DashboardTab />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-800">
            <Sidebar /> 
            <div className="flex flex-col flex-1 overflow-hidden">
                <AppHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-gray-800">
                    {renderActiveTab()}
                </main>
            </div>
        </div>
    );
}