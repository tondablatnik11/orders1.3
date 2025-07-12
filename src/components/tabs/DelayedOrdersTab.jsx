"use client";
import React, { useState, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, parseISO } from 'date-fns';
import { getDelayColorClass } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { FileDown, ClipboardList } from 'lucide-react';
import { exportDelayedOrdersXLSX } from '@/lib/exportUtils'; // Importujte funkci exportu

export default function DelayedOrdersTab() {
    const { summary, handleSaveNote, supabase } = useData(); 
    const { t } = useUI();
    const [showAll, setShowAll] = useState(false);
    const [localNotes, setLocalNotes] = useState({});

    useEffect(() => {
        console.log('DelayedOrdersTab: summary stav (dynamická data):', summary);
        if (summary?.delayedOrdersList) {
            console.log('DelayedOrdersTab: délka delayedOrdersList (dynamická data):', summary.delayedOrdersList.length);
            if (summary.delayedOrdersList.length > 0) {
                console.log('DelayedOrdersTab: První zpožděná zakázka (dynamická data):', summary.delayedOrdersList[0]);
            }
        }
    }, [summary]);


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

    const delayedOrders = summary.delayedOrdersList;
    const displayedOrders = showAll ? delayedOrders : delayedOrders.slice(0, 10);

    console.log('DelayedOrdersTab: Počet zakázek k vykreslení (displayedOrders.length):', displayedOrders.length);


    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 text-red-400">
                        <ClipboardList className="w-6 h-6" /> {t.delayed} ({delayedOrders.length})
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
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.deliveryNo}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.delay}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.loadingDate}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.status}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.note}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedOrders.map((order) => {
                                    console.log('DelayedOrdersTab: Vykresluji zakázku (dynamická data):', order.delivery, order);
                                    
                                    if (!order.delivery) {
                                        console.warn('DelayedOrdersTab: Zakázka postrádá číslo dodávky pro klíč, přeskočeno:', order);
                                        return null;
                                    }

                                    return (
                                        <tr key={order.delivery} className="border-t border-gray-600 hover:bg-gray-600">
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
                {delayedOrders.length > 10 && (
                    <div className="text-center mt-4">
                        <button onClick={() => setShowAll(!showAll)} className="text-blue-400 hover:underline">
                            {showAll ? t.showLess : `${t.showMore} (${delayedOrders.length - 10} ${t.moreItems})`}
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}