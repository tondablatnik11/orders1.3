'use client';
import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { FiGrid, FiBarChart2, FiSearch, FiTruck, FiMessageSquare, FiLifeBuoy, FiSettings, FiLogOut, FiArchive, FiAlertCircle } from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const { t } = useUI();
    const { userProfile, logout } = useAuth();

    return (
        // Červený okraj ponechán pro kontrolu
        <div className="flex flex-col h-full w-64 bg-gray-900 text-gray-300 border-r-4 border-red-500">
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
                {/* === RADIKÁLNÍ ZMĚNA PRO LADĚNÍ: Statické vykreslení tlačítek === */}
                <button onClick={() => setActiveTab(0)} className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === 0 ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
                    <FiGrid className="w-5 h-5 mr-3" /> <span className="font-medium">{t.dashboardTab}</span>
                </button>
                <button onClick={() => setActiveTab(1)} className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
                    <FiBarChart2 className="w-5 h-5 mr-3" /> <span className="font-medium">{t.delayedOrdersTab}</span>
                </button>
                <button onClick={() => setActiveTab(2)} className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === 2 ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
                    <FiSearch className="w-5 h-5 mr-3" /> <span className="font-medium">{t.orderSearchTab}</span>
                </button>
                <button onClick={() => setActiveTab(3)} className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === 3 ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
                    <FiTruck className="w-5 h-5 mr-3" /> <span className="font-medium">{t.announcedLoadingsTab}</span>
                </button>
                <button onClick={() => setActiveTab(4)} className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === 4 ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
                    <FiLifeBuoy className="w-5 h-5 mr-3" /> <span className="font-medium">{t.ticketsTab}</span>
                </button>
                <button onClick={() => setActiveTab(7)} className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === 7 ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
                    <FiArchive className="w-5 h-5 mr-3" /> <span className="font-medium">{t.warehouseActivitiesTab}</span>
                </button>
                <button onClick={() => setActiveTab(8)} className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === 8 ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
                    <FiAlertCircle className="w-5 h-5 mr-3" /> <span className="font-medium">{t.errorMonitorTab}</span>
                </button>
                <button onClick={() => setActiveTab(6)} className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === 6 ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
                    <FiMessageSquare className="w-5 h-5 mr-3" /> <span className="font-medium">{t.chatTab}</span>
                </button>
            </nav>

            <div className="px-4 py-4 border-t border-gray-800">
                 <button onClick={() => setActiveTab(5)} className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === 5 ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
                    <FiSettings className="w-5 h-5 mr-3" />
                    <span className="font-medium">{t.settingsTab || 'Nastavení'}</span>
                </button>
                <button onClick={logout} className="flex items-center w-full px-4 py-3 mt-2 text-left text-red-400 rounded-lg hover:bg-gray-800 hover:text-red-500">
                    <FiLogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium">{t.logout}</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;