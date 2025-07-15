"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import Notifications from './Notifications';
import { FiSearch, FiUploadCloud, FiGlobe, FiAlertCircle } from 'react-icons/fi';

export default function AppHeader({ activeTab }) { // <-- PŘIDÁN PROP
    const { handleFileUpload, handleErrorLogUpload } = useData();
    const { t, toggleLang } = useUI();

    const isErrorMonitorTab = activeTab === 8;

    return (
        <header className="flex justify-between items-center h-20 px-6 lg:px-10 bg-gray-900 border-b border-gray-700 flex-shrink-0">
            <div className="relative hidden md:block">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder="Hledat zakázku..."
                    className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 w-80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div className="flex items-center gap-4">
                {isErrorMonitorTab ? (
                     <label className="cursor-pointer flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors">
                        <FiAlertCircle className="w-5 h-5" />
                        <span>Nahrát log chyb</span>
                        <input type="file" accept=".csv, .xlsx, .xls" onChange={(e) => handleErrorLogUpload(e.target.files[0])} className="hidden" />
                    </label>
                ) : (
                    <label className="cursor-pointer flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors">
                        <FiUploadCloud className="w-5 h-5" />
                        <span>{t.upload}</span>
                        <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />
                    </label>
                )}

                <button onClick={toggleLang} className="p-2 rounded-full hover:bg-gray-700">
                    <FiGlobe className="w-5 h-5 text-gray-300" />
                </button>
                <Notifications />
            </div>
        </header>
    );
}