"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { CHART_COLORS } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';

export default function ShiftComparisonChart() {
    const { summary } = useData();
    const { t } = useUI();

    const chartData = [
        { name: t.shift1Name, value: summary?.shiftDoneCounts?.['1'] || 0 },
        { name: t.shift2Name, value: summary?.shiftDoneCounts?.['2'] || 0 },
    ];
    
    const hasData = chartData.some(d => d.value > 0);

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t.shiftComparison}</h2>
                {hasData ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                             <XAxis type="number" stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} />
                             <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={120} tick={{ fill: "#D1D5DB", fontSize: 12 }} />
                             <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                             <Bar dataKey="value" name={t.done} fill={CHART_COLORS[4]} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[250px]"><p>{t.noDataAvailable}</p></div>
                )}
            </CardContent>
        </Card>
    );
}