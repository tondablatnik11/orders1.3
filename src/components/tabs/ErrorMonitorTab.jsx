"use client";
import React, { useRef } from 'react';
import { useData } from '@/hooks/useData';
import { 
    Card, 
    Title, 
    Button, 
    BarChart, 
    Grid, 
    Text, 
    DonutChart, 
    Legend,
    Table,
    TableHead,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
} from '@tremor/react';
import { RefreshCw, UploadCloud, PackageX, ListChecks, MapPin, Package, GitCommitVertical, List } from 'lucide-react';

// Vlastní komponenta pro Tooltip s definovanými barvami
const CustomTooltip = ({ payload, active, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const category = payload[0].dataKey;
      const value = data[category];
      // Manuální mapování barev
      let bgColor = 'bg-gray-700';
      if (category.includes('Počet chyb')) bgColor = 'bg-blue-500';
      if (category.includes('Absolutní rozdíl')) bgColor = 'bg-orange-500';

      return (
        <div className="rounded-tremor-default text-tremor-default bg-tremor-background p-2 shadow-tremor-dropdown border border-tremor-border">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${bgColor}`} />
            <p className="text-tremor-content-emphasis font-medium">{label}</p>
          </div>
          <p className="text-tremor-content mt-1">{`${category}: ${value}`}</p>
        </div>
      );
    }
    return null;
};


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

    const donutColors = ["blue", "green", "yellow", "orange", "red"];

    const formatErrorType = (description) => {
        if (description && description.toLowerCase().includes('location')) {
            return 'Location empty';
        }
        return description;
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
                            <Title className="flex items-center gap-2"><ListChecks className="w-5 h-5" />TOP 5 Typů Chyb</Title>
                             <DonutChart
                                className="mt-8 h-64"
                                data={errorData.chartsData.errorsByType.slice(0, 5)}
                                category="Počet chyb"
                                index="name"
                                colors={donutColors}
                                showAnimation={true}
                                variant="pie"
                            />
                            <Legend categories={errorData.chartsData.errorsByType.slice(0, 5).map(e => e.name)} colors={donutColors} className="mt-4" />
                        </Card>
                        <Card>
                            <Title className="flex items-center gap-2"><MapPin className="w-5 h-5" />TOP 10 Pozic s nejvíce chybami</Title>
                            <BarChart
                                className="mt-6 h-[22rem]"
                                data={errorData.chartsData.errorsByPosition.slice(0, 10)}
                                index="name"
                                categories={['Počet chyb']}
                                colors={["blue"]}
                                yAxisWidth={100}
                                layout="vertical"
                                showAnimation={true}
                                customTooltip={CustomTooltip}
                            />
                        </Card>
                    </Grid>
                    <Grid numItemsLg={2} className="gap-6">
                        <Card>
                            <Title className="flex items-center gap-2"><Package className="w-5 h-5" />TOP 10 Materiálů s nejvíce chybami</Title>
                            <BarChart
                                className="mt-6 h-96"
                                data={errorData.chartsData.errorsByMaterial.slice(0, 10)}
                                index="name"
                                categories={['Počet chyb']}
                                colors={["green"]}
                                yAxisWidth={100}
                                layout="vertical"
                                showAnimation={true}
                                customTooltip={CustomTooltip}
                            />
                        </Card>
                        <Card>
                            <Title className="flex items-center gap-2"><GitCommitVertical className="w-5 h-5" />TOP 10 Materiálů s největším rozdílem</Title>
                            <BarChart
                                className="mt-6 h-96"
                                data={errorData.chartsData.quantityDifferenceByMaterial.slice(0, 10)}
                                index="name"
                                categories={['Absolutní rozdíl']}
                                colors={["orange"]}
                                yAxisWidth={100}
                                layout="vertical"
                                showAnimation={true}
                                customTooltip={CustomTooltip}
                            />
                        </Card>
                    </Grid>
                    
                    <Card>
                        <Title className="flex items-center gap-2"><List className="w-5 h-5" />Detailní Seznam Chyb</Title>
                        <Table className="mt-5">
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
                                    <TableRow key={index}>
                                        <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Text>{formatErrorType(error.description)}</Text>
                                        </TableCell>
                                        <TableCell>{error.error_location}</TableCell>
                                        <TableCell>{error.order_refence}</TableCell>
                                        <TableCell>{error.diff_qty}</TableCell>
                                        <TableCell>{error.user}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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