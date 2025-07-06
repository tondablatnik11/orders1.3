"use client";
import React from 'react';
import { useUI } from '@/hooks/useUI';
import { useAuth } from '@/hooks/useAuth';
import { Globe, Sun, Moon, Lock, MessageSquare, Bell, User } from 'lucide-react';

export default function AppHeader({ onChatToggle, onProfileToggle }) {
    const { t, darkMode, toggleTheme, toggleLang } = useUI();
    const { userProfile, logout } = useAuth();
    
    const unreadMessages = 0;
    const notifications = [];

    return (
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">{t.title}</h1>
            <div className="flex items-center gap-6">
                {userProfile && (
                    <div className="flex items-center gap-4 text-white">
                        <div className="relative cursor-pointer" onClick={onChatToggle}>
                            <MessageSquare className="w-6 h-6" />
                            {unreadMessages > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadMessages}</span>}
                        </div>
                        <div className="relative">
                            <Bell className="w-6 h-6" />
                            {notifications.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{notifications.length}</span>}
                        </div>
                        <div className="relative cursor-pointer flex items-center gap-2" onClick={onProfileToggle}>
                            <User className="w-6 h-6" />
                            <span className="font-semibold">{userProfile.displayName}</span>
                        </div>
                    </div>
                )}
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