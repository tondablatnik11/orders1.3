"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { CHART_COLORS } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';

export default function ShipmentsChart({ summary }) {
    const { t } = useUI();

    if (!summary || !summary.hourlyStatusSnapshots) {
        return <p>{t.noDataAvailable}</p>;
    }

    const chartData = Object.entries(summary.hourlyStatusSnapshots)
        .map(([hour, statuses]) => ({
            hour: `${hour}:00`,
            status50: statuses['50'] || 0,
            status60: statuses['60'] || 0,
            status70: statuses['70'] || 0,
            total: (statuses['50'] || 0) + (statuses['60'] || 0) + (statuses['70'] || 0)
        }))
        .filter(d => d.total > 0);

    if (chartData.length === 0) {
        return <Card><CardContent><h2 className="text-xl font-semibold mb-2">{t.shipments}</h2><p className="text-center p-8">{t.noDataAvailable}</p></CardContent></Card>
    }

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t.shipments} ({t.today})</h2>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData}>
                        <XAxis dataKey="hour" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }}/>
                        <YAxis stroke="#9CA3AF" allowDecimals={false} tick={{ fill: "#D1D5DB" }}/>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                        <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }}/>
                        <Bar dataKey="status50" name="Status 50" stackId="a" fill={CHART_COLORS[4]} />
                        <Bar dataKey="status60" name="Status 60" stackId="a" fill={CHART_COLORS[7]} />
                        <Bar dataKey="status70" name="Status 70" stackId="a" fill={CHART_COLORS[8]} radius={[4, 4, 0, 0]}/>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}