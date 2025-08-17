"use client";
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Upload, BarChart, Users, Package, Search, Layout3d, PieChart } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { createWarehouseSnapshot, calculateDetailedKPIs, parseStockFile } from '../../lib/warehouseProcessor';

import { Warehouse3DViewTab } from './warehouse/Warehouse3DViewTab';
import { WarehouseAnalyticsTab } from './warehouse/WarehouseAnalyticsTab';

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
    const [labels, setLabels] = useState([]);
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics'); // Začínáme na analytice
    const fileInputRef = React.useRef(null);

    const loadInitialData = useCallback(async (stockData = null) => {
        if (!warehouseLayout) return;
        try {
            const { grid, dimensions, labels } = createWarehouseSnapshot(warehouseLayout, stockData);
            setGridData(grid);
            setDimensions(dimensions);
            setLabels(labels);
            setKpis(calculateDetailedKPIs(grid));
        } catch (error) {
            toast.error(`Chyba při zpracování dat: ${error.message}`);
        }
    }, [warehouseLayout]);
    
    useEffect(() => {
        const loadLayout = async () => {
            setLoading(true);
            try {
                const response = await fetch('/data/warehouse-layout.json');
                if (!response.ok) throw new Error('Nepodařilo se načíst soubor s layoutem skladu.');
                const layoutData = await response.json();
                setWarehouseLayout(layoutData);
            } catch (error) {
                toast.error(`Chyba při načítání layoutu: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        loadLayout();
    }, []);

    useEffect(() => {
        if (warehouseLayout) {
            loadInitialData(null); // Načteme prázdný layout po načtení JSON
        }
    }, [warehouseLayout, loadInitialData]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file && warehouseLayout) {
            const toastId = toast.loading('Zpracovávám soubor LT10...');
            try {
                const stockData = await parseStockFile(file);
                await loadInitialData(stockData);
                toast.success('Stav skladu byl úspěšně aktualizován!', { id: toastId });
            } catch (error) {
                toast.error(`Chyba při zpracování souboru: ${error.message}`, { id: toastId });
            }
        }
        if(event.target) event.target.value = null;
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full">Načítám layout skladu...</div>;
    }
    
    return (
        <>
            <Toaster position="bottom-right" toastOptions={{ className: 'bg-card text-foreground border border-border' }} />
            <div className="h-full w-full flex flex-col gap-4">
                {/* Horní lišta s KPI a nahráváním souboru */}
                <div className="bg-card rounded-xl shadow-lg p-4 flex flex-col xl:flex-row items-center gap-4 border border-border">
                    <div className="grid gap-4 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 flex-grow">
                         {kpis?.overall ? (
                            <>
                                <KpiCard title="Celková Obsazenost" value={`${kpis.overall.occupancyRate}%`} subtext={`${kpis.overall.occupiedBins} / ${kpis.overall.totalBins} pozic`} icon={BarChart} />
                                <KpiCard title="Počet Palet (SU)" value={kpis.overall.totalPallets} subtext="Unikátních skladových jednotek" icon={Users} />
                                <KpiCard title="Unikátní Materiály (SKU)" value={kpis.overall.uniqueSKUs} subtext="Různých typů materiálu" icon={Package} />
                            </>
                        ) : (
                             Array(3).fill(0).map((_, i) => <div key={i} className="bg-background h-24 rounded-lg animate-pulse"></div>)
                        )}
                    </div>
                     <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-2 pt-4 xl:pt-0 border-t xl:border-t-0 xl:border-l border-border xl:pl-4 mt-4 xl:mt-0">
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden"/>
                         <button onClick={() => fileInputRef.current.click()} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-lg hover:bg-opacity-80 transition-all">
                             <Upload size={20} />
                             Nahrát LT10 Report
                         </button>
                         {/* Přepínač záložek */}
                         <div className="flex w-full sm:w-auto bg-background rounded-lg p-1 border border-border">
                             <button onClick={() => setActiveTab('analytics')} className={`flex-1 sm:flex-auto px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:bg-card/50'}`}><PieChart className="inline h-4 w-4 mr-2"/>Analytika</button>
                             <button onClick={() => setActiveTab('3d_view')} className={`flex-1 sm:flex-auto px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === '3d_view' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:bg-card/50'}`}><Layout3d className="inline h-4 w-4 mr-2"/>3D Pohled</button>
                         </div>
                     </div>
                </div>

                {/* Kontejner pro aktivní záložku */}
                <div className="flex-grow w-full h-full rounded-lg overflow-hidden relative min-h-0 bg-card border border-border shadow-lg">
                    <Suspense fallback={<div className="flex justify-center items-center h-full">Načítám zobrazení...</div>}>
                        {activeTab === 'analytics' && <WarehouseAnalyticsTab kpis={kpis} isLoading={!kpis} />}
                        {activeTab === '3d_view' && <Warehouse3DViewTab gridData={gridData} dimensions={dimensions} labels={labels} />}
                    </Suspense>
                </div>
            </div>
        </>
    );
};
export default WarehouseOverviewTab;