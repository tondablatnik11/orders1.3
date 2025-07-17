"use client";
import React from 'react';
import { 
    Card, 
    Title, 
    BarChart, 
    Grid, 
    DonutChart, 
    Legend,
} from '@tremor/react';
import { ListChecks, MapPin, Package, GitCommitVertical } from 'lucide-react';

// Vlastní Tooltip pro grafy pro lepší zobrazení
const CustomTooltip = ({ payload, active, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const category = payload[0].dataKey;
      const value = data[category];
      return (
        <div className="rounded-tremor-default text-tremor-default bg-tremor-background p-2 shadow-tremor-dropdown border border-tremor-border">
          <p className="text-tremor-content-emphasis font-medium">{label}</p>
          <p className="text-tremor-content mt-1">{`${category}: ${value}`}</p>
        </div>
      );
    }
    return null;
};

// Formátování typů chyb pro lepší čitelnost
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

// Barevná paleta pro Donut Chart
const donutColors = ["#3b82f6", "#16a34a", "#facc15", "#f97316", "#ef4444", "#9333ea"];

const ErrorMonitorCharts = ({ chartsData }) => {
    // Transformace dat pro Donut Chart s lepšími popisky
    const errorsByTypeData = chartsData?.errorsByType.map(e => ({
        ...e,
        name: formatErrorTypeForDisplay(e.name)
    })).slice(0, 6) || [];

    return (
        <>
            <Grid numItemsLg={2} className="gap-6">
                <Card>
                    <Title className="flex items-center gap-2"><ListChecks className="w-5 h-5" />TOP 6 Typů Chyb</Title>
                    <DonutChart
                        className="mt-8 h-64"
                        data={errorsByTypeData}
                        category="Počet chyb"
                        index="name"
                        colors={donutColors}
                        showAnimation={true}
                        variant="pie"
                    />
                    <Legend categories={errorsByTypeData.map(e => e.name)} colors={donutColors} className="mt-4" />
                </Card>
                <Card>
                    <Title className="flex items-center gap-2"><MapPin className="w-5 h-5" />TOP 10 Pozic s nejvíce chybami</Title>
                    <BarChart
                        className="mt-6 h-[22rem]"
                        data={chartsData.errorsByPosition.slice(0, 10)}
                        index="name"
                        categories={['Počet chyb']}
                        colors={["#3b82f6"]}
                        yAxisWidth={160}
                        layout="vertical"
                        showAnimation={true}
                        customTooltip={CustomTooltip}
                    />
                </Card>
            </Grid>
            <Grid numItemsLg={2} className="gap-6 mt-6">
                <Card>
                    <Title className="flex items-center gap-2"><Package className="w-5 h-5" />TOP 10 Materiálů s nejvíce chybami</Title>
                    <BarChart
                        className="mt-6 h-96"
                        data={chartsData.errorsByMaterial.slice(0, 10)}
                        index="name"
                        categories={['Počet chyb']}
                        colors={["#16a34a"]}
                        yAxisWidth={160}
                        layout="vertical"
                        showAnimation={true}
                        customTooltip={CustomTooltip}
                    />
                </Card>
                <Card>
                    <Title className="flex items-center gap-2"><GitCommitVertical className="w-5 h-5" />TOP 10 Materiálů s největším rozdílem</Title>
                    <BarChart
                        className="mt-6 h-96"
                        data={chartsData.quantityDifferenceByMaterial.slice(0, 10)}
                        index="name"
                        categories={['Absolutní rozdíl']}
                        colors={["#f97316"]}
                        yAxisWidth={160}
                        layout="vertical"
                        showAnimation={true}
                        customTooltip={CustomTooltip}
                    />
                </Card>
            </Grid>
        </>
    );
};

export default ErrorMonitorCharts;