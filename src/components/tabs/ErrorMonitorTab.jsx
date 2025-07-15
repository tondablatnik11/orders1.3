"use client";
import React, { useState, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { Card, Title, Button, BarChart, Grid, Text, TextInput } from '@tremor/react';
import { RefreshCw, UploadCloud, PackageX, AlertTriangle, Users, BarChart3, Search } from 'lucide-react';

// KPI Karta pro zobrazení hlavních statistik
const KpiCard = ({ title, value, icon }) => (
    <Card decoration="top" decorationColor="blue">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                {icon}
            </div>
            <div>
                <Text className="text-gray-400">{title}</Text>
                <p className="text-2xl font-bold text-gray-100 truncate" title={String(value)}>
                    {value || 'N/A'}
                </p>
            </div>
        </div>
    </Card>
);

export default function ErrorMonitorTab() {
    const { errorData, isLoadingErrorData, refetchErrorData, handleErrorLogUpload } = useData();
    const fileInputRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleErrorLogUpload(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Filtrování pro tabulku s detailními záznamy
    const filteredErrors = errorData?.detailedErrors?.filter(error =>
        Object.values(error).some(value =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
    ) || [];

    return (
        <div className="p-0 md:p-4 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Analýza Chyb Skenování</h1>
                <div className='flex items-center gap-2'>
                    <Button onClick={() => fileInputRef.current?.click()} icon={UploadCloud} variant="primary">Nahrát Report</Button>
                    <Button onClick={refetchErrorData} loading={isLoadingErrorData} icon={RefreshCw} variant="secondary">Aktualizovat</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                </div>
            </div>

            {isLoadingErrorData && (
                <div className="flex justify-center items-center h-96">
                    <RefreshCw className="w-10 h-10 text-gray-400 animate-spin" />
                </div>
            )}

            {!isLoadingErrorData && errorData && errorData.chartsData ? (
                <>
                    {/* Sekce se statistikami (KPI Karty) */}
                    <Grid numItemsLg={3} className="gap-6">
                        <KpiCard title="Celkem chyb" value={errorData.summaryMetrics.totalErrors} icon={<AlertTriangle />} />
                        <KpiCard title="Nejčastější typ chyby" value={errorData.summaryMetrics.mostCommonErrorType} icon={<BarChart3 />} />
                        <KpiCard title="Uživatel s nejvíce chybami" value={errorData.summaryMetrics.userWithMostErrors} icon={<Users />} />
                    </Grid>

                    {/* Sekce s novými grafy */}
                    <Grid numItemsLg={3} className="gap-6">
                        <Card>
                            <Title>TOP 10 Pozic s nejvíce chybami</Title>
                            <BarChart className="mt-6 h-96" data={errorData.chartsData.errorsByPosition.slice(0, 10)} index="name" categories={['Počet chyb']} colors={['cyan']} yAxisWidth={100} layout="vertical" showAnimation />
                        </Card>
                        <Card>
                            <Title>TOP 10 Materiálů s nejvíce chybami</Title>
                            <BarChart className="mt-6 h-96" data={errorData.chartsData.errorsByMaterial.slice(0, 10)} index="name" categories={['Počet chyb']} colors={['blue']} yAxisWidth={100} layout="vertical" showAnimation />
                        </Card>
                        <Card>
                            <Title>TOP 10 Materiálů s největším rozdílem</Title>
                            <BarChart className="mt-6 h-96" data={errorData.chartsData.quantityDifferenceByMaterial.slice(0, 10)} index="name" categories={['Absolutní rozdíl']} colors={['amber']} yAxisWidth={100} layout="vertical" showAnimation />
                        </Card>
                    </Grid>

                    {/* Sekce s detailním přehledem všech chyb */}
                    <Card>
                        <div className='flex justify-between items-center mb-4'>
                            <Title>Detailní záznamy chyb ({filteredErrors.length})</Title>
                            <TextInput icon={Search} placeholder="Hledat v záznamech..." value={searchQuery} onValueChange={setSearchQuery} className="max-w-xs" />
                        </div>
                        <div className="overflow-x-auto h-[500px] border-t border-gray-700">
                            <table className="min-w-full">
                                <thead className="sticky top-0 bg-gray-800 z-10">
                                    <tr>
                                        <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Čas</th>
                                        <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Typ Chyby</th>
                                        <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Uživatel</th>
                                        <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Materiál</th>
                                        <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rozdíl</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredErrors.map((error, idx) => (
                                        <tr key={`${error.timestamp}-${idx}`} className="hover:bg-gray-800/50">
                                            <td className="p-3 whitespace-nowrap text-sm text-gray-300">{new Date(error.timestamp).toLocaleString('cs-CZ')}</td>
                                            <td className="p-3 text-sm text-blue-400 font-medium">{error.errorType}</td>
                                            <td className="p-3 whitespace-nowrap text-sm text-gray-200">{error.user}</td>
                                            <td className="p-3 whitespace-nowrap text-sm text-gray-400">{error.material}</td>
                                            <td className={`p-3 whitespace-nowrap text-sm font-bold text-center ${error.qtyDifference > 0 ? 'text-green-400' : error.qtyDifference < 0 ? 'text-red-400' : 'text-gray-500'}`}>{error.qtyDifference > 0 ? `+${error.qtyDifference}` : error.qtyDifference}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            ) : (
                !isLoadingErrorData && (
                    <div className="flex items-center justify-center h-[60vh] text-center">
                        <div className="space-y-2">
                            <PackageX className="mx-auto h-12 w-12 text-gray-500" />
                            <h3 className="text-lg font-medium text-gray-200">Žádná data k zobrazení</h3>
                            <Text className="text-gray-400">Zkuste aktualizovat nebo nahrát nový report chyb.</Text>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};