"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

// Komponenta pro výběr řady
const RowSelector = ({ rows, selectedRow, onSelectRow }) => (
    <select 
        value={selectedRow} 
        onChange={e => onSelectRow(e.target.value)}
        className="bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
        {rows.map(row => <option key={row} value={row}>Řada {row}</option>)}
    </select>
);

// Komponenta pro graf detailu řady
const RowDetailChart = ({ data }) => {
    // Definujeme pořadí a typy, které chceme zobrazit
    const relevantTypes = ['K1', 'P1', 'P2', 'P3', 'P4'];
    const chartData = relevantTypes.map(type => {
        const typeData = data[type] || { total: 0, occupied: 0 };
        return {
            name: type,
            Obsazeno: typeData.occupied,
            Volno: typeData.total - typeData.occupied,
        };
    });

    return(
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                    cursor={{fill: 'rgba(136, 132, 216, 0.2)'}}
                    contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A', borderRadius: '0.5rem' }}
                />
                <Legend />
                <Bar dataKey="Obsazeno" stackId="a" fill="#be123c" />
                <Bar dataKey="Volno" stackId="a" fill="#166534" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export const BinTypeByRowAnalysis = ({ kpis }) => {
    // Získáme seřazený seznam řad z dat
    const rows = useMemo(() => kpis && kpis.byRowAndType ? Object.keys(kpis.byRowAndType).sort((a,b) => parseInt(a) - parseInt(b)) : [], [kpis]);
    const [selectedRow, setSelectedRow] = useState(rows[0] || null);
    
    // Zajistí, že je vždy vybrána platná řada
    useEffect(() => {
        if (rows.length > 0 && !rows.includes(selectedRow)) {
            setSelectedRow(rows[0]);
        }
    }, [rows, selectedRow]);

    if (!kpis || !kpis.byRowAndType) {
         return <div className="p-4 text-center text-muted-foreground">Data pro analýzu řad se načítají...</div>
    }

    if (!selectedRow) {
        return <div className="p-4 text-center text-muted-foreground">Nejsou dostupná žádná data pro zobrazení analýzy po řadách.</div>
    }

    return(
        <div className="space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-2xl font-bold">Analýza Typů Míst v Řadě:</h2>
                <RowSelector rows={rows} selectedRow={selectedRow} onSelectRow={setSelectedRow} />
            </div>
            <div className="bg-card-alt p-4 rounded-lg border border-border shadow-lg">
                <RowDetailChart data={kpis.byRowAndType[selectedRow]} />
            </div>
        </div>
    );
};