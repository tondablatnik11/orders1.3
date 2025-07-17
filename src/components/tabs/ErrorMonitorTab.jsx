"use client";
import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/hooks/useData';
import {
    Card,
    Title,
    Button,
    Text,
    Table,
    TableHead,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
} from '@tremor/react';
import { RefreshCw, UploadCloud, PackageX, List } from 'lucide-react';

// KLÍČOVÁ ZMĚNA: Dynamický import komponenty s grafy a vypnutí SSR (Server-Side Rendering)
// Toto zajistí, že se grafy vykreslí na straně klienta a předejde se tak problému s černými obdélníky.
const ErrorMonitorCharts = dynamic(() => import('../charts/ErrorMonitorCharts'), {
    ssr: false,
    loading: () => <div className="flex justify-center items-center h-96"><RefreshCw className="w-10 h-10 text-gray-400 animate-spin" /></div>
});

export default function ErrorMonitorTab() {
    const { errorData, isLoadingErrorData, refetchErrorData, handleErrorLogUpload } = useData();
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleErrorLogUpload(file);
        }
        // Resetování inputu pro možnost nahrání stejného souboru znovu
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
                    {/* Použití nové, dynamicky importované komponenty pro všechny grafy */}
                    <ErrorMonitorCharts chartsData={errorData.chartsData} />
                    
                    <Card className="mt-6">
                        <Title className="flex items-center gap-2"><List className="w-5 h-5" />Detailní Seznam Chyb</Title>
                        <div className="overflow-x-auto">
                            <Table className="mt-5 min-w-full">
                                <TableHead>
                                    <TableRow>
                                        <TableHeaderCell>Timestamp</TableHeaderCell>
                                        <TableHeaderCell>Typ chyby</TableHeaderCell>
                                        <TableHeaderCell>Pozice</TableHeaderCell>
                                        <TableHeaderCell>Zakázka</TableHeaderCell>
                                        <TableHeaderCell>Rozdíl</TableHeaderCell>
                                        <TableHeaderCell>Uživatel</TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(errorData.detailedErrors || []).map((error, index) => (
                                        <TableRow key={error.unique_key || index}>
                                            <TableCell>{new Date(error.timestamp).toLocaleString('cs-CZ')}</TableCell>
                                            <TableCell>
                                                <Text>{formatErrorTypeForDisplay(error.description)}</Text>
                                            </TableCell>
                                            <TableCell>{error.error_location}</TableCell>
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