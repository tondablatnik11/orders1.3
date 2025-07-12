'use client';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';
import { UIProvider } from '../contexts/UIContext';
import Login from '../components/auth/Login';
import DashboardLayout from '../components/layout/DashboardLayout';

const AppContent = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Načítání...</div>;
  }

  return currentUser ? <DashboardLayout /> : <Login />;
};

export default function Page() {
  return (
    <UIProvider>
        <AuthProvider>
            <DataProvider>
                <AppContent />
            </DataProvider>
        </AuthProvider>
    </UIProvider>
  );
}