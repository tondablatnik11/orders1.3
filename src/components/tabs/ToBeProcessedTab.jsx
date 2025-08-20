"use client";
import React, { useMemo, useState } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, startOfDay, addDays, parseISO, isSameDay, isBefore } from 'date-fns';
import { SummaryCard } from '@/components/shared/SummaryCard';
import { OrderListModal } from '@/components/modals/OrderListModal';
import { Package, Zap, Hourglass, CheckCircle, ArrowUpDown } from 'lucide-react';

const getSubSummary = (orders) => { /* ... kód beze změny z minulé verze ... */ };

// Komponenta pro jednu sekci (Normální / OEM) - NYNÍ S ŘAZENÍM
const OrderSection = ({ title, orders, onKpiClick, onOrderClick, t }) => {
    const subSummary = getSubSummary(orders);
    const [sortConfig, setSortConfig] = useState({ key: 'Loading Date', direction: 'ascending' });

    const sortedOrders = useMemo(() => {
        let sortableItems = [...orders];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                // Řazení podle data
                if (sortConfig.key === 'Loading Date') {
                    const dateA = parseISO(aValue);
                    const dateB = parseISO(bValue);
                    if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
                
                // Řazení podle ostatních sloupců
                if (aValue.toString().localeCompare(bValue.toString(), 'cs', { numeric: true }) > 0) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                if (aValue.toString().localeCompare(bValue.toString(), 'cs', { numeric: true }) < 0) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [orders, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-2 opacity-30" />;
        if (sortConfig.direction === 'ascending') return <ArrowUpDown size={14} className="ml-2 text-cyan-400" />;
        return <ArrowUpDown size={14} className="ml-2 text-cyan-400 transform rotate-180" />;
    };
    
    // Mapování typů pro lepší čitelnost
    const orderTypeMap = { 'O': 'OEM', 'N': 'Normal', 'E': 'Expres' };
    const delTypeMap = { 'P': 'Palety', 'K': 'Kartony' };

    return (
        <div className="glass-card p-4 rounded-xl">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">{title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                 {/* ... KPI Karty beze změny ... */}
            </div>
            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-700 sticky top-0 bg-slate-900/50 backdrop-blur-sm">
                        <tr>
                            {/* UPRAVENO: Přidány nové sloupce a tlačítka pro řazení */}
                            <th className="p-2"><button onClick={() => requestSort('Delivery No')} className="flex items-center">Delivery No {getSortIndicator('Delivery No')}</button></th>
                            <th className="p-2"><button onClick={() => requestSort('Loading Date')} className="flex items-center">Loading Date {getSortIndicator('Loading Date')}</button></th>
                            <th className="p-2"><button onClick={() => requestSort('Status')} className="flex items-center">Status {getSortIndicator('Status')}</button></th>
                            <th className="p-2">Typ dodávky</th>
                            <th className="p-2">Typ zakázky</th>
                            <th className="p-2">Jméno dopravce</th>
                            <th className="p-2">Ship-to Party</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedOrders.map(order => (
                            <tr key={order['Delivery No']} className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer" onClick={() => onOrderClick(order)}>
                                <td className="p-2 font-mono">{order['Delivery No']}</td>
                                <td className="p-2 whitespace-nowrap">{format(parseISO(order['Loading Date']), 'dd.MM.yyyy')}</td>
                                <td className="p-2">{order.Status}</td>
                                <td className="p-2">{delTypeMap[order['del.type']] || order['del.type']}</td>
                                <td className="p-2">{orderTypeMap[order.order_type] || order.order_type}</td>
                                <td className="p-2 truncate max-w-xs">{order['Forwarding agent name']}</td>
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
        const doneStatuses = [50, 60, 70, 80, 90];

        const isNotDone = (order) => !doneStatuses.includes(Number(order.Status));

        // UPRAVENO: Filtrování nyní zahrnuje i zpožděné zakázky
        const normalOrders = allOrdersData.filter(order => {
            const loadingDate = order["Loading Date"] ? startOfDay(parseISO(order["Loading Date"])) : null;
            return (
                order.order_type !== 'O' &&
                isNotDone(order) &&
                loadingDate &&
                (isBefore(loadingDate, today) || isSameDay(loadingDate, today) || isSameDay(loadingDate, tomorrow))
            );
        });

        const oemOrders = allOrdersData.filter(order => {
            const loadingDate = order["Loading Date"] ? startOfDay(parseISO(order["Loading Date"])) : null;
            return (
                order.order_type === 'O' &&
                isNotDone(order) &&
                loadingDate &&
                (isBefore(loadingDate, today) || (loadingDate >= today && loadingDate <= fourDaysFromNow))
            );
        });
        
        return { normalOrders, oemOrders };

    }, [allOrdersData, today]);

    // Zbytek souboru zůstává stejný...
    const handleKpiClick = (status, title, sourceOrders) => { /* ... */ };
    const handleOrderClick = (order) => setSelectedOrderDetails(order);

    if (isLoadingData) return <div className="p-6 text-center text-xl font-bold">Načítám operativní data...</div>;

    return (
        <div className="space-y-8 p-6">
            {/* ... Hlavička beze změny ... */}
            <OrderSection title="Normální Zakázky" orders={normalOrders} onKpiClick={handleKpiClick} onOrderClick={handleOrderClick} t={t} />
            <OrderSection title="OEM Zakázky" orders={oemOrders} onKpiClick={handleKpiClick} onOrderClick={handleOrderClick} t={t} />
            <OrderListModal /* ... props beze změny ... */ />
        </div>
    );
}