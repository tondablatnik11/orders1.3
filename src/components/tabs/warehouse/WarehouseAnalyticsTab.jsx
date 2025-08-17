"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Warehouse, TrendingUp, Package, Box, ListChecks, Shapes } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon }) => (
    <div className="bg-background p-4 rounded-lg border border-border flex-grow">
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

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-card p-2 border border-border rounded-lg shadow-lg">
                <p className="font-bold">{`${label}`}</p>
                <p className="text-sm">{`Obsazenost: ${data.Obsazenost.toFixed(1)}% (${data.obsazeno}/${data.celkem})`}</p>
            </div>
        );
    }
    return null;
};

const OccupancyByRowChart = ({ data }) => {
     const chartData = Object.entries(data).map(([row, values]) => ({
        name: `R${row}`, Obsazenost: values.rate, obsazeno: values.occupied, celkem: values.total
    })).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value)}%`}/>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136, 136, 136, 0.1)' }} />
                    <Bar dataKey="Obsazenost" radius={[4, 4, 0, 0]}>
                         {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.Obsazenost > 85 ? "#F43F5E" : entry.Obsazenost > 65 ? "#F97316" : "#22C55E"} />))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const TopMaterialsTable = ({ data, title }) => (
    <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background border-b border-border">
                <tr>
                    <th scope="col" className="px-4 py-3">Materiál</th>
                    <th scope="col" className="px-4 py-3 text-right">Počet pozic</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index} className="border-b border-border hover:bg-background/50">
                        <td className="px-4 py-3 font-medium text-foreground truncate" style={{maxWidth: '150px'}}>{item.material}</td>
                        <td className="px-4 py-3 text-right font-bold text-primary">{item.count}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const BinTypeDistributionChart = ({ data }) => {
    const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
    const COLORS = ['#0EA5E9', '#F97316', '#10B981', '#8B5CF6', '#EAB308'];
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={10} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export const WarehouseAnalyticsTab = ({ kpis, isLoading }) => {
    if (isLoading || !kpis) {
        return <div className="p-6 h-full w-full bg-background rounded-lg animate-pulse"></div>;
    }
    
    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            <div className="flex flex-wrap gap-4">
                <StatCard title="Obsazenost Pozic" value={`${kpis.overall.occupancyRate}%`} subtext={`${kpis.overall.occupiedBins} / ${kpis.overall.totalBins} pozic`} icon={TrendingUp} />
                <StatCard title="Vytížení Objemu" value={`${kpis.overall.volumeOccupancyRate}%`} subtext={`${kpis.overall.occupiedVolume.toFixed(0)} / ${kpis.overall.totalVolume.toFixed(0)} m³`} icon={Warehouse} />
                <StatCard title="Typy Materiálů (SKU)" value={kpis.overall.uniqueSKUs} icon={Package} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* LEVÝ (HLAVNÍ) SLOUPEC */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-background p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold mb-4 text-foreground">Obsazenost podle Řad</h3>
                        <OccupancyByRowChart data={kpis.byRow} />
                    </div>
                     <div className="bg-background p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold mb-4 text-foreground">Využití typů skladových míst</h3>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                             {Object.entries(kpis.byBinType).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([type, data]) => (
                                 <div key={type} className="text-center bg-card p-3 rounded-md border border-border/50">
                                     <p className="font-bold text-2xl text-primary">{Math.round(data.rate)}%</p>
                                     <p className="text-sm font-semibold text-foreground">{type}</p>
                                     <p className="text-xs text-muted-foreground">{data.occupied}/{data.total}</p>
                                 </div>
                             ))}
                         </div>
                     </div>
                </div>

                {/* PRAVÝ (POSTRANNÍ) SLOUPEC */}
                <div className="space-y-6">
                    <div className="bg-background p-6 rounded-lg border border-border">
                         <TopMaterialsTable data={kpis.topMaterialsByBins} title="TOP 10 Materiálů dle počtu pozic"/>
                    </div>
                     <div className="bg-background p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold mb-2 text-foreground">Počet SKU na typ místa</h3>
                        <BinTypeDistributionChart data={kpis.materialDistributionByBinType} />
                    </div>
                     <div className="bg-background p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold mb-4 text-foreground">Volné pozice dle typu</h3>
                        <div className="space-y-2">
                            {Object.entries(kpis.emptyBinsByType).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-muted-foreground">{type}</span>
                                    <span className="font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};