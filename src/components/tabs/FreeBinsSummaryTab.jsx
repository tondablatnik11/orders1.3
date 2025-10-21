// src/components/tabs/FreeBinsSummaryTab.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Warehouse, PackageOpen, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"; // Používáme i CardDescription
import { Progress } from "@/components/ui/progress"; // Přidáme Progress bar (nezapomeňte vytvořit nebo nainstalovat, pokud nemáte)
import { Button } from "@/components/ui/button"; // Použijeme Button pro obnovení


// Komponenta Progress může vypadat takto (pokud ji nemáte):
// Vytvořte soubor src/components/ui/progress.jsx
/*
'use client';
import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils'; // Předpokládá existenci cn utility

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-slate-800', // Tmavší pozadí
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-sky-500 transition-all" // Barva indikátoru
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
*/

// --- Komponenty pro stavy ---
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
    <p className="text-lg text-wh-text-secondary">Načítám přehled prázdných pozic...</p>
    <p className="text-sm text-slate-500">Zpracovávám data z LX03...</p>
  </div>
);
const ErrorState = ({ error }) => (
  <Card className="bg-red-900/20 border-red-700 text-red-400">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" /> Chyba při načítání dat
      </CardTitle>
      <CardDescription className="text-red-300/80">Nepodařilo se získat přehled volných pozic.</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm">Detail chyby: {error}</p>
      <p className="text-xs mt-2 text-red-300/60">
        (Zkontrolujte SQL funkci `get_empty_bin_summary_v2` a API cestu).
      </p>
    </CardContent>
  </Card>
);
const EmptyState = () => (
   <Card className="border-dashed border-slate-700">
     <CardHeader>
        <CardTitle className="text-wh-text-secondary font-normal">Žádná data</CardTitle>
     </CardHeader>
     <CardContent>
        <p className="text-slate-500">Nebyly nalezeny žádné prázdné pozice pro sklady 800 nebo 820, nebo data ještě nebyla načtena.</p>
     </CardContent>
   </Card>
);

// --- Hlavní komponenta ---
const FreeBinsSummaryTab = () => {
  const [summaryData, setSummaryData] = useState(null); // Data budou { '800': {...}, '820': {...} }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Funkce pro načtení a filtrování dat
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/warehouse/free-bins-summary');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Chyba ${response.status}`);
      }
      const allData = await response.json();

      // Vyfiltrujeme jen sklady 800 a 820
      const filteredData = {};
      if (allData['800']) {
        filteredData['800'] = allData['800'];
      }
      if (allData['820']) {
        filteredData['820'] = allData['820'];
      }

      setSummaryData(filteredData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      setSummaryData(null); // Resetujeme data při chybě
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Načteme data při prvním zobrazení
  }, []);

  const renderContent = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} />;
    if (!summaryData || (Object.keys(summaryData).length === 0 && !loading)) return <EmptyState />;

    // Zjistíme maximální celkový počet pozic pro výpočet procent v Progress baru (volitelné)
    // Pokud chcete procenta vůči celkovému počtu binů daného typu, musela by se upravit SQL funkce
    const overallMax = Math.max(
        summaryData['800']?.celkem_prazdnych || 0,
        summaryData['820']?.celkem_prazdnych || 0
    );


    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vykreslíme vždy karty pro 800 a 820, i když data chybí */}
        {['800', '820'].map((sklad) => {
          const data = summaryData ? summaryData[sklad] : null; // Získáme data pro konkrétní sklad
          const celkemPrazdnych = data?.celkem_prazdnych || 0;
          // const progressValue = overallMax > 0 ? (celkemPrazdnych / overallMax) * 100 : 0; // Procentuální zobrazení

          return (
            <Card key={sklad} className="bg-wh-card border-wh-border shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
              <CardHeader className="pb-4 border-b border-slate-700/50 mb-4">
                <div className="flex justify-between items-center">
                   <CardTitle className="text-2xl font-semibold text-wh-text-primary flex items-center">
                     <Warehouse className="w-6 h-6 mr-3 text-sky-400" />
                     Sklad {sklad}
                   </CardTitle>
                   <div className="text-right">
                      <p className="text-sm text-wh-text-secondary">Celkem prázdných:</p>
                      <p className="text-3xl font-bold text-emerald-400">{celkemPrazdnych}</p>
                   </div>
                </div>
                 {/* <Progress value={progressValue} className="mt-2 h-2" /> Volitelný progress bar */}
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                {data && data.typy_binu.length > 0 ? (
                  <ul className="space-y-3">
                    {data.typy_binu
                     // Seřadíme K1, P1, P2...
                     .sort((a, b) => {
                        const order = {'K1': 1, 'P1': 2, 'P2': 3, 'P3': 4, 'P4': 5};
                        return (order[a.typ] || 99) - (order[b.typ] || 99);
                     })
                     .map((binInfo) => (
                      <li key={binInfo.typ} className="flex justify-between items-center text-md border-b border-slate-700/50 pb-2 last:border-b-0">
                        <span className="text-wh-text-secondary flex items-center">
                          <PackageOpen className="w-5 h-5 mr-2 text-slate-500"/>
                          <span className="w-10 font-medium">{binInfo.typ}:</span> {/* Pevná šířka pro zarovnání */}
                        </span>
                        <span className="font-semibold text-wh-text-primary text-lg">{binInfo.pocet}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic text-center py-4">Pro tento sklad nebyly nalezeny žádné prázdné pozice podle typu.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full animate-fadeInUp">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-wh-text-primary">
          Přehled prázdných pozic
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
           {lastUpdated && (
             <span>Posl. akt.: {lastUpdated.toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'medium' })}</span>
           )}
          <Button
            variant="outline" // Styl tlačítka (může vyžadovat definici v ui/button.jsx)
            size="sm" // Menší velikost
            onClick={fetchData}
            disabled={loading}
            className="border-slate-600 hover:bg-slate-700 hover:text-sky-300" // Styly pro tmavý režim
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Obnovit
          </Button>
        </div>
      </div>

      {renderContent()}

      <p className="text-xs text-slate-500 mt-6 italic text-center border-t border-slate-700/50 pt-4">
        Zobrazený počet představuje prázdné skladové pozice (bez materiálu). Blokované pozice nejsou zohledněny.
      </p>
    </div>
  );
};

export default FreeBinsSummaryTab;