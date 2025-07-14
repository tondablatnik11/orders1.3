"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, startOfDay, addDays, subDays, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CheckCircle, Clock, Hourglass, Info, AlertTriangle, ClipboardList } from 'lucide-react';
import { OrderListModal } from '@/components/modals/OrderListModal';
import { DailyOverviewCard } from '@/components/shared/DailyOverviewCard';
import { SummaryCard } from '@/components/shared/SummaryCard';
import OrdersOverTimeChart from '@/components/charts/OrdersOverTimeChart';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import GeoChart from '@/components/charts/GeoChart';
import RecentUpdates from '@/components/shared/RecentUpdates';
import DonutChartCard from '@/components/charts/DonutChartCard';

const FeaturedKPICard = ({ title, value, icon: Icon }) => (
    <div className="bg-red-800/80 p-4 rounded-xl shadow-lg border border-red-600/50 flex flex-col items-center justify-center text-center h-full">
        <div className="p-2 bg-red-500/80 rounded-full mb-2">
            <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm text-red-200 font-semibold">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value || 0}</p>
    </div>
);

export default function DashboardTab() {
    const { summary, allOrdersData, setSelectedOrderDetails } = useData();
    const { t } = useUI();
    const [modalState, setModalState] = useState({ isOpen: false, title: '', orders: [] });
    const scrollContainerRef = useRef(null);
    const todayCardRef = useRef(null);

    useEffect(() => {
        if (scrollContainerRef.current && todayCardRef.current) {
            const container = scrollContainerRef.current;
            const todayCard = todayCardRef.current;
            const scrollAmount = todayCard.offsetLeft - (container.offsetWidth / 2) + (todayCard.offsetWidth / 2);
            container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
        }
    }, [summary]);

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
            if (format(parseISO(order["Loading Date"]), 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) return false;

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
        { labelKey: 'total', value: summary.total, icon: Info, color: 'bg-blue-500' },
        { labelKey: 'done', value: summary.doneTotal, icon: CheckCircle, color: 'bg-green-500' },
        { labelKey: 'remaining', value: summary.remainingTotal, icon: Clock, color: 'bg-yellow-500' },
        { labelKey: 'inProgress', value: summary.inProgressTotal, icon: Hourglass, color: 'bg-orange-500' },
    ];
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {summaryCardsData.map(card => (
                    <SummaryCard key={card.labelKey} title={t[card.labelKey]} value={card.value} icon={card.icon} colorClass={card.color} />
                ))}
                <FeaturedKPICard title={t.delayed} value={summary.delayed} icon={AlertTriangle} />
            </div>
            
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <StatusDistributionChart />
                </div>
                <div className="lg:col-span-1">
                     <OrdersOverTimeChart summary={summary} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2">
                    <GeoChart data={summary.ordersByCountry} />
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <DonutChartCard title="Podíl typů dodávek" data={summary.deliveryTypes} />
                    <DonutChartCard title="Typy objednávek" data={summary.orderTypesOEM} />
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