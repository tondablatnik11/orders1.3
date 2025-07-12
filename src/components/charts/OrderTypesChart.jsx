"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { CHART_COLORS } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';

export default function OrderTypesChart({ summary }) {
    const { t } = useUI();

    if (!summary || !summary.deliveryTypes) {
        return <p>{t.noDataAvailable}</p>;
    }

    const chartData = Object.entries(summary.deliveryTypes).map(([type, count]) => ({
        name: type === 'P' ? t.pallets : t.carton,
        value: count,
    }));

    const hasData = chartData.some(d => d.value > 0);

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t.orderTypes}</h2>
                {hasData ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} />
                            <YAxis stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                            <Bar dataKey="value" name={t.total} radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === t.pallets ? CHART_COLORS[5] : CHART_COLORS[6]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[250px]"><p>{t.noDataAvailable}</p></div>
                )}
            </CardContent>
        </Card>
    );
}