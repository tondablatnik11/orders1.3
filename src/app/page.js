// src/app/page.js
'use client';

// Importujte potřebné komponenty a hooky
import DashboardLayout from '@/components/layout/DashboardLayout';
import Login from '@/components/auth/Login';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react'; // Import ikony pro spinner

// Komponenta pro profesionální loading spinner
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
    <p className="text-lg text-slate-400">Načítání aplikace...</p>
  </div>
);


export default function Home() {
  const { user, loading } = useAuth();

  // Zobrazí se, dokud se ověřuje přihlášení uživatele
  if (loading) {
    return <LoadingSpinner />;
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