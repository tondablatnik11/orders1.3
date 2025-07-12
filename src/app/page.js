// src/app/page.js
'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/components/auth/Login'; 

export default function Home() {
  // Získat celý kontextový objekt z useAuth
  const authContext = useAuth(); 
  // Bezpečné destrukturování vlastností, s poskytnutím fallbacku pro případy, kdy authContext může být null během SSR nebo počáteční hydratace
  const currentUser = authContext ? authContext.currentUser : null;
  const loading = authContext ? authContext.loading : true; // Předpokládejte, že je načítání aktivní, dokud není určen stav

  // Pokud je aplikace stále načítána (kontroluje stav autentizace), zobrazte loader
  if (loading) {
    console.log("page.js: Stav načítání autentizace je true, zobrazuji loader.");
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        Načítání...
      </div>
    );
  }

  // Pokud je uživatel přihlášen, zobrazte DashboardLayout
  if (currentUser) {
    console.log("page.js: Současný uživatel je přihlášen, zobrazuji DashboardLayout.");
    return <DashboardLayout />;
  }

  // Pokud uživatel není přihlášen, zobrazte LoginPage
  console.log("page.js: Žádný současný uživatel, zobrazuji LoginPage.");
  return <LoginPage />;
}