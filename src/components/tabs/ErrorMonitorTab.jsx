"use client";
import React, { useRef } from 'react';
import { useData } from '@/hooks/useData';
import { Card, Title, Button, BarChart, Grid, Text, DonutChart, Legend } from '@tremor/react';
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

    // Paleta barev pro profesionální vzhled
    const colors = {
        positions: 'teal',
        materials: 'cyan',
        difference: 'amber',
        types: ["#16a34a", "#0ea5e9", "#f97316", "#c026d3", "#64748b"], // zelená, modrá, oranžová, fialová, šedá
    };

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

            {isLoadingErrorData ? (
                <div className="flex justify-center items-center h-96">
                    <RefreshCw className="w-10 h-10 text-gray-400 animate-spin" />
                </div>
            ) : errorData && errorData.chartsData ? (
                <>
                    <Grid numItemsLg={2} className="gap-6">
                        <Card>
                            <Title>TOP 5 Typů Chyb</Title>
                             <DonutChart
                                className="mt-8 h-64"
                                data={errorData.chartsData.errorsByType.slice(0, 5)}
                                category="Počet chyb"
                                index="name"
                                colors={colors.types}
                                showAnimation={true}
                                variant="pie"
                            />
                            <Legend categories={errorData.chartsData.errorsByType.slice(0, 5).map(e => e.name)} colors={colors.types} className="mt-4" />
                        </Card>
                        <Card>
                            <Title>TOP 10 Pozic s nejvíce chybami</Title>
                            <BarChart
                                className="mt-6 h-[22rem]"
                                data={errorData.chartsData.errorsByPosition.slice(0, 10)}
                                index="name"
                                categories={['Počet chyb']}
                                colors={[colors.positions]}
                                yAxisWidth={100}
                                layout="vertical"
                                showAnimation={true}
                            />
                        </Card>
                    </Grid>
                    <Grid numItemsLg={2} className="gap-6">
                        <Card>
                            <Title>TOP 10 Materiálů s nejvíce chybami</Title>
                            <BarChart
                                className="mt-6 h-96"
                                data={errorData.chartsData.errorsByMaterial.slice(0, 10)}
                                index="name"
                                categories={['Počet chyb']}
                                colors={[colors.materials]}
                                yAxisWidth={100}
                                layout="vertical"
                                showAnimation={true}
                            />
                        </Card>
                        <Card>
                            <Title>TOP 10 Materiálů s největším rozdílem v množství</Title>
                            <BarChart
                                className="mt-6 h-96"
                                data={errorData.chartsData.quantityDifferenceByMaterial.slice(0, 10)}
                                index="name"
                                categories={['Absolutní rozdíl']}
                                colors={[colors.difference]}
                                yAxisWidth={100}
                                layout="vertical"
                                showAnimation={true}
                            />
                        </Card>
                    </Grid>
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