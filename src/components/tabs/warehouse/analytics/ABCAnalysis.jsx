"use client";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ABCStat = ({ title, color, materialCount, pickCount, pickPercent }) => (
    <div className={`p-6 rounded-lg border-l-4 ${color}`}>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-3xl font-extrabold text-foreground mt-2">{materialCount}<span className="text-lg font-medium text-muted-foreground"> materiálů</span></p>
        <p className="text-muted-foreground mt-2">Zodpovídá za <span className="font-bold text-foreground">{pickCount.toLocaleString()}</span> picků</p>
        <p className="text-sm font-bold text-primary">{pickPercent.toFixed(1)}% celkové aktivity</p>
    </div>
);

const ABCTable = ({ materials }) => (
    <div className="mt-4 max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground">Materiál</th>
                    <th className="text-right p-2 text-muted-foreground">Počet Picků</th>
                    <th className="text-right p-2 text-muted-foreground">Počet Pozic</th>
                </tr>
            </thead>
            <tbody>
                {materials.map(item => (
                    <tr key={item.material} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="p-2 font-medium">{item.material}</td>
                        <td className="text-right p-2">{item.count}</td>
                        <td className="text-right p-2">{item.locations}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const ABCAnalysis = ({ kpis }) => {
    // OPRAVA: Zajištění, že data existují, než se je pokusíme použít
    if (!kpis || !kpis.abcAnalysis || !kpis.abcAnalysis.A?.materials || !kpis.abcAnalysis.B?.materials || !kpis.abcAnalysis.C?.materials) {
        return <div className="p-4 text-center text-muted-foreground">Data pro ABC analýzu nejsou k dispozici. Zkontrolujte, zda byla nahrána data o pickování.</div>;
    }

    const { A, B, C } = kpis.abcAnalysis;
    const totalPicks = kpis.overall.totalPicks;

    if (totalPicks === 0) {
         return <div className="p-4 text-center text-muted-foreground">Nebyly nalezeny žádné záznamy o pickování pro provedení ABC analýzy.</div>;
    }

    const chartData = [
        { name: `A (${A.materials.length} SKU)`, value: A.picks },
        { name: `B (${B.materials.length} SKU)`, value: B.picks },
        { name: `C (${C.materials.length} SKU)`, value: C.picks },
    ];
    const COLORS = ['#22C55E', '#F97316', '#EF4444'];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">ABC Analýza Materiálů</h2>
            <p className="text-muted-foreground max-w-2xl">Rozdělení materiálů podle Paretova principu (80/20). Identifikuje "rychloobrátkové" (A) a "pomalé" (C) materiály, což je klíčové pro optimalizaci jejich umístění ve skladu.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ABCStat title="Skupina A" color="border-green-500" materialCount={A.materials.length} pickCount={A.picks} pickPercent={(A.picks / totalPicks) * 100} />
                <ABCStat title="Skupina B" color="border-orange-500" materialCount={B.materials.length} pickCount={B.picks} pickPercent={(B.picks / totalPicks) * 100} />
                <ABCStat title="Skupina C" color="border-red-500" materialCount={C.materials.length} pickCount={C.picks} pickPercent={(C.picks / totalPicks) * 100} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-background p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Distribuce Picků do ABC Skupin</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} label>
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                            </Pie>
                             <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A' }}/>
                             <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-background p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-foreground">Detailní přehled - Skupina A</h3>
                    <ABCTable materials={A.materials}/>
                </div>
            </div>
        </div>
    );
};