"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Package, Warehouse, Layers } from 'lucide-react';

// Pomocná komponenta pro zobrazení jednoho KPI bloku
const StatCard = ({ title, value, subtext, icon: Icon }) => (
    <div className="bg-background p-6 rounded-lg border border-border">
        <div className="flex items-center gap-4">
            <Icon className="h-8 w-8 text-primary" />
            <div>
                <p className="text-3xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
        {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
    </div>
);

// Komponenta pro zobrazení obsazenosti po řadách
const OccupancyByRowChart = ({ data }) => {
    const chartData = Object.entries(data).map(([row, values]) => ({
        name: `R ${row}`,
        Obsazenost: parseFloat(values.rate),
        obsazeno: values.occupied,
        celkem: values.total
    }));

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`}/>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A', borderRadius: '0.5rem' }}
                        cursor={{ fill: 'rgba(136, 136, 136, 0.1)' }}
                        formatter={(value, name, props) => [`${value}% (${props.payload.obsazeno}/${props.payload.celkem})`, "Obsazenost"]}
                    />
                    <Bar dataKey="Obsazenost" radius={[4, 4, 0, 0]}>
                         {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.Obsazenost > 80 ? "#EF4444" : entry.Obsazenost > 50 ? "#F97316" : "#22C55E"} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const WarehouseAnalyticsTab = ({ kpis, isLoading }) => {
    if (isLoading) {
        return <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {Array(8).fill(0).map((_,i) => <div key={i} className="h-24 bg-background rounded-lg"></div>)}
        </div>
    }

    if (!kpis) return <div className="p-6 text-center">Data nejsou k dispozici. Nahrajte prosím LT10 report.</div>;
    
    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            {/* Sekce 1: Klíčové statistiky podle typu pozice */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Paletové Pozice" value={`${kpis.byLevelType.pallet.rate}%`} subtext={`${kpis.byLevelType.pallet.occupied} / ${kpis.byLevelType.pallet.total} obsazeno`} icon={Package} />
                <StatCard title="KLT Pozice" value={`${kpis.byLevelType.klt.rate}%`} subtext={`${kpis.byLevelType.klt.occupied} / ${kpis.byLevelType.klt.total} obsazeno`} icon={Layers} />
                <StatCard title="Průměrné Stáří Palet" value={`${kpis.averageAge.toFixed(1)} dní`} subtext="U všech obsazených pozic" icon={Warehouse} />
            </div>

            {/* Sekce 2: Graf obsazenosti po řadách */}
            <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Obsazenost podle Řad Regálů</h3>
                <OccupancyByRowChart data={kpis.byRow} />
            </div>

            {/* TODO: Zde je prostor pro další grafy a tabulky, např. obsazenost podle výšek, top 10 nejdéle ležících materiálů, atd. */}
        </div>
    );
};