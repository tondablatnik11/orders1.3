"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

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
    const chartData = Object.entries(data)
        .map(([name, values]) => ({ 
            name, 
            obsazeno: values.occupied,
            volno: values.total - values.occupied,
            picky: values.picks 
        }))
        .sort((a,b) => a.name.localeCompare(b.name));

    return(
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Počet Pozic', angle: -90, position: 'insideLeft', fill: '#8884d8' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Počet Picků', angle: -90, position: 'insideRight', fill: '#82ca9d' }}/>
                <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A', borderRadius: '0.5rem' }}/>
                <Legend />
                <Bar yAxisId="left" dataKey="obsazeno" name="Obsazeno" stackId="capacity" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="volno" name="Volno" stackId="capacity" fill="rgba(136, 132, 216, 0.2)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="picky" name="Počet picků" fill="#82ca9d" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export const BinTypeByRowAnalysis = ({ kpis }) => {
    const rows = useMemo(() => kpis && kpis.byRowAndType ? Object.keys(kpis.byRowAndType).sort((a,b) => parseInt(a) - parseInt(b)) : [], [kpis]);
    const [selectedRow, setSelectedRow] = useState(rows[0] || null);
    
    useEffect(() => {
        if (rows.length > 0 && !rows.includes(selectedRow)) {
            setSelectedRow(rows[0]);
        } else if (rows.length === 0 && selectedRow !== null) {
            setSelectedRow(null);
        }
    }, [rows, selectedRow]);

    if (!selectedRow) {
        return <div className="p-4 text-center text-muted-foreground">Nejsou dostupná data pro zobrazení analýzy po řadách.</div>
    }

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