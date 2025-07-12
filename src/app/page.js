// src/app/page.js
'use client';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/components/auth/Login';

/**
 * Hlavní vstupní bod aplikace.
 * Tato komponenta funguje jako "výhybka", která rozhoduje,
 * co zobrazit na základě stavu přihlášení uživatele.
 */
export default function Home() {
  // Získání stavu přihlášení a načítání z AuthContextu.
  // Destrukturování je čistý a běžný způsob, jak přistupovat k hodnotám z kontextu.
  const { currentUser, loading } = useAuth();

  // 1. Zobrazit "Načítání...", dokud se neověří stav autentizace.
  //    Tím se zabrání problikávání mezi přihlašovací a hlavní stránkou.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        Načítání...
      </div>
    );
  }

  // 2. Po dokončení načítání zkontrolovat, zda je uživatel přihlášen.
  //    Pokud ano, zobrazit hlavní layout aplikace.
  //    Pokud ne, zobrazit přihlašovací stránku.
  //    Ternární operátor (?:) je pro tuto logiku ideální a velmi čitelný.
  return currentUser ? <DashboardLayout /> : <LoginPage />;
}