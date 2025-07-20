// src/components/charts/OrdersOverTimeChart.jsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Brush } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { format, parseISO } from 'date-fns';

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
    const [opacity, setOpacity] = useState({ total: 1, completed: 1 });
    const [brushDomain, setBrushDomain] = useState({ startIndex: 0, endIndex: 0 });

    const chartData = useMemo(() => {
        if (!summary || !summary.dailySummaries || summary.dailySummaries.length === 0) {
            return [];
        }
        return summary.dailySummaries
            .map(day => ({
                date: format(parseISO(day.date), 'dd/MM'),
                fullDate: day.date,
                total: day.total,
                completed: day.done,
            }))
            .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    }, [summary]);

    useEffect(() => {
        if (chartData.length > 0) {
            const endIndex = chartData.length - 1;
            const startIndex = Math.max(0, endIndex - 30);
            setBrushDomain({ startIndex, endIndex });
        }
    }, [chartData.length]);

    if (!chartData.length) {
       return <ChartSkeleton />;
    }
    
    const handleLegendClick = (dataKey) => {
        setOpacity(prev => ({ ...prev, [dataKey]: prev[dataKey] === 1 ? 0.2 : 1 }));
    };

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t.ordersOverTime}</h2>
                <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#9CA3AF" allowDecimals={false} tick={{ fill: "#D1D5DB" }}/>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ stroke: '#4A5568' }}/>
                        <Legend onClick={(e) => handleLegendClick(e.dataKey)} wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="total" name={t.total} stroke="#8884d8" fill="url(#colorTotal)" strokeWidth={2} activeDot={{ r: 6 }} opacity={opacity.total} />
                        <Area type="monotone" dataKey="completed" name={t.done} stroke="#10B981" fill="url(#colorCompleted)" strokeWidth={2} activeDot={{ r: 6 }} opacity={opacity.completed} />
                        <Brush 
                            dataKey="date" 
                            height={25} 
                            stroke="#8884d8" 
                            startIndex={brushDomain.startIndex} 
                            endIndex={brushDomain.endIndex}
                            onChange={(newDomain) => setBrushDomain(newDomain)}
                            y={290}
                            fill="rgba(100, 116, 139, 0.2)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}