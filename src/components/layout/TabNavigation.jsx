import React from 'react';
import { useUI } from '@/hooks/useUI';

const TABS = [
    { id: 0, labelKey: 'dashboardTab' },
    { id: 1, labelKey: 'delayedOrdersTab' },
    { id: 2, labelKey: 'orderSearchTab' },
    { id: 3, labelKey: 'announcedLoadingsTab' }, // Nová záložka
    { id: 4, labelKey: 'ticketsTab' },         // Nová záložka
    // Přidejte další záložky, pokud je máte definované
];

export default function TabNavigation({ activeTab, setActiveTab }) {
    const { t } = useUI();
    
    return (
        <div className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-8 max-w-full mx-auto overflow-x-auto">
            {TABS.map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex-shrink-0 w-full md:w-auto px-4 py-2.5 text-sm rounded-lg font-medium focus:outline-none ${
                        activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12]'
                    }`}
                >
                    {t[tab.labelKey]}
                </button>
            ))}
        </div>
    );
}