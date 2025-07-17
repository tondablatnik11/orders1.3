"use client";
import React, { useState } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import Notifications from './Notifications';
import { FiSearch, FiUploadCloud, FiGlobe, FiAlertCircle, FiMenu } from 'react-icons/fi'; // Přidána ikona FiMenu

export default function AppHeader({ onSearchSubmit, activeTab, onMenuClick }) { // Přidán prop onMenuClick
    const { handleFileUpload, handleErrorLogUpload } = useData();
    const { t, toggleLang } = useUI();
    const [localSearch, setLocalSearch] = useState('');

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            onSearchSubmit(localSearch);
        }
    };
    
    const isErrorMonitorTab = activeTab === 'errorMonitor';

    return (
        <header className="flex justify-between items-center h-20 px-6 lg:px-10 bg-gray-900 border-b border-gray-700 flex-shrink-0">
            {/* OPRAVA: Hamburger menu pro mobilní zobrazení */}
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden text-gray-300">
                    <FiMenu className="w-6 h-6" />
                </button>
                <div className="relative hidden md:block">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Hledat zakázku a stisknout Enter..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 w-80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {isErrorMonitorTab ? (
                     <label className="cursor-pointer flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                        <FiAlertCircle className="w-5 h-5" />
                        <span className="hidden sm:inline">Nahrát log chyb</span>
                        <input type="file" accept=".csv, .xlsx, .xls" onChange={(e) => handleErrorLogUpload(e.target.files[0])} className="hidden" />
                    </label>
                ) : (
                    <label className="cursor-pointer flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                        <FiUploadCloud className="w-5 h-5" />
                        <span className="hidden sm:inline">{t.upload}</span>
                        <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />
                    </label>
                )}

                <button onClick={toggleLang} className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200">
                    <FiGlobe className="w-5 h-5 text-gray-300" />
                </button>
                <Notifications />
            </div>
        </header>
    );
}