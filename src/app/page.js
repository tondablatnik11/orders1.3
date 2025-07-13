'use client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/components/auth/Login';

export default function Home() {
  const { loading, currentUser } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        Načítání...
      </div>
    );
  }

  return currentUser ? <DashboardLayout /> : <LoginPage />;
}