// src/components/tabs/FreeBinsSummaryTab.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Warehouse, PackageOpen, RefreshCw } from 'lucide-react';
// Ujistěte se, že cesta k UI komponentám je správná
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import EmptyBinsListModal from '@/components/modals/EmptyBinsListModal'; // Import modálního okna

// --- Komponenty pro stavy ---
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
    <p className="text-lg text-wh-text-secondary">Načítám přehled prázdných pozic...</p>
    <p className="text-sm text-slate-500">Zpracovávám data...</p>
  </div>
);
const ErrorState = ({ error }) => (
 <Card className="bg-red-900/20 border-red-700 text-red-400">
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Chyba</CardTitle>
      {/* CardDescription jsme odstranili kvůli kompatibilitě */}
    </CardHeader>
    <CardContent>
      <p className="text-sm">Detail chyby: {error}</p>
      <p className="text-xs mt-2 text-red-300/60">
        (Zkontrolujte SQL funkci `get_empty_bin_summary_v2` a API cestu `/api/warehouse/free-bins-summary`).
      </p>
      </CardContent>
  </Card>
);
const EmptyState = () => (
  <Card className="border-dashed border-slate-700">
     <CardHeader><CardTitle className="text-wh-text-secondary font-normal">Žádná data</CardTitle></CardHeader>
     <CardContent><p className="text-slate-500">Nebyly nalezeny žádné prázdné pozice pro sklady 800 nebo 820.</p></CardContent>
   </Card>
);

// --- Hlavní komponenta ---
const FreeBinsSummaryTab = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Chyba pro načítání SUMÁRNÍCH dat
  const [lastUpdated, setLastUpdated] = useState(null);

  // --- Stavy pro modální okno ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSklad, setModalSklad] = useState(null);
  const [modalTypBinu, setModalTypBinu] = useState(null);
  // ------------------------------

  // Funkce pro načtení a filtrování dat
  const fetchData = async () => {
    setLoading(true);
    setError(null); // Resetujeme chybu před novým načtením
    try {
      // API volá funkci get_empty_bin_summary_v2
      const response = await fetch('/api/warehouse/free-bins-summary');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP chyba ${response.status}` }));
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
      console.error("Chyba při načítání sumárních dat:", err); // Logování chyby
      setError(err.message);
      setSummaryData(null); // Resetujeme data při chybě
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Načteme data při prvním zobrazení
  }, []);

  // --- Funkce pro otevření modálního okna ---
  const handleOpenModal = (sklad, typBinu) => {
    // Ověření, že máme platné hodnoty PŘED nastavením stavu
    if (sklad && typBinu) {
        // console.log("Otevírám modal pro:", sklad, typBinu); // Pro ladění
        setModalSklad(sklad);
        setModalTypBinu(typBinu);
        setIsModalOpen(true); // Otevřeme AŽ když máme data
    } else {
        console.error("Pokus o otevření modalu s neplatnými daty:", sklad, typBinu);
        // Zde můžete přidat toast notifikaci pro uživatele, pokud ji používáte
        // např. toast.error("Nelze zobrazit detail, chybí data.")
    }
  };
  // ----------------------------------------

  const renderContent = () => {
    if (loading) return <LoadingState />;
    // Zobrazíme chybu POUZE pokud selhalo načtení SUMÁRNÍCH dat a nemáme žádná data
    if (error && !summaryData) return <ErrorState error={error} />;
    // Zobrazíme "Žádná data", pokud je summaryData prázdné PO načtení (a není chyba)
    if (!summaryData || (Object.keys(summaryData).length === 0 && !loading && !error)) return <EmptyState />;

    // Pokud máme data (i když třeba jen pro jeden sklad), vykreslíme karty
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vykreslíme vždy karty pro 800 a 820 */}
        {['800', '820'].map((sklad) => {
          // Získáme data pro konkrétní sklad, nebo null, pokud neexistují
          const data = summaryData ? summaryData[sklad] : null;
          const celkemPrazdnych = data?.celkem_prazdnych || 0;

          return (
            <Card key={sklad} className="bg-wh-card border-wh-border shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col min-h-[200px]"> {/* Přidána minimální výška */}
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
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                {/* Zobrazíme seznam, POUZE pokud data pro tento sklad existují */}
                {data && data.typy_binu.length > 0 ? (
                  <ul className="space-y-3">
                    {data.typy_binu
                     // Seřadíme K1, P1, P2...
                     .sort((a, b) => {
                        const order = {'K1': 1, 'P1': 2, 'P2': 3, 'P3': 4, 'P4': 5};
                        // Dáme 'NEURČENO' na konec
                        const orderA = order[a.typ] || 99;
                        const orderB = order[b.typ] || 99;
                        return orderA - orderB;
                      })
                     .map((binInfo) => (
                      // --- Klikatelná položka seznamu ---
                      <li key={binInfo.typ}
                          className="flex justify-between items-center text-md border-b border-slate-700/50 pb-2 last:border-b-0 group cursor-pointer hover:bg-slate-800/50 px-2 -mx-2 rounded transition-colors duration-150"
                          // Předáváme 'sklad' a 'binInfo.typ' do handleOpenModal
                          onClick={() => handleOpenModal(sklad, binInfo.typ)}
                          title={`Zobrazit seznam prázdných pozic typu ${binInfo.typ}`}>
                        <span className="text-wh-text-secondary flex items-center">
                          <PackageOpen className="w-5 h-5 mr-2 text-slate-500"/>
                          <span className="w-10 font-medium group-hover:text-sky-300">{binInfo.typ}:</span>
                        </span>
                        {/* Číslo je nyní také součástí klikatelné oblasti */}
                        <span className="font-semibold text-wh-text-primary text-lg group-hover:text-sky-300">{binInfo.pocet}</span>
                      </li>
                     // -----------------------------
                    ))}
                  </ul>
                ) : (
                  // Zpráva, pokud pro tento konkrétní sklad nejsou data
                  <p className="text-sm text-slate-500 italic text-center py-4">Žádné prázdné pozice pro tento sklad.</p>
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
            variant="outline"
            size="sm"
            onClick={fetchData} // Tlačítko znovu načte data
            disabled={loading}
            className="border-slate-600 hover:bg-slate-700 hover:text-sky-300"
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

      {/* --- Vykreslení modálního okna --- */}
      {/* Modal se vykreslí POUZE pokud isModalOpen je true */}
      {/* Předáváme aktuální hodnoty ze stavu modalSklad a modalTypBinu */}
      {isModalOpen && (
        <EmptyBinsListModal
          sklad={modalSklad}
          typBinu={modalTypBinu}
          onClose={() => setIsModalOpen(false)} // Funkce pro zavření
        />
      )}
      {/* ---------------------------------- */}
    </div>
  );
};

export default FreeBinsSummaryTab;