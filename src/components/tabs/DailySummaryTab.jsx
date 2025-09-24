// src/components/tabs/DailySummaryTab.jsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { DailyOverviewCard } from '@/components/shared/DailyOverviewCard';
import OrderListModal from '@/components/modals/OrderListModal';
import { format, parseISO, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DailySummaryTab = () => {
    const { summary, allOrdersData, isLoadingData } = useData();
    const { t } = useUI();
    const [modalState, setModalState] = useState({ isOpen: false, orders: [], title: '' });
    const scrollContainerRef = useRef(null);

    const handleStatClick = useCallback((date, statuses, title) => {
        if (!allOrdersData) {
            setModalState({ isOpen: true, orders: [], title });
            return;
        }

        // --- FINÁLNÍ OPRAVA ---
        // 'date' je již ve formátu 'yyyy-MM-dd' ze summary
        const targetDateStr = date;

        const filteredOrders = allOrdersData.filter(order => {
            // Díky úpravě v dataProcessor jsou nyní formáty shodné
            const orderDateStr = order["Pland Gds Mvmnt Date"];
            if (!orderDateStr) return false;
            
            // Jednoduché a spolehlivé porovnání řetězců
            const dateMatches = orderDateStr === targetDateStr;
            if (!dateMatches) return false;

            if (statuses === 'all') return true;
            return statuses.includes(Number(order.Status));
        });
        // --- KONEC OPRAVY ---
        
        setModalState({ isOpen: true, orders: filteredOrders, title });
    }, [allOrdersData]);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -scrollContainerRef.current.offsetWidth * 0.75 : scrollContainerRef.current.offsetWidth * 0.75;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };
    
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container && !isLoadingData && summary?.dailySummaries?.length > 0) {
            const todayCard = container.querySelector('.animate-pulse-border');
            if (todayCard) {
                const containerRect = container.getBoundingClientRect();
                const cardRect = todayCard.getBoundingClientRect();
                const scrollPosition = cardRect.left - containerRect.left - (containerRect.width / 2) + (cardRect.width / 2);
                container.scrollLeft = scrollPosition;
            } else {
                // Pokud není dnešní karta, scrolluj na konec (poslední den)
                container.scrollLeft = container.scrollWidth;
            }
        }
    }, [isLoadingData, summary]);


    if (isLoadingData) {
        return <div className="p-4 text-center">Načítání denního souhrnu...</div>;
    }
    if (!summary || !summary.dailySummaries || summary.dailySummaries.length === 0) {
        return <div className="p-4 text-center">Žádná data k dispozici.</div>;
    }

    return (
        <>
            <div className="relative">
                <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-slate-800/50 rounded-full hover:bg-slate-700 transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <div 
                    ref={scrollContainerRef} 
                    className="flex overflow-x-auto space-x-4 p-4 scrollbar-hide"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {summary.dailySummaries.map((stats) => {
                         const dateObj = parseISO(stats.date);
                         const title = format(dateObj, 'd. MMMM');
                         return (
                            <div key={stats.date} style={{ scrollSnapAlign: 'center' }}>
                                <DailyOverviewCard
                                    title={title}
                                    stats={stats}
                                    t={t}
                                    onStatClick={handleStatClick}
                                    date={stats.date} // předáváme datum jako string YYYY-MM-DD
                                    isToday={isToday(dateObj)}
                                />
                            </div>
                         );
                    })}
                </div>
                <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-slate-800/50 rounded-full hover:bg-slate-700 transition-colors">
                    <ChevronRight className="h-6 w-6" />
                </button>
            </div>
            
            {modalState.isOpen && (
                <OrderListModal
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState({ isOpen: false, orders: [], title: '' })}
                    orders={modalState.orders}
                    title={modalState.title}
                />
            )}
        </>
    );
};

export default DailySummaryTab;