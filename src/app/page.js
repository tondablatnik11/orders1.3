// src/app/page.js
'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/components/auth/Login'; // Zde importujeme vaši komponentu Login

export default function Home() {
  const { currentUser, loading } = useAuth();

  // Pokud je aplikace stále načítána (kontroluje stav autentizace), zobrazte loader
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        Načítání...
      </div>
    );
  }

  // Pokud je uživatel přihlášen, zobrazte DashboardLayout
  if (currentUser) {
    return <DashboardLayout />;
  }

  // Pokud uživatel není přihlášen, zobrazte přihlašovací stránku
  return <LoginPage />;
}