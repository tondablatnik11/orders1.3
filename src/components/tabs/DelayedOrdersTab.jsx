"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, parseISO } from 'date-fns';
import { getDelayColorClass, getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { FileDown, ClipboardList } from 'lucide-react';
import { exportDelayedOrdersXLSX } from '@/lib/exportUtils';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';

export default function DelayedOrdersTab() {
    const { summary, handleSaveNote, setSelectedOrderDetails: setGlobalSelectedOrderDetails, selectedOrderDetails: globalSelectedOrderDetails } = useData();
    const { t } = useUI();
    const [showAll, setShowAll] = useState(false);
    const [localNotes, setLocalNotes] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: 'delayDays', direction: 'descending' });

    const sortedOrders = useMemo(() => {
        if (!summary || !summary.delayedOrdersList) {
            return [];
        }

        let sortableItems = [...summary.delayedOrdersList];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'loadingDate') {
                    aValue = aValue ? parseISO(aValue).getTime() : 0;
                    bValue = bValue ? parseISO(bValue).getTime() : 0;
                } else if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [summary, sortConfig]);

    const displayedOrders = showAll ? sortedOrders : sortedOrders.slice(0, 10);
    
    if (!summary || !summary.delayedOrdersList) {
        return <p className="text-center p-8">{t.noDataAvailable}</p>;
    }

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };
    
    const handleNoteChange = (deliveryNo, text) => {
        setLocalNotes(prev => ({ ...prev, [deliveryNo]: text }));
    };

    const handleNoteBlur = (deliveryNo, originalNote) => {
        if (localNotes[deliveryNo] !== undefined && localNotes[deliveryNo] !== originalNote) {
            handleSaveNote(deliveryNo, localNotes[deliveryNo]);
        }
    };

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 text-red-400">
                        <ClipboardList className="w-6 h-6" /> {t.delayed} ({summary.delayedOrdersList.length})
                    </h2>
                    <button
                        onClick={() => exportDelayedOrdersXLSX(summary.delayedOrdersList, t)}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
                    >
                        <FileDown className="w-5 h-5" /> {t.exportToXLSX}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {displayedOrders.length > 0 ? (
                        <table className="min-w-full bg-gray-700">
                            <thead className="bg-gray-600">
                                <tr>
                                    <th className="py-3 px-4 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort('delivery')}>{t.deliveryNo}{getSortIndicator('delivery')}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.status}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.shipToPartyName}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort('loadingDate')}>{t.loadingDate}{getSortIndicator('loadingDate')}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort('delayDays')}>{t.delay}{getSortIndicator('delayDays')}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.note}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedOrders.map((order) => (
                                    <tr
                                        key={order.delivery}
                                        className="border-t border-gray-600 cursor-pointer hover:bg-gray-600"
                                        onClick={() => setGlobalSelectedOrderDetails(order)}
                                    >
                                        <td className="py-3 px-4">{order.delivery}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getStatusColor(order.status) }}></span>
                                                {order.status}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">{order["Name of ship-to party"] || 'N/A'}</td>
                                        <td className="py-3 px-4">{order.loadingDate ? format(parseISO(order.loadingDate), 'dd.MM.yyyy') : 'N/A'}</td>
                                        <td className={`py-3 px-4 font-semibold ${getDelayColorClass(order.delayDays)}`}>{order.delayDays}</td>
                                        <td className="py-3 px-4">
                                            <input
                                                type="text"
                                                value={localNotes[order.delivery] ?? (order.Note || '')}
                                                onChange={(e) => handleNoteChange(order.delivery, e.target.value)}
                                                onBlur={() => handleNoteBlur(order.delivery, order.Note)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full p-1 rounded-md bg-gray-600 border border-gray-500 text-sm"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <p className="text-center text-gray-400 p-8">{t.noDataAvailable}</p>
                    )}
                </div>
                {sortedOrders.length > 10 && (
                    <div className="text-center mt-4">
                        <button onClick={() => setShowAll(!showAll)} className="text-blue-400 hover:underline">
                            {showAll ? t.showLess : `${t.showMore} (${sortedOrders.length - 10} ${t.moreItems})`}
                        </button>
                    </div>
                )}
            </CardContent>
            {globalSelectedOrderDetails && (
                <OrderDetailsModal order={globalSelectedOrderDetails} onClose={() => setGlobalSelectedOrderDetails(null)} />
            )}
        </Card>
    );
}