"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import OrdersOverTimeChart from '@/components/charts/OrdersOverTimeChart';
import StatusPieChart from '@/components/charts/StatusPieChart'; // <-- NOVÝ IMPORT
import { format, startOfDay, addDays, subDays, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { UploadCloud, CheckCircle, Clock, Hourglass, PlusCircle, Truck, Box, Info, FileDown, ClipboardList } from 'lucide-react';
import { OrderListModal } from '@/components/modals/OrderListModal';
import { DailyOverviewCard } from '@/components/shared/DailyOverviewCard';
import { SummaryCard } from '@/components/shared/SummaryCard';

export default function DashboardTab() {
    const { summary, isLoadingData, handleFileUpload, allOrdersData, setSelectedOrderDetails } = useData();
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
    }, [isLoadingData, summary]);

    const today = startOfDay(new Date());
    const datesForOverview = Array.from({ length: 20 }).map((_, i) => {
        const date = addDays(subDays(today, 10), i);
        let label;
        if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) label = t.today;
        else if (format(date, 'yyyy-MM-dd') === format(subDays(today, 1), 'yyyy-MM-dd')) label = t.yesterday;
        else label = format(date, 'EEEE', { locale: cs });
        return { date, label };
    });

    const handleStatClick = (date, type, title) => {
        const doneStatuses = [50, 60, 70];
        const inProgressStatuses = [31, 35, 40];
        const newStatus = [10];
        const remainingStatuses = [10, 31, 35, 40];
        
        const filteredOrders = allOrdersData.filter(order => {
            if (!order["Loading Date"]) return false;
            const orderDate = startOfDay(parseISO(order["Loading Date"]));
            if (orderDate.getTime() !== date.getTime()) return false;

            const status = Number(order.Status);
            switch (type) {
                case 'total': return true;
                case 'done': return doneStatuses.includes(status);
                case 'remaining': return remainingStatuses.includes(status);
                case 'inProgress': return inProgressStatuses.includes(status);
                case 'new': return newStatus.includes(status);
                default: return false;
            }
        });

        setModalState({
            isOpen: true,
            title: `${title} - ${format(date, 'dd.MM.yyyy')}`,
            orders: filteredOrders
        });
    };

    if (isLoadingData) {
        return <p className="text-center p-8 text-lg">Načítám data...</p>;
    }

    if (!summary) {
        return (
            <div className="text-center mt-12">
                 <p className="mb-6 text-xl text-gray-400">{t.uploadFilePrompt}</p>
                 <label className="cursor-pointer inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg shadow-lg text-lg">
                    <UploadCloud className="w-6 h-6" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
                </label>
            </div>
        );
    }

    const summaryCardsData = [
        { labelKey: 'total', value: summary.total, icon: Info, color: 'bg-blue-500' },
        { labelKey: 'done', value: summary.doneTotal, icon: CheckCircle, color: 'bg-green-500' },
        { labelKey: 'remaining', value: summary.remainingTotal, icon: Clock, color: 'bg-yellow-500' },
        { labelKey: 'inProgress', value: summary.inProgressTotal, icon: Hourglass, color: 'bg-orange-500' },
        { labelKey: 'newOrders', value: summary.newOrdersTotal, icon: PlusCircle, color: 'bg-purple-500' },
        { labelKey: 'pallets', value: summary.palletsTotal, icon: Truck, color: 'bg-pink-500' },
        { labelKey: 'carton', value: summary.cartonsTotal, icon: Box, color: 'bg-cyan-500' },
    ];
    
    return (
        <div className="space-y-10">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6">
                {summaryCardsData.map(card => (
                    <SummaryCard key={card.labelKey} title={t[card.labelKey]} value={card.value} icon={card.icon} colorClass={card.color} />
                ))}
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
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
            
            {/* ZMĚNA ZDE: Přidáváme grid pro dva grafy vedle sebe */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <StatusPieChart summary={summary} />
                <OrdersOverTimeChart summary={summary} />
            </div>
            
            <OrderListModal 
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, title: '', orders: [] })}
                title={modalState.title}
                orders={modalState.orders}
                onSelectOrder={(order) => setSelectedOrderDetails(order)}
                t={t}
            />
        </div>
    );
}