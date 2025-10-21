// src/components/modals/StockPositionModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, X, AlertTriangle, Archive } from 'lucide-react';
import { useUI } from '@/hooks/useUI'; // Předpokládám, že máte useUI pro darkMode

const StockPositionModal = ({ materialCode, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useUI(); // Pro stylování

  useEffect(() => {
    const fetchData = async () => {
      if (!materialCode) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/analytics/stock-by-material?material=${materialCode}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Chyba ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [materialCode]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="ml-3 text-wh-text-secondary">Načítám pozice z LT10...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-48">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <p className="mt-4 text-red-400">Chyba při načítání dat</p>
          <p className="mt-1 text-sm text-wh-text-secondary">{error}</p>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48">
          <Archive className="w-10 h-10 text-wh-text-secondary" />
          <p className="mt-4 text-wh-text-primary">Pro tento materiál nebyly nalezeny žádné skladové pozice.</p>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto max-h-96">
        <table className="min-w-full divide-y divide-wh-border">
          <thead className="bg-slate-800 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-wh-text-secondary uppercase tracking-wider">
                Skladová Pozice (Bin)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-wh-text-secondary uppercase tracking-wider">
                Dostupné Množství (ks)
              </th>
            </tr>
          </thead>
          <tbody className="bg-wh-card divide-y divide-wh-border">
            {data.map((item) => (
              <tr key={item.pozice} className="hover:bg-slate-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-wh-text-primary">
                  {item.pozice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-wh-text-secondary font-mono">
                  {new Intl.NumberFormat('cs-CZ').format(item.mnozstvi)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl rounded-xl shadow-2xl border ${
          darkMode 
            ? 'bg-slate-900 border-slate-700' 
            : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-wh-border">
          <h2 className="text-lg font-semibold text-wh-text-primary">
            Skladové pozice (LT10) pro materiál:
            <span className="ml-2 font-bold text-sky-400">{materialCode}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-wh-text-secondary hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {renderContent()}
        </div>

      </div>
    </div>
  );
};

export default StockPositionModal;