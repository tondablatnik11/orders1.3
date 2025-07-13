'use client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/components/auth/Login';

export default function Home() {
  const { status, currentUser } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        Načítání...
      </div>
    );
  }

  return status === 'authenticated' && currentUser ? <DashboardLayout /> : <LoginPage />;
}