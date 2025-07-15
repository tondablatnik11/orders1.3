"use client";
import React, { useState, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { Card, Title, Text, Button, BarChart, AreaChart, Grid, TextInput, DonutChart, Legend } from '@tremor/react';
import { RefreshCw, Search, BarChart3, Users, AlertTriangle, UploadCloud, PackageX, CalendarDays, Clock } from 'lucide-react';

const KpiCard = ({ title, value, icon, t }) => (
    <Card decoration="top" decorationColor="indigo">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
                {icon}
            </div>
            <div>
                <Text className="text-gray-400">{title}</Text>
                <p className="text-2xl font-bold text-gray-100 truncate" title={String(value)}>
                    {value || t.noDataAvailable || 'N/A'}
                </p>
            </div>
        </div>
    </Card>
);

export default function ErrorMonitorTab() {
    const { errorData, isLoadingErrorData, refetchErrorData, handleErrorLogUpload } = useData();
    const { t } = useUI();
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleErrorLogUpload(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const filteredErrors = errorData?.detailedErrors?.filter(error =>
        Object.values(error).some(value =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
    ) || [];

    return (
        <div className="p-0 md:p-4">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Analýza Chyb Skenování</h1>
                <div className='flex items-center gap-2'>
                    <Button onClick={() => fileInputRef.current?.click()} icon={UploadCloud} variant="primary">Nahrát Report</Button>
                    <Button onClick={refetchErrorData} loading={isLoadingErrorData} icon={RefreshCw} variant="secondary">Aktualizovat</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />
                </div>
            </div>

            {isLoadingErrorData ? (
                <div className="flex justify-center items-center h-96">
                    <RefreshCw className="w-10 h-10 text-gray-400 animate-spin" />
                </div>
            ) : errorData && errorData.detailedErrors.length > 0 ? (
                <div className="space-y-6">
                    <Grid numItemsLg={3} numItemsSm={2} className="gap-6">
                        <KpiCard title="Celkem chyb" value={errorData.summaryMetrics.totalErrors} icon={<AlertTriangle />} t={t} />
                        <KpiCard title="Nejčastější chyba" value={errorData.summaryMetrics.mostCommonError} icon={<BarChart3 />} t={t} />
                        <KpiCard title="Nejaktivnější uživatel" value={errorData.summaryMetrics.userWithMostErrors} icon={<Users />} t={t} />
                        <KpiCard title="Celkový rozdíl v množství" value={errorData.summaryMetrics.totalDifference} icon={<PackageX />} t={t} />
                        <KpiCard title="Materiál s nejvíce chybami" value={errorData.summaryMetrics.materialWithMostErrors} icon={<PackageX />} t={t} />
                    </Grid>
                    
                    <Grid numItemsLg={3} className="gap-6">
                        <Card className="lg:col-span-2">
                           <Title>Chyby v průběhu dne</Title>
                            <AreaChart
                                className="h-72 mt-4"
                                data={errorData.chartsData.errorsByHour}
                                index="key"
                                categories={['Počet chyb']}
                                colors={['indigo']}
                                showAnimation={true}
                            />
                        </Card>
                        <Card>
                            <Title>Chyby podle dne v týdnu</Title>
                            <BarChart
                                className="mt-4 h-72"
                                data={errorData.chartsData.errorsByDay}
                                index="key"
                                categories={['Počet chyb']}
                                colors={['cyan']}
                                showAnimation={true}
                            />
                        </Card>
                    </Grid>
                    
                    <Grid numItemsLg={2} className="gap-6">
                       <Card>
                            <Title>TOP 5 typů chyb</Title>
                            <DonutChart
                                className="mt-8 h-64"
                                data={errorData.chartsData.errorsByType.slice(0, 5)}
                                category="Počet chyb"
                                index="name"
                                colors={["blue", "cyan", "indigo", "violet", "fuchsia"]}
                                showAnimation={true}
                            />
                             <Legend categories={errorData.chartsData.errorsByType.slice(0, 5).map(e => e.name)} colors={["blue", "cyan", "indigo", "violet", "fuchsia"]} className="mt-4" />
                        </Card>
                         <Card>
                            <Title>TOP 10 Materiálů s největším rozdílem</Title>
                             <BarChart 
                                className="mt-6 h-80"
                                data={errorData.chartsData.topMaterialDiscrepancy} 
                                index="name" 
                                categories={['Absolutní rozdíl']} 
                                colors={['amber']}
                                yAxisWidth={100}
                                layout="vertical" 
                                showAnimation={true}
                            />
                        </Card>
                    </Grid>

                    <Card>
                        <div className='flex justify-between items-center mb-4'>
                            <Title>Detailní záznamy chyb ({filteredErrors.length})</Title>
                            <TextInput icon={Search} placeholder="Hledat v záznamech..." value={searchQuery} onValueChange={setSearchQuery} className="max-w-xs" />
                        </div>
                        <div className="overflow-y-auto h-[500px] border-t border-gray-700">
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
                                        <tr key={idx} className="hover:bg-gray-800/50">
                                            <td className="p-3 whitespace-nowrap text-sm text-gray-300">{new Date(error.timestamp).toLocaleString('cs-CZ')}</td>
                                            <td className="p-3 whitespace-nowrap text-sm text-blue-400 font-medium">{error.errorType}</td>
                                            <td className="p-3 whitespace-nowrap text-sm text-gray-200 font-medium">{error.user}</td>
                                            <td className="p-3 whitespace-nowrap text-sm text-gray-400">{error.material}</td>
                                            <td className={`p-3 whitespace-nowrap text-sm font-bold text-center ${error.qtyDifference > 0 ? 'text-green-400' : error.qtyDifference < 0 ? 'text-red-400' : 'text-gray-500'}`}>{error.qtyDifference > 0 ? `+${error.qtyDifference}` : error.qtyDifference}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="flex items-center justify-center h-[60vh] text-center">
                    <div className="space-y-2">
                        <PackageX className="mx-auto h-12 w-12 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-200">Žádná data k zobrazení</h3>
                        <Text className="text-gray-400">Zkuste aktualizovat nebo nahrát nový report chyb.</Text>
                    </div>
                </div>
            )}
        </div>
    );
};