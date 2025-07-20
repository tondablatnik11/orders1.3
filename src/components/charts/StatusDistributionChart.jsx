// src/components/charts/StatusDistributionChart.jsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Brush } from 'recharts';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { format, parseISO } from 'date-fns';

// Komponenta pro vlastní vzhled tooltipu
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 p-3 border border-gray-700 rounded-lg shadow-xl">
                <p className="label text-white font-semibold">{`Den: ${label}`}</p>
                <div className="mt-2 space-y-1">
                    {payload.map((p, index) => (
                        <div key={index} style={{ color: p.color }}>
                            {`${p.name}: ${p.value}`}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function StatusDistributionChart({ onBarClick }) {
    const { summary } = useData();
    const { t } = useUI();
    const [brushDomain, setBrushDomain] = useState({ startIndex: 0, endIndex: 0 });
    const [hiddenStatuses, setHiddenStatuses] = useState({});

    // Logika pro agregaci méně častých statusů
    const { stackedData, uniqueStatuses } = useMemo(() => {
        if (!summary || !summary.statusByLoadingDate) return { stackedData: [], uniqueStatuses: [] };

        const totalCounts = {};
        Object.values(summary.statusByLoadingDate).forEach(day => {
            Object.keys(day).forEach(key => {
                if (key.startsWith('status')) {
                    totalCounts[key] = (totalCounts[key] || 0) + day[key];
                }
            });
        });

        const totalOrders = Object.values(totalCounts).reduce((sum, count) => sum + count, 0);
        const frequentStatuses = new Set(Object.entries(totalCounts)
            .filter(([, count]) => (count / totalOrders) > 0.02) // Zobrazit statusy, které tvoří více než 2 % celku
            .map(([key]) => key));
        
        // Zajistíme, že status 40 bude vždy viditelný, pokud existuje
        if (totalCounts['status40']) {
            frequentStatuses.add('status40');
        }
        
        const rawData = Object.values(summary.statusByLoadingDate || {})
            .filter(d => d.date && !isNaN(new Date(d.date).getTime()))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const processedData = rawData.map(day => {
            const newDay = { date: format(parseISO(day.date), 'dd/MM'), Ostatní: 0 };
            Object.keys(day).forEach(key => {
                if (key.startsWith('status')) {
                    if (frequentStatuses.has(key)) {
                        newDay[key] = day[key];
                    } else {
                        newDay['Ostatní'] += day[key];
                    }
                }
            });
            return newDay;
        });
        
        const statuses = Array.from(frequentStatuses);
        if (processedData.some(d => d.Ostatní > 0)) {
            statuses.push('Ostatní');
        }
        
        return { 
            stackedData: processedData, 
            uniqueStatuses: statuses.sort((a, b) => {
                if (a === 'Ostatní') return 1;
                if (b === 'Ostatní') return -1;
                return parseInt(a.replace('status', '')) - parseInt(b.replace('status', ''));
            })
        };
    }, [summary]);

    useEffect(() => {
        if (stackedData.length > 0) {
            const endIndex = stackedData.length - 1;
            const startIndex = Math.max(0, endIndex - 30);
            setBrushDomain({ startIndex, endIndex });
        }
    }, [stackedData.length]);

    const handleLegendClick = (e) => {
        const { dataKey } = e;
        setHiddenStatuses(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    if (stackedData.length === 0) return <Card><CardContent><p>{t.noDataAvailable}</p></CardContent></Card>;

    return (
        <Card>
            <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">{t.statusDistribution}</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={stackedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={onBarClick}>
                        <defs>
                            {uniqueStatuses.map((statusKey) => {
                                const status = statusKey.replace('status', '');
                                const color = status === 'Ostatní' ? '#64748B' : getStatusColor(status);
                                return (
                                    <linearGradient key={`gradient-${status}`} id={`colorStatus${status}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={color} stopOpacity={0.4}/>
                                    </linearGradient>
                                )
                            })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }} />
                        <YAxis stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                        <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }} onClick={handleLegendClick} />
                        {uniqueStatuses.map((statusKey) => {
                             const status = statusKey.replace('status', '');
                             const color = status === 'Ostatní' ? '#64748B' : getStatusColor(status);
                             return (
                                <Bar 
                                    key={`status-bar-${status}`} 
                                    dataKey={statusKey} 
                                    name={status === 'Ostatní' ? 'Ostatní' : `Status ${status}`} 
                                    fill={`url(#colorStatus${status})`} 
                                    stackId="statusStack" 
                                    radius={[4, 4, 0, 0]} 
                                    hide={hiddenStatuses[statusKey]}
                                />
                            )
                        })}
                        <Brush 
                            dataKey="date" 
                            height={30} 
                            stroke="#8884d8" 
                            startIndex={brushDomain.startIndex} 
                            endIndex={brushDomain.endIndex}
                            onChange={(newDomain) => setBrushDomain(newDomain)}
                            fill="rgba(100, 116, 139, 0.2)"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}