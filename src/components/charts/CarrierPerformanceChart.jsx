"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartSkeleton } from '../shared/ChartSkeleton';

export default function CarrierPerformanceChart() {
    const { summary, isLoadingData } = useData();

    if (isLoadingData || !summary?.ordersByForwardingAgent) {
        return <ChartSkeleton title="Výkon dopravců" />;
    }
    
    // Zobrazíme TOP 10 dopravců
    const data = summary.ordersByForwardingAgent.slice(0, 10);

    return (
        <div className="glass-card p-4 rounded-xl h-[400px]">
            <h3 className="text-xl font-bold text-slate-200 mb-4">TOP 10 Dopravců</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" />
                    <Tooltip cursor={{ fill: 'rgba(136, 132, 216, 0.1)' }} contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', borderRadius: '0.5rem' }} />
                    <Legend />
                    <Bar dataKey="Počet zakázek" fill="#22d3ee" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}