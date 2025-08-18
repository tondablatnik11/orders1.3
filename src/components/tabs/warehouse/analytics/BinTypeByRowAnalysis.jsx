"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const RowSelector = ({ rows, selectedRow, onSelectRow }) => (
    <select 
        value={selectedRow} 
        onChange={e => onSelectRow(e.target.value)}
        className="bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
        {rows.map(row => <option key={row} value={row}>Řada {row}</option>)}
    </select>
);

const RowDetailChart = ({ data }) => {
    const chartData = Object.entries(data).map(([name, values]) => ({ name, ...values, rate: (values.total > 0 ? (values.occupied/values.total)*100 : 0) }));
    return(
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A' }} formatter={(value, name) => [name === 'rate' ? `${value.toFixed(1)}%` : value, name]}/>
                <Legend />
                <Bar dataKey="occupied" name="Obsazeno" stackId="a" fill="#38BDF8" />
                <Bar dataKey="picks" name="Počet picků" stackId="a" fill="#8B5CF6" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export const BinTypeByRowAnalysis = ({ kpis }) => {
    // OPRAVA: Zajištění, že data existují, než se je pokusíme použít
    const rows = useMemo(() => kpis && kpis.byRowAndType ? Object.keys(kpis.byRowAndType).sort((a,b) => parseInt(a) - parseInt(b)) : [], [kpis]);
    const [selectedRow, setSelectedRow] = useState(rows[0] || null);
    
    useEffect(() => {
        if (rows.length > 0 && !rows.includes(selectedRow)) {
            setSelectedRow(rows[0]);
        } else if (rows.length === 0 && selectedRow !== null) {
            setSelectedRow(null);
        }
    }, [rows, selectedRow]);

    if (!selectedRow) return <div className="p-4 text-center text-muted-foreground">Nejsou dostupná data pro zobrazení analýzy po řadách.</div>

    return(
        <div className="space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-2xl font-bold">Analýza Typů Míst v Řadě:</h2>
                <RowSelector rows={rows} selectedRow={selectedRow} onSelectRow={setSelectedRow} />
            </div>
            <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Přehled pro Řadu {selectedRow}</h3>
                <RowDetailChart data={kpis.byRowAndType[selectedRow]} />
            </div>
        </div>
    );
};