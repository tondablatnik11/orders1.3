"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Brush, LabelList } from 'recharts';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { statusConfig } from '@/config/statusConfig';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { BarChart2 } from 'lucide-react';
import { ChartSkeleton } from '../shared/ChartSkeleton';
import { format, startOfToday } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {    
    if (active && payload && payload.length) {
        return (
            <div className="glass-card p-4 rounded-lg shadow-xl">
                <p className="font-bold text-slate-200 mb-2">{`Den: ${label}`}</p>
                {payload.slice().reverse().map((entry, index) => (
                    // Zobrazujeme jen položky s hodnotou > 0
                    entry.value > 0 && (
                        <p key={`item-${index}`} style={{ color: entry.fill }} className="text-sm">
                            {`${entry.name}: ${entry.value.toFixed(1)}%`}
                        </p>
                    )
                ))}
            </div>
        );
    }
    return null;
};

const CustomBarLabel = (props) => {
    const { x, y, width, payload } = props;
    const { doneCount, totalCount } = payload;
    
    if (totalCount === 0) {
        return null;
    }

    return (
        <g>
            <text x={x + width / 2} y={y - 10} fill="#cbd5e1" textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight="bold">
                {`${doneCount}/${totalCount}`}
            </text>
        </g>
    );
};

const CustomLegend = (props) => {
    const { payload, onClick } = props;
    return (
        <div className="bg-slate-900/50 backdrop-blur-sm p-2 rounded-md mt-4 border border-slate-700/50">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                {payload.map((entry, index) => (
                    <div 
                        key={`item-${index}`} 
                        onClick={() => onClick(entry)}
                        className="flex items-center gap-1.5 cursor-pointer transition-opacity duration-200"
                        style={{ opacity: entry.payload.inactive ? 0.4 : 1 }}
                    >
                        <div style={{ width: 10, height: 10, backgroundColor: entry.color, borderRadius: '50%' }} />
                        <span className="text-xs text-slate-300">{entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function StatusDistributionChart({ onBarClick }) {
    const { summary, isLoadingData } = useData();
    const { t } = useUI();
    
    const [brushDomain, setBrushDomain] = useState({ startIndex: 0, endIndex: 0 });
    const [hiddenStatuses, setHiddenStatuses] = useState({});

    const chartData = useMemo(() => summary?.dailyStatusPercentages || [], [summary]);

    useEffect(() => {
        if (chartData && chartData.length > 0) {
            const todayFormatted = format(startOfToday(), 'dd/MM');
            const todayIndex = chartData.findIndex(d => d.date === todayFormatted);
            const visibleRange = 30;
            const daysBefore = 15;

            if (todayIndex !== -1) {
                const startIndex = Math.max(0, todayIndex - daysBefore);
                const endIndex = Math.min(chartData.length - 1, startIndex + visibleRange - 1);
                setBrushDomain({ startIndex, endIndex });
            } else {
                const startIndex = Math.max(0, chartData.length - visibleRange);
                const endIndex = chartData.length - 1;
                setBrushDomain({ startIndex, endIndex });
            }
        }
    }, [chartData]);
    
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
                </CardTitle> {/* <-- ZDE BYLA CHYBA, NYNÍ JE OPRAVENA */}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                        data={chartData} 
                        margin={{ top: 30, right: 30, left: 0, bottom: 0 }}
                        stackOffset="expand"
                        onClick={onBarClick}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5}/>
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12, fill: "#D1D5DB" }} />
                        <YAxis 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12, fill: "#D1D5DB" }}
                            domain={[0, 1]}
                            tickFormatter={(tick) => `${Math.round(tick * 100)}%`} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                        <Legend content={<CustomLegend onClick={handleLegendClick} />} verticalAlign="bottom" />
                        
                        {Object.entries(statusConfig)
                            .filter(([key]) => Number(key) >= 10 && Number(key) <= 90)
                            .map(([key, config], index, arr) => (
                                <Bar
                                    key={`status-bar-${key}`}
                                    dataKey={`status${key}`}
                                    name={config.label}
                                    fill={config.color}
                                    stackId="statusStack"
                                    hide={hiddenStatuses[`status${key}`]}
                                >
                                    {index === arr.length -1 && (
                                        <LabelList dataKey="totalCount" content={<CustomBarLabel />} />
                                    )}
                                </Bar>
                        ))}
                        
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