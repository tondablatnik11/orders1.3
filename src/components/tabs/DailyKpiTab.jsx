// src/components/tabs/DailyKpiTab.jsx
"use client";
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/hooks/useData';
import { Card, CardContent } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Minus, Calendar, BarChartHorizontal, Loader } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';

// Dynamický import pro grafy, aby se předešlo chybám při buildu na serveru
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });

// Mapování statusů pro srozumitelné popisky v detailní tabulce
const statusLabelMap = {
    10: 'Plánováno', 31: 'TOR', 35: 'Picking', 40: 'Gepickt',
    50: 'Verpackt', 60: 'Bereitgestellt', 70: 'Verladen',
    80: 'Na cestě', 90: 'Doručeno'
};

// Komponenta pro zobrazení odchylky se správnou ikonou a barvou
const DeviationCell = ({ value }) => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    const colorClass = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400';
    return (
        <div className={`flex items-center justify-center gap-1 font-semibold ${colorClass}`}>
            <Icon className="w-4 h-4" />
            <span>{Math.abs(value)}</span>
        </div>
    );
};

// Komponenta pro detailní tabulku, která se zobrazí po kliknutí
const DailyDetailTable = ({ data, date }) => {
    if (!data) return null;
    const sortedStatuses = Object.keys(data.statuses).sort((a, b) => a - b);
    return (
        <div className="mt-8 animate-fadeInUp">
            <h3 className="text-xl font-semibold mb-3 text-slate-300">Detailní rozpad pro den: {format(parseISO(date), 'dd.MM.yyyy')}</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="min-w-full bg-slate-800 text-sm text-left">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <th className="p-3 font-semibold text-slate-300">Dopravce</th>
                            <th className="p-3 font-semibold text-slate-300 text-center">Laden geplant</th>
                            {sortedStatuses.map(status => (
                                <th key={status} className="p-3 font-semibold text-slate-300 text-center">
                                    {statusLabelMap[status] || `Status ${status}`}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {Object.keys(data.agents).sort().map(agent => (
                            <tr key={agent}>
                                <td className="p-3 font-medium text-white whitespace-nowrap">{agent}</td>
                                <td className="p-3 text-center font-bold text-white">{data.agents[agent].total}</td>
                                {sortedStatuses.map(status => (
                                    <td key={status} className="p-3 text-center text-slate-300">
                                        {data.agents[agent][status] || 0}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Komponenta pro zobrazení "načítání"
const LoadingSkeleton = () => (
    <div className="space-y-8">
        <div className="skeleton h-12 w-1/3 rounded-lg"></div>
        <div className="skeleton h-64 w-full rounded-lg"></div>
        <div className="skeleton h-80 w-full rounded-lg"></div>
    </div>
);

// Hlavní komponenta záložky
export default function DailyKpiTab() {
    const { summary, allOrdersData, isLoadingData } = useData();
    const [selectedDate, setSelectedDate] = useState(null);

    const detailedDayData = useMemo(() => {
        if (!selectedDate || !allOrdersData) return null;
        
        const filteredOrders = allOrdersData.filter(o => o["Pland Gds Mvmnt Date"] && format(parseISO(o["Pland Gds Mvmnt Date"]), 'yyyy-MM-dd') === selectedDate);
        const statuses = {};
        const agents = {};

        filteredOrders.forEach(order => {
            const agent = order["Forwarding agent name"] || "Neznámý";
            const status = Number(order.Status);
            if(isNaN(status)) return;
            statuses[status] = true;
            if (!agents[agent]) agents[agent] = { total: 0 };
            agents[agent][status] = (agents[agent][status] || 0) + 1;
            agents[agent].total++;
        });

        return { agents, statuses };
    }, [selectedDate, allOrdersData]);

    if (isLoadingData) return <LoadingSkeleton />;
    if (!summary || !summary.dailySummaries || summary.dailySummaries.length === 0) {
        return <p className="text-center p-8 text-slate-400">Nejsou k dispozici žádná data pro report.</p>;
    }
    
    const displayData = [...summary.dailySummaries].reverse();
    const uniqueAgents = Object.keys(summary.dailyBacklogChartData[0] || {}).filter(key => key !== 'date');
    const agentColors = uniqueAgents.reduce((acc, agent, index) => {
        acc[agent] = `hsl(${index * 40}, 70%, 50%)`;
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            <Card>
                <CardContent className="p-6">
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-blue-400">
                        <Calendar className="w-6 h-6" /> Výkon směn - Denní Report
                    </h2>
                    <div className="overflow-x-auto rounded-lg border border-slate-700">
                        <table className="min-w-full bg-slate-800 text-sm text-left">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-300">Datum</th>
                                    <th className="p-3 font-semibold text-slate-300 text-center">Celkem zakázek</th>
                                    <th className="p-3 font-semibold text-slate-300 text-center">Dokončené zakázky</th>
                                    <th className="p-3 font-semibold text-slate-300 text-center">% dokončení</th>
                                    <th className="p-3 font-semibold text-slate-300 text-center" title="Nevyřízené zakázky z daného dne">Backlog Dne</th>
                                    <th className="p-3 font-semibold text-slate-300 text-center" title="Celkový počet nevyřízených zakázek k danému dni">Celkový Backlog</th>
                                    <th className="p-3 font-semibold text-slate-300 text-center" title="Změna celkového backlogu oproti předchozímu dni">Odchylka</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {displayData.map((day) => (
                                    <tr key={day.date} className={`hover:bg-slate-700/50 cursor-pointer transition-colors duration-200 ${selectedDate === day.date ? 'bg-blue-900/50' : ''}`} onClick={() => setSelectedDate(day.date)}>
                                        <td className="p-3 font-medium text-white whitespace-nowrap">{format(parseISO(day.date), 'EEEE, dd.MM.yyyy', { locale: cs })}</td>
                                        <td className="p-3 text-center font-bold text-blue-300">{day.total}</td>
                                        <td className="p-3 text-center font-bold text-green-400">{day.done}</td>
                                        <td className="p-3 text-center font-bold text-green-300">{day.completionPercentage}%</td>
                                        <td className="p-3 text-center font-bold text-yellow-400">{day.todaysBacklog}</td>
                                        <td className="p-3 text-center font-bold text-orange-400">{day.totalBacklog}</td>
                                        <td className="p-3 text-center"><DeviationCell value={day.deviation} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {selectedDate && <DailyDetailTable data={detailedDayData} date={selectedDate} />}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                     <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-orange-400">
                        <BarChartHorizontal className="w-6 h-6" /> Vývoj celkového backlogu podle dopravců
                    </h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={summary.dailyBacklogChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="date" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                            {uniqueAgents.map((agent) => (
                                <Bar key={agent} dataKey={agent} stackId="a" fill={agentColors[agent] || '#8884d8'} name={agent} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <p className="text-xs text-slate-500 mt-4 text-center">
                * Metriky týkající se počtu zaměstnanců a počtu řádků nelze zobrazit, protože zdrojová data tyto informace neobsahují.
            </p>
        </div>
    );
}