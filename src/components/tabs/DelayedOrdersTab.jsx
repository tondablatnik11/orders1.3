"use client";
import React, { useState, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, parseISO } from 'date-fns';
import { getDelayColorClass } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { FileDown, ClipboardList } from 'lucide-react';

export default function DelayedOrdersTab() {
    const { summary, handleSaveNote } = useData();
    const { t } = useUI();
    const [showAll, setShowAll] = useState(false);
    const [localNotes, setLocalNotes] = useState({});

    useEffect(() => {
        if (summary && summary.delayedOrdersList) {
            const initialNotes = {};
            summary.delayedOrdersList.forEach(order => {
                initialNotes[order["Delivery No"]] = order.Note || '';
            });
            setLocalNotes(initialNotes);
        }
    }, [summary]);

    if (!summary || !summary.delayedOrdersList || summary.delayedOrdersList.length === 0) {
        return <Card><CardContent><p className="text-center p-8">{t.noDataAvailable}</p></CardContent></Card>;
    }

    const handleNoteChange = (deliveryNo, text) => {
        setLocalNotes(prev => ({ ...prev, [deliveryNo]: text }));
    };

    const handleNoteBlur = (deliveryNo) => {
        const originalNote = summary.delayedOrdersList.find(o => o["Delivery No"] === deliveryNo)?.Note || '';
        if (localNotes[deliveryNo] !== undefined && localNotes[deliveryNo] !== originalNote) {
            handleSaveNote(deliveryNo, localNotes[deliveryNo]);
        }
    };

    const delayedOrders = summary.delayedOrdersList;
    const displayedOrders = showAll ? delayedOrders : delayedOrders.slice(0, 10);

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 text-red-400">
                        <ClipboardList className="w-6 h-6" /> {t.delayed} ({delayedOrders.length})
                    </h2>
                    <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700">
                        <FileDown className="w-5 h-5" /> Export do XLSX
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-800">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold">{t.deliveryNo}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">{t.status}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">{t.deliveryType}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">{t.loadingDate}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">{t.delay}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">Nákladní list</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">{t.note}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {displayedOrders.map((order) => (
                                <tr key={order["Delivery No"]} className="hover:bg-gray-750">
                                    <td className="py-3 px-4">{order["Delivery No"]}</td>
                                    <td className="py-3 px-4">{order.Status}</td>
                                    <td className="py-3 px-4">{order["del.type"]}</td>
                                    <td className="py-3 px-4">{format(parseISO(order["Loading Date"]), 'dd/MM/yyyy')}</td>
                                    <td className={`py-3 px-4 font-semibold ${getDelayColorClass(order.delayDays)}`}>{order.delayDays}</td>
                                    <td className="py-3 px-4">{order["Bill of lading"] || 'N/A'}</td>
                                    <td className="py-3 px-4">
                                        <input
                                            type="text"
                                            value={localNotes[order["Delivery No"]] ?? ''}
                                            onChange={(e) => handleNoteChange(order["Delivery No"], e.target.value)}
                                            onBlur={() => handleNoteBlur(order["Delivery No"])}
                                            className="w-full p-1 rounded-md bg-gray-600 border border-gray-500 text-sm focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Poznámka"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {delayedOrders.length > 10 && (
                    <div className="text-center mt-4">
                        <button onClick={() => setShowAll(!showAll)} className="text-blue-400 hover:underline px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600">
                            {showAll ? t.showLess : `${t.showMore} (${delayedOrders.length - 10} ${t.moreItems})`}
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}