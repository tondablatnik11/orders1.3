'use client';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';
import Login from '../components/auth/Login';
import Dashboard from '../components/dashboard/Dashboard'; // Vytvoříme za chvíli

// Komponenta, která rozhoduje, co zobrazit
const AppContent = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Načítání...</div>;
  }

  return currentUser ? <Dashboard /> : <Login />;
};


// Hlavní export stránky
export default function Page() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}