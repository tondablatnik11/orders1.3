"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Warehouse, Package, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-background p-4 rounded-lg border border-border flex-grow">
        <div className="flex items-center gap-4">
            <Icon className={`h-7 w-7 ${color || 'text-primary'}`} />
            <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
        {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
    </div>
);

const BinTypeOccupancyChart = ({ data }) => {
    const chartData = Object.entries(data)
        .map(([name, values]) => ({ name, Obsazenost: values.rate }))
        .sort((a, b) => a.Obsazenost - b.Obsazenost);
    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={50} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A' }} formatter={(value) => [`${value.toFixed(1)}%`, 'Obsazenost']}/>
                <Bar dataKey="Obsazenost" name="Obsazenost" radius={[0, 4, 4, 0]} background={{ fill: 'rgba(128,128,128,0.1)' }}>
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.Obsazenost > 85 ? "#F43F5E" : entry.Obsazenost > 65 ? "#F97316" : "#22C55E"} />))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

const TurnoverList = ({ title, data, color }) => (
     <div className="bg-background p-4 rounded-lg border border-border">
        <h3 className={`text-md font-semibold mb-2 ${color}`}>{title}</h3>
        <ul className="space-y-1 text-sm">
            {data.map(item => (
                <li key={item.material} className="flex justify-between items-center text-xs hover:bg-muted/50 p-1 rounded">
                    <span className="font-medium truncate pr-2">{item.material}</span>
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded-sm">{item.turnoverRate.toFixed(4)}</span>
                </li>
            ))}
        </ul>
     </div>
);

const SlowMoversTable = ({ data }) => (
    <div className="bg-background p-4 rounded-lg border border-border">
        <h3 className="text-md font-semibold mb-2 text-amber-500 flex items-center gap-2"><Clock size={16}/> "Ležáky" (bez pohybu > 30 dní)</h3>
         <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-xs text-left">
                <tbody>
                    {data.map((bin) => (
                        <tr key={bin.id} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="p-1.5 font-medium">{bin.stockData[0].material}</td>
                            <td className="p-1.5 text-muted-foreground">{bin.address}</td>
                            <td className="p-1.5 text-right text-muted-foreground">{new Date(bin.stockData[0].last_movement).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)


export const OverallOverview = ({ kpis }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Obsazenost Pozic" value={`${kpis.overall.occupancyRate.toFixed(1)}%`} subtext={`${kpis.overall.occupiedBins} / ${kpis.overall.totalBins}`} icon={TrendingUp} />
            <StatCard title="Celková Nosnost" value={`${(kpis.weightCapacity / 1000).toFixed(0)} t`} subtext="Pozn: Aktuální váha zásob není dostupná" icon={Warehouse} />
            <StatCard title="Volné Prémiové Pozice" value={kpis.emptyPremiumBins} subtext="Typy EP3 a EP4" icon={CheckCircle} color="text-green-500" />
            <StatCard title="Materiály bez Pohybu" value={kpis.slowMovers.length} subtext="Déle než 30 dní" icon={AlertTriangle} color="text-amber-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-background p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Obsazenost dle Typu Místa</h3>
                <BinTypeOccupancyChart data={kpis.byBinType} />
            </div>
            <div className="space-y-4">
                <TurnoverList title="TOP 10 Rychloobrátkové Materiály" data={kpis.fastestMovers} color="text-green-500"/>
                <TurnoverList title="TOP 10 Pomalobrátkové Materiály" data={kpis.slowestMovers} color="text-red-500"/>
            </div>
        </div>
        
        {kpis.slowMovers.length > 0 && <SlowMoversTable data={kpis.slowMovers} />}
    </div>
);