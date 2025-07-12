"use client";
import React, { useState } from 'react';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import AppHeader from './AppHeader';
import TabNavigation from './TabNavigation';
import DashboardTab from '@/components/tabs/DashboardTab';
import DelayedOrdersTab from '@/components/tabs/DelayedOrdersTab';
import OrderSearchTab from '@/components/tabs/OrderSearchTab';
import DailySummaryTab from '@/components/tabs/DailySummaryTab';
import AnnouncedLoadingsTab from '@/components/tabs/AnnouncedLoadingsTab';
import TicketsTab from '@/components/tabs/TicketsTab';
import ProfileSettingsTab from '@/components/tabs/ProfileSettingsTab';
import ChatTab from '@/components/tabs/ChatTab';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';
import { Modal } from '@/components/ui/Modal';
import { XCircle } from 'lucide-react';

export default function DashboardLayout() {
    const { t, darkMode } = useUI();
    const { selectedOrderDetails, setSelectedOrderDetails } = useData();
    const [activeTab, setActiveTab] = useState(0);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const renderActiveTab = () => {
        switch (activeTab) {
            case 0: return <DashboardTab />;
            case 1: return <DelayedOrdersTab />;
            case 2: return <OrderSearchTab />;
            case 3: return <DailySummaryTab />;
            case 4: return <AnnouncedLoadingsTab />;
            case 5: return <TicketsTab />;
            default: return <DashboardTab />;
        }
    };

    return (
        <div className={`p-8 space-y-8 min-h-screen ${darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"} transition-colors duration-300 font-sans`}>
            <AppHeader
                onChatToggle={() => setIsChatOpen(!isChatOpen)}
                onProfileToggle={() => setIsProfileOpen(!isProfileOpen)}
            />

            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            <main>
                {renderActiveTab()}
            </main>

            {selectedOrderDetails && (
                <OrderDetailsModal order={selectedOrderDetails} onClose={() => setSelectedOrderDetails(null)} />
            )}

            {isProfileOpen && (
                <Modal title={t.profileTab} onClose={() => setIsProfileOpen(false)}>
                    <ProfileSettingsTab />
                </Modal>
            )}

            {isChatOpen && (
                <div className="fixed bottom-0 right-20 w-96 h-[500px] bg-gray-800 rounded-t-lg shadow-2xl flex flex-col z-50">
                    <header className="bg-gray-900 p-3 rounded-t-lg flex justify-between items-center cursor-pointer" onClick={() => setIsChatOpen(false)}>
                        <h3 className="text-white font-semibold">{t.chatTab}</h3>
                        <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white"><XCircle className="w-5 h-5"/></button>
                    </header>
                    <div className="flex-grow overflow-y-auto">
                        <ChatTab />
                    </div>
                </div>
            )}
        </div>
    );
}