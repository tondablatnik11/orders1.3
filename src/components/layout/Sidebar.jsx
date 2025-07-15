'use client';
import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { FiGrid, FiBarChart2, FiSearch, FiTruck, FiMessageSquare, FiLifeBuoy, FiSettings, FiLogOut, FiWarehouse, FiAlertCircle } from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const { t } = useUI();
    const { userProfile, logout } = useAuth();

    const menuItems = [
        { id: 0, labelKey: 'dashboardTab', icon: FiGrid },
        { id: 1, labelKey: 'delayedOrdersTab', icon: FiBarChart2 },
        { id: 2, labelKey: 'orderSearchTab', icon: FiSearch },
        { id: 3, labelKey: 'announcedLoadingsTab', icon: FiTruck },
        { id: 4, labelKey: 'ticketsTab', icon: FiLifeBuoy },
        { id: 7, labelKey: 'warehouseActivitiesTab', icon: FiWarehouse },
        { id: 8, labelKey: 'errorMonitorTab', icon: FiAlertCircle },
        { id: 6, labelKey: 'chatTab', icon: FiMessageSquare },
    ];

    return (
        <div className="flex flex-col h-full w-64 bg-gray-900 text-gray-300 border-r border-gray-700">
            <div className="flex items-center justify-center h-20 px-6 border-b border-gray-800">
                <Image src="/logo.jpg" alt="Hellmann Logo" width={150} height={40} priority style={{ width: 'auto', height: 'auto' }} />
            </div>

            <div className="flex flex-col items-center p-6 border-b border-gray-800">
                <img
                    className="w-20 h-20 rounded-full object-cover mb-3"
                    src={userProfile?.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.displayName}&background=0D8ABC&color=fff`}
                    alt="User profile"
                />
                <h2 className="font-semibold text-lg text-white">{userProfile?.displayName}</h2>
                <p className="text-sm text-gray-500">{userProfile?.function || (userProfile?.isAdmin ? 'Administrator' : 'Uživatel')}</p>
            </div>

            <nav className="flex-grow px-4 py-6">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                            activeTab === item.id
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{t[item.labelKey]}</span>
                    </button>
                ))}
            </nav>

            <div className="px-4 py-4 border-t border-gray-800">
                 <button
                    onClick={() => setActiveTab(5)}
                    className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                        activeTab === 5 ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'
                    }`}
                >
                    <FiSettings className="w-5 h-5 mr-3" />
                    <span className="font-medium">{t.settingsTab || 'Nastavení'}</span>
                </button>
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-3 mt-2 text-left text-red-400 rounded-lg hover:bg-gray-800 hover:text-red-500"
                >
                    <FiLogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium">{t.logout}</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;