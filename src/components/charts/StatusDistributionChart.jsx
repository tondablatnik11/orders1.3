// src/components/charts/StatusDistributionChart.jsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Brush } from 'recharts';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
// OPRAVA: Správný název knihovny 'date-fns'
import { format, parseISO, isBefore, addDays, startOfToday } from 'date-fns'; 
import { BarChart2 } from 'lucide-react';

// Vylepšený Tooltip, který ladí s designem
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const total = payload.reduce((sum, entry) => sum + entry.value, 0);
        return (
            <div className="bg-slate-800/80 backdrop-blur-sm p-3 border border-slate-700 rounded-lg shadow-xl text-sm">
                <p className="label text-white font-semibold">{`Den: ${label}`}</p>
                {total > 0 ? (
                    <div className="mt-2 space-y-1">
                        {payload.slice().reverse().map((p, index) => (
                            p.value > 0 && (
                                <div key={index} style={{ color: p.color || p.fill }}>
                                    {`${p.name}: ${p.value}`}
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 mt-1">Žádná data</p>
                )}
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

        let processedData = rawData.map(day => {
            const newDay = { dateObj: parseISO(day.date), date: format(parseISO(day.date), 'dd/MM') };
            allAvailableStatuses.forEach(statusKey => {
                newDay[statusKey] = day[statusKey] || 0;
            });
            return newDay;
        });
        
        if (processedData.length > 0) {
            const lastDataDate = processedData[processedData.length - 1].dateObj;
            const today = startOfToday();

            if (isBefore(lastDataDate, today)) {
                let currentDate = addDays(lastDataDate, 1);
                while (!isBefore(today, currentDate)) {
                    const emptyDay = { dateObj: currentDate, date: format(currentDate, 'dd/MM') };
                    allAvailableStatuses.forEach(statusKey => {
                        emptyDay[statusKey] = 0;
                    });
                    processedData.push(emptyDay);
                    currentDate = addDays(currentDate, 1);
                }
            }
        }

        return {
            stackedData: processedData,
            uniqueStatuses: allAvailableStatuses
        };
    }, [summary]);

    useEffect(() => {
        if (stackedData && stackedData.length > 0) {
            const todayFormatted = format(new Date(), 'dd/MM');
            let todayIndex = stackedData.findIndex(d => d.date === todayFormatted);
            
            if (todayIndex === -1) todayIndex = stackedData.length - 1;
            
            const visibleRange = 14; 
            const startIndex = Math.max(0, stackedData.length - visibleRange);
            const endIndex = stackedData.length - 1;
            
            setBrushDomain({ startIndex, endIndex });
        }
    }, [stackedData]);

    const handleLegendClick = (e) => {
        const { dataKey } = e;
        setHiddenStatuses(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    if (stackedData.length === 0) return <Card><CardContent><p>{t.noDataAvailable}</p></CardContent></Card>;

    return (
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-sky-400" />
                    <span className="text-lg">{t.statusDistribution}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={stackedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={onBarClick}>
                        <defs>
                            {uniqueStatuses.map(statusKey => {
                                const status = statusKey.replace('status', '');
                                const color = getStatusColor(status);
                                return (
                                    <linearGradient key={`gradient-${status}`} id={`color${status}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={color} stopOpacity={0.4}/>
                                    </linearGradient>
                                );
                            })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
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
                                     fill={`url(#color${status})`}
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
                            tickFormatter={(index) => stackedData[index]?.date}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}