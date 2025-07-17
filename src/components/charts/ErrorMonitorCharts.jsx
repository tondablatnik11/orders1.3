// src/components/charts/ErrorMonitorCharts.jsx
"use client";
import React from 'react';
// Importujeme pouze komponenty grafů z Tremor, ne layout
import { BarChart, DonutChart, Legend } from '@tremor/react';
// Importujeme vaši vlastní UI komponentu Card, která prokazatelně funguje jinde v aplikaci
import { Card, CardContent } from '../ui/Card';
import { ListChecks, MapPin, Package, GitCommitVertical } from 'lucide-react';

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

const donutColors = ["#3b82f6", "#16a34a", "#facc15", "#f97316", "#ef4444", "#9333ea"];

const ErrorMonitorCharts = ({ chartsData }) => {
    const errorsByTypeData = chartsData?.errorsByType.map(e => ({
        ...e,
        name: formatErrorTypeForDisplay(e.name)
    })).slice(0, 6) || [];

    return (
        <>
            {/* Používáme standardní div s Tailwind gridem místo <Grid> od Tremor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Používáme vaši vlastní komponentu <Card> */}
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><ListChecks className="w-5 h-5" />TOP 6 Typů Chyb</h3>
                        <DonutChart
                            className="mt-8 h-64"
                            data={errorsByTypeData}
                            category="Počet chyb"
                            index="name"
                            colors={donutColors}
                            showAnimation={true}
                            variant="pie"
                        />
                        <Legend categories={errorsByTypeData.map(e => e.name)} colors={donutColors} className="mt-4 flex-wrap" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                       <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" />TOP 10 Pozic s nejvíce chybami</h3>
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
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Package className="w-5 h-5" />TOP 10 Materiálů s nejvíce chybami</h3>
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
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><GitCommitVertical className="w-5 h-5" />TOP 10 Materiálů s největším rozdílem</h3>
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
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default ErrorMonitorCharts;