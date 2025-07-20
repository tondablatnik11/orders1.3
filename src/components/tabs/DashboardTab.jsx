// src/components/tabs/DashboardTab.jsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, startOfDay, addDays, subDays, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CheckCircle, Clock, Hourglass, Info, AlertTriangle, ClipboardList, ArrowUp, ArrowDown, Truck } from 'lucide-react';
import { OrderListModal } from '@/components/modals/OrderListModal';
import { DailyOverviewCard } from '@/components/shared/DailyOverviewCard';
import { SummaryCard } from '@/components/shared/SummaryCard';
import { Card, CardContent } from '@/components/ui/Card';
import OrdersOverTimeChart from '@/components/charts/OrdersOverTimeChart';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import GeoChart from '@/components/charts/GeoChart';
import DonutChartCard from '@/components/charts/DonutChartCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
// NOVÉ: Import mapy kódů zemí
import { countryCodeMap } from '@/lib/dataProcessor';

const SummaryCardSkeleton = () => (
    <div className="col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-4 skeleton h-[88px]"></div>
);

const DailyOverviewSkeleton = () => (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 min-w-64 flex-shrink-0 skeleton h-[216px]"></div>
);

const ChartSkeleton = ({ height = 400 }) => (
    <Card>
        <CardContent className="pt-6">
            <div className={`skeleton w-full rounded-lg`} style={{ height: `${height}px` }}></div>
        </CardContent>
    </Card>
);


