// src/app/page.js - TOTO JE SPRÁVNÁ A JEDNODUŠŠÍ VERZE
'use client'; // Tato direktiva je nezbytná pro klientské komponenty

import React from "react";
import DashboardLayout from '@/components/layout/DashboardLayout'; // Importujeme hlavní layout
import { AuthProvider } from '@/contexts/AuthContext'; // Importujeme Auth kontext
import { DataProvider } from '@/contexts/DataContext'; // Importujeme Data kontext
import { UIProvider } from '@/contexts/UIContext'; // Importujeme UI kontext

// Tento soubor by měl být nyní velmi jednoduchý.
// Veškerá inicializace Firebase/Supabase, autentizační logika,
// načítání dat, správa stavů pro záložky atd.
// by měla být přesunuta DO jejich příslušných Kontextů (AuthContext, DataContext, UIContext)
// nebo do samotné komponenty DashboardLayout.
// Ujistěte se, že všechny relevantní části kódu, které byly v původním page.js,
// jsou nyní přesunuty do správných kontextů nebo komponent!

export default function Home() {
  return (
    // Zde obalíme celý Dashboard do providerů kontextů
    <UIProvider>
      <AuthProvider>
        <DataProvider>
          <DashboardLayout /> {/* Zde se vykreslí hlavní layout */}
        </DataProvider>
      </AuthProvider>
    </UIProvider>
  );
}