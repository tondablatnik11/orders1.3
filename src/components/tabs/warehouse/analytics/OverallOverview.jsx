"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Warehouse, Package, Activity } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon }) => (
    <div className="bg-background p-4 rounded-lg border border-border flex-grow">
        <div className="flex items-center gap-4">
            <Icon className="h-7 w-7 text-primary" />
            <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
        {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
    </div>
);

const ActivityByZoneChart = ({ data }) => {
    const chartData = Object.entries(data).map(([name, values]) => ({ name, ...values }));
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #3A3A3A' }} cursor={{ fill: 'rgba(136, 136, 136, 0.1)' }} />
                <Bar dataKey="picks" name="Počet picků" radius={[0, 4, 4, 0]} background={{ fill: '#eee' }}>
                     {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill="#38BDF8" />))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export const OverallOverview = ({ kpis }) => (
    <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
            <StatCard title="Obsazenost Pozic" value={`${kpis.overall.occupancyRate.toFixed(1)}%`} subtext={`${kpis.overall.occupiedBins} / ${kpis.overall.totalBins} pozic`} icon={TrendingUp} />
            <StatCard title="Celkem Picků" value={kpis.overall.totalPicks.toLocaleString()} subtext="V analyzovaném období" icon={Activity} />
            <StatCard title="Unikátních SKU" value={kpis.overall.uniqueSKUs.toLocaleString()} subtext="Různých materiálů na skladě" icon={Package} />
        </div>
        <div className="bg-background p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Aktivita podle Zón</h3>
            <ActivityByZoneChart data={kpis.byZone} />
        </div>
    </div>
);