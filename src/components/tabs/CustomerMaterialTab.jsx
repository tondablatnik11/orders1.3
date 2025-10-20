// src/components/tabs/CustomerMaterialTab.jsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertTriangle, FileDown } from 'lucide-react';
// Předpokládám, že komponenta Card existuje na základě vaší struktury
// Pokud ne, můžete <Card> a <CardHeader> atd. nahradit prostými <div>
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import * as XLSX from 'xlsx';

// Komponenta pro zobrazení tabulky
const AnalysisTable = ({ data }) => {
  // Seskupení dat podle zákazníka pro lepší přehlednost
  const groupedData = useMemo(() => {
    return data.reduce((acc, item) => {
      const zakaznik = item.zakaznik || 'Neznámý zákazník';
      if (!acc[zakaznik]) {
        acc[zakaznik] = [];
      }
      acc[zakaznik].push(item);
      return acc;
    }, {});
  }, [data]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    Object.entries(groupedData).forEach(([zakaznik, materials]) => {
      // Omezení délky názvu listu (Excel má limit 31 znaků)
      const sheetName = zakaznik.replace(/[\*:\/\\?\s\[\]]/g, '').substring(0, 31);
      const ws_data = materials.map(item => ({
        Material: item.material,
        "Celkové Množství": item.celkove_mnozstvi,
      }));
      const ws = XLSX.utils.json_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    XLSX.writeFile(wb, "analyza_zakazniku_a_materialu.xlsx");
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <FileDown size={18} />
          Exportovat do Excelu
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedData).map(([zakaznik, materials]) => (
          <Card key={zakaznik} className="bg-wh-card border-wh-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-wh-text-primary">{zakaznik}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-wh-border">
                  <thead className="bg-slate-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-wh-text-secondary uppercase tracking-wider">
                        Materiál
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-wh-text-secondary uppercase tracking-wider">
                        Celkové Množství
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-wh-card divide-y divide-wh-border">
                    {materials.map((item, index) => (
                      <tr key={`${item.material}-${index}`} className="hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-wh-text-primary">
                          {item.material}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-wh-text-secondary">
                          {new Intl.NumberFormat('cs-CZ').format(item.celkove_mnozstvi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Hlavní komponenta záložky
const CustomerMaterialTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/analytics/customer-materials');
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
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="ml-4 text-lg text-wh-text-secondary">Načítám analýzu...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-red-900/20 border border-red-700 rounded-lg p-6">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <p className="mt-4 text-lg text-red-400">Chyba při načítání dat</p>
          <p className="mt-2 text-sm text-wh-text-secondary text-center">
            Detail: {error}
          </p>
          <p className="mt-2 text-sm text-wh-text-secondary text-center">
            Ujistěte se, že je správně nastavena databázová funkce `get_customer_material_summary` (Krok 1)
            a proměnná `SUPABASE_SERVICE_ROLE_KEY` v `.env.local` (Krok 2).
          </p>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-wh-text-secondary">Nenalezena žádná data pro analýzu.</p>
        </div>
      );
    }

    return <AnalysisTable data={data} />;
  };

  return (
    <div className="h-full">
      <h1 className="text-3xl font-bold text-wh-text-primary mb-6">
        Analýza: Nejčastější materiály podle zákazníka
      </h1>
      {renderContent()}
    </div>
  );
};

export default CustomerMaterialTab;