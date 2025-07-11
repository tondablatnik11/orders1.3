"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, parseISO } from 'date-fns';
import { getDelayColorClass } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { FileDown, ClipboardList } from 'lucide-react';
import { exportDelayedOrdersXLSX } from '@/lib/exportUtils';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';
import StatusHistoryModal from '@/components/modals/StatusHistoryModal';

export default function DelayedOrdersTab() {
    const { summary, handleSaveNote, supabase, setSelectedOrderDetails: setGlobalSelectedOrderDetails, selectedOrderDetails: globalSelectedOrderDetails } = useData(); 
    const { t } = useUI();
    const [showAll, setShowAll] = useState(false);
    const [localNotes, setLocalNotes] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
    const [currentDeliveryNoForHistory, setCurrentDeliveryNoForHistory] = useState(null);
    const [deliveryStatusLog, setDeliveryStatusLog] = useState([]);


    // Není potřeba logovat summary v useEffect, pokud není specifické ladění potřeba
    // useEffect(() => { /* ... */ }, [summary]);


    if (!summary || !summary.delayedOrdersList) {
        console.log('DelayedOrdersTab: Není k dispozici žádná data pro zpožděné zakázky.');
        return <p className="text-center p-8">{t.noDataAvailable}</p>;
    }

    const handleNoteChange = (deliveryNo, text) => {
        setLocalNotes(prev => ({ ...prev, [deliveryNo]: text }));
    };

    const handleNoteBlur = (deliveryNo, originalNote) => {
        if (localNotes[deliveryNo] !== undefined && localNotes[deliveryNo] !== originalNote) {
            handleSaveNote(deliveryNo, localNotes[deliveryNo]);
        }
    };

    // Použijte useMemo pro řazení dat
    const sortedOrders = useMemo(() => {
        // Zde se delayedOrders získává přímo ze summary
        const allDelayedOrders = summary.delayedOrdersList; 
        
        let sortableItems = [...allDelayedOrders]; 
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'loadingDate') {
                    aValue = parseISO(aValue || '');
                    bValue = parseISO(bValue || '');
                    if (isNaN(aValue.getTime())) aValue = new Date(0); 
                    if (isNaN(bValue.getTime())) bValue = new Date(0);
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
    }, [summary.delayedOrdersList, sortConfig]);

    // displayedOrders nyní používá sortedOrders
    const displayedOrders = showAll ? sortedOrders : sortedOrders.slice(0, 10);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = null; 
            key = null;
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const handleSelectOrder = (order) => {
        setGlobalSelectedOrderDetails({ 
            "Delivery No": order.delivery,
            "Status": order.status,
            "del.type": order.delType,
            "Loading Date": order.loadingDate,
            "Note": order.note,
            "Forwarding agent name": order["Forwarding agent name"],
            "Name of ship-to party": order["Name of ship-to party"],
            "Total Weight": order["Total Weight"],
            "Bill of lading": order["Bill of lading"],
        });
    };

    const handleCloseOrderDetailsModal = () => {
        setGlobalSelectedOrderDetails(null);
    };

    const handleShowStatusHistory = async (deliveryNo) => {
        try {
            const { data, error } = await supabase
                .from('delivery_status_log')
                .select('status, timestamp')
                .eq('delivery_no', deliveryNo.trim())
                .order('timestamp', { ascending: true });

            if (error) {
                console.error("Error fetching status history:", error.message);
                setDeliveryStatusLog([]);
            } else {
                setDeliveryStatusLog(data || []);
            }
        } catch (e) {
            console.error("Caught error fetching status history:", e);
            setDeliveryStatusLog([]);
        } finally {
            setCurrentDeliveryNoForHistory(deliveryNo);
            setShowStatusHistoryModal(true);
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
                        onClick={() => exportDelayedOrdersXLSX(supabase, t)}
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
                                    <th className="py-3 px-4 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort('delivery')}>
                                        {t.deliveryNo}{getSortIndicator('delivery')}
                                    </th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort('delayDays')}>
                                        {t.delay}{getSortIndicator('delayDays')}
                                    </th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort('loadingDate')}>
                                        {t.loadingDate}{getSortIndicator('loadingDate')}
                                    </th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort('status')}>
                                        {t.status}{getSortIndicator('status')}
                                    </th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.note}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedOrders.map((order) => {
                                    // console.log('DelayedOrdersTab: Vykresluji zakázku (dynamická data):', order.delivery, order); // Méně verbose
                                    
                                    if (!order.delivery) {
                                        console.warn('DelayedOrdersTab: Zakázka postrádá číslo dodávky pro klíč, přeskočeno:', order);
                                        return null;
                                    }

                                    return (
                                        <tr 
                                            key={order.delivery} 
                                            className="border-t border-gray-600 cursor-pointer hover:bg-gray-600"
                                            onClick={() => handleSelectOrder(order)} 
                                        >
                                            <td className="py-3 px-4">{order.delivery}</td>
                                            <td className={`py-3 px-4 font-semibold ${getDelayColorClass(order.delayDays)}`}>{order.delayDays}</td>
                                            <td className="py-3 px-4">{order.loadingDate ? format(parseISO(order.loadingDate), 'dd.MM.yyyy') : 'N/A'}</td>
                                            <td className="py-3 px-4">{order.status}</td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="text"
                                                    value={localNotes[order.delivery] ?? order.note ?? ''}
                                                    onChange={(e) => handleNoteChange(order.delivery, e.target.value)}
                                                    onBlur={() => handleNoteBlur(order.delivery, order.note)}
                                                    onClick={(e) => e.stopPropagation()} 
                                                    className="w-full p-1 rounded-md bg-gray-600 border border-gray-500 text-sm"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                         <p className="text-center text-gray-400">
                            {t.noDataAvailable}
                         </p>
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
                <OrderDetailsModal
                    order={globalSelectedOrderDetails}
                    onClose={handleCloseOrderDetailsModal}
                    onShowHistory={handleShowStatusHistory}
                    onSaveNote={handleSaveNote} 
                    t={t}
                />
            )}
            {showStatusHistoryModal && ( 
                <StatusHistoryModal
                    history={deliveryStatusLog}
                    onClose={() => setShowStatusHistoryModal(false)}
                    t={t}
                />
            )}
        </Card>
    );
}