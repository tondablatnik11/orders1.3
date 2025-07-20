// src/components/charts/StatusDistributionChart.jsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Brush } from 'recharts';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800/90 p-3 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm">
                <p className="label text-white font-semibold">{`Den: ${label}`}</p>
                <div className="mt-2 space-y-1 text-sm">
                    {payload.slice().reverse().map((p, index) => ( // Reverse to show from bottom up
                        p.value > 0 && (
                            <div key={index} style={{ color: p.color || p.fill }}>
                                {`${p.name}: ${p.value}`}
                            </div>
                        )
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

    const { stackedData, uniqueStatuses } = useMemo(() => {
        if (!summary || !summary.statusByLoadingDate) return { stackedData: [], uniqueStatuses: [] };

        const allAvailableStatuses = Array.from(new Set(
            Object.values(summary.statusByLoadingDate).flatMap(day =>
                Object.keys(day).filter(key => key.startsWith('status'))
            )
        )).sort((a, b) => parseInt(a.replace('status', '')) - parseInt(b.replace('status', '')));

        const rawData = Object.values(summary.statusByLoadingDate || {})
            .filter(d => d.date && !isNaN(new Date(d.date).getTime()))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const processedData = rawData.map(day => {
            const newDay = { date: format(parseISO(day.date), 'dd/MM') };
            allAvailableStatuses.forEach(statusKey => {
                newDay[statusKey] = day[statusKey] || 0;
            });
            return newDay;
        });

        return {
            stackedData: processedData,
            uniqueStatuses: allAvailableStatuses
        };
    }, [summary]);

    useEffect(() => {
        if (stackedData.length > 0) {
            const todayFormatted = format(new Date(), 'dd/MM');
            const todayIndex = stackedData.findIndex(d => d.date === todayFormatted);
            const visibleRange = 8; // Počet dnů viditelných v grafu
            
            let startIndex, endIndex;

            if (todayIndex !== -1) {
                // Vycentrovat na dnešní datum
                const halfRange = Math.floor((visibleRange - 1) / 2);
                startIndex = Math.max(0, todayIndex - halfRange);
                endIndex = Math.min(stackedData.length - 1, startIndex + visibleRange - 1);
                
                // Pokud jsme na konci a nemůžeme zobrazit celý rozsah, posuneme start zpět
                if (endIndex - startIndex < visibleRange - 1) {
                    startIndex = Math.max(0, endIndex - visibleRange + 1);
                }

            } else {
                // Pokud dnešní datum v datech není, zobrazíme posledních 8 dnů
                endIndex = stackedData.length - 1;
                startIndex = Math.max(0, endIndex - (visibleRange - 1));
            }
            
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
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }} />
                        <YAxis stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                        <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }} onClick={handleLegendClick} />
                        {uniqueStatuses.map((statusKey) => {
                             const status = statusKey.replace('status', '');
                             return (
                                <Bar
                                    key={`status-bar-${status}`}
                                    dataKey={statusKey}
                                    name={`Status ${status}`}
                                    fill={getStatusColor(status)}
                                    stackId="statusStack"
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