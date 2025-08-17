"use client";
import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Warehouse3DMap } from '../charts/Warehouse3DMap';
import { createWarehouseSnapshot, parseStockFile, calculateKPIs } from '../../lib/warehouseProcessor';
import { Upload, BarChart, Users, Package, Search } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const BinDetailModal = ({ data, onClose }) => {
    if (!data) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeInUp" onClick={onClose}>
            <div className="bg-wh-card text-wh-text-primary p-6 rounded-xl shadow-2xl max-w-lg w-full border border-wh-border" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-wh-brand-blue">Detail Pozice: {data.address}</h2>
                <div className="space-y-3">
                    <p className="bg-wh-bg p-2 rounded-md"><strong>Status:</strong> <span className={data.status === 'occupied' ? 'text-red-400' : 'text-green-400'}>{data.status === 'occupied' ? 'Obsazeno' : 'Volno'}</span></p>
                    {data.stockData && data.stockData.map((item, index) => (
                        <div key={index} className="border-t border-wh-border pt-3 mt-3">
                            <p><strong>Paleta (SU):</strong> {item['Storage Unit']}</p>
                            <p><strong>Materiál:</strong> {item.Material}</p>
                            <p><strong>Množství:</strong> {item['Available stock']} {item['Base Unit of Measure']}</p>
                            <p><strong>Stáří (dny):</strong> {item['Durat.']}</p>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-wh-brand-blue text-white font-semibold py-2 rounded-lg hover:bg-opacity-80 transition-all">
                    Zavřít
                </button>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, subtext, icon: Icon }) => (
    <div className="bg-card p-4 rounded-xl shadow-lg border border-border flex items-center gap-4 animate-fadeInUp transition-transform hover:scale-105">
        <div className="bg-background p-3 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{subtext}</p>
        </div>
    </div>
);

const WarehouseOverviewTab = () => {
    const [warehouseLayout, setWarehouseLayout] = useState(null);
    const [gridData, setGridData] = useState(null);
    const [dimensions, setDimensions] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBin, setSelectedBin] = useState(null);
    const fileInputRef = useRef(null);
    const [focusedPosition, setFocusedPosition] = useState(null);

    useEffect(() => {
        const loadLayout = async () => {
            try {
                const response = await fetch('/data/warehouse-layout.json');
                if (!response.ok) throw new Error('Nepodařilo se načíst soubor s layoutem skladu (warehouse-layout.json).');
                const layoutData = await response.json();
                setWarehouseLayout(layoutData);
                const { grid, dimensions } = createWarehouseSnapshot(layoutData, null);
                setGridData(grid);
                setDimensions(dimensions);
                setKpis(calculateKPIs(grid));
            } catch (error) {
                toast.error(`Chyba při načítání layoutu: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        loadLayout();
    }, []);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file && warehouseLayout) {
            const toastId = toast.loading('Zpracovávám soubor LT10...');
            try {
                const stockData = await parseStockFile(file);
                const { grid, dimensions } = createWarehouseSnapshot(warehouseLayout, stockData);
                setGridData(grid);
                setDimensions(dimensions);
                setKpis(calculateKPIs(grid));
                toast.success('Stav skladu byl úspěšně aktualizován!', { id: toastId });
            } catch (error) {
                toast.error(`Chyba při zpracování souboru: ${error.message}`, { id: toastId });
            }
        }
        event.target.value = null;
    };
    
    const filteredGrid = useMemo(() => {
        if (!gridData) return [];
        const gridArray = Array.from(gridData.values());

        if (!searchTerm.trim()) {
            setFocusedPosition(null);
            return gridArray;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();
        
        const result = gridArray.filter(bin => {
            if (lowerCaseSearch === 'empty' || lowerCaseSearch === 'volné') {
                return bin.status === 'empty';
            }
            return (
                bin.address.toLowerCase().includes(lowerCaseSearch) ||
                (bin.stockData && bin.stockData.some(item =>
                    String(item.Material)?.toLowerCase().includes(lowerCaseSearch) ||
                    String(item['Storage Unit'])?.toLowerCase().includes(lowerCaseSearch)
                ))
            )
        });
        
        if (result.length === 1) {
            setFocusedPosition(result[0].position);
        } else {
            setFocusedPosition(null);
        }

        return result;
    }, [gridData, searchTerm]);

    if (loading) {
        return <div className="flex justify-center items-center h-full">Načítám layout skladu...</div>;
    }

    return (
        <>
            <Toaster position="bottom-right" toastOptions={{ className: 'bg-card text-foreground border border-border' }} />
            <div className="h-full w-full flex flex-col gap-4">
                {kpis && (
                    <div className="grid gap-4 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <KpiCard title="Obsazenost Skladu" value={`${kpis.occupancyRate}%`} subtext={`${kpis.occupiedBins} / ${kpis.totalBins} pozic`} icon={BarChart} />
                        <KpiCard title="Počet Palet (SU)" value={kpis.totalPallets} subtext="Unikátních skladových jednotek" icon={Users} />
                        <KpiCard title="Unikátní Materiály (SKU)" value={kpis.uniqueSKUs} subtext="Různých typů materiálu" icon={Package} />
                    </div>
                )}
                
                <div className="bg-card rounded-xl shadow-lg p-4 flex flex-col md:flex-row items-center gap-4 border border-border">
                    <div className="relative w-full md:flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Hledat pozici, materiál, paletu (SU) nebo 'empty'..."
                            className="w-full bg-background p-2 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden"/>
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-lg hover:bg-opacity-80 transition-all"
                    >
                        <Upload size={20} />
                        Nahrát LT10 Report
                    </button>
                </div>

                <div className="flex-grow w-full h-full rounded-lg overflow-hidden relative min-h-0">
                    <Suspense fallback={<div className="flex justify-center items-center h-full">Načítám 3D model...</div>}>
                        {gridData && 
                            <Warehouse3DMap
                                data={Array.from(gridData.values())}
                                filteredIds={new Set(filteredGrid.map(bin => bin.id))}
                                onBinClick={(bin) => setSelectedBin(bin)}
                                dimensions={dimensions}
                                focusedPosition={focusedPosition}
                            />
                        }
                    </Suspense>
                </div>
            </div>
            
            <BinDetailModal data={selectedBin} onClose={() => setSelectedBin(null)} />
        </>
    );
};

export default WarehouseOverviewTab;