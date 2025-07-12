'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { UIProvider } from '@/contexts/UIContext';

export function AppProviders({ children }) {
  return (
    <UIProvider>
      <AuthProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </AuthProvider>
    </UIProvider>
  );
}
