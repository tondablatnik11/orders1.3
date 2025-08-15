// src/components/tabs/ErrorMonitorTab.jsx
"use client";
import React, { useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/hooks/useData';
import { Card, Title, Button, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { RefreshCw, UploadCloud, PackageX, List, AlertTriangle, Filter, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine } from 'recharts';

// Dynamický import původních grafů
const ErrorMonitorCharts = dynamic(() => import('../charts/ErrorMonitorCharts'), {
    ssr: false,
    loading: () => <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="h-96 bg-slate-800 rounded-lg animate-pulse"></div><div className="h-96 bg-slate-800 rounded-lg animate-pulse"></div></div>
});

// Komponenta pro zobrazení rizikové analýzy
const RiskAnalysisCard = ({ analysis }) => {
    if (!analysis || (!analysis.topRiskyMaterials?.length && !analysis.topRiskyOrders?.length)) return null;
    return (
        <Card className="bg-amber-900/20 border border-amber-700">
            <Title className="flex items-center gap-2 text-amber-400"><AlertTriangle className="w-5 h-5" />Prediktivní Analýza Rizik</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                    <Text className="font-semibold text-slate-300">Top 5 rizikových materiálů</Text>
                    <ul className="list-disc pl-5 mt-2 text-slate-400 text-sm">
                        {(analysis.topRiskyMaterials || []).map(item => <li key={item.name}>{item.name} ({item['Počet chyb']} chyb)</li>)}
                    </ul>
                </div>
                <div>
                    <Text className="font-semibold text-slate-300">Top 5 rizikových zakázek</Text>
                     <ul className="list-disc pl-5 mt-2 text-slate-400 text-sm">
                        {(analysis.topRiskyOrders || []).map(item => <li key={item.name}>{item.name} ({item['Počet chyb']} chyb)</li>)}
                    </ul>
                </div>
            </div>
        </Card>
    );
};

// Komponenta pro nový graf chyb v čase
const ErrorsOverTimeChart = ({ data, timeRange }) => {
    // Zde můžeme data dále filtrovat podle timeRange (day, week, month) - pro jednoduchost nyní zobrazujeme vše
    const last30Days = data.slice(-30); // Příklad zobrazení posledních 30 dnů

    return (
        <Card>
             <Title className="flex items-center gap-2"><Calendar className="w-5 h-5" />Chybovost v čase (posledních 30 záznamů)</Title>
             <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last30Days} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937' }}/>
                    <Legend />
                    <Line type="monotone" dataKey="Počet chyb" stroke="#ef4444" strokeWidth={2} name="Počet chyb" />
                    <Line type="monotone" dataKey="30-denní průměr" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="30-denní průměr" />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};


export default function ErrorMonitorTab() {
    const { errorData, isLoadingErrorData, refetchErrorData, handleErrorLogUpload } = useData();
    const fileInputRef = useRef(null);
    const [filters, setFilters] = useState({
        description: '', material: '', error_location: '', order_refence: '', user: ''
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredErrors = useMemo(() => {
        if (!errorData?.detailedErrors) return [];
        return errorData.detailedErrors.filter(error => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                return String(error[key] || '').toLowerCase().includes(value.toLowerCase());
            });
        });
    }, [errorData, filters]);

    const formatErrorTypeForDisplay = (description) => {
        // ... (tato funkce zůstává beze změny)
    };

    return (
        <div className="p-0 md:p-4 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Analýza Chyb Skenování</h1>
                <div className='flex items-center gap-2'>
                    <Button onClick={() => fileInputRef.current?.click()} icon={UploadCloud} variant="primary">Nahrát Report</Button>
                    <Button onClick={refetchErrorData} loading={isLoadingErrorData} icon={RefreshCw} variant="secondary">Aktualizovat</Button>
                    <input type="file" ref={fileInputRef} onChange={(e) => handleErrorLogUpload(e.target.files[0])} className="hidden" accept=".xlsx, .xls" />
                </div>
            </div>

            {isLoadingErrorData ? (
                <div className="flex justify-center items-center h-96">
                    <RefreshCw className="w-10 h-10 text-gray-400 animate-spin" />
                </div>
            ) : errorData && errorData.detailedErrors.length > 0 ? (
                <>
                    <RiskAnalysisCard analysis={errorData.riskAnalysis} />

                    <ErrorsOverTimeChart data={errorData.timeSeriesData} />
                    
                    <ErrorMonitorCharts chartsData={errorData.chartsData} />
                    
                    <Card className="mt-6">
                        <Title className="flex items-center gap-2"><List className="w-5 h-5" />Detailní Seznam Chyb</Title>
                        
                        {/* NOVÉ: Filtrovací pole */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 my-4 p-4 border border-slate-700 rounded-lg">
                            <input name="description" value={filters.description} onChange={handleFilterChange} placeholder="Filtrovat typ chyby..." className="bg-slate-800 p-2 rounded text-sm" />
                            <input name="material" value={filters.material} onChange={handleFilterChange} placeholder="Filtrovat materiál..." className="bg-slate-800 p-2 rounded text-sm" />
                            <input name="error_location" value={filters.error_location} onChange={handleFilterChange} placeholder="Filtrovat pozici..." className="bg-slate-800 p-2 rounded text-sm" />
                            <input name="order_refence" value={filters.order_refence} onChange={handleFilterChange} placeholder="Filtrovat zakázku..." className="bg-slate-800 p-2 rounded text-sm" />
                            <input name="user" value={filters.user} onChange={handleFilterChange} placeholder="Filtrovat uživatele..." className="bg-slate-800 p-2 rounded text-sm" />
                        </div>
                        
                        <div className="overflow-x-auto">
                            <Table className="mt-5 min-w-full">
                                <TableHead>
                                    <TableRow>
                                        <TableHeaderCell>Timestamp</TableHeaderCell>
                                        <TableHeaderCell>Typ chyby</TableHeaderCell>
                                        <TableHeaderCell>Pozice</TableHeaderCell>
                                        <TableHeaderCell>Materiál</TableHeaderCell>
                                        <TableHeaderCell>Zakázka</TableHeaderCell>
                                        <TableHeaderCell>Rozdíl</TableHeaderCell>
                                        <TableHeaderCell>Uživatel</TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredErrors.map((error, index) => (
                                        <TableRow key={error.unique_key || index}>
                                            <TableCell>{new Date(error.timestamp).toLocaleString('cs-CZ')}</TableCell>
                                            <TableCell><Text>{formatErrorTypeForDisplay(error.description)}</Text></TableCell>
                                            <TableCell>{error.error_location}</TableCell>
                                            <TableCell>{error.material}</TableCell>
                                            <TableCell>{error.order_refence}</TableCell>
                                            <TableCell>{error.diff_qty}</TableCell>
                                            <TableCell>{error.user}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </>
            ) : (
                <div className="flex items-center justify-center h-[60vh] text-center">
                    <div className="space-y-2">
                        <PackageX className="mx-auto h-12 w-12 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-200">Žádná data k zobrazení</h3>
                        <Text className="text-gray-400">Zkuste nahrát report chyb pro zobrazení analýzy.</Text>
                    </div>
                </div>
            )}
        </div>
    );
};