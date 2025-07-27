// src/components/charts/StatusDistributionChart.jsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Brush } from 'recharts';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { format, parseISO, isBefore, addDays, startOfToday } from 'date-fns';
import { BarChart2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const total = payload.reduce((sum, entry) => sum + entry.value, 0);
        return (
            <div className="bg-gray-800/90 p-3 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm">
                <p className="label text-white font-semibold">{`Den: ${label}`}</p>
                {total > 0 ? (
                    <div className="mt-2 space-y-1 text-sm">
                        {payload.slice().reverse().map((p, index) => (
                            p.value > 0 && (
                                <div key={index} style={{ color: p.color || p.fill }}>
                                    {`${p.name}: ${p.value}`}
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 mt-1">Žádná data</p>
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
            const visibleRange = 8;
            
            let startIndex, endIndex;

            if (todayIndex === -1) {
                todayIndex = stackedData.length - 1;
            }

            const halfRangeBefore = 4;
            const halfRangeAfter = 3;

            startIndex = Math.max(0, todayIndex - halfRangeBefore);
            endIndex = Math.min(stackedData.length - 1, todayIndex + halfRangeAfter);

            if (endIndex - startIndex + 1 < visibleRange) {
                if (startIndex === 0) {
                    endIndex = Math.min(stackedData.length - 1, visibleRange - 1);
                } else {
                    startIndex = Math.max(0, endIndex - visibleRange + 1);
                }
            }
            
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
                    <BarChart2 className="w-6 h-6 text-sky-400" />
                    {t.statusDistribution}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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