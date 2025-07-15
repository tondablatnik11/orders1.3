'use client';

// Importujte potřebné komponenty a hooky
import DashboardLayout from '@/components/layout/DashboardLayout';
import Login from '@/components/auth/Login';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  const { user, loading } = useAuth();

  // Zobrazí se, dokud se ověřuje přihlášení uživatele
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        Načítání...
      </div>
    );
  }

  // Hlavní logika pro zobrazení aplikace
  return (
    <main>
      {/* Komponenta pro zobrazení notifikací */}
      <Toaster position="bottom-right" />
      
      {/* Pokud je uživatel přihlášen, zobrazí se hlavní layout, jinak přihlašovací stránka */}
      {user ? <DashboardLayout /> : <Login />}
    </main>
  );
}