// src/components/tabs/WarehouseOverviewTab.jsx
"use client";
import React, { useState, Suspense } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { Card } from '@/components/ui/Card';
import { Button } from '@tremor/react';
import { UploadCloud, Package, Boxes, Warehouse, Clock, AlertOctagon, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import ErrorDetailModal from '../modals/ErrorDetailModal'; // Budeme chtít zobrazovat detaily
import Warehouse3DMap from '../charts/Warehouse3DMap'; // Import naší nové 3D komponenty

const KPICard = ({ title, value, icon: Icon }) => (
    <Card className="p-4">
        <div className="flex items-center">
            <Icon className="w-8 h-8 text-sky-400 mr-4" />
            <div>
                <p className="text-slate-400 text-sm">{title}</p>
                <p className="text-2xl font-bold text-white">{(value || 0).toLocaleString('cs-CZ')}</p>
            </div>
        </div>
    </Card>
);

const ChartCard = ({ title, children }) => (
    <Card className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
            {children}
        </ResponsiveContainer>
    </Card>
);

export default function WarehouseOverviewTab() {
    const { processedWarehouseData, handleWarehouseFileUpload, isLoadingWarehouseData } = useData();
    const { t } = useUI();
    const fileInputRef = React.useRef(null);
    const [selectedBin, setSelectedBin] = useState(null); // Stav pro zobrazení detailu pozice

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleWarehouseFileUpload(e.target.files[0]);
        }
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    if (isLoadingWarehouseData) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-lg text-slate-400">Načítání dat skladu...</p>
            </div>
        );
    }

    if (!processedWarehouseData) {
        return (
            <div className="text-center p-8">
                <p className="mb-4">Žádná data o skladu. Nahrajte prosím soubor s přehledem zásob.</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv, .xlsx, .xls" />
                <Button icon={UploadCloud} onClick={() => fileInputRef.current?.click()}>
                    Nahrát Report Skladu
                </Button>
            </div>
        );
    }
    
    const { kpis, charts, detailedStock } = processedWarehouseData;
    const COLORS = ["#3b82f6", "#16a34a", "#facc15", "#f97316", "#ef4444"];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <KPICard title="Celkem položek" value={kpis.totalStock} icon={Package} />
                <KPICard title="Obsazené pozice" value={kpis.occupiedBins} icon={Boxes} />
                <KPICard title="Unikátní materiály" value={kpis.uniqueMaterials} icon={Warehouse} />
                <KPICard title="Celkem palet" value={kpis.totalPallets} icon={Boxes} />
                <KPICard title="Staré zásoby (>180 dní)" value={kpis.deadStockCount} icon={AlertOctagon} />
            </div>

            {/* Nahrazení placeholderu za reálnou 3D mapu */}
            <Card className="p-6">
                <h3 className="text-2xl font-bold text-center text-white mb-4">Interaktivní 3D Mapa Skladu</h3>
                <Suspense fallback={<div className="h-[70vh] flex items-center justify-center">Načítání 3D modelu...</div>}>
                    <Warehouse3DMap stockData={detailedStock} onBinClick={setSelectedBin} />
                </Suspense>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Stáří zásob (počet palet)">
                    <BarChart data={charts.stockAgeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                        <Bar dataKey="Počet palet" fill="#3b82f6" />
                    </BarChart>
                </ChartCard>

                <ChartCard title="Rozložení zásob podle typu skladu">
                     <PieChart>
                        <Pie data={charts.stockDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {charts.stockDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                         <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                        <Legend />
                    </PieChart>
                </ChartCard>
            </div>

            <ChartCard title="TOP 10 Materiálů podle množství">
                <BarChart data={charts.top10Materials} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis type="number" stroke="#9CA3AF" />
                    <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                    <Bar dataKey="Celkové množství" fill="#16a34a" />
                </BarChart>
            </ChartCard>
            
            {/* Zobrazení modálního okna po kliknutí na pozici v 3D mapě */}
            {selectedBin && (
                 <ErrorDetailModal
                    error={{
                        description: `Detail pozice: ${selectedBin['Storage Bin']}`,
                        timestamp: selectedBin.receptionDate,
                        user: 'N/A',
                        error_location: selectedBin['Storage Bin'],
                        material: selectedBin.Material,
                        order_refence: `Paleta: ${selectedBin['Storage Unit']}`,
                        diff_qty: selectedBin['Available stock'],
                    }}
                    onClose={() => setSelectedBin(null)}
                />
            )}
        </div>
    );
}