const FeaturedKPICard = ({ title, value, icon: Icon, change, onClick }) => (
    <div
        onClick={onClick}
        className="col-span-2 sm:col-span-1 lg:col-span-1 group rounded-lg border border-red-500/50 bg-red-900/30 p-3 transition-all duration-300 hover:shadow-lg hover:border-red-500/70 hover:-translate-y-0.5 backdrop-blur-sm cursor-pointer"
    >
        <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-red-300 uppercase tracking-wider">{title}</p>
            <Icon className="w-5 h-5 text-red-300" />
        </div>
        <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">{value ?? 0}</p>
            {change !== undefined && change !== 0 && (
                <span className={`flex items-center text-xs font-bold ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(change)}
                </span>
            )}
        </div>
    </div>
);


export default function DashboardTab({ setActiveTab }) {
    const { summary, previousSummary, allOrdersData, setSelectedOrderDetails, isLoadingData } = useData();
    const { t } = useUI();
    const [modalState, setModalState] = useState({ isOpen: false, title: '', orders: [] });
    const scrollContainerRef = useRef(null);
    const todayCardRef = useRef(null);
    
    useEffect(() => {
        if (summary && scrollContainerRef.current && todayCardRef.current) {
            const container = scrollContainerRef.current;
            const todayCard = todayCardRef.current;
            const scrollAmount = todayCard.offsetLeft - (container.offsetWidth / 2) + (todayCard.offsetWidth / 2);
            container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
        }
    }, [summary]);

    const getChange = (currentValue, previousValue) => {
        if (previousSummary === null || currentValue === undefined || previousValue === undefined) {
            return undefined;
        }
        const change = currentValue - previousValue;
        return change;
    };
    
    const handleCountryClick = (countryCode3) => {
        if (!allOrdersData) return;
        const countryCodeMapReversed = Object.fromEntries(Object.entries(countryCodeMap).map(([k, v]) => [v, k]));
        const countryCode2 = countryCodeMapReversed[countryCode3];
        const filteredOrders = allOrdersData.filter(order => order["Country ship-to prty"] === countryCode2);
        
        setModalState({ 
            isOpen: true, 
            title: `${t.orderListFor} ${countryCode3}`, 
            orders: filteredOrders 
        });
    };

    if (isLoadingData) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => <SummaryCardSkeleton key={i} />)}
                </div>
                <div>
                    <div className="h-8 w-72 mb-4 skeleton"></div>
                    <div className="flex space-x-4 overflow-x-auto pb-4">
                        {Array.from({ length: 7 }).map((_, i) => <DailyOverviewSkeleton key={i} />)}
                    </div>
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                        <ChartSkeleton height={400} />
                        <ChartSkeleton height={400} />
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <ChartSkeleton height={320} />
                        <ChartSkeleton height={250} />
                    </div>
                </div>
            </div>
        );
    }

    if (!summary) {
        return <div className="text-center p-8 text-lg">Žádná data k zobrazení.</div>;
    }

    const today = startOfDay(new Date());
    const datesForOverview = Array.from({ length: 20 }).map((_, i) => {
        const date = addDays(subDays(today, 10), i);
        let label = format(date, 'EEEE', { locale: cs });
        if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) label = t.today || "Dnes";
        if (format(date, 'yyyy-MM-dd') === format(subDays(today, 1), 'yyyy-MM-dd')) label = t.yesterday || "Včera";
        return { date, label };
    });

    const handleStatClick = (date, type, title) => {
        const doneStatuses = [50, 60, 70, 80, 90];
        const inProgressStatuses = [31, 35, 40];
        const newStatus = [10];
        
        const filteredOrders = allOrdersData.filter(order => {
            if (!order["Loading Date"]) return false;
            try {
                if (format(parseISO(order["Loading Date"]), 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) return false;
            } catch (e) {
                return false;
            }

            const status = Number(order.Status);
            switch (type) {
                case 'total': return true;
                case 'done': return doneStatuses.includes(status);
                case 'inProgress': return inProgressStatuses.includes(status);
                case 'new': return newStatus.includes(status);
                case 'remaining': return !doneStatuses.includes(status);
                default: return false;
            }
        });
        setModalState({ isOpen: true, title: `${title} - ${format(date, 'dd.MM.yyyy')}`, orders: filteredOrders });
    };

    const summaryCardsData = [
        { labelKey: 'total', value: summary.total, change: getChange(summary.total, previousSummary?.total), icon: Info, color: 'blue' },
        { labelKey: 'done', value: summary.doneTotal, change: getChange(summary.doneTotal, previousSummary?.doneTotal), icon: CheckCircle, color: 'green' },
        { labelKey: 'remaining', value: summary.remainingTotal, change: getChange(summary.remainingTotal, previousSummary?.remainingTotal), icon: Clock, color: 'yellow' },
        { labelKey: 'inProgress', value: summary.inProgressTotal, change: getChange(summary.inProgressTotal, previousSummary?.inProgressTotal), icon: Hourglass, color: 'orange' },
    ];

    const getDailyChange = (date, metric) => {
        if (!previousSummary?.dailySummaries) return undefined;

        const dateStr = format(date, 'yyyy-MM-dd');
        const prevDayStats = previousSummary.dailySummaries.find(d => d.date === dateStr);
        const currentDayStats = summary.dailySummaries.find(d => d.date === dateStr);

        if (prevDayStats && currentDayStats) {
            return currentDayStats[metric] - prevDayStats[metric];
        }
        return undefined;
    };


    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {summaryCardsData.map(card => (
                    <SummaryCard key={card.labelKey} title={t[card.labelKey]} value={card.value} icon={card.icon} color={card.color} change={card.change} />
                ))}
                <FeaturedKPICard 
                    title={t.delayed} 
                    value={summary.delayed} 
                    icon={AlertTriangle} 
                    change={getChange(summary.delayed, previousSummary?.delayed)} 
                    onClick={() => setActiveTab('delayedOrders')}
                />
            </div>
            
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-slate-200">
                    <ClipboardList className="w-6 h-6 text-green-400" /> Denní přehled stavu
                </h2>
                <div className="lg:hidden space-y-4">
                     {datesForOverview.map((d) => {
                        const dateStr = format(d.date, 'yyyy-MM-dd');
                        const isToday = format(d.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                        const dailyStats = summary.dailySummaries.find(s => s.date === dateStr);
                        if (!dailyStats) return null;
                        const displayLabel = `${d.label} (${format(d.date, 'dd.MM.')})`;
                        const dailyChanges = { total: getDailyChange(d.date, 'total'), done: getDailyChange(d.date, 'done'), remaining: getDailyChange(d.date, 'remaining'), inProgress: getDailyChange(d.date, 'inProgress'), new: getDailyChange(d.date, 'new')};

                        return (<DailyOverviewCard key={dateStr} title={displayLabel} stats={dailyStats} t={t} onStatClick={handleStatClick} date={d.date} changes={dailyChanges} isToday={isToday} />);
                    })}
                </div>
                <div ref={scrollContainerRef} className="hidden lg:flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {datesForOverview.map((d) => {
                        const dateStr = format(d.date, 'yyyy-MM-dd');
                        const isToday = format(d.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                        const dailyStats = summary.dailySummaries.find(s => s.date === dateStr);
                        const displayLabel = `${d.label} (${format(d.date, 'dd.MM.')})`;
                        const dailyChanges = { total: getDailyChange(d.date, 'total'), done: getDailyChange(d.date, 'done'), remaining: getDailyChange(d.date, 'remaining'), inProgress: getDailyChange(d.date, 'inProgress'), new: getDailyChange(d.date, 'new') };

                        return (
                            <DailyOverviewCard 
                                ref={isToday ? todayCardRef : null} 
                                key={dateStr} 
                                title={displayLabel} 
                                stats={dailyStats} 
                                t={t} 
                                onStatClick={handleStatClick} 
                                date={d.date}
                                changes={dailyChanges}
                                isToday={isToday}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-8 space-y-6">
                    <StatusDistributionChart />
                    <GeoChart data={summary.ordersByCountry} onCountryClick={handleCountryClick} />
                    <Card>
                        <CardContent className="pt-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-400" /> Dopravci</h2>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={summary.ordersByForwardingAgent.slice(0, 10)} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                                    <XAxis type="number" stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} />
                                    <YAxis type="category" dataKey="name" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }} width={120} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                                    <Bar dataKey="Počet zakázek" fill="#818cf8" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <OrdersOverTimeChart summary={summary} />
                    <DonutChartCard title="Typy objednávek" data={summary.orderTypesOEM} />
                    <DonutChartCard title="Podíl typů dodávek" data={summary.deliveryTypes} />
                </div>
            </div>
            
            <OrderListModal 
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                title={modalState.title}
                orders={modalState.orders}
                onSelectOrder={setSelectedOrderDetails}
                t={t}
            />
        </div>
    );
}