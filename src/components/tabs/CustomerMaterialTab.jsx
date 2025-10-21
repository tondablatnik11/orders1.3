// src/components/tabs/CustomerMaterialTab.jsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertTriangle, FileDown, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import StockPositionModal from '@/components/modals/StockPositionModal';
import * as XLSX from 'xlsx';

// Stavové komponenty (bez změny)
const LoadingState = () => (
 <div className="flex items-center justify-center h-full">
    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
    <p className="ml-4 text-lg text-wh-text-secondary">Načítám analýzu...</p>
  </div>
);
const ErrorState = ({ error }) => (
 <div className="flex flex-col items-center justify-center h-64 bg-red-900/20 border border-red-700 rounded-lg p-6">
    <AlertTriangle className="w-12 h-12 text-red-500" />
    <p className="mt-4 text-lg text-red-400">Chyba při načítání dat</p>
    <p className="mt-2 text-sm text-wh-text-secondary text-center">
      Detail: {error}
    </p>
  </div>
);
const EmptyState = () => (
 <div className="flex items-center justify-center h-64">
    <p className="text-lg text-wh-text-secondary">Nenalezena žádná data pro analýzu.</p>
    <p className="text-sm text-wh-text-secondary ml-2">(Ověřte, že máte v DB data ze stejného období pro zakázky i picking).</p>
  </div>
);

/**
 * Komponenta "Detail" - Zjednodušené zobrazení v UI
 */
