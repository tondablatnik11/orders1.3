"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, startOfDay, addDays, subDays, parseISO, isValid } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CheckCircle, Clock, Hourglass, Info, AlertTriangle, ClipboardList, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { OrderListModal } from '@/components/modals/OrderListModal';
import { DailyOverviewCard } from '@/components/shared/DailyOverviewCard';
import { SummaryCard, FeaturedKPICard } from '@/components/shared/SummaryCard';
import OrdersOverTimeChart from '@/components/charts/OrdersOverTimeChart';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import DonutChartCard from '@/components/charts/DonutChartCard';
import D3GeoChart from '../charts/D3GeoChart';
import { countryCodeMap } from '@/lib/dataProcessor';

const SummaryCardSkeleton = () => <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 h-[88px] animate-pulse"></div>;

export default function DashboardTab({ setActiveTab }) {
    const { summary, previousSummary, allOrdersData, setSelectedOrderDetails, isLoadingData, pickingData } = useData();
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
        if (previousSummary === null || currentValue === undefined || previousValue === undefined) return undefined;
        return currentValue - previousValue;
    };
    
    const handleOrderClick = useCallback((deliveryNo) => {
        const orderDetails = allOrdersData.find(order => String(order['Delivery No']) === String(deliveryNo));
        const relatedPicking = (pickingData || []).filter(p => String(p.delivery_no) === String(deliveryNo));
        
        if (orderDetails) {
            setSelectedOrderDetails({ ...orderDetails, picking_details: relatedPicking });
        } else {
            console.error(`Objednávka ${deliveryNo} nebyla nalezena.`);
        }
    }, [allOrdersData, pickingData, setSelectedOrderDetails]);

    if (isLoadingData || !summary) {
        return (
             <div className="space-y-8">
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                     {Array.from({length: 5}).map((_, i) => <SummaryCardSkeleton key={i} />)}
                 </div>
             </div>
        );
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
            const loadingDate = order["Loading Date"] ? parseISO(order["Loading Date"]) : null;
            if (!loadingDate || !isValid(loadingDate) || format(loadingDate, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) return false;
            if (statusFilter === 'all') return true;
            return statusFilter.includes(Number(order.Status));
        });
        setModalState({ isOpen: true, title: `${title} - ${format(date, 'dd.MM.yyyy')}`, orders: filteredOrders });
    };
    
    const handleBarClick = (data) => {
        if (!data || !data.activePayload || !data.activePayload.length) return;
        const clickedBar = data.activePayload[0];
        const statusKey = clickedBar.dataKey;
        const dateLabel = data.activeLabel;
        const dateObj = summary.dailySummaries.find(d => {
            const parsedDate = parseISO(d.date);
            return isValid(parsedDate) && format(parsedDate, 'dd/MM') === dateLabel;
        });
        if (!dateObj) return;
        const dateStr = dateObj.date;
        const filteredOrders = allOrdersData.filter(order => {
            const loadingDate = order["Loading Date"] ? parseISO(order["Loading Date"]) : null;
            if (!loadingDate || !isValid(loadingDate) || format(loadingDate, 'yyyy-MM-dd') !== dateStr) return false;
             const status = statusKey.replace('status', '');
             return String(order.Status) === status;
        });
        const statusName = clickedBar.name || statusKey;
        setModalState({ isOpen: true, title: `${statusName} - ${format(parseISO(dateStr), 'dd.MM.yyyy')}`, orders: filteredOrders });
    };
    
    const handleCountryClick = (countryCode3) => {
        if (!allOrdersData) return;
        const countryCodeMapReversed = Object.fromEntries(Object.entries(countryCodeMap).map(([k,v])=>[v,k]));
        const countryCode2 = countryCodeMapReversed[countryCode3];
        const filteredOrders = allOrdersData.filter(o => o["Country ship-to prty"] === countryCode2);
        setModalState({ isOpen: true, title: `${t.orderListFor} ${countryCode3}`, orders: filteredOrders });
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
        if (prevDayStats && currentDayStats && prevDayStats[metric] !== undefined && currentDayStats[metric] !== undefined) {
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
                    onClick={() => setActiveTab('delayedOrders')}
                    change={getChange(summary.delayed, previousSummary?.delayed)}
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

                        // Upraveno pro nové kategorie
                        const dailyChanges = dailyStats ? {
                            total: getDailyChange(d.date, 'total'),
                            status10: getDailyChange(d.date, 'status10'),
                            status31: getDailyChange(d.date, 'status31'),
                            status35: getDailyChange(d.date, 'status35'),
                            status40: getDailyChange(d.date, 'status40'),
                            status50_60: getDailyChange(d.date, 'status50_60'),
                            status_done_all: getDailyChange(d.date, 'status_done_all'),
                        } : {};

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
                                changes={dailyChanges}
                            />
                        );
                    })}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StatusDistributionChart onBarClick={handleBarClick} />
                <OrdersOverTimeChart summary={summary} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 <div className="lg:col-span-8">
                     <D3GeoChart data={summary?.ordersByCountry || []} onCountryClick={handleCountryClick} />
                 </div>
                 <div className="lg:col-span-4 space-y-6">
                     <DonutChartCard title="Typy objednávek" data={summary?.orderTypesOEM} />
                     <DonutChartCard title="Podíl typů dodávek" data={summary?.deliveryTypes} />
                 </div>
            </div>
            
            <OrderListModal 
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, title: '', orders: [] })}
                title={modalState.title}
                orders={modalState.orders}
                onSelectOrder={(order) => handleOrderClick(order['Delivery No'])}
                t={t}
            />
        </div>
    );
}