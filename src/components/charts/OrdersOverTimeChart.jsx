"use client";
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { CHART_COLORS } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { format } from 'date-fns';
import { BarChart3, LineChart as LineChartIcon } from 'lucide-react';

export default function OrdersOverTimeChart({ summary }) {
    const { t } = useUI();
    // OPRAVA: Výchozí graf je nyní čárový
    const [chartType, setChartType] = useState('line');

    if (!summary || !summary.dailySummaries) {
        return <p>{t.noDataAvailable}</p>;
    }

    const chartData = summary.dailySummaries.map(day => ({
        date: day.date,
        total: day.total,
        remaining: day.remaining,
        new: day.new, // Změna na `new` podle `dataProcessor`
        inProgress: day.inProgress,
        completed: day.done, // Změna na `done` podle `dataProcessor`
    })) || [];

    if (chartData.length === 0) {
       return <Card><CardContent><h2 className="text-xl font-semibold mb-2">{t.ordersOverTime}</h2><p className="text-center p-8">{t.noDataAvailable}</p></CardContent></Card>
    }

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t.ordersOverTime}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setChartType('bar')} className={`p-2 rounded-full ${chartType === 'bar' ? 'bg-blue-600' : 'bg-gray-700'}`} title={t.barChart}><BarChart3 className="w-5 h-5" /></button>
                        <button onClick={() => setChartType('line')} className={`p-2 rounded-full ${chartType === 'line' ? 'bg-blue-600' : 'bg-gray-700'}`} title={t.lineChart}><LineChartIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                    {chartType === 'bar' ? (
                        <BarChart data={chartData}>
                            <XAxis dataKey="date" stroke="#9CA3AF" tickFormatter={(tick) => format(new Date(tick), 'dd/MM')} tick={{ fontSize: 12 }} />
                            <YAxis stroke="#9CA3AF" allowDecimals={false} tick={{ fill: "#D1D5DB" }}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                            <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }}/>
                            <Bar dataKey="completed" name={t.done} stackId="a" fill={CHART_COLORS[4]} />
                            <Bar dataKey="inProgress" name={t.inProgress} stackId="a" fill={CHART_COLORS[3]} />
                            <Bar dataKey="new" name={t.newOrders} stackId="a" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    ) : (
                        <LineChart data={chartData}>
                             <XAxis dataKey="date" stroke="#9CA3AF" tickFormatter={(tick) => format(new Date(tick), 'dd/MM')} tick={{ fontSize: 12 }} />
                            <YAxis stroke="#9CA3AF" allowDecimals={false} tick={{ fill: "#D1D5DB" }}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ stroke: '#4A5568' }}/>
                            <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }}/>
                            <Line type="monotone" dataKey="total" name={t.total} stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }}/>
                            <Line type="monotone" dataKey="completed" name={t.done} stroke={CHART_COLORS[4]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }}/>
                            <Line type="monotone" dataKey="inProgress" name={t.inProgress} stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }}/>
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}