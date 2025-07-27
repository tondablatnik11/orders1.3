'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileDown, ClipboardList, AlertTriangle, Clock } from 'lucide-react';
import { exportDelayedOrdersXLSX } from '@/lib/exportUtils';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';
import OrderListTable from '../shared/OrderListTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format, parseISO, getWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';

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
    const [chartInterval, setChartInterval] = useState('day');

    const delayedOrdersStats = useMemo(() => {
        if (!summary || !summary.delayedOrdersList || summary.delayedOrdersList.length === 0) {
            return { total: 0, avgDelay: 0 };
        }
        const totalDelayDays = summary.delayedOrdersList.reduce((sum, order) => sum + order.delayDays, 0);
        return {
            total: summary.delayedOrdersList.length,
            avgDelay: (totalDelayDays / summary.delayedOrdersList.length).toFixed(1),
        };
    }, [summary]);
    
    const chartData = useMemo(() => {
        if (!summary || !summary.delayedOrdersList) return [];
        const orders = summary.delayedOrdersList;
        const firstDate = new Date(Math.min(...orders.map(o => parseISO(o.loadingDate))));
        const lastDate = new Date(Math.max(...orders.map(o => parseISO(o.loadingDate))));

        let interval, formatStr, checkInterval;

        switch(chartInterval) {
            case 'week':
                interval = eachWeekOfInterval({ start: firstDate, end: lastDate }, { weekStartsOn: 1 });
                formatStr = (date) => `T${getWeek(date, { weekStartsOn: 1 })}`;
                checkInterval = (orderDate, intDate) => getWeek(orderDate, { weekStartsOn: 1 }) === getWeek(intDate, { weekStartsOn: 1 });
                break;
            case 'month':
                interval = eachMonthOfInterval({ start: firstDate, end: lastDate });
                formatStr = (date) => format(date, 'LLLL yyyy', { locale: cs });
                checkInterval = (orderDate, intDate) => orderDate.getMonth() === intDate.getMonth();
                break;
            default: // day
                interval = eachDayOfInterval({ start: firstDate, end: lastDate });
                formatStr = (date) => format(date, 'dd.MM');
                checkInterval = (orderDate, intDate) => format(orderDate, 'yyyy-MM-dd') === format(intDate, 'yyyy-MM-dd');
        }

        return interval.map(intDate => {
            const count = orders.filter(o => checkInterval(parseISO(o.loadingDate), intDate)).length;
            return { name: formatStr(intDate), 'Počet zpožděných': count };
        });

    }, [summary, chartInterval]);

    const delayedOrdersForTable = useMemo(() => {
        if (!summary || !summary.delayedOrdersList) return [];
        return summary.delayedOrdersList.map(order => ({
            ...order,
            "Delivery No": order.delivery,
            "del.type": order.delType,
            "Loading Date": order.loadingDate,
        })).sort((a, b) => b.delayDays - a.delayDays);
    }, [summary]);

    const handleSelectOrder = useCallback((order) => {
        const deliveryNo = order["Delivery No"];
        const relatedPicking = pickingData.filter(p => String(p.delivery_no) === String(deliveryNo));
        const fullOrderDetails = { ...order, picking_details: relatedPicking };
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <KpiCard title="Celkem zpožděných zakázek" value={delayedOrdersStats.total} icon={ClipboardList} />
                    <KpiCard title="Průměrné zpoždění (dny)" value={delayedOrdersStats.avgDelay} icon={Clock} />
                </div>
                
                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Zpožděné zakázky v čase</h3>
                        <div className="flex items-center gap-1 bg-slate-700/50 p-1 rounded-md">
                            <button onClick={() => setChartInterval('day')} className={`px-2 py-1 text-sm rounded ${chartInterval === 'day' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>Dny</button>
                            <button onClick={() => setChartInterval('week')} className={`px-2 py-1 text-sm rounded ${chartInterval === 'week' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>Týdny</button>
                            <button onClick={() => setChartInterval('month')} className={`px-2 py-1 text-sm rounded ${chartInterval === 'month' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>Měsíce</button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                            <Bar dataKey="Počet zpožděných" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Seznam zakázek</h3>
                        <button onClick={() => exportDelayedOrdersXLSX(summary.delayedOrdersList, t)} className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-600 transition-colors text-sm">
                            <FileDown className="w-4 h-4" /> Exportovat do XLSX
                        </button>
                    </div>
                    
                    <OrderListTable
                        orders={displayedOrders}
                        onSelectOrder={handleSelectOrder}
                        columnsToShow={['Delivery No', 'Status', 'Loading Date', 'delayDays', 'del.type', 'Forwarding agent name']}
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
                    <OrderDetailsModal order={selectedOrderDetails} onClose={() => setSelectedOrderDetails(null)} />
                )}
            </CardContent>
        </Card>
    );
}