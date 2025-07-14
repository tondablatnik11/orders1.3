"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Brush } from 'recharts'; // Přidán Brush
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { format, parseISO } from 'date-fns';

export default function StatusDistributionChart() {
    const { summary } = useData();
    const { t } = useUI();

    if (!summary || !summary.statusByLoadingDate) return <Card><CardContent><p>{t.noDataAvailable}</p></CardContent></Card>;
    
    const stackedData = Object.values(summary.statusByLoadingDate || {}).sort((a, b) => new Date(a.date) - new Date(b.date)).map(d => ({ ...d, date: format(parseISO(d.date), 'dd/MM')}));
    const uniqueStatuses = Array.from(new Set(summary.allOrdersData.map(row => Number(row.Status)).filter(s => !isNaN(s)))).sort((a, b) => a - b);

    if (stackedData.length === 0) return <Card><CardContent><p>{t.noDataAvailable}</p></CardContent></Card>;

    return (
        <Card>
            <CardContent>
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
                        {/* Přidání Brush pro zoom a posun */}
                        <Brush dataKey="date" height={30} stroke="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}