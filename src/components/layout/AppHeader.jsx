"use client";
import React from 'react';
import { useUI } from '@/hooks/useUI';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import Notifications from './Notifications';
import { Globe, Sun, Moon, Lock, UploadCloud, Settings } from 'lucide-react';

export default function AppHeader({ setActiveTab }) {
    const { t, darkMode, toggleTheme, toggleLang } = useUI();
    const { currentUserProfile, logout } = useAuth();
    const { handleFileUpload } = useData(); 

    return (
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">{t.title}</h1>
            <div className="flex items-center gap-4">
                <Notifications />
                
                {currentUserProfile && (
                    <div className="flex items-center gap-2 text-white">
                        <span className="font-semibold">{currentUserProfile.displayName}</span>
                        <button 
                            onClick={() => setActiveTab(5)} 
                            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                            title="Nastavení"
                        >
                            <Settings className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                )}
                
                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow text-sm">
                    <UploadCloud className="w-4 h-4 text-white" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />
                </label>

                <button onClick={toggleLang} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg shadow text-sm">
                    <Globe className="w-4 h-4" /> {t.langCode}
                </button>
                <button onClick={toggleTheme} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg shadow text-sm">
                    {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                </button>
                <button onClick={logout} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg shadow text-sm">
                    <Lock className="w-5 h-5" /> {t.logout}
                </button>
            </div>
        </header>
    );
}