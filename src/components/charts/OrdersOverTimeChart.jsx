// src/components/charts/OrdersOverTimeChart.jsx
"use client";
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { format, parseISO } from 'date-fns';

// Skeleton Loader komponenta pro tento graf
const ChartSkeleton = () => (
    <Card>
        <CardContent className="pt-6">
            <div className="skeleton h-8 w-48 mb-4"></div>
            <div className="skeleton h-[320px] w-full"></div>
        </CardContent>
    </Card>
);

export default function OrdersOverTimeChart({ summary }) {
    const { t } = useUI();
    const [opacity, setOpacity] = useState({ total: 1, completed: 1, remaining: 1 });

    if (!summary || !summary.dailySummaries || summary.dailySummaries.length === 0) {
       return <ChartSkeleton />; // OPRAVA: Vložen správný skeleton loader
    }
    
    const chartData = summary.dailySummaries
        .map(day => ({
            date: format(parseISO(day.date), 'dd/MM'),
            total: day.total,
            completed: day.done,
            remaining: day.remaining,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const handleLegendClick = (dataKey) => {
        setOpacity(prev => ({ ...prev, [dataKey]: prev[dataKey] === 1 ? 0.2 : 1 })); // Změna na ztlumení místo skrytí
    };

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t.ordersOverTime}</h2>
                <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#9CA3AF" allowDecimals={false} tick={{ fill: "#D1D5DB" }}/>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ stroke: '#4A5568' }}/>
                        <Legend onClick={(e) => handleLegendClick(e.dataKey)} wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="total" name={t.total} stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} activeDot={{ r: 6 }} opacity={opacity.total} />
                        <Area type="monotone" dataKey="completed" name={t.done} stroke="#10B981" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} activeDot={{ r: 6 }} opacity={opacity.completed} />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}