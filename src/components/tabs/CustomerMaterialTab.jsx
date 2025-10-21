// src/components/tabs/CustomerMaterialTab.jsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertTriangle, FileDown, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import StockPositionModal from '@/components/modals/StockPositionModal';
import * as XLSX from 'xlsx';

// Stav 1: Načítání
const LoadingState = () => (
  // ... (bez zmeny)
  <div className="flex items-center justify-center h-full">
    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
    <p className="ml-4 text-lg text-wh-text-secondary">Načítám analýzu...</p>
  </div>
);

// Stav 2: Chyba
const ErrorState = ({ error }) => (
  // ... (bez zmeny)
   <div className="flex flex-col items-center justify-center h-64 bg-red-900/20 border border-red-700 rounded-lg p-6">
    <AlertTriangle className="w-12 h-12 text-red-500" />
    <p className="mt-4 text-lg text-red-400">Chyba při načítání dat</p>
    <p className="mt-2 text-sm text-wh-text-secondary text-center">
      Detail: {error}
    </p>
  </div>
);

// Stav 3: Žádná data
const EmptyState = () => (
  // ... (bez zmeny)
   <div className="flex items-center justify-center h-64">
    <p className="text-lg text-wh-text-secondary">Nenalezena žádná data pro analýzu.</p>
    <p className="text-sm text-wh-text-secondary ml-2">(Ověřte, že máte v DB data ze stejného období pro zakázky i picking).</p>
  </div>
);

/**
 * Komponenta "Detail" - OPRAVENÁ
 * Zobrazuje tabulku materiálů pro vybraného zákazníka.
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
          Exportovat
        </button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
         {/* Pridané overflow-x-auto pre prípad veľmi dlhých reťazcov pozícií */}
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
                {/* =================================================================== */}
                {/* TOTO CHÝBALO: Hlavička pre nový stĺpec */}
                {/* =================================================================== */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-wh-text-secondary uppercase tracking-wider">
                  Pozice ve Skladu (Bin (ks))
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
                  {/* =================================================================== */}
                  {/* TOTO CHÝBALO: Bunka pre nový stĺpec */}
                  {/* =================================================================== */}
                   <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                    {/* Zobrazíme info o pozíciách, ktoré prišlo z API */}
                    {item.pozice_info}
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
const CustomerMaterialTab = ({/* ... props ... */}) => { // Pridal som ({/* ... props ... */}) pre prehľadnosť, nemusíte meniť
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
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Chyba ${response.status}`);
        }
        const result = await response.json();
        // Overenie, či dáta obsahujú nové pole (len pre ladenie, môžete odstrániť)
        // console.log("Fetched data sample:", result.length > 0 ? result[0] : 'No data'); 
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const uniqueCustomers = useMemo(() => {
    if (!data) return [];
    
    const customerSet = new Set(data.map(item => item.zakaznik || 'Neznámý zákazník'));
    const allCustomers = Array.from(customerSet);

    // Prioritizace skupin
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

  /**
   * AKTUALIZOVANÁ FUNKCE EXPORTU
   */
  const handleExport = (customerName, customerData) => {
    if (!customerData || customerData.length === 0) {
      console.warn("Žádná data k exportu.");
      return; 
    }
    try {
      const ws_data = customerData.map(item => ({
        Material: item.material,
        "Celkové Objednané Množství": item.celkove_mnozstvi,
        "Pozice ve Skladu (Bin (ks))": item.pozice_info, 
      }));

      const ws = XLSX.utils.json_to_sheet(ws_data);

      ws['!cols'] = [
        { wch: 20 }, 
        { wch: 25 }, 
        { wch: 60 }  
      ];

      const wb = XLSX.utils.book_new();
      
      const sheetName = customerName.replace(/[\*:\/\\?\s\[\]]/g, '').substring(0, 31);
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `analyza_materialu_${sheetName}.xlsx`);

    } catch (exportError) {
      console.error("Chyba při exportu do Excelu:", exportError);
    }
  };
  
  const handleMaterialClick = (materialCode) => {
    setSelectedMaterial(materialCode);
    setIsModalOpen(true);
  };

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
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-700"
                title="Vymazat hledání"
              >
                <X className="w-4 h-4 text-wh-text-secondary hover:text-white" />
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <ul className="space-y-2">
              {filteredCustomers.map(customer => (
                <li key={customer}>
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors duration-150 truncate ${
                      selectedCustomer === customer
                        ? 'bg-sky-600 text-white font-semibold shadow-md'
                        : 'bg-slate-700/50 hover:bg-slate-700 text-wh-text-secondary hover:text-wh-text-primary'
                    }`}
                    title={customer}
                  >
                    {(customer.includes('(Group)')) ? (
                      <span className="font-bold text-yellow-400">{customer}</span>
                    ) : (
                      customer
                    )}
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
          ) : (
            <div className="flex items-center justify-center h-full bg-wh-card border-2 border-dashed border-wh-border rounded-lg">
              <p className="text-lg text-wh-text-secondary">
                Vyberte zákazníka ze seznamu pro zobrazení detailů.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <StockPositionModal
          materialCode={selectedMaterial}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      
    </div>
  );
};

export default CustomerMaterialTab;