const CustomerMaterialTable = ({ customerName, data, onExport, onMaterialClick }) => {
  return (
    <Card className="bg-wh-card border-wh-border shadow-lg h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl text-wh-text-primary">{customerName}</CardTitle>
        <button
          onClick={() => onExport(customerName, data)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
          disabled={!data || data.length === 0}
        >
          <FileDown size={16} />
          Exportovat (vč. pozic)
        </button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="overflow-auto h-full pr-2">
          <table className="min-w-full divide-y divide-wh-border">
            <thead className="bg-slate-800 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-wh-text-secondary uppercase tracking-wider">
                  Materiál
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-wh-text-secondary uppercase tracking-wider">
                  Celk. Objednané Množství
                </th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-wh-text-secondary uppercase tracking-wider">
                  Počet Pozic
                </th>
              </tr>
            </thead>
            <tbody className="bg-wh-card divide-y divide-wh-border">
              {data.map((item, index) => (
                <tr key={`${item.material}-${index}`} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onMaterialClick(item.material)}
                      className="text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                      title={`Zobrazit detailní pozice (LT10) pro ${item.material}`}
                    >
                      {item.material}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-wh-text-secondary font-mono">
                    {new Intl.NumberFormat('cs-CZ').format(item.celkove_mnozstvi)}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {Array.isArray(item.pozice_data) ? item.pozice_data.length : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};


/**
 * Hlavní komponenta záložky
 */
const CustomerMaterialTab = ({/* ... props ... */}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/analytics/customer-materials');
        if (!response.ok) { /* ... error handling ... */ }
        const result = await response.json();
        setData(result);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // uniqueCustomers a filteredCustomers (bez změny)
  const uniqueCustomers = useMemo(() => {
    if (!data) return [];
    const customerSet = new Set(data.map(item => item.zakaznik || 'Neznámý zákazník'));
    const allCustomers = Array.from(customerSet);
    const prioritized = [];
    if (allCustomers.includes('DAIMLER (Group)')) prioritized.push('DAIMLER (Group)');
    if (allCustomers.includes('VOLVO (Group)')) prioritized.push('VOLVO (Group)');
    const otherCustomers = allCustomers
      .filter(c => c !== 'DAIMLER (Group)' && c !== 'VOLVO (Group)')
      .sort();
    return [...prioritized, ...otherCustomers];
  }, [data]);

  const filteredCustomers = useMemo(() => {
    return uniqueCustomers.filter(customer =>
      customer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueCustomers, searchTerm]);

  const selectedCustomerData = useMemo(() => {
    if (!data || !selectedCustomer) return [];
    return data
      .filter(item => (item.zakaznik || 'Neznámý zákazník') === selectedCustomer)
      .sort((a, b) => b.celkove_mnozstvi - a.celkove_mnozstvi);
  }, [data, selectedCustomer]);

  // ===================================================================
  // ZDE JE FINÁLNÍ OPRAVA EXPORTU
  // ===================================================================
  /**
   * Generuje Excel soubor s detailním rozpisem pozic a místem pro diference.
   */
  const handleExport = (customerName, customerData) => {
    if (!customerData || customerData.length === 0) return;

    try {
      // 1. Najdeme maximální počet pozic pro správné generování sloupců
      let maxBins = 0;
      customerData.forEach(item => {
        if (Array.isArray(item.pozice_data) && item.pozice_data.length > maxBins) {
          maxBins = item.pozice_data.length;
        }
      });

      // 2. Vytvoříme hlavičky dynamicky
      const headers = ["Material", "Celk. Objednané Množství"];
      const colWidths = [{ wch: 20 }, { wch: 25 }]; // Šířky pro první dva sloupce
      for (let i = 1; i <= maxBins; i++) {
        headers.push(`Bin ${i}`);          // Hlavička pro pozici
        headers.push(`Množství ${i}`);    // Hlavička pro množství na pozici
        headers.push(`Diference ${i}`);   // Hlavička pro rozdíl
        colWidths.push({ wch: 15 }); // Šířka Bin
        colWidths.push({ wch: 10 }); // Šířka Množství
        colWidths.push({ wch: 10 }); // Šířka Diference
      }

      // 3. Připravíme data řádek po řádku
      const ws_data = customerData.map(item => {
        // Základní informace o materiálu
        const rowData = {
          Material: item.material,
          "Celk. Objednané Množství": item.celkove_mnozstvi,
        };

        // Dynamicky přidáme sloupce pro každou pozici
        if (Array.isArray(item.pozice_data)) {
          item.pozice_data.forEach((pos, index) => {
            const i = index + 1; // Číslování sloupců od 1
            if (i <= maxBins) { // Jen do maximálního počtu sloupců
              rowData[`Bin ${i}`] = pos.bin;
              rowData[`Množství ${i}`] = pos.qty;
              rowData[`Diference ${i}`] = ''; // Prázdné místo pro zápis
            }
          });
        }
        return rowData;
      });

      // 4. Vytvoříme Excel worksheet a workbook
      const ws = XLSX.utils.json_to_sheet([]); // Začneme s prázdným listem

      // Manuálně přidáme hlavičky
      XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });

      // Přidáme data pod hlavičky
      XLSX.utils.sheet_add_json(ws, ws_data, { origin: 'A2', skipHeader: true });

      ws['!cols'] = colWidths; // Nastavíme šířky sloupců

      const wb = XLSX.utils.book_new();
      const sheetName = customerName.replace(/[\*:\/\\?\s\[\]]/g, '').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // 5. Stáhneme soubor
      XLSX.writeFile(wb, `analyza_materialu_${sheetName}_s_pozicemi_a_diferencemi.xlsx`);

    } catch (exportError) {
      console.error("Chyba při exportu do Excelu:", exportError);
      // Zde můžete přidat toast notifikaci
    }
  };
  // ===================================================================

  const handleMaterialClick = (materialCode) => {
    setSelectedMaterial(materialCode);
    setIsModalOpen(true);
  };

  // Renderovací logika (bez změny)
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data || data.length === 0) return <EmptyState />;

  return (
     <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold text-wh-text-primary mb-6">
        Analýza: Nejčastější materiály podle zákazníka
      </h1>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100%-5rem)]">
        <div className="md:col-span-1 bg-wh-card border border-wh-border rounded-lg p-4 flex flex-col h-full">
          <h2 className="text-lg font-semibold text-wh-text-primary mb-4">
            Zákazníci ({filteredCustomers.length})
          </h2>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Hledat zákazníka..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-lg bg-slate-800 border border-wh-border text-wh-text-primary focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-wh-text-secondary" />
            {searchTerm && ( <button onClick={() => setSearchTerm('')} /* ... */ > <X/> </button> )}
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            <ul className="space-y-2">
              {filteredCustomers.map(customer => (
                <li key={customer}>
                  <button onClick={() => setSelectedCustomer(customer)} /* ... classes ... */ >
                    {(customer.includes('(Group)')) ? ( <span className="font-bold text-yellow-400">{customer}</span> ) : ( customer )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="md:col-span-3 h-full">
          {selectedCustomer ? (
            <CustomerMaterialTable
              customerName={selectedCustomer}
              data={selectedCustomerData}
              onExport={handleExport}
              onMaterialClick={handleMaterialClick}
            />
          ) : ( <div /* ... placeholder ... */ > Vyberte zákazníka... </div> )}
        </div>
      </div>
      {isModalOpen && ( <StockPositionModal materialCode={selectedMaterial} onClose={() => setIsModalOpen(false)} /> )}
    </div>
  );
};

export default CustomerMaterialTab;