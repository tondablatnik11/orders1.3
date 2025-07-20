// src/components/tabs/DashboardTab.jsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, startOfDay, addDays, subDays, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CheckCircle, Activity, Info, AlertTriangle, ClipboardList } from 'lucide-react';
import { OrderListModal } from '@/components/modals/OrderListModal';
import { DailyOverviewCard } from '@/components/shared/DailyOverviewCard';
import { SummaryCard, FeaturedKPICard } from '@/components/shared/SummaryCard';
import { Card, CardContent } from '@/components/ui/Card';
import DonutChartCard from '@/components/charts/DonutChartCard';

// NOVÉ: Import D3 grafů
import D3OrdersOverTimeChart from '../charts/D3OrdersOverTimeChart';
import D3StatusDistributionChart from '../charts/D3StatusDistributionChart';
import D3GeoChart from '../charts/D3GeoChart';
import { countryCodeMap } from '@/lib/dataProcessor';

// Kostry pro plynulé načítání
const SummaryCardSkeleton = () => <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 skeleton h-[88px]"></div>;
const DailyOverviewSkeleton = () => <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 min-w-[220px] flex-shrink-0 skeleton h-[180px]"></div>;
const ChartSkeleton = ({ height = 400 }) => (
    <Card>
        <CardContent className="pt-6">
            <div className={`skeleton w-full rounded-lg`} style={{ height: `${height}px` }}></div>
        </CardContent>
    </Card>
);

export default function DashboardTab({ setActiveTab }) {
    const { summary, allOrdersData, setSelectedOrderDetails, isLoadingData } = useData();
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

    if (isLoadingData) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)}
                </div>
                <div>
                    <div className="h-8 w-72 mb-4 skeleton"></div>
                    <div className="flex space-x-4 overflow-x-auto pb-4">
                        {Array.from({ length: 7 }).map((_, i) => <DailyOverviewSkeleton key={i} />)}
                    </div>
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartSkeleton height={400} />
                    <ChartSkeleton height={400} />
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

    const handleStatClick = (date, statusFilter, title) => {
        const filteredOrders = allOrdersData.filter(order => {
            if (!order["Loading Date"]) return false;
            try {
                if (format(parseISO(order["Loading Date"]), 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) return false;
            } catch (e) {
                return false;
            }
            if (statusFilter === 'all') return true;
            return statusFilter.includes(Number(order.Status));
        });
        setModalState({ isOpen: true, title: `${title} - ${format(date, 'dd.MM.yyyy')}`, orders: filteredOrders });
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
    
    // Nové seskupení KPI karet
    const summaryCardsData = [
        { labelKey: 'total', value: summary.total, icon: Info, color: 'blue' },
        { labelKey: 'done', value: summary.doneTotal, icon: CheckCircle, color: 'green' },
        { labelKey: 'active', value: summary.inProgressTotal + summary.newOrdersTotal, icon: Activity, color: 'yellow' },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryCardsData.map(card => (
                    <SummaryCard key={card.labelKey} title={t[card.labelKey] || card.labelKey} value={card.value} icon={card.icon} color={card.color} />
                ))}
                <FeaturedKPICard 
                    title={t.delayed} 
                    value={summary.delayed} 
                    icon={AlertTriangle} 
                    onClick={() => setActiveTab('delayedOrders')}
                />
            </div>
            
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-slate-200">
                    <ClipboardList className="w-6 h-6 text-green-400" /> Denní přehled stavu
                </h2>
                <div ref={scrollContainerRef} className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {datesForOverview.map((d) => {
                        const dateStr = format(d.date, 'yyyy-MM-dd');
                        const isToday = format(d.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                        const dailyStats = summary.dailySummaries.find(s => s.date === dateStr);
                        const displayLabel = `${d.label} (${format(d.date, 'dd.MM.')})`;

                        return (
                            <DailyOverviewCard 
                                ref={isToday ? todayCardRef : null} 
                                key={dateStr} 
                                title={displayLabel} 
                                stats={dailyStats} 
                                t={t} 
                                onStatClick={handleStatClick} 
                                date={d.date}
                                isToday={isToday}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <D3StatusDistributionChart summary={summary} />
                <D3OrdersOverTimeChart summary={summary} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 <div className="lg:col-span-8">
                    <D3GeoChart data={summary.ordersByCountry} onCountryClick={handleCountryClick} />
                 </div>
                 <div className="lg:col-span-4 space-y-6">
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