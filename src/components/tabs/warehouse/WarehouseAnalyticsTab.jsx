"use client";
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Warehouse, TrendingUp, Package, Activity, Layers, CheckSquare } from 'lucide-react';

const StatCard = ({ title, value, subtext }) => (
    <div className="bg-background p-4 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
);

const ABCTable = ({ data, title, color }) => (
    <div>
        <h4 className={`text-lg font-bold ${color}`}>{title} ({data.length} materiálů)</h4>
        <div className="mt-2 space-y-1 text-sm">
            {data.slice(0, 5).map(item => (
                <div key={item.material} className="flex justify-between">
                    <span className="text-muted-foreground">{item.material}</span>
                    <span className="font-semibold">{item.count} picks</span>
                </div>
            ))}
            {data.length > 5 && <p className="text-xs text-muted-foreground">a dalších {data.length - 5}...</p>}
        </div>
    </div>
);

const BinTypeChart = ({ data }) => {
    const chartData = Object.entries(data).map(([name, values]) => ({
        name,
        Obsazenost: values.rate,
        Pohyby: values.pickCount
    })).sort((a, b) => b.Pohyby - a.Pohyby);

    return (
         <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis yAxisId="left" stroke="#22C55E" orientation="left" />
                <YAxis yAxisId="right" stroke="#38BDF8" orientation="right" />
                <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A' }}/>
                <Legend />
                <Bar yAxisId="left" dataKey="Obsazenost" fill="#22C55E" name="Obsazenost (%)" radius={[4, 4, 0, 0]}/>
                <Bar yAxisId="right" dataKey="Pohyby" fill="#38BDF8" name="Počet picků" radius={[4, 4, 0, 0]}/>
            </BarChart>
        </ResponsiveContainer>
    );
};

export const WarehouseAnalyticsTab = ({ kpis, isLoading }) => {
    const [activeSubTab, setActiveSubTab] = useState('overview');

    if (isLoading || !kpis) {
        return <div className="p-6 h-full w-full bg-background rounded-lg animate-pulse"></div>;
    }

    const SubTabButton = ({ tabName, label }) => (
        <button onClick={() => setActiveSubTab(tabName)} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeSubTab === tabName ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
            {label}
        </button>
    );

    return (
        <div className="p-6 flex flex-col h-full">
            <div className="flex gap-2 border-b border-border pb-4 mb-4">
                <SubTabButton tabName="overview" label="Celkový Přehled"/>
                <SubTabButton tabName="abc" label="ABC Analýza"/>
                <SubTabButton tabName="binTypes" label="Analýza Typů Míst"/>
            </div>

            <div className="overflow-y-auto flex-grow">
                {activeSubTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Celkem Pozic" value={kpis.overall.totalBins.toLocaleString()} subtext="Všech typů" />
                        <StatCard title="Obsazenost" value={`${kpis.overall.occupancyRate.toFixed(1)}%`} subtext={`${kpis.overall.occupiedBins.toLocaleString()} obsazených pozic`} />
                        <StatCard title="Celkem Picků" value={kpis.overall.totalPicks.toLocaleString()} subtext="V analyzovaném období" />
                        {/* Zde přidat další celkové grafy, např. obsazenost po řadách */}
                    </div>
                )}

                {activeSubTab === 'abc' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">ABC Analýza Materiálů</h2>
                        <p className="text-muted-foreground mb-6">Materiály rozdělené podle frekvence vychystávání. Skupina 'A' jsou nejčastěji pickované materiály (80% pohybů), které by měly být co nejdostupnější.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <ABCTable data={kpis.abcAnalysis.A} title="Skupina A (Top 80%)" color="text-green-400" />
                            <ABCTable data={kpis.abcAnalysis.B} title="Skupina B (Dalších 15%)" color="text-yellow-400" />
                            <ABCTable data={kpis.abcAnalysis.C} title="Skupina C (Posledních 5%)" color="text-red-400" />
                        </div>
                    </div>
                )}

                {activeSubTab === 'binTypes' && (
                     <div>
                        <h2 className="text-2xl font-bold mb-4">Analýza podle Typu Skladových Míst</h2>
                        <div className="bg-background p-6 rounded-lg border border-border">
                             <h3 className="text-lg font-semibold mb-4 text-foreground">Obsazenost a Pohyby podle Typu Pozice</h3>
                             <BinTypeChart data={kpis.byBinType} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};