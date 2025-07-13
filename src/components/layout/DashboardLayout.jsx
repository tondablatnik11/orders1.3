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
    // Načítáme zde všechny potřebné informace o uživateli
    const { currentUser, userProfile, loading: authLoading } = useAuth();
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

    // KLÍČOVÁ ZMĚNA: Pokud se stále načítá profil, zobrazíme načítací obrazovku
    if (authLoading || !currentUser || !userProfile) {
        return <div className="flex items-center justify-center min-h-screen">Načítání profilu a dat...</div>;
    }

    const renderActiveTab = () => {
        if (activeTab === 5) {
            // Předáváme profil přímo jako prop, je zaručeno, že není null
            return <SettingsTab initialProfile={userProfile} />;
        }
        if (activeTab === 6) {
            return <ChatTab />;
        }

        if (isLoadingData) {
            return <p className="text-center p-8">Načítám data objednávek...</p>;
        }
        
        if (!summary) {
            return (
                 <div className="text-center mt-12">
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
        <div className={`p-8 space-y-8 min-h-screen ${darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"}`}>
            <AppHeader setActiveTab={setActiveTab} />
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <main>
                {renderActiveTab()}
            </main>
        </div>
    );
}