"use client";
import React, { useState } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import Notifications from './Notifications';
import { Search, UploadCloud, Globe, AlertCircle, Menu } from 'lucide-react';

export default function AppHeader({ onSearchSubmit, activeTab, onMenuClick }) {
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
        <header className="flex justify-between items-center h-20 px-6 lg:px-10 bg-gradient-to-b from-slate-900/80 to-slate-900/50 backdrop-blur-lg border-b border-slate-700/50 flex-shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden text-gray-300">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Hledat zakázku a stisknout Enter..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="bg-slate-800/70 border border-slate-700 rounded-lg py-2 pl-10 pr-4 w-80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-300"
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {isErrorMonitorTab ? (
                     <label className="cursor-pointer flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-red-600/20 transition-all duration-300 transform hover:-translate-y-0.5">
                        <AlertCircle className="w-5 h-5" />
                        <span className="hidden sm:inline">Nahrát log chyb</span>
                        <input type="file" accept=".csv, .xlsx, .xls" onChange={(e) => handleErrorLogUpload(e.target.files[0])} className="hidden" />
                    </label>
                ) : (
                    <label className="cursor-pointer flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-sky-600/20 transition-all duration-300 transform hover:-translate-y-0.5">
                        <UploadCloud className="w-5 h-5" />
                        <span className="hidden sm:inline">{t.upload}</span>
                        <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />
                    </label>
                )}

                <button onClick={toggleLang} title="Změnit jazyk" className="p-2 rounded-full hover:bg-slate-700/50 transition-colors duration-200">
                    <Globe className="w-5 h-5 text-gray-300" />
                </button>
                <Notifications />
            </div>
        </header>
    );
}