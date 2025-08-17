// src/components/tabs/warehouse/WarehouseAnalyticsTab.jsx
"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Package, Warehouse, Layers, Clock, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon }) => (
    <div className="bg-background p-4 rounded-lg border border-border">
        <div className="flex items-center gap-4">
            <Icon className="h-7 w-7 text-primary" />
            <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
        {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
    </div>
);

const OccupancyByRowChart = ({ data }) => {
    const chartData = Object.entries(data).map(([row, values]) => ({
        name: `R${row}`, Obsazenost: values.rate, obsazeno: values.occupied, celkem: values.total
    })).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value)}%`}/>
                    <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A', borderRadius: '0.5rem' }} cursor={{ fill: 'rgba(136, 136, 136, 0.1)' }} formatter={(value, name, props) => [`${value.toFixed(1)}% (${props.payload.obsazeno}/${props.payload.celkem})`, "Obsazenost"]}/>
                    <Bar dataKey="Obsazenost" radius={[4, 4, 0, 0]}>
                         {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.Obsazenost > 80 ? "#EF4444" : entry.Obsazenost > 50 ? "#F97316" : "#22C55E"} />))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const OldestStockTable = ({ data }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background border-b border-border">
                <tr>
                    <th scope="col" className="px-4 py-3">Materiál</th>
                    <th scope="col" className="px-4 py-3">Pozice</th>
                    <th scope="col" className="px-4 py-3 text-right">Stáří (dny)</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index} className="border-b border-border hover:bg-background/50">
                        <td className="px-4 py-3 font-medium text-foreground">{item.Material}</td>
                        <td className="px-4 py-3">{item['Storage Bin']}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-400">{item.duration}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const WarehouseAnalyticsTab = ({ kpis, isLoading }) => {
    if (isLoading || !kpis) {
        return (
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {Array(4).fill(0).map((_,i) => <div key={i} className="h-24 bg-background rounded-lg"></div>)}
                </div>
                 <div className="mt-6 h-96 bg-background rounded-lg animate-pulse"></div>
            </div>
        );
    }
    
    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Obsazenost Pozic" value={`${kpis.overall.occupancyRate}%`} subtext={`${kpis.overall.occupiedBins} / ${kpis.overall.totalBins} pozic`} icon={TrendingUp} />
                <StatCard title="Vytížení Objemu" value={`${kpis.overall.volumeOccupancyRate}%`} subtext={`${kpis.overall.occupiedVolume.toFixed(0)} / ${kpis.overall.totalVolume.toFixed(0)} m³`} icon={Warehouse} />
                <StatCard title="Průměrné Stáří Zásob" value={`${kpis.averageAge.toFixed(1)} dní`} icon={Clock} />
                 <StatCard title="Typy Materiálů" value={kpis.overall.uniqueSKUs} subtext="Počet unikátních SKU na skladě" icon={Layers} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-background p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Obsazenost podle Řad</h3>
                    <OccupancyByRowChart data={kpis.byRow} />
                </div>
                 <div className="bg-background p-6 rounded-lg border border-border">
                     <h3 className="text-lg font-semibold mb-4 text-foreground">TOP 10 Nejstarších Palet</h3>
                    <OldestStockTable data={kpis.oldestStock} />
                </div>
            </div>

             <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Obsazenost podle Typu Místa</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                     {Object.entries(kpis.byBinType).map(([type, data]) => (
                         <div key={type} className="text-center bg-card p-4 rounded-md border border-border/50">
                             <p className="font-bold text-2xl text-primary">{data.rate.toFixed(1)}%</p>
                             <p className="text-sm font-semibold text-foreground">{type}</p>
                             <p className="text-xs text-muted-foreground">{data.occupied}/{data.total}</p>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    );
};