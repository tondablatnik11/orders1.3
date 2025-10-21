// src/components/tabs/FreeBinsSummaryTab.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Warehouse, PackageOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"; // Ujistěte se, že cesta je správná

// Komponenty pro různé stavy načítání
const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
    <p className="ml-4 text-lg text-wh-text-secondary">Načítám přehled volných pozic...</p>
  </div>
);
const ErrorState = ({ error }) => (
  <div className="flex flex-col items-center justify-center h-64 bg-red-900/20 border border-red-700 rounded-lg p-6">
    <AlertTriangle className="w-12 h-12 text-red-500" />
    <p className="mt-4 text-lg text-red-400">Chyba při načítání dat</p>
    <p className="mt-2 text-sm text-wh-text-secondary text-center">Detail: {error}</p>
    <p className="mt-2 text-xs text-slate-500 text-center">
      (Zkontrolujte název tabulky 'lx03_data' a názvy sloupců v SQL funkci `get_free_bin_summary_v1`)
    </p>
  </div>
);
const EmptyState = () => (
  <div className="flex items-center justify-center h-64">
    <p className="text-lg text-wh-text-secondary">Nenalezena žádná data o volných pozicích.</p>
  </div>
);

// Hlavní komponenta
const FreeBinsSummaryTab = () => {
  const [summaryData, setSummaryData] = useState(null); // Data budou ve formátu { '800': { celkem_volnych: N, typy_binu: [...] }, ... }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/warehouse/free-bins-summary');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Chyba ${response.status}`);
      }
      const result = await response.json();
      setSummaryData(result);
      setLastUpdated(new Date()); // Uložíme čas poslední aktualizace
    } catch (err) {
      setError(err.message);
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
    if (!summaryData || Object.keys(summaryData).length === 0) return <EmptyState />;

    // Zobrazíme karty pro každý sklad
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(summaryData)
         .sort(([skladA], [skladB]) => skladA.localeCompare(skladB)) // Seřadíme sklady
         .map(([sklad, data]) => (
          <Card key={sklad} className="bg-wh-card border-wh-border shadow-md flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-wh-text-primary flex items-center">
                <Warehouse className="w-5 h-5 mr-2 text-sky-400" />
                Sklad {sklad}
              </CardTitle>
               <p className="text-sm text-wh-text-secondary pt-1">
                Celkem volných pozic: <span className="font-bold text-emerald-400">{data.celkem_volnych}</span>
              </p>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              {data.typy_binu.length > 0 ? (
                <ul className="space-y-2">
                  {data.typy_binu.map((binInfo) => (
                    <li key={binInfo.typ} className="flex justify-between items-center text-sm border-b border-slate-700/50 py-1.5 last:border-b-0">
                      <span className="text-wh-text-secondary flex items-center">
                        <PackageOpen className="w-4 h-4 mr-2 text-slate-500"/>
                        Typ: <strong className="ml-1 text-wh-text-primary">{binInfo.typ}</strong>
                      </span>
                      <span className="font-semibold text-wh-text-primary">{binInfo.pocet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">Pro tento sklad nebyly nalezeny žádné volné pozice podle typu.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-wh-text-primary">
          Přehled volných pozic ve skladu
        </h1>
        {lastUpdated && (
          <div className="text-xs text-slate-400">
            Poslední aktualizace: {lastUpdated.toLocaleString('cs-CZ')}
            <button
                onClick={fetchData}
                className="ml-2 text-sky-400 hover:text-sky-300 underline"
                disabled={loading}
              >
                (Obnovit)
              </button>
          </div>
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default FreeBinsSummaryTab;