"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, startOfDay, addDays, subDays, parseISO, isValid } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CheckCircle, Clock, Hourglass, Info, AlertTriangle, ClipboardList, Package, Zap } from 'lucide-react';
import { OrderListModal } from '@/components/modals/OrderListModal';
import { DailyOverviewCard } from '@/components/shared/DailyOverviewCard';
import { SummaryCard, FeaturedKPICard, PickingKPICard } from '@/components/shared/SummaryCard';
import OrdersOverTimeChart from '@/components/charts/OrdersOverTimeChart';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import DonutChartCard from '@/components/charts/DonutChartCard';
import D3GeoChart from '../charts/D3GeoChart';
import { countryCodeMap } from '@/lib/dataProcessor';

const SummaryCardSkeleton = () => <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 h-[120px] animate-pulse"></div>;

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
    
    const handleKpiStatusClick = (statuses, title) => {
        const filteredOrders = allOrdersData.filter(order => statuses.includes(Number(order.Status)));
        setModalState({ isOpen: true, title: `${title}`, orders: filteredOrders });
    };

    if (isLoadingData || !summary) {
        return (
             <div className="space-y-6">
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                     {Array.from({length: 6}).map((_, i) => <SummaryCardSkeleton key={i} />)}
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
        setModalState({ isOpen: true, title: `${title}`, orders: filteredOrders });
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

    return (
        // ZMĚNA: Sníženy vertikální mezery
        <div className="space-y-4">
            {/* ZMĚNA: Sníženy mezery mezi kartami */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <SummaryCard title={t.total} value={summary.total} icon={Package} color="blue" onStatusClick={(status) => handleKpiStatusClick([status], `Zakázky ve stavu ${status}`)} breakdown={summary.statusCounts} />
                <SummaryCard title={t.done} value={summary.doneTotal} icon={CheckCircle} color="green" onStatusClick={(status) => handleKpiStatusClick([status], `Hotové zakázky ve stavu ${status}`)} breakdown={summary.doneBreakdown} />
                <SummaryCard title={t.remaining} value={summary.remainingTotal} icon={Clock} color="yellow" onStatusClick={(status) => handleKpiStatusClick([status], `Zbývající zakázky ve stavu ${status}`)} breakdown={summary.remainingBreakdown} />
                <SummaryCard title={t.inProgress} value={summary.inProgressTotal} icon={Hourglass} color="orange" onStatusClick={(status) => handleKpiStatusClick([status], `Zakázky v procesu ve stavu ${status}`)} breakdown={summary.inProgressBreakdown} />
                <PickingKPICard title="Včerejší picky" shifts={summary.yesterdayPicksByShift} icon={Zap} />
                <FeaturedKPICard 
                    title={t.delayed} 
                    value={summary.delayed} 
                    icon={AlertTriangle} 
                    onClick={() => setActiveTab('delayedOrders')}
                    onStatusClick={(status) => handleKpiStatusClick([status], `Zpožděné zakázky ve stavu ${status}`)}
                    breakdown={summary.delayedBreakdown}
                />
            </div>
            
            <div>
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-slate-200">
                    <ClipboardList className="w-5 h-5 text-cyan-400" /> Denní přehled stavu
                </h2>
                {/* ZMĚNA: Sníženy mezery a upraven padding pro lepší zobrazení */}
                <div ref={scrollContainerRef} className="flex space-x-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 -mx-2 px-2">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StatusDistributionChart onBarClick={handleBarClick} />
                <OrdersOverTimeChart summary={summary} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                 <div className="lg:col-span-8">
                     <D3GeoChart data={summary?.ordersByCountry || []} onCountryClick={handleCountryClick} />
                 </div>
                 <div className="lg:col-span-4 space-y-4">
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