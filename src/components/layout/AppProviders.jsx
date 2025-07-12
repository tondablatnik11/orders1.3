'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { UIProvider } from '@/contexts/UIContext';

// Ujistěte se, že exportovaná funkce se jmenuje přesně "AppProviders"
export function AppProviders({ children }) {
  return (
    // Správné vnoření providerů, kde AuthProvider obaluje DataProvider
    <UIProvider>
      <AuthProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </AuthProvider>
    </UIProvider>
  );
}