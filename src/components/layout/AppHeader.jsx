"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { FiSearch, FiUploadCloud, FiMenu } from 'react-icons/fi';

export default function AppHeader({ onToggleSidebar }) {
    const { handleFileUpload } = useData();
    const { t } = useUI();

    return (
        <header className="flex justify-between items-center h-20 px-6 lg:px-10 bg-gray-900 border-b border-gray-800 flex-shrink-0">
            {/* Tlačítko pro menu na mobilu - zatím jen vizuální */}
            <button onClick={onToggleSidebar} className="text-gray-400 hover:text-white lg:hidden">
                <FiMenu className="w-6 h-6" />
            </button>

            {/* Globální vyhledávací pole */}
            <div className="relative hidden md:block">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder="Hledat zakázku..."
                    className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 w-80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div className="flex items-center gap-4">
                <label className="cursor-pointer flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors">
                    <FiUploadCloud className="w-5 h-5" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />
                </label>
            </div>
        </header>
    );
}