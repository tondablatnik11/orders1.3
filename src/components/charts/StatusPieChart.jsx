"use client";
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';

export default function StatusPieChart({ summary }) {
    const { t } = useUI();

    if (!summary || !summary.statusCounts) {
        return <div className="flex items-center justify-center h-[320px]"><p>{t.noDataAvailable}</p></div>;
    }

    const pieData = Object.entries(summary.statusCounts)
        .map(([status, count]) => ({
            name: `Status ${status}`,
            value: count,
        }))
        .filter(item => item.value > 0);

    if (pieData.length === 0) {
        return <div className="flex items-center justify-center h-[320px]"><p>{t.noDataAvailable}</p></div>;
    }

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t.statusDistribution}</h2>
                <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                            {pieData.map((entry, index) => {
                                const status = entry.name.split(' ')[1];
                                return <Cell key={`cell-${index}`} fill={getStatusColor(status)} />;
                            })}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}