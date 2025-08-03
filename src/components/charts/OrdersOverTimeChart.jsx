// src/components/charts/OrdersOverTimeChart.jsx
"use client";
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, ReferenceLine } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { format, parseISO } from 'date-fns';
import { TrendingUp } from 'lucide-react';

const ChartSkeleton = () => (
    <Card>
        <CardContent className="pt-6">
            <div className="animate-pulse h-8 w-48 mb-4 bg-slate-700 rounded"></div>
            <div className="animate-pulse h-[320px] w-full bg-slate-700 rounded"></div>
        </CardContent>
    </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-800/80 backdrop-blur-sm p-3 border border-slate-700 rounded-lg shadow-xl text-sm">
                <p className="label text-white font-semibold mb-2">{`Den: ${label}`}</p>
                {payload.map((p, index) => (
                    <div key={index} style={{ color: p.color }}>
                        {`${p.name}: ${p.value}`}
                    </div>
                ))}
                {data.movingAverage && <p style={{ color: '#FBBF24' }}>7-denní průměr: {data.movingAverage.toFixed(1)}</p>}
            </div>
        );
    }
    return null;
};

export default function OrdersOverTimeChart({ summary }) {
    const { t } = useUI();
    const [timeRange, setTimeRange] = useState(90);

    const chartData = useMemo(() => {
        if (!summary || !summary.dailySummaries || summary.dailySummaries.length === 0) {
            return [];
        }
        
        const sortedData = summary.dailySummaries
            .map(day => ({ ...day, dateObj: parseISO(day.date) }))
            .sort((a, b) => a.dateObj - b.dateObj);
        
        const dataWithMovingAverage = sortedData.map((day, index, arr) => {
            const start = Math.max(0, index - 6);
            const slice = arr.slice(start, index + 1);
            const sum = slice.reduce((acc, curr) => acc + curr.total, 0);
            return {
                date: format(parseISO(day.date), 'dd/MM'),
                total: day.total,
                completed: day.status_done_all,
                movingAverage: sum / slice.length
            };
        });

        if (timeRange === 0) return dataWithMovingAverage;
        return dataWithMovingAverage.slice(-timeRange);

    }, [summary, timeRange]);

    if (!summary || chartData.length === 0) {
       return <ChartSkeleton />;
    }

    return (
        <Card>
             <CardHeader>
                 <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <span className="text-lg">{t.ordersOverTime}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-700/50 p-1 rounded-md">
                        {[7, 30, 90, 0].map(range => (
                            <button 
                                key={range} 
                                onClick={() => setTimeRange(range)}
                                className={`px-2 py-1 text-xs rounded ${timeRange === range ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
                            >
                                {range === 0 ? 'Vše' : `${range}D`}
                            </button>
                        ))}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12, fill: "#D1D5DB" }} />
                        <YAxis stroke="#9CA3AF" allowDecimals={false} tick={{ fill: "#D1D5DB" }}/>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="total" name={t.total} stroke="#3b82f6" fill="url(#colorTotal)" strokeWidth={2} activeDot={{ r: 6, stroke: '#0f172a', strokeWidth: 2 }} />
                        <Area type="monotone" dataKey="completed" name={t.done} stroke="#10b981" fill="url(#colorCompleted)" strokeWidth={2} activeDot={{ r: 6, stroke: '#0f172a', strokeWidth: 2 }} />
                        <ReferenceLine yAxisId={0} dataKey="movingAverage" stroke="#FBBF24" strokeDasharray="3 3" name="7-denní průměr" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}