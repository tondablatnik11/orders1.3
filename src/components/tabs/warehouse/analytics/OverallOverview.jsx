"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { 
    Warehouse, Boxes, Activity, Clock, Percent, PackagePlus
} from 'lucide-react';

// Vylepšená KPI karta s vizuálním prvkem (progress bar)
const KpiCard = ({ title, value, subtext, progress, icon: Icon, color }) => (
    <div className="bg-card-alt p-4 rounded-lg border border-border flex-grow shadow-md hover:shadow-primary/20 transition-shadow">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
                <Icon className={`h-8 w-8 ${color || 'text-primary'}`} />
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">{subtext}</p>
        </div>
        {progress !== undefined && (
            <div className="w-full bg-background rounded-full h-2.5 mt-3">
                <div className={`${color || 'bg-primary'} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
            </div>
        )}
    </div>
);

// Hlavní komponenta
export const OverallOverview = ({ kpis }) => {
    if (!kpis || !kpis.overall || !kpis.detailedRowAnalysis) {
        return <div className="p-4 text-center text-muted-foreground">Načítání hlavního přehledu...</div>;
    }

    const { overall, detailedRowAnalysis } = kpis;
    
    return (
        <div className="space-y-6">
            {/* Profesionální KPI karty */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard 
                    title="Vytížení Kapacity (Pozice)" 
                    value={`${overall.occupancyRate.toFixed(1)}%`} 
                    subtext={`${overall.occupiedBins.toLocaleString()} / ${overall.totalBins.toLocaleString()}`}
                    progress={overall.occupancyRate}
                    icon={Warehouse} 
                />
                <KpiCard 
                    title="Vytížení Kapacity (Váha)" 
                    value={`${overall.weightOccupancyRate.toFixed(1)}%`} 
                    subtext="Aktuální váha vs. Max. nosnost"
                    progress={overall.weightOccupancyRate}
                    icon={PackagePlus}
                    color="text-green-500"
                />
                <KpiCard 
                    title="Aktivita Skladu" 
                    value={`${overall.picksPerDay.toFixed(1)}`} 
                    subtext="Průměr picků / den (90d)"
                    icon={Activity} 
                />
                <KpiCard 
                    title="Počet SKU na Skladě" 
                    value={overall.totalSKUs.toLocaleString()} 
                    subtext="Unikátních materiálů"
                    icon={Boxes} 
                />
                <KpiCard 
                    title="Efektivita Vychystávání" 
                    value={`${overall.pickingEfficiency.toFixed(2)}`} 
                    subtext="Počet picků na 1 SKU"
                    icon={Activity} 
                />
                <KpiCard 
                    title="Pomalé Zásoby (>90d)" 
                    value={overall.slowMoversCount.toLocaleString()} 
                    subtext="Počet materiálů bez pohybu"
                    icon={Clock}
                    color="text-amber-500"
                />
            </div>

            {/* Nový, detailní graf vytíženosti po řadách */}
            <div className="bg-card-alt p-4 rounded-lg border border-border shadow-lg mt-6">
                 <h3 className="text-lg font-semibold mb-4 text-foreground">Detailní Vytíženost Řad 13-18</h3>
                 <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={detailedRowAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
                        <XAxis dataKey="row" />
                        <YAxis />
                        <Tooltip 
                            cursor={{fill: 'rgba(136, 132, 216, 0.2)'}}
                            contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A', borderRadius: '0.5rem' }}
                        />
                        <Legend />
                        {/* KLT Pozice */}
                        <Bar dataKey="occupied_KLT" stackId="KLT" name="KLT Obsazeno" fill="#166534" />
                        <Bar dataKey="empty_KLT" stackId="KLT" name="KLT Volno" fill="#4ade80" />
                        {/* Paletové pozice */}
                        <Bar dataKey="occupied_EP1" stackId="EP1" name="EP1 Obsazeno" fill="#1e3a8a" />
                        <Bar dataKey="empty_EP1" stackId="EP1" name="EP1 Volno" fill="#60a5fa" />
                        <Bar dataKey="occupied_EP2" stackId="EP2" name="EP2 Obsazeno" fill="#86198f" />
                        <Bar dataKey="empty_EP2" stackId="EP2" name="EP2 Volno" fill="#e879f9" />
                        <Bar dataKey="occupied_EP3" stackId="EP3" name="EP3 Obsazeno" fill="#9a3412" />
                        <Bar dataKey="empty_EP3" stackId="EP3" name="EP3 Volno" fill="#fb923c" />
                        <Bar dataKey="occupied_EP4" stackId="EP4" name="EP4 Obsazeno" fill="#b91c1c" />
                        <Bar dataKey="empty_EP4" stackId="EP4" name="EP4 Volno" fill="#f87171" />
                    </BarChart>
                 </ResponsiveContainer>
            </div>
        </div>
    );
};