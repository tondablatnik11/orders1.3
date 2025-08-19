"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
    Percent, Boxes, Activity, Clock, CalendarDays, Archive, Weight, 
    Warehouse, Box, TrendingUp, DivideCircle, Users
} from 'lucide-react';

// Komponenta pro zobrazení jednotlivých KPI karet
const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-card-alt p-4 rounded-lg border border-border flex-grow shadow-md hover:shadow-primary/20 transition-shadow">
        <div className="flex items-center gap-4">
            <Icon className={`h-8 w-8 ${color || 'text-primary'}`} />
            <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
        {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
    </div>
);

// Hlavní komponenta
export const OverallOverview = ({ kpis }) => {
    if (!kpis || !kpis.overall) {
        return <div className="p-4 text-center text-muted-foreground">Načítání hlavního přehledu...</div>;
    }

    const { overall, byRowDetail } = kpis;
    
    // Data pro graf vytíženosti po řadách
    const occupancyByRow = (byRowDetail || []).map(row => ({
      name: `R ${row.row}`,
      obsazenost: row.rate,
    })).sort((a,b) => parseInt(a.name.replace('R ','')) - parseInt(b.name.replace('R ','')));


    return (
        <div className="space-y-6">
            {/* Mřížka s 12 KPI kartami */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <StatCard title="Celková Obsazenost" value={`${overall.occupancyRate.toFixed(1)}%`} subtext={`${overall.occupiedBins.toLocaleString()} / ${overall.totalBins.toLocaleString()}`} icon={Percent} />
                <StatCard title="Celkem SKU" value={overall.totalSKUs.toLocaleString()} subtext="Unikátních materiálů" icon={Boxes} />
                <StatCard title="Picků za 90 dní" value={overall.totalPicks.toLocaleString()} subtext={`Ø ${overall.picksPerDay.toFixed(1)} / den`} icon={Activity} />
                <StatCard title="Položky bez pohybu" value={overall.slowMoversCount.toLocaleString()} subtext="Déle než 90 dní" icon={Clock} color="text-amber-500" />
                <StatCard title="Průměrné stáří zásob" value={`${overall.averageStockAge.toFixed(0)} dní`} icon={CalendarDays} />
                <StatCard title="Skladové Jednotky (SU)" value={overall.uniqueStorageUnits.toLocaleString()} subtext="Počet palet/boxů" icon={Archive} />
                <StatCard title="Celková váha" value={`${(overall.totalWeight / 1000).toFixed(1)} t`} subtext="Suma váhy zásob" icon={Weight} color="text-green-500" />
                <StatCard title="Volné PALETY" value={overall.emptyPalletBins.toLocaleString()} subtext="Pozice typu EP" icon={Warehouse} color="text-sky-500" />
                <StatCard title="Volné KLT" value={overall.emptyKLTBins.toLocaleString()} subtext="Pozice typu KLT/K1" icon={Box} color="text-sky-500" />
                <StatCard title="SKU v 'A' Třídě" value={overall.abcA_SKUs.toLocaleString()} subtext="Nejčastější materiály" icon={TrendingUp} />
                <StatCard title="SKU v 'B' Třídě" value={overall.abcB_SKUs.toLocaleString()} subtext="Středně časté" icon={DivideCircle} />
                <StatCard title="SKU v 'C' Třídě" value={overall.abcC_SKUs.toLocaleString()} subtext="Nejméně časté" icon={Users} color="text-red-500" />
            </div>

            {/* Graf vytíženosti po řadách */}
            <div className="bg-card-alt p-4 rounded-lg border border-border shadow-lg mt-6">
                 <h3 className="text-lg font-semibold mb-4 text-foreground">Vytíženost Skladu po Řadách</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={occupancyByRow} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" interval={0} fontSize={12} />
                        <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                        <Tooltip 
                            formatter={(value) => [`${value.toFixed(1)}%`, 'Obsazenost']}
                            cursor={{fill: 'rgba(136, 132, 216, 0.2)'}}
                            contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A', borderRadius: '0.5rem' }}
                            labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Bar dataKey="obsazenost" name="Obsazenost" radius={[4, 4, 0, 0]}>
                            {occupancyByRow.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.obsazenost > 85 ? '#f87171' : (entry.obsazenost > 60 ? '#fbbf24' : '#82ca9d')} />
                            ))}
                        </Bar>
                    </BarChart>
                 </ResponsiveContainer>
            </div>
        </div>
    );
};