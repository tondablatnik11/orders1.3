// src/app/page.js
'use client';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/components/auth/Login';

export default function Home() {
  const { currentUser, userProfile, loading } = useAuth();

  // 1. Zobrazit "Načítání...", dokud se ověřuje stav přihlášení
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        Načítání...
      </div>
    );
  }

  // 2. PŘIDÁNO: Zobrazit "Načítání profilu...", pokud je uživatel přihlášen, ale profil ještě není k dispozici.
  //    Toto je klíčová oprava, která řeší váš problém.
  if (currentUser && !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        Načítání profilu...
      </div>
    );
  }

  // 3. Teprve když je vše ověřeno a načteno, zobrazíme správnou stránku
  return currentUser && userProfile ? <DashboardLayout /> : <LoginPage />;
}