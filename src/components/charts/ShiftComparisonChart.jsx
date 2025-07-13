"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { getCurrentShift } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';

export default function ShiftComparisonChart({ summary }) {
    const { t } = useUI();

    if (!summary || !summary.shiftDoneCounts) {
        return <p>{t.noDataAvailable}</p>;
    }

    const currentShift = getCurrentShift(new Date());

    // Základní data pro graf
    const chartData = [
        { name: t.shift1Name, value: summary.shiftDoneCounts['1'] || 0 },
        { name: t.shift2Name, value: summary.shiftDoneCounts['2'] || 0 },
    ];
    
    // Filtrujeme data: pokud je čas před koncem ranní směny, zobrazíme jen ji.
    // Jinak zobrazíme obě.
    const filteredData = currentShift === 1 
        ? chartData.slice(0, 1) 
        : chartData;

    const hasData = filteredData.some(d => d.value > 0);

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t.shiftComparison}</h2>
                {hasData ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={filteredData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                             <XAxis type="number" stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                             <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={120} tick={{ fill: "#D1D5DB", fontSize: 12 }} />
                             <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                             <Bar dataKey="value" name={t.done} fill="#10B981" radius={[0, 4, 4, 0]} barSize={35} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[250px]"><p>{t.noDataAvailable}</p></div>
                )}
            </CardContent>
        </Card>
    );
}