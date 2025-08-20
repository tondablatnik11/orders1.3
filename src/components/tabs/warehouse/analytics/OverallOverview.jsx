"use client";
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Warehouse, Boxes, Check, X, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

const OverallKpiCard = ({ total, occupied, free }) => (
    <div className="bg-card-alt p-6 rounded-lg border border-border shadow-lg col-span-1 md:col-span-3">
        <div className="flex items-center gap-4 mb-4">
            <Warehouse className="h-10 w-10 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Celkový Stav Skladu</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center divide-x divide-border/50">
            <div>
                <p className="text-sm text-muted-foreground">Celkem Pozic</p>
                <p className="text-3xl font-bold text-foreground">{total.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Obsazeno</p>
                <p className="text-3xl font-bold text-green-400">{occupied.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Volno</p>
                <p className="text-3xl font-bold text-sky-400">{free.toLocaleString()}</p>
            </div>
        </div>
    </div>
);

const DrilldownView = ({ data, type, onExport }) => (
    <div className="mt-4 border-t border-border pt-4">
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-border/50">
                    <th className="text-left p-2 text-muted-foreground">Řada</th>
                    <th className="text-right p-2 text-muted-foreground">Obsazeno</th>
                    <th className="text-right p-2 text-muted-foreground">Volno</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(data).map(([row, stats]) => (
                    <tr key={row}>
                        <td className="text-left p-2 font-semibold">Řada {row}</td>
                        <td className="text-right p-2">
                            <button onClick={() => onExport(type, row, 'occupied')} className="text-green-400 hover:underline" title={`Exportovat obsazené ${type} v řadě ${row}`}>{stats.occupied}</button>
                        </td>
                        <td className="text-right p-2">
                            <button onClick={() => onExport(type, row, 'empty')} className="text-sky-400 hover:underline" title={`Exportovat volné ${type} v řadě ${row}`}>{stats.total - stats.occupied}</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const BinTypeStatCard = ({ type, stats, drilldownData, onExport }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { total = 0, occupied = 0, rate = 0 } = stats || {};

    return (
        <div className="bg-card p-4 rounded-lg border border-border/50 transition-all duration-300">
            <button className="w-full text-left" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-foreground">{type}</span>
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm px-2 py-1 rounded-full ${rate > 80 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{rate.toFixed(1)}%</span>
                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Obsazenost</p>
                <div className="w-full bg-background rounded-full h-2.5 my-2"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${rate}%` }}></div></div>
                <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground" title="Obsazeno"><Check className="inline h-4 w-4 text-green-500"/> {occupied.toLocaleString()}</span>
                    <span className="text-muted-foreground" title="Celkem"><Boxes className="inline h-4 w-4 text-slate-400"/> {total.toLocaleString()}</span>
                </div>
            </button>
            {isExpanded && <DrilldownView data={drilldownData} type={type} onExport={onExport} />}
        </div>
    );
};

export const OverallOverview = ({ kpis, warehouseGrid }) => {
    if (!kpis || !kpis.overall || !kpis.detailedRowAnalysis || !kpis.byBinType) {
        return <div className="p-4 text-center text-muted-foreground">Načítání hlavního přehledu...</div>;
    }

    const { overall, detailedRowAnalysis, byBinType, typeOccupancyByRow } = kpis;
    const binTypesForDisplay = ['K1', 'P1', 'P2', 'P3', 'P4'];

    const handleExport = (type, row, status) => {
        if (!warehouseGrid) {
            alert("Data pro export nejsou k dispozici.");
            return;
        }

        const binsToExport = [];
        for (const bin of warehouseGrid.values()) {
            if (bin.address.startsWith(row) && bin.type === type && bin.status === status) {
                binsToExport.push({ Pozice: bin.address });
            }
        }

        if (binsToExport.length === 0) {
            alert(`Nenalezeny žádné ${status === 'occupied' ? 'obsazené' : 'volné'} pozice pro export.`);
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(binsToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pozice");
        XLSX.writeFile(workbook, `Export_${type}_Rada${row}_${status}.xlsx`);
    };
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OverallKpiCard 
                    total={overall.totalBins}
                    occupied={overall.occupiedBins}
                    free={overall.freeBins}
                />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {binTypesForDisplay.map(type => (
                    <BinTypeStatCard 
                        key={type} 
                        type={type} 
                        stats={byBinType[type]} 
                        drilldownData={typeOccupancyByRow[type]}
                        onExport={handleExport}
                    />
                ))}
            </div>
            <div className="bg-card-alt p-4 rounded-lg border border-border shadow-lg mt-6">
                 <h3 className="text-lg font-semibold mb-4 text-foreground">Detailní Vytíženost Řad 13-18</h3>
                 <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={detailedRowAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
                        <XAxis dataKey="row" />
                        <YAxis allowDecimals={false} />
                        <Tooltip 
                            cursor={{fill: 'rgba(136, 132, 216, 0.2)'}}
                            contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A', borderRadius: '0.5rem' }}
                        />
                        <Legend />
                        
                        <Bar dataKey="occupied_K1" stackId="row" name="K1 Obsazeno" fill="#15803d" />
                        <Bar dataKey="empty_K1" stackId="row" name="K1 Volno" fill="#86efac" />
                        <Bar dataKey="occupied_P1" stackId="row" name="P1 Obsazeno" fill="#1e40af" />
                        <Bar dataKey="empty_P1" stackId="row" name="P1 Volno" fill="#93c5fd" />
                        <Bar dataKey="occupied_P2" stackId="row" name="P2 Obsazeno" fill="#7e22ce" />
                        <Bar dataKey="empty_P2" stackId="row" name="P2 Volno" fill="#e9d5ff" />
                        <Bar dataKey="occupied_P3" stackId="row" name="P3 Obsazeno" fill="#ea580c" />
                        <Bar dataKey="empty_P3" stackId="row" name="P3 Volno" fill="#fed7aa" />
                        <Bar dataKey="occupied_P4" stackId="row" name="P4 Obsazeno" fill="#be123c" />
                        <Bar dataKey="empty_P4" stackId="row" name="P4 Volno" fill="#fecaca" radius={[4, 4, 0, 0]}/>
                    </BarChart>
                 </ResponsiveContainer>
            </div>
        </div>
    );
};