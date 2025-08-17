// src/components/tabs/WarehouseKpiTab.jsx
"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createWarehouseSnapshot, parseStockFile, calculateDetailedKPIs } from '@/lib/warehouseProcessor';
import { Upload, BarChart, Layers } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Komponenta pro zobrazení statistik ---
const KpiDisplay = ({ title, data, icon: Icon }) => {
    const chartData = {
        labels: data.map(d => d.name),
        datasets: [{
            label: 'Obsazenost (%)',
            data: data.map(d => parseFloat(d.occupancy)),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
        }]
    };

    return (
        <div className="bg-card p-4 rounded-xl shadow-lg border border-border animate-fadeInUp">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                <Icon className="text-primary" />
                {title}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-96">
                    <Bar data={chartData} options={{ maintainAspectRatio: false, indexAxis: 'y' }} />
                </div>
                <div className="overflow-auto max-h-96 scrollbar-thin">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-card">
                            <tr>
                                <th className="p-2">Jednotka</th>
                                <th className="p-2 text-right">Obsazeno</th>
                                <th className="p-2 text-right">Celkem</th>
                                <th className="p-2 text-right">Obsazenost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item.name} className="border-t border-border">
                                    <td className="p-2 font-semibold">{item.name}</td>
                                    <td className="p-2 text-right">{item.occupied}</td>
                                    <td className="p-2 text-right">{item.total}</td>
                                    <td className="p-2 text-right font-bold">{item.occupancy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const WarehouseKpiTab = () => {
    const [warehouseLayout, setWarehouseLayout] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadLayout = async () => {
            try {
                const response = await fetch('/data/warehouse-layout.json');
                if (!response.ok) throw new Error('Nepodařilo se načíst layout skladu.');
                const layoutData = await response.json();
                setWarehouseLayout(layoutData);
                // Zobrazit prázdný sklad
                const snapshot = createWarehouseSnapshot(layoutData, null);
                setKpis(calculateDetailedKPIs(snapshot));
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
            const toastId = toast.loading('Zpracovávám LT10 report...');
            try {
                const stockData = await parseStockFile(file);
                const snapshot = createWarehouseSnapshot(warehouseLayout, stockData);
                setKpis(calculateDetailedKPIs(snapshot));
                toast.success('Statistiky skladu aktualizovány!', { id: toastId });
            } catch (error) {
                toast.error(`Chyba při zpracování souboru: ${error.message}`, { id: toastId });
            }
        }
        event.target.value = null;
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-full">Načítám data...</div>;
    }

    return (
        <>
            <Toaster position="bottom-right" toastOptions={{ className: 'bg-card text-foreground border border-border' }} />
            <div className="h-full w-full flex flex-col gap-4">
                <div className="bg-card rounded-xl shadow-lg p-4 flex justify-end items-center gap-4 border border-border">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden"/>
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-lg hover:bg-opacity-80 transition-all"
                    >
                        <Upload size={20} />
                        Nahrát LT10 Report
                    </button>
                </div>

                {kpis ? (
                    <div className="flex-grow flex flex-col gap-4 overflow-y-auto scrollbar-thin">
                        <KpiDisplay title="Obsazenost podle Řad" data={kpis.occupancyByRow} icon={BarChart} />
                        <KpiDisplay title="Obsazenost podle Pater" data={kpis.occupancyByLevel} icon={Layers} />
                    </div>
                ) : (
                    <div className="flex-grow flex justify-center items-center bg-card rounded-xl">
                        <p className="text-muted-foreground">Pro zobrazení statistik nahrajte LT10 report.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default WarehouseKpiTab;