import React from 'react';
import { useUI } from '@/hooks/useUI';

// ODSTRANĚNO: { id: 5, labelKey: 'settingsTab' }
const TABS = [
    { id: 0, labelKey: 'dashboardTab' },
    { id: 1, labelKey: 'delayedOrdersTab' },
    { id: 2, labelKey: 'orderSearchTab' },
    { id: 3, labelKey: 'announcedLoadingsTab' },
    { id: 4, labelKey: 'ticketsTab' },
    { id: 6, labelKey: 'chatTab' },
];

export default function TabNavigation({ activeTab, setActiveTab }) {
    const { t } = useUI();
    
    return (
        <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                {TABS.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                            activeTab === tab.id 
                                ? 'border-blue-500 text-blue-400' 
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        }`}
                    >
                        {t[tab.labelKey]}
                    </button>
                ))}
            </nav>
        </div>
    );
}