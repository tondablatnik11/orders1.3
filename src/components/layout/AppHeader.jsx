// src/components/layout/AppHeader.jsx
"use client";
import React from 'react';
import { useUI } from '@/hooks/useUI';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData'; // Import useData
import { Globe, Sun, Moon, Lock, UploadCloud } from 'lucide-react'; // Import UploadCloud ikony

export default function AppHeader() {
    const { t, darkMode, toggleTheme, toggleLang } = useUI();
    const { currentUserProfile, logout } = useAuth();
    const { handleFileUpload } = useData(); // Získání handleFileUpload z DataContextu

    return (
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">{t.title}</h1>
            <div className="flex items-center gap-6">
                {/* Stávající profil uživatele a ikony notifikací */}
                {currentUserProfile && (
                    <div className="flex items-center gap-4 text-white">
                        {/* Předpokládáme, že chat/notifikační ikony jsou zde nebo jinde, podle starého kódu */}
                        <span className="font-semibold">{currentUserProfile.displayName}</span>
                    </div>
                )}
                
                {/* NOVINKA: Tlačítko pro nahrání souboru */}
                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow text-sm">
                    <UploadCloud className="w-4 h-4 text-white" /> {/* Menší ikona pro záhlaví */}
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />
                </label>

                {/* Stávající tlačítka pro jazyk, téma a odhlášení */}
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