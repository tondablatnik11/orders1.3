"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { CHART_COLORS } from '@/lib/utils';

export default function DailyStatusChart({ data }) {
    const { t } = useUI();
    
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                <Tooltip
                    cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                />
                <Bar dataKey="value" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} name={t.total} />
            </BarChart>
        </ResponsiveContainer>
    );
}