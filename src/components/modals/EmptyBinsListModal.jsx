// src/components/modals/EmptyBinsListModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, X, AlertTriangle, PackageSearch } from 'lucide-react';
import { useUI } from '@/hooks/useUI'; // Předpokládáme existenci

const EmptyBinsListModal = ({ sklad, typBinu, onClose }) => {
  const [bins, setBins] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useUI();

  useEffect(() => {
    const fetchBins = async () => {
      // 1. Zásadní kontrola HNED na začátku
      if (!sklad || !typBinu) {
        console.error("EmptyBinsListModal Chyba: Chybí props 'sklad' nebo 'typBinu'. Hodnoty:", sklad, typBinu);
        // Nastavíme chybu, která se zobrazí uživateli
        setError("Chybí parametry sklad nebo typBinu pro načtení seznamu.");
        setLoading(false); // Ukončíme načítání
        return; // Nepokračujeme dál
      }

      // Pokud máme parametry, pokračujeme
      setLoading(true);
      setError(null);
      setBins(null);

      try {
        // 2. Sestavení URL s parametry
        const apiUrl = `/api/warehouse/empty-bins-list?sklad=${encodeURIComponent(sklad)}&typBinu=${encodeURIComponent(typBinu)}`;
        // console.log("Fetching bins from:", apiUrl); // Pro ladění

        const response = await fetch(apiUrl);

        // 3. Kontrola odpovědi
        if (!response.ok) {
          let errorDetail = `HTTP chyba ${response.status}`;
          try {
            const errData = await response.json();
            errorDetail = errData.error || errorDetail;
          } catch (e) { /* Ignorujeme, pokud odpověď není JSON */ }
          throw new Error(errorDetail);
        }

        const result = await response.json();
        setBins(result);

      } catch (err) {
        console.error("Chyba při načítání seznamu binů v modalu:", err);
        setError(err.message); // Zobrazíme chybu uživateli
      } finally {
        setLoading(false);
      }
    };

    fetchBins();
  }, [sklad, typBinu]); // Efekt se spustí znovu, pokud se změní sklad nebo typBinu

  // Funkce pro vykreslení obsahu modalu
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="ml-3 text-wh-text-secondary">Načítám seznam pozic...</p>
        </div>
      );
    }

    // Zde se nyní zobrazí chyba "Chybí parametry...", pokud props nepřišly správně
    // NEBO jakákoli jiná chyba z API volání
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center px-4">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
          <p className="font-semibold text-red-400">Chyba</p>
          <p className="mt-1 text-sm text-wh-text-secondary">{error}</p>
          <p className="mt-2 text-xs text-slate-500">
            (Zkontrolujte API cestu `/api/warehouse/empty-bins-list` a její parametry v Network tabu prohlížeče).
          </p>
        </div>
      );
    }

    if (!bins || bins.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48">
          <PackageSearch className="w-10 h-10 text-wh-text-secondary" />
          <p className="mt-4 text-wh-text-primary">Nebyly nalezeny žádné prázdné pozice pro tento typ.</p>
        </div>
      );
    }

    // Zobrazení seznamu binů ve sloupcích
    const numColumns = 4;
    const itemsPerColumn = Math.ceil(bins.length / numColumns);
    const columns = Array.from({ length: numColumns }, (_, colIndex) =>
      bins.slice(colIndex * itemsPerColumn, (colIndex + 1) * itemsPerColumn)
    );

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 max-h-96 overflow-y-auto pr-2">
        {columns.map((column, colIndex) => (
          <ul key={colIndex} className="space-y-1">
            {column.map((bin) => (
              <li key={bin} className="text-sm font-mono text-wh-text-primary bg-slate-800 px-2 py-0.5 rounded break-all">
                {bin}
              </li>
            ))}
          </ul>
        ))}
      </div>
    );
  };

  // Vykreslení celého modalu
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-3xl rounded-xl shadow-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-wh-border">
          <h2 className="text-lg font-semibold text-wh-text-primary">
            Seznam prázdných pozic - Sklad: <span className="font-bold text-sky-400">{sklad || '?'}</span>, Typ: <span className="font-bold text-sky-400">{typBinu || '?'}</span>
          </h2>
          <button onClick={onClose} /* ... */ > <X size={20} /> </button>
        </div>
        <div className="p-6"> {renderContent()} </div>
      </div>
    </div>
  );
};

export default EmptyBinsListModal;