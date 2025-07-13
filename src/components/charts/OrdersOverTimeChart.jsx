"use client";
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { format, parseISO } from 'date-fns';
import { BarChart3, LineChart as LineChartIcon } from 'lucide-react';

export default function OrdersOverTimeChart({ summary }) {
    const { t } = useUI();
    const [chartType, setChartType] = useState('line');

    if (!summary || !summary.dailySummaries || summary.dailySummaries.length === 0) {
       return (
            <Card>
                <CardContent>
                    <h2 className="text-xl font-semibold mb-2">{t.ordersOverTime}</h2>
                    <div className="flex items-center justify-center h-[320px]">
                        <p className="text-center text-gray-500">{t.noDataAvailable}</p>
                    </div>
                </CardContent>
            </Card>
       );
    }
    
    const chartData = summary.dailySummaries
        .map(day => ({
            ...day,
            date: day.date, 
            total: day.total,
            completed: day.done, // Používáme klíč 'done' z dat
            remaining: day.remaining, // Nová hodnota "Zbývá"
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

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
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="date" stroke="#9CA3AF" tickFormatter={(tick) => format(parseISO(tick), 'dd/MM')} tick={{ fontSize: 12 }} />
                            <YAxis stroke="#9CA3AF" allowDecimals={false} tick={{ fill: "#D1D5DB" }}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                            <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }}/>
                            <Bar dataKey="completed" name={t.done} stackId="a" fill="#10B981" />
                            <Bar dataKey="remaining" name={t.remaining} stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    ) : (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="date" stroke="#9CA3AF" tickFormatter={(tick) => format(parseISO(tick), 'dd/MM')} tick={{ fontSize: 12 }} />
                            <YAxis stroke="#9CA3AF" allowDecimals={false} tick={{ fill: "#D1D5DB" }}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ stroke: '#4A5568' }}/>
                            <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }}/>
                            <Line type="monotone" dataKey="total" name={t.total} stroke="#8884d8" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }}/>
                            <Line type="monotone" dataKey="completed" name={t.done} stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }}/>
                            <Line type="monotone" dataKey="remaining" name={t.remaining} stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }}/>
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}