"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Brush } from 'recharts';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { statusConfig } from '@/config/statusConfig'; // Použijeme centrální konfiguraci pro konzistenci
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { BarChart2 } from 'lucide-react';
import { ChartSkeleton } from '../shared/ChartSkeleton';

// Nový tooltip, upravený pro zobrazení procent
const CustomTooltip = ({ active, payload, label }) => {    
    if (active && payload && payload.length) {
        return (
            <div className="glass-card p-4 rounded-lg">
                <p className="font-bold text-slate-200">{`Den: ${label}`}</p>
                {payload.map((entry, index) => (
                    // Zobrazujeme jen položky s hodnotou > 0
                    entry.value > 0 && (
                        <p key={`item-${index}`} style={{ color: entry.fill }}>
                            {`${entry.name}: ${entry.value.toFixed(1)}%`}
                        </p>
                    )
                ))}
            </div>
        );
    }
    return null;
};


export default function StatusDistributionChart({ onBarClick }) {
    const { summary, isLoadingData } = useData();
    const { t } = useUI();
    
    // Ponecháváme state pro interaktivitu z vaší původní verze
    const [brushDomain, setBrushDomain] = useState({ startIndex: 0, endIndex: 0 });
    const [hiddenStatuses, setHiddenStatuses] = useState({});

    // Používáme nová, předpočítaná procentuální data z dataProcessor.js
    const chartData = useMemo(() => {
        return summary?.dailyStatusPercentages || [];
    }, [summary]);

    // Ponecháváme logiku pro nastavení výchozího pohledu Brushe
    useEffect(() => {
        if (chartData && chartData.length > 0) {
            const visibleRange = 30; // Zobrazíme posledních 30 dní
            const startIndex = Math.max(0, chartData.length - visibleRange);
            const endIndex = chartData.length - 1;
            setBrushDomain({ startIndex, endIndex });
        }
    }, [chartData]);

    // Ponecháváme funkci pro skrývání/zobrazování statusů
    const handleLegendClick = (e) => {
        const { dataKey } = e;
        setHiddenStatuses(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    if (isLoadingData || chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-cyan-400" />
                        <span className="text-lg">Rozložení Statusů (Procentuálně)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartSkeleton isSimple={true} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-cyan-400" />
                    <span className="text-lg">Rozložení Statusů (Procentuálně)</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={onBarClick}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5}/>
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12, fill: "#D1D5DB" }} />
                        {/* UPRAVENO: Osa Y nyní zobrazuje procenta */}
                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 12, fill: "#D1D5DB" }} tickFormatter={(tick) => `${Math.round(tick * 100)}%`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                        <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '20px' }} onClick={handleLegendClick} />
                        
                        {Object.entries(statusConfig)
                            .filter(([key]) => Number(key) >= 10 && Number(key) <= 90)
                            .map(([key, config]) => (
                                <Bar
                                    key={`status-bar-${key}`}
                                    dataKey={`status${key}`}
                                    name={config.label}
                                    fill={config.color}
                                    stackId="statusStack"
                                    // KLÍČOVÁ VLASTNOST PRO 100% GRAF
                                    stackOffset="expand" 
                                    // PONECHÁVÁME PŮVODNÍ FUNKCIONALITU
                                    hide={hiddenStatuses[`status${key}`]}
                                />
                        ))}
                        
                        {/* PONECHÁVÁME PŮVODNÍ FUNKCIONALITU BRUSHE */}
                        <Brush
                            dataKey="date"
                            height={30}
                            stroke="hsl(var(--chart-1))"
                            startIndex={brushDomain.startIndex}
                            endIndex={brushDomain.endIndex}
                            onChange={(newDomain) => setBrushDomain(newDomain)}
                            fill="rgba(100, 116, 139, 0.2)"
                            tickFormatter={(index) => chartData[index]?.date}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}