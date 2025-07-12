"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useUI } from '@/hooks/useUI';
import { CHART_COLORS } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';

export default function InProgressChart({ summary }) {
    const { t } = useUI();

    if (!summary || !summary.hourlyStatusSnapshots) {
        return <p>{t.noDataAvailable}</p>;
    }

    const chartData = Object.entries(summary.hourlyStatusSnapshots)
        .map(([hour, statuses]) => ({
            hour: `${hour}:00`,
            status31: statuses['31'] || 0,
            status35: statuses['35'] || 0,
            status40: statuses['40'] || 0,
            total: (statuses['31'] || 0) + (statuses['35'] || 0) + (statuses['40'] || 0)
        }))
        .filter(d => d.total > 0);

    if (chartData.length === 0) {
        return <Card><CardContent><h2 className="text-xl font-semibold mb-2">{t.inProgressOnly}</h2><p className="text-center p-8">{t.noDataAvailable}</p></CardContent></Card>
    }

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t.inProgressOnly} ({t.today})</h2>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData}>
                        <XAxis dataKey="hour" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }}/>
                        <YAxis stroke="#9CA3AF" allowDecimals={false} tick={{ fill: "#D1D5DB" }}/>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                        <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }}/>
                        <Bar dataKey="status31" name="Status 31" stackId="a" fill={CHART_COLORS[8]} />
                        <Bar dataKey="status35" name="Status 35" stackId="a" fill={CHART_COLORS[9]} />
                        <Bar dataKey="status40" name="Status 40" stackId="a" fill={CHART_COLORS[10]} radius={[4, 4, 0, 0]}/>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}