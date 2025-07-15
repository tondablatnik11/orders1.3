"use client";
import React, { useRef } from 'react';
import { useData } from '@/hooks/useData';
import { Card, Title, Button, BarChart, Grid, Text } from '@tremor/react';
import { RefreshCw, UploadCloud, PackageX } from 'lucide-react';

export default function ErrorMonitorTab() {
    const { errorData, isLoadingErrorData, refetchErrorData, handleErrorLogUpload } = useData();
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

    return (
        <div className="p-0 md:p-4">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Analýza Chyb Skenování</h1>
                <div className='flex items-center gap-2'>
                    <Button onClick={() => fileInputRef.current?.click()} icon={UploadCloud} variant="primary" className="bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700">Nahrát Report</Button>
                    <Button onClick={refetchErrorData} loading={isLoadingErrorData} icon={RefreshCw} variant="secondary">Aktualizovat</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                </div>
            </div>

            {isLoadingErrorData ? (
                <div className="flex justify-center items-center h-96">
                    <RefreshCw className="w-10 h-10 text-gray-400 animate-spin" />
                </div>
            ) : errorData && errorData.chartsData ? ( // Kontrolujeme novou strukturu dat
                <Grid numItemsLg={3} className="gap-6">
                    {/* Graf 1: Chyby podle pozic */}
                    <Card className="lg:col-span-1">
                        <Title>TOP 10 Pozic s nejvíce chybami</Title>
                        <BarChart
                            className="mt-6 h-96"
                            data={errorData.chartsData.errorsByPosition.slice(0, 10)}
                            index="name"
                            categories={['Počet chyb']}
                            colors={['cyan']}
                            yAxisWidth={100}
                            layout="vertical"
                            showAnimation={true}
                        />
                    </Card>

                    {/* Graf 2: Chyby podle materiálu */}
                    <Card className="lg:col-span-1">
                        <Title>TOP 10 Materiálů s nejvíce chybami</Title>
                        <BarChart
                            className="mt-6 h-96"
                            data={errorData.chartsData.errorsByMaterial.slice(0, 10)}
                            index="name"
                            categories={['Počet chyb']}
                            colors={['blue']}
                            yAxisWidth={100}
                            layout="vertical"
                            showAnimation={true}
                        />
                    </Card>

                    {/* Graf 3: Rozdíly v množství */}
                    <Card className="lg:col-span-1">
                        <Title>TOP 10 Materiálů s největším rozdílem v množství</Title>
                        <BarChart
                            className="mt-6 h-96"
                            data={errorData.chartsData.quantityDifferenceByMaterial.slice(0, 10)}
                            index="name"
                            categories={['Absolutní rozdíl']}
                            colors={['amber']}
                            yAxisWidth={100}
                            layout="vertical"
                            showAnimation={true}
                        />
                    </Card>
                </Grid>
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