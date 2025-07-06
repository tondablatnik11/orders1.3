import React from 'react';

const TABS = [
    { id: 0, labelKey: 'dashboardTab' },
    { id: 1, labelKey: 'delayedOrdersTab' },
    { id: 2, labelKey: 'orderSearchTab' },
    { id: 3, labelKey: 'dailySummary' },
    { id: 4, labelKey: 'announcedLoadingsTab' },
    { id: 5, labelKey: 'ticketsTab' },
];

export default function TabNavigation({ activeTab, setActiveTab, t }) {
    const getButtonClass = (tabId) => {
        return `flex-shrink-0 w-full md:w-auto px-4 py-2.5 text-sm rounded-lg font-medium focus:outline-none ${
            activeTab === tabId ? 'bg-blue-600 text-white shadow' : 'text-blue-100 hover:bg-white/[0.12]'
        }`;
    };
    
    return (
        <div className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-8 max-w-full mx-auto overflow-x-auto">
            {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={getButtonClass(tab.id)}>
                    {t[tab.labelKey]}
                </button>
            ))}
        </div>
    );
}