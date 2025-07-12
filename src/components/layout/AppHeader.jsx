"use client";
import React from 'react';
import { useUI } from '@/hooks/useUI';
import { useAuth } from '@/hooks/useAuth';
import { Globe, Sun, Moon, Lock } from 'lucide-react';

export default function AppHeader() {
    const { t, darkMode, toggleTheme, toggleLang } = useUI();
    const { currentUserProfile, logout } = useAuth();
    
    return (
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">{t.title}</h1>
            <div className="flex items-center gap-6">
                {currentUserProfile && <span className="font-semibold">{currentUserProfile.displayName}</span>}
                <button onClick={toggleLang} className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg shadow text-sm">
                    <Globe className="w-4 h-4" /> {t.langCode}
                </button>
                <button onClick={toggleTheme} className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg shadow text-sm">
                    {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                </button>
                <button onClick={logout} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg shadow text-sm">
                    <Lock className="w-5 h-5" /> {t.logout}
                </button>
            </div>
        </header>
    );
}