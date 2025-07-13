"use client";
import React, { useState, useCallback } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { CHART_COLORS } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function StatusDistributionChart() {
    const { summary } = useData();
    const { t } = useUI();
    const [chartType, setChartType] = useState('stackedBar');

    const pieData = Object.entries(summary?.statusCounts || {}).map(([status, count]) => ({ name: `Status ${status}`, value: count })).filter(item => item.value > 0);
    
    // OPRAVA: Zajištění správného řazení a formátování dat pro graf
    const stackedData = Object.values(summary?.statusByLoadingDate || {})
        .sort((a, b) => new Date(a.date) - new Date(b.date)) // Řazení podle plného data
        .map(d => ({ 
            ...d, 
            date: format(parseISO(d.date), 'dd/MM') // Formátování až pro zobrazení
        }));

    const uniqueStatuses = Array.from(new Set(summary?.allOrdersData?.map(row => Number(row.Status)).filter(s => !isNaN(s)))).sort((a, b) => a - b);

    if (pieData.length === 0) {
        return <Card><CardContent><h2 className="text-xl font-semibold mb-2">{t.statusDistribution}</h2><div className="flex items-center justify-center h-[320px]"><p className="text-center text-gray-500">{t.noDataAvailable}</p></div></CardContent></Card>;
    }

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t.statusDistribution}</h2>
                    <div className="flex gap-2">
                         <button onClick={() => setChartType('stackedBar')} className={`p-2 rounded-full ${chartType === 'stackedBar' ? 'bg-blue-600' : 'bg-gray-700'}`} title={t.stackedBarChart}><BarChart3 className="w-5 h-5" /></button>
                         <button onClick={() => setChartType('pie')} className={`p-2 rounded-full ${chartType === 'pie' ? 'bg-blue-600' : 'bg-gray-700'}`} title={t.pieChart}><PieChartIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                    {chartType === 'pie' ? (
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} fill="#8884d8" dataKey="value" label>
                                {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                            <Legend />
                        </PieChart>
                    ) : (
                        <BarChart data={stackedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }} />
                            <YAxis stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                            <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }} />
                            {uniqueStatuses.map((status, index) => (
                                <Bar key={`status-bar-${status}`} dataKey={`status${status}`} name={`Status ${status}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stackId="statusStack" radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}