// src/components/tabs/WarehouseOverviewTab.jsx
"use client";
import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Papa from 'papaparse';
import { Warehouse3DMap } from '../charts/Warehouse3DMap';
import { createWarehouseSnapshot, parseStockFile, calculateKPIs } from '../../lib/warehouseProcessor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart, Users, Archive, Package, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

// Detailní modální okno (beze změny)
const BinDetailModal = ({ data, onClose }) => {
    if (!data) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">Detail Pozice: {data.address}</h2>
                <div className="space-y-2">
                    <p><strong>Status:</strong> {data.status === 'occupied' ? 'Obsazeno' : 'Volno'}</p>
                    {data.stockData && data.stockData.map((item, index) => (
                        <div key={index} className="border-t pt-2 mt-2">
                            <p><strong>Paleta (SU):</strong> {item['Storage Unit']}</p>
                            <p><strong>Materiál:</strong> {item.Material}</p>
                            <p><strong>Množství:</strong> {item['Available stock']} {item['Base Unit of Measure']}</p>
                            <p><strong>Stáří (dny):</strong> {item['Durat.']}</p>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    Zavřít
                </button>
            </div>
        </div>
    );
};


const WarehouseOverviewTab = () => {
    const [warehouseLayout, setWarehouseLayout] = useState(null);
    const [gridData, setGridData] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBin, setSelectedBin] = useState(null);
    const fileInputRef = useRef(null);

    // Krok 1: Načtení statického layoutu skladu (pouze jednou)
    useEffect(() => {
        const loadLayout = async () => {
            try {
                toast.loading('Načítám layout skladu...', { id: 'layout_load' });
                const response = await fetch('/data/Regalplaetze.csv');
                if (!response.ok) throw new Error('Nepodařilo se načíst soubor s layoutem skladu.');
                
                const csvText = await response.text();
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        setWarehouseLayout(results.data);
                        // Zobrazit prázdný sklad
                        const emptySnapshot = createWarehouseSnapshot(results.data, null);
                        setGridData(emptySnapshot);
                        setKpis(calculateKPIs(emptySnapshot));
                        setLoading(false);
                        toast.success('Layout skladu načten. Nahrajte soubor LT10 pro zobrazení zásob.', { id: 'layout_load' });
                    }
                });
            } catch (error) {
                setLoading(false);
                toast.error(`Chyba při načítání layoutu: ${error.message}`, { id: 'layout_load' });
            }
        };
        loadLayout();
    }, []);

    // Krok 2: Zpracování nahraného souboru LT10
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file && warehouseLayout) {
            try {
                toast.loading('Zpracovávám soubor LT10...', { id: 'stock_load' });
                const stockData = await parseStockFile(file);
                const snapshot = createWarehouseSnapshot(warehouseLayout, stockData);
                setGridData(snapshot);
                setKpis(calculateKPIs(snapshot));
                toast.success('Stav skladu byl úspěšně aktualizován!', { id: 'stock_load' });
            } catch (error) {
                toast.error(`Chyba při zpracování souboru: ${error.message}`, { id: 'stock_load' });
            }
        }
    };
    
    const filteredGrid = useMemo(() => {
        if (!gridData) return [];
        const gridArray = Array.from(gridData.values());

        if (!searchTerm.trim()) return gridArray;

        const lowerCaseSearch = searchTerm.toLowerCase();
        if (lowerCaseSearch === 'empty' || lowerCaseSearch === 'volné') {
            return gridArray.filter(bin => bin.status === 'empty');
        }

        return gridArray.filter(bin => 
            bin.stockData && bin.stockData.some(item =>
                String(item.Material)?.toLowerCase().includes(lowerCaseSearch) ||
                String(item['Storage Unit'])?.toLowerCase().includes(lowerCaseSearch)
            )
        );
    }, [gridData, searchTerm]);

    if (loading) {
        return <div className="flex justify-center items-center h-full">Načítám layout skladu...</div>;
    }

    return (
        <div className="p-4 h-full flex flex-col gap-4 bg-gray-50">
            {kpis && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* KPI Karty */}
              </div>
            )}
            
            <div className="flex-grow flex flex-col gap-4">
                <div className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row items-center gap-4">
                    <input
                        type="text"
                        placeholder="Hledat materiál, paletu (SU) nebo 'empty'..."
                        className="w-full md:w-1/3 p-2 border rounded-md focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden"/>
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Upload size={20} />
                        Nahrát LT10 Report
                    </button>
                </div>

                <div className="flex-grow w-full h-full min-h-[600px] rounded-lg overflow-hidden shadow-lg">
                    <Suspense fallback={<div>Načítám 3D model...</div>}>
                        <Warehouse3DMap
                            data={Array.from(gridData.values())}
                            filteredIds={new Set(filteredGrid.map(bin => bin.id))}
                            onBinClick={(bin) => setSelectedBin(bin)}
                        />
                    </Suspense>
                </div>
            </div>
            
            <BinDetailModal data={selectedBin} onClose={() => setSelectedBin(null)} />
        </div>
    );
};

export default WarehouseOverviewTab;