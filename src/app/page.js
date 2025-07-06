"use client";
import React from 'react';
import { UIProvider } from '@/contexts/UIContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import Login from '@/components/auth/Login';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Pomocná komponenta, která má přístup k autentizačnímu kontextu
function AppContent() {
    const { user, loading } = useAuth();

    // Zobrazí načítací obrazovku, dokud se neověří stav přihlášení
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
                <p>Načítání aplikace...</p>
            </div>
        );
    }

    // Pokud je uživatel přihlášen, zobrazí hlavní layout aplikace.
    // Jinak zobrazí přihlašovací formulář.
    return user ? (
        <DataProvider>
            <DashboardLayout />
        </DataProvider>
    ) : (
        <Login />
    );
}

// Hlavní exportovaná komponenta stránky
export default function Page() {
    return (
        <UIProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </UIProvider>
    );
}