"use client";
import React, { useMemo, useState } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, startOfDay, addDays, parseISO, isSameDay } from 'date-fns';
import { SummaryCard } from '@/components/shared/SummaryCard';
import { OrderListModal } from '@/components/modals/OrderListModal';
import { Package, Truck, Zap } from 'lucide-react';

// Pomocná funkce pro agregaci dat pro KPI karty
const getSubSummary = (orders) => {
    const doneStatuses = [50, 60, 70, 80, 90];
    const inProgressStatuses = [35, 40];

    const summary = {
        total: orders.length,
        done: 0,
        inProgress: 0,
        breakdown: {},
    };

    orders.forEach(order => {
        const status = Number(order.Status);
        summary.breakdown[status] = (summary.breakdown[status] || 0) + 1;
        if (doneStatuses.includes(status)) summary.done++;
        if (inProgressStatuses.includes(status)) summary.inProgress++;
    });
    return summary;
};

// Komponenta pro jednu sekci (Normální / OEM)
const OrderSection = ({ title, orders, onKpiClick, onOrderClick, t }) => {
    const subSummary = getSubSummary(orders);

    return (
        <div className="glass-card p-4 rounded-xl">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">{title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                 <SummaryCard title="Celkem" value={subSummary.total} icon={Package} color="blue" breakdown={subSummary.breakdown} onStatusClick={(status) => onKpiClick(status, `Status ${status} - ${title}`, orders)} />
                 <SummaryCard title="Hotovo" value={subSummary.done} icon={Zap} color="green" breakdown={{}} onStatusClick={(status) => onKpiClick(status, `Status ${status} - ${title}`, orders)} />
                 <SummaryCard title="V procesu" value={subSummary.inProgress} icon={Zap} color="orange" breakdown={{}} onStatusClick={(status) => onKpiClick(status, `Status ${status} - ${title}`, orders)} />
            </div>
            
            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700 sticky top-0 bg-slate-900/50 backdrop-blur-sm">
                            <th className="p-2">Delivery No</th>
                            <th className="p-2">Loading Date</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Ship-to Party</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order['Delivery No']} className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer" onClick={() => onOrderClick(order)}>
                                <td className="p-2 font-mono">{order['Delivery No']}</td>
                                <td className="p-2">{format(parseISO(order['Loading Date']), 'dd.MM.yyyy')}</td>
                                <td className="p-2">{order.Status}</td>
                                <td className="p-2 truncate max-w-xs">{order['Name of ship-to party']}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {orders.length === 0 && <p className="text-center p-4 text-slate-400">Žádné zakázky k zobrazení.</p>}
            </div>
        </div>
    );
};


export default function ToBeProcessedTab() {
    const { allOrdersData, isLoadingData, setSelectedOrderDetails } = useData();
    const { t } = useUI();
    const today = startOfDay(new Date());
    const [modalState, setModalState] = useState({ isOpen: false, title: '', orders: [] });

    const { normalOrders, oemOrders } = useMemo(() => {
        if (!allOrdersData) return { normalOrders: [], oemOrders: [] };

        const tomorrow = addDays(today, 1);
        const fourDaysFromNow = addDays(today, 4);

        // Filtrování "Normálních zakázek" (DNES a ZÍTRA)
        const normalOrders = allOrdersData.filter(order => {
            const loadingDate = order["Loading Date"] ? startOfDay(parseISO(order["Loading Date"])) : null;
            return (
                order.order_type !== 'O' &&
                loadingDate &&
                (isSameDay(loadingDate, today) || isSameDay(loadingDate, tomorrow))
            );
        });

        // Filtrování "OEM zakázek" (DNES + 4 DNY)
        const oemOrders = allOrdersData.filter(order => {
            const loadingDate = order["Loading Date"] ? startOfDay(parseISO(order["Loading Date"])) : null;
            return (
                order.order_type === 'O' &&
                loadingDate &&
                loadingDate >= today &&
                loadingDate <= fourDaysFromNow
            );
        });
        
        return { normalOrders, oemOrders };

    }, [allOrdersData, today]);

    const handleKpiClick = (status, title, sourceOrders) => {
        const filtered = sourceOrders.filter(o => Number(o.Status) === status);
        setModalState({ isOpen: true, title: title, orders: filtered });
    };

    const handleOrderClick = (order) => {
        setSelectedOrderDetails(order);
    };

    if (isLoadingData) {
        return <div className="p-6 text-center text-xl font-bold">Načítám operativní data...</div>;
    }

    return (
        <div className="space-y-8 p-6">
            <div className="flex items-center gap-4">
                 <Zap className="w-10 h-10 text-cyan-400" />
                 <div>
                    <h1 className="text-3xl font-bold text-slate-100">Zakázky ke Zpracování</h1>
                    <p className="text-slate-400">Aktivní přehled prioritních zakázek pro den {format(today, 'dd.MM.yyyy')}</p>
                 </div>
            </div>
            
            <OrderSection title="Normální Zakázky (Dnes a Zítra)" orders={normalOrders} onKpiClick={handleKpiClick} onOrderClick={handleOrderClick} t={t} />
            <OrderSection title="OEM Zakázky (Následující 4 dny)" orders={oemOrders} onKpiClick={handleKpiClick} onOrderClick={handleOrderClick} t={t} />
            
            <OrderListModal 
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, title: '', orders: [] })}
                title={modalState.title}
                orders={modalState.orders}
                onSelectOrder={handleOrderClick}
                t={t}
            />
        </div>
    );
}