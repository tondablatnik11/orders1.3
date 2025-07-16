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

const FeaturedKPICard = ({ title, value, icon: Icon, change, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-red-900/20 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-red-500/30 flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:bg-red-800/50 hover:shadow-red-500/10 hover:-translate-y-px ${onClick ? 'cursor-pointer' : ''}`}
    >
        <Icon className="w-6 h-6 text-red-400" />
        <p className="text-sm text-red-300">{title}</p>
        <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">{value ?? 0}</p>
            {change !== undefined && change !== 0 && (
                <span className={`flex items-center text-sm font-bold ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {Math.abs(change)}
                </span>
            )}
        </div>
    </div>
);


export default function DashboardTab({ setActiveTab }) {
    const { summary, previousSummary, allOrdersData, setSelectedOrderDetails } = useData();
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

    if (!summary) {
        return <div className="text-center p-8 text-lg">Zpracovávám data...</div>;
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
        { labelKey: 'total', value: summary.total, change: getChange(summary.total, previousSummary?.total), icon: Info, colorClass: 'bg-blue-500' },
        { labelKey: 'done', value: summary.doneTotal, change: getChange(summary.doneTotal, previousSummary?.doneTotal), icon: CheckCircle, colorClass: 'bg-green-500' },
        { labelKey: 'remaining', value: summary.remainingTotal, change: getChange(summary.remainingTotal, previousSummary?.remainingTotal), icon: Clock, colorClass: 'bg-yellow-500' },
        { labelKey: 'inProgress', value: summary.inProgressTotal, change: getChange(summary.inProgressTotal, previousSummary?.inProgressTotal), icon: Hourglass, colorClass: 'bg-orange-500' },
    ];

    return (
        <div className="space-y-6">
            {/* HORNÍ KARTY */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {summaryCardsData.map(card => (
                    <SummaryCard key={card.labelKey} title={t[card.labelKey]} value={card.value} icon={card.icon} colorClass={card.colorClass} change={card.change} />
                ))}
                <FeaturedKPICard 
                    title={t.delayed} 
                    value={summary.delayed} 
                    icon={AlertTriangle} 
                    change={getChange(summary.delayed, previousSummary?.delayed)} 
                    onClick={() => setActiveTab('delayedOrders')}
                />
            </div>
            
            {/* DENNÍ PŘEHLED */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-green-400" /> Denní přehled stavu
                </h2>
                <div ref={scrollContainerRef} className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {datesForOverview.map((d) => {
                        const dateStr = format(d.date, 'yyyy-MM-dd');
                        const isToday = format(d.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                        const dailyStats = summary.dailySummaries.find(s => s.date === dateStr);
                        const displayLabel = `${d.label} (${format(d.date, 'dd.MM.')})`;
                        return (
                            <DailyOverviewCard ref={isToday ? todayCardRef : null} key={dateStr} title={displayLabel} stats={dailyStats} t={t} onStatClick={handleStatClick} date={d.date} />
                        );
                    })}
                </div>
            </div>

            {/* HLAVNÍ MŘÍŽKA S GRAFY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-8 space-y-6">
                    <StatusDistributionChart />
                    <GeoChart data={summary.ordersByCountry} />
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