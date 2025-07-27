'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileDown, ClipboardList, AlertTriangle, Clock, Truck } from 'lucide-react';
import { exportDelayedOrdersXLSX } from '@/lib/exportUtils';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';
import OrderListTable from '../shared/OrderListTable';

const KpiCard = ({ title, value, icon: Icon }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg flex items-center gap-4 border border-slate-700">
        <div className="bg-slate-700 p-3 rounded-md">
            <Icon className="w-6 h-6 text-red-400" />
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    </div>
);

export default function DelayedOrdersTab() {
    const { summary, pickingData, setSelectedOrderDetails, selectedOrderDetails } = useData();
    const { t } = useUI();
    const [showAll, setShowAll] = useState(false);
    
    const delayedOrdersStats = useMemo(() => {
        if (!summary || !summary.delayedOrdersList || summary.delayedOrdersList.length === 0) {
            return { total: 0, avgDelay: 0, topCarrier: 'N/A' };
        }
        const totalDelayDays = summary.delayedOrdersList.reduce((sum, order) => sum + order.delayDays, 0);
        const topCarrier = Object.entries(summary.delayedByCarrier).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        return {
            total: summary.delayedOrdersList.length,
            avgDelay: (totalDelayDays / summary.delayedOrdersList.length).toFixed(1),
            topCarrier,
        };
    }, [summary]);
    
    const delayedOrdersForTable = useMemo(() => {
        if (!summary || !summary.delayedOrdersList) return [];
        return summary.delayedOrdersList.map(order => ({
            ...order,
            "Delivery No": order.delivery,
            "del.type": order.delType,
            "Loading Date": order.loadingDate,
        }));
    }, [summary]);

    const handleSelectOrder = useCallback((order) => {
        const deliveryNo = order["Delivery No"];
        const relatedPicking = pickingData.filter(p => String(p.delivery_no) === String(deliveryNo));
        const fullOrderDetails = {
            ...order,
            picking_details: relatedPicking
        };
        setSelectedOrderDetails(fullOrderDetails);
    }, [pickingData, setSelectedOrderDetails]);

    if (!summary || !summary.delayedOrdersList) {
        return <div className="text-center p-8 text-slate-400">Načítám data...</div>;
    }

    const displayedOrders = showAll ? delayedOrdersForTable : delayedOrdersForTable.slice(0, 10);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                    <AlertTriangle />
                    {t.delayedOrders}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard title="Celkem zpožděných zakázek" value={delayedOrdersStats.total} icon={ClipboardList} />
                    <KpiCard title="Průměrné zpoždění (dny)" value={delayedOrdersStats.avgDelay} icon={Clock} />
                    <KpiCard title="Nejčastější dopravce" value={delayedOrdersStats.topCarrier} icon={Truck} />
                </div>

                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Seznam zakázek</h3>
                        <button
                            onClick={() => exportDelayedOrdersXLSX(summary.delayedOrdersList, t)}
                            className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-600 transition-colors text-sm"
                        >
                            <FileDown className="w-4 h-4" /> Exportovat do XLSX
                        </button>
                    </div>
                    
                    <OrderListTable
                        orders={displayedOrders}
                        onSelectOrder={handleSelectOrder}
                        columnsToShow={['Delivery No', 'Status', 'Loading Date', 'del.type', 'Forwarding agent name', 'delayDays']}
                    />

                    {delayedOrdersForTable.length > 10 && (
                        <div className="text-center mt-4">
                            <button onClick={() => setShowAll(!showAll)} className="text-sky-400 hover:underline text-sm">
                                {showAll ? 'Zobrazit méně' : `Zobrazit všech ${delayedOrdersForTable.length} zakázek`}
                            </button>
                        </div>
                    )}
                </div>

                {selectedOrderDetails && (
                    <OrderDetailsModal 
                        order={selectedOrderDetails} 
                        onClose={() => setSelectedOrderDetails(null)} 
                    />
                )}
            </CardContent>
        </Card>
    );
}