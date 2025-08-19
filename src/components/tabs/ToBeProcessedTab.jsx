"use client";
import React, { useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { format, startOfDay, addDays, parseISO, isValid } from 'date-fns';

// Zde můžete znovu použít existující komponenty pro zobrazení seznamu zakázek a KPI
// Pro jednoduchost zde použijeme základní zobrazení, které můžete rozšířit.
import { SummaryCard } from '@/components/shared/SummaryCard'; 
import { Package, Truck } from 'lucide-react';

const OrderSection = ({ title, orders }) => {
    // Agregace dat pro KPI karty
    const statusCounts = orders.reduce((acc, order) => {
        const status = Number(order.Status);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="glass-card p-4 rounded-xl">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">{title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                 <SummaryCard title="Celkem k práci" value={orders.length} icon={Package} color="blue" breakdown={statusCounts} />
                 {/* Zde můžete přidat další specifické KPI karty pro daný typ zakázek */}
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="p-2">Delivery No</th>
                            <th className="p-2">Loading Date</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Ship-to Party</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.slice(0, 20).map(order => ( // Zobrazíme jen prvních 20 pro přehlednost
                            <tr key={order['Delivery No']} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="p-2 font-mono">{order['Delivery No']}</td>
                                <td className="p-2">{format(parseISO(order['Loading Date']), 'dd.MM.yyyy')}</td>
                                <td className="p-2">{order.Status}</td>
                                <td className="p-2">{order['Name of ship-to party']}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {orders.length > 20 && <p className="text-center mt-4 text-slate-400">... a {orders.length - 20} dalších.</p>}
            </div>
        </div>
    );
};

export default function ToBeProcessedTab() {
    const { allOrdersData, isLoadingData } = useData();
    const today = startOfDay(new Date());

    const { normalOrders, oemOrders } = useMemo(() => {
        if (!allOrdersData) return { normalOrders: [], oemOrders: [] };

        const tomorrow = addDays(today, 1);
        const fourDaysFromNow = addDays(today, 4);

        const normalOrders = allOrdersData.filter(order => {
            const loadingDate = order["Loading Date"] ? startOfDay(parseISO(order["Loading Date"])) : null;
            return (
                order.order_type !== 'O' &&
                loadingDate &&
                (format(loadingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') ||
                 format(loadingDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd'))
            );
        });

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

    if (isLoadingData) {
        return <div className="p-6 text-center">Načítám data...</div>;
    }

    return (
        <div className="space-y-8 p-6">
            <div className="flex items-center gap-4">
                 <Truck className="w-10 h-10 text-cyan-400" />
                 <div>
                    <h1 className="text-3xl font-bold text-slate-100">Zakázky ke Zpracování</h1>
                    <p className="text-slate-400">Přehled zakázek vyžadujících vaši pozornost na základě dnešního data: {format(today, 'dd.MM.yyyy')}</p>
                 </div>
            </div>
            
            <OrderSection title="Normální Zakázky (Dnes a Zítra)" orders={normalOrders} />
            <OrderSection title="OEM Zakázky (Následující 4 dny)" orders={oemOrders} />
        </div>
    );
}