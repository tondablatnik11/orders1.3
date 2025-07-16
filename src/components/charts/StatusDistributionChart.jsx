"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Brush } from 'recharts';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { format, parseISO } from 'date-fns';

export default function StatusDistributionChart() {
    const { summary } = useData();
    const { t } = useUI();
    const [brushDomain, setBrushDomain] = useState({ startIndex: 0, endIndex: 0 });

    const stackedData = useMemo(() => {
        if (!summary || !summary.statusByLoadingDate) return [];
        return Object.values(summary.statusByLoadingDate || {})
            .filter(d => d.date && !isNaN(new Date(d.date).getTime()))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(d => ({ ...d, date: format(parseISO(d.date), 'dd/MM') }));
    }, [summary]);

    useEffect(() => {
        if (stackedData.length > 0) {
            const endIndex = stackedData.length - 1;
            const startIndex = Math.max(0, endIndex - 30);
            setBrushDomain({ startIndex, endIndex });
        }
    }, [stackedData.length]);

    const uniqueStatuses = useMemo(() => {
        if (!summary) return [];
        return Array.from(new Set(summary.allOrdersData.map(row => Number(row.Status)).filter(s => !isNaN(s)))).sort((a, b) => a - b);
    }, [summary]);

    if (stackedData.length === 0) return <Card><CardContent><p>{t.noDataAvailable}</p></CardContent></Card>;

    return (
        <Card>
            <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">{t.statusDistribution}</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={stackedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }} />
                        <YAxis stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                        <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }} />
                        {uniqueStatuses.map((status) => (
                            <Bar key={`status-bar-${status}`} dataKey={`status${status}`} name={`Status ${status}`} fill={getStatusColor(status)} stackId="statusStack" />
                        ))}
                        <Brush 
                            dataKey="date" 
                            height={30} 
                            stroke="#8884d8" 
                            startIndex={brushDomain.startIndex} 
                            endIndex={brushDomain.endIndex}
                            onChange={(newDomain) => setBrushDomain(newDomain)}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}