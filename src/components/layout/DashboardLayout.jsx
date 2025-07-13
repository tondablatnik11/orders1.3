"use client";
import React, { useState, useEffect } from 'react';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from './AppHeader';
import TabNavigation from './TabNavigation'; 
import DashboardTab from '@/components/tabs/DashboardTab';
import DelayedOrdersTab from '@/components/tabs/DelayedOrdersTab';
import OrderSearchTab from '@/components/tabs/OrderSearchTab';
import AnnouncedLoadingsTab from '@/components/tabs/AnnouncedLoadingsTab';
import TicketsTab from '@/components/tabs/TicketsTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import ChatTab from '@/components/tabs/ChatTab';

export default function DashboardLayout() {
    const { t, darkMode } = useUI();
    const { summary, isLoadingData } = useData(); 
    const { userProfile, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState(0); 

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

    const renderActiveTab = () => {
        // Logika pro zobrazení speciálních záložek, které nepotřebují 'summary' data
        if (activeTab === 5) {
            return <SettingsTab initialProfile={userProfile} />;
        }
        if (activeTab === 6) {
            return <ChatTab />;
        }

        // Zobrazení načítací obrazovky, pokud se načítají jakákoliv data
        if (isLoadingData || authLoading) {
            return <p className="text-center p-8">Načítám data...</p>;
        }
        
        // Zobrazení výzvy k nahrání souboru, pokud chybí data pro hlavní záložky
        if (!summary) {
            return (
                 <div className="text-center mt-12">
                     <p className="mb-6 text-xl text-gray-400">{t.uploadFilePrompt}</p>
                     <label className="cursor-pointer inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg shadow-lg text-lg">
                        <UploadCloud className="w-6 h-6" />
                        <span>{t.upload}</span>
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
                    </label>
                </div>
            );
        }
        
        // Zobrazení standardních záložek
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
        <div className={`p-8 space-y-8 min-h-screen ${darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"}`}>
            <AppHeader setActiveTab={setActiveTab} />
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <main>
                {renderActiveTab()}
            </main>
        </div>
    );
}