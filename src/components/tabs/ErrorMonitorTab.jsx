// src/components/tabs/ErrorMonitorTab.jsx
"use client";
import React, { useRef, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/hooks/useData';
import { Card, Title, Button, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { RefreshCw, UploadCloud, PackageX, List, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ErrorDetailModal from '../modals/ErrorDetailModal';
import MaterialErrorsModal from '../modals/MaterialErrorsModal'; // Import nového modálu

const ErrorMonitorCharts = dynamic(() => import('../charts/ErrorMonitorCharts'), {
    ssr: false,
    loading: () => <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="h-96 bg-slate-800 rounded-lg animate-pulse"></div><div className="h-96 bg-slate-800 rounded-lg animate-pulse"></div></div>
});

const ErrorsOverTimeChart = ({ data, timeRange, setTimeRange }) => {
    const chartData = data[timeRange] || [];
    
    return (
        <Card>
             <div className="flex justify-between items-center">
                <Title className="flex items-center gap-2"><Calendar className="w-5 h-5" />Chybovost</Title>
                <div className="flex items-center gap-1 bg-slate-700/50 p-1 rounded-md">
                    <button onClick={() => setTimeRange('day')} className={`px-2 py-1 text-xs sm:text-sm rounded ${timeRange === 'day' ? 'bg-sky-600' : 'hover:bg-slate-600'}`}>Den</button>
                    <button onClick={() => setTimeRange('week')} className={`px-2 py-1 text-xs sm:text-sm rounded ${timeRange === 'week' ? 'bg-sky-600' : 'hover:bg-slate-600'}`}>Týden</button>
                    <button onClick={() => setTimeRange('month')} className={`px-2 py-1 text-xs sm:text-sm rounded ${timeRange === 'month' ? 'bg-sky-600' : 'hover:bg-slate-600'}`}>Měsíc</button>
                </div>
            </div>
             <ResponsiveContainer width="100%" height={300} className="mt-4">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937' }}/>
                    <Legend />
                    <Line type="monotone" dataKey="Počet chyb" stroke="#ef4444" strokeWidth={2} name="Počet chyb" />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default function ErrorMonitorTab() {
    const { errorData, isLoadingErrorData, refetchData, handleErrorLogUpload, allOrdersData, setSelectedOrderDetails } = useData();
    const fileInputRef = useRef(null);
    const [filters, setFilters] = useState({ description: '', material: '', error_location: '', order_refence: '', user: '' });
    const [selectedErrorForDetail, setSelectedErrorForDetail] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null); // <-- Nový stav pro materiál modál
    const [timeRange, setTimeRange] = useState('week');

    const handleBarClick = useCallback((payload) => {
        if (!payload) return;
        setFilters(prev => ({
            ...{ description: '', material: '', error_location: '', order_refence: '', user: '' },
            [payload.filterKey]: payload.value
        }));
    }, []);

    const handleOrderClick = useCallback((e, deliveryNo) => {
        e.stopPropagation();
        const orderDetails = allOrdersData.find(order => String(order['Delivery No']) === String(deliveryNo));
        if (orderDetails) {
            setSelectedOrderDetails(orderDetails);
        } else {
            toast.error(`Zakázka ${deliveryNo} nebyla nalezena.`);
        }
    }, [allOrdersData, setSelectedOrderDetails]);

    const handleMaterialClick = useCallback((e, material) => {
        e.stopPropagation();
        setSelectedMaterial(material);
    }, []);

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
        if (!description) return "Neznámý typ";
        const desc = description.toLowerCase();
        if (desc.includes('location empty')) return 'Prázdná lokace';
        if (desc.includes('skip position')) return 'Přeskočená pozice';
        if (desc.includes('serial number')) return 'Chyba sériového čísla';
        if (desc.includes('location short')) return 'Neúplná lokace';
        if (desc.includes('empty skid')) return 'Prázdná paleta';
        return description.charAt(0).toUpperCase() + description.slice(1);
    };

    return (
        <div className="p-0 md:p-4 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Analýza Chyb Skenování</h1>
                <div className='flex items-center gap-2'>
                    <Button onClick={() => fileInputRef.current?.click()} icon={UploadCloud} variant="primary">Nahrát Report</Button>
                    <Button onClick={refetchData} loading={isLoadingErrorData} icon={RefreshCw} variant="secondary">Aktualizovat</Button>
                    <input type="file" ref={fileInputRef} onChange={(e) => handleErrorLogUpload(e.target.files[0])} className="hidden" accept=".xlsx, .xls" />
                </div>
            </div>

            {isLoadingErrorData ? (
                <div className="flex justify-center items-center h-96"><RefreshCw className="w-10 h-10 text-gray-400 animate-spin" /></div>
            ) : errorData && errorData.detailedErrors.length > 0 ? (
                <>
                    <ErrorsOverTimeChart data={errorData.timeSeriesData} timeRange={timeRange} setTimeRange={setTimeRange} />
                    
                    <ErrorMonitorCharts chartsData={errorData.chartsData} onBarClick={handleBarClick} />
                    
                    <Card className="mt-6">
                        <Title className="flex items-center gap-2"><List className="w-5 h-5" />Detailní Seznam Chyb</Title>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 my-4 p-4 border border-slate-700 rounded-lg">
                             <input name="description" value={filters.description} onChange={(e) => setFilters(prev => ({...prev, description: e.target.value}))} placeholder="Filtrovat typ chyby..." className="bg-slate-800 p-2 rounded text-sm w-full" />
                            <input name="material" value={filters.material} onChange={(e) => setFilters(prev => ({...prev, material: e.target.value}))} placeholder="Filtrovat materiál..." className="bg-slate-800 p-2 rounded text-sm w-full" />
                            <input name="error_location" value={filters.error_location} onChange={(e) => setFilters(prev => ({...prev, error_location: e.target.value}))} placeholder="Filtrovat pozici..." className="bg-slate-800 p-2 rounded text-sm w-full" />
                            <input name="order_refence" value={filters.order_refence} onChange={(e) => setFilters(prev => ({...prev, order_refence: e.target.value}))} placeholder="Filtrovat zakázku..." className="bg-slate-800 p-2 rounded text-sm w-full" />
                            <input name="user" value={filters.user} onChange={(e) => setFilters(prev => ({...prev, user: e.target.value}))} placeholder="Filtrovat uživatele..." className="bg-slate-800 p-2 rounded text-sm w-full" />
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
                                        <TableHeaderCell>Uživatel</TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredErrors.map((error, index) => (
                                        <TableRow key={error.unique_key || index} onClick={() => setSelectedErrorForDetail(error)} className="cursor-pointer hover:bg-slate-700/50">
                                            <TableCell>{new Date(error.timestamp).toLocaleString('cs-CZ')}</TableCell>
                                            <TableCell><Text>{formatErrorTypeForDisplay(error.description)}</Text></TableCell>
                                            <TableCell>{error.error_location}</TableCell>
                                            <TableCell onClick={(e) => handleMaterialClick(e, error.material)} className="text-sky-400 hover:underline">
                                                {error.material}
                                            </TableCell>
                                            <TableCell onClick={(e) => handleOrderClick(e, error.order_refence)} className="text-sky-400 hover:underline">
                                                {error.order_refence}
                                            </TableCell>
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
            
            {selectedErrorForDetail && (
                <ErrorDetailModal
                    error={selectedErrorForDetail}
                    onClose={() => setSelectedErrorForDetail(null)}
                />
            )}
            {selectedMaterial && (
                <MaterialErrorsModal
                    material={selectedMaterial}
                    allErrors={errorData.detailedErrors}
                    onClose={() => setSelectedMaterial(null)}
                />
            )}
        </div>
    );
};