'use client';
import { useAuth } from '@/hooks/useAuth'; // Importujeme náš hook
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/components/auth/Login'; 

export default function Home() {
  // Přímé a čisté získání hodnot z kontextu
  const { currentUser, loading } = useAuth();

  // Zobrazit loader, dokud se neověří stav přihlášení
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        Načítání...
      </div>
    );
  }

  // Pokud je uživatel přihlášen, zobrazit Dashboard, jinak Login.
  // Použití ternárního operátoru je zde ještě o kousek kratší a elegantnější.
  return currentUser ? <DashboardLayout /> : <LoginPage />;
}