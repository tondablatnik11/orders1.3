"use client";
import React, { useState, useCallback } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { CHART_COLORS } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const renderActiveShape = (props) => {
    // ... kód pro renderActiveShape zůstává stejný ...
};

// ZMĚNA: Přijímáme 'summary' jako prop
export default function StatusDistributionChart({ summary }) { 
    const { t } = useUI();
    const [chartType, setChartType] = useState('stackedBar');
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = useCallback((_, index) => setActiveIndex(index), []);

    // ZMĚNA: Používáme 'summary' z props, ne z useData()
    const pieData = Object.entries(summary?.statusCounts || {}).map(([status, count]) => ({ name: `Status ${status}`, value: count })).filter(item => item.value > 0);
    const stackedData = Object.values(summary?.statusByLoadingDate || {}).sort((a, b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-')));
    const uniqueStatuses = Array.from(new Set(summary?.allOrdersData?.map(row => Number(row.Status)).filter(s => !isNaN(s)))).sort((a, b) => a - b);

    if (pieData.length === 0) {
        return <Card><CardContent><h2 className="text-xl font-semibold mb-2">{t.statusDistribution}</h2><p className="text-center p-8">{t.noDataAvailable}</p></CardContent></Card>
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
                <ResponsiveContainer width="100%" height={320}>
                    {chartType === 'pie' ? (
                        <PieChart>
                            <Pie activeIndex={activeIndex} activeShape={renderActiveShape} data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" dataKey="value" onMouseEnter={onPieEnter}>
                                {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                            </Pie>
                        </PieChart>
                    ) : (
                        <BarChart data={stackedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }} />
                            <YAxis stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                            <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }} />
                            {uniqueStatuses.map((status, index) => (
                                <Bar key={`status-bar-${status}`} dataKey={`status${status}`} name={`Status ${status}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stackId="statusStack" />
                            ))}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}