"use client";
import React, { useState } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { useAuth } from '@/hooks/useAuth';
import { exportDelayedOrdersXLSX } from '@/lib/exportUtils';
import { format, parseISO } from 'date-fns';
import { getDelayColorClass } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { FileDown, ClipboardList } from 'lucide-react';

export default function DelayedOrdersTab() {
    const { summary, handleSaveNote } = useData();
    const { t } = useUI();
    const { supabase } = useAuth();
    const [showAll, setShowAll] = useState(false);
    const [localNotes, setLocalNotes] = useState({});

    if (!summary || !summary.delayedOrdersList) {
        return <p className="text-center p-8">{t.noDataAvailable}</p>;
    }

    const handleExport = () => {
        exportDelayedOrdersXLSX(supabase, t);
    };
    
    const handleNoteChange = (deliveryNo, text) => {
        setLocalNotes(prev => ({ ...prev, [deliveryNo]: text }));
    };

    const handleNoteBlur = (deliveryNo) => {
        if (localNotes[deliveryNo] !== undefined) {
            const originalNote = summary.delayedOrdersList.find(o => o.delivery === deliveryNo)?.note || '';
            if (localNotes[deliveryNo] !== originalNote) {
                handleSaveNote(deliveryNo, localNotes[deliveryNo]);
            }
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
                    <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                        <FileDown className="w-5 h-5" /> {t.exportToXLSX}
                    </button>
                </div>
                <div className="overflow-x-auto">
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
                            {displayedOrders.map((order, index) => (
                                <tr key={order.delivery || index} className="border-t border-gray-600 hover:bg-gray-600">
                                    <td className="py-3 px-4">{order.delivery}</td>
                                    <td className={`py-3 px-4 font-semibold ${getDelayColorClass(order.delayDays)}`}>{order.delayDays}</td>
                                    <td className="py-3 px-4">{format(parseISO(order.loadingDate), 'dd.MM.yyyy')}</td>
                                    <td className="py-3 px-4">{order.status}</td>
                                    <td className="py-3 px-4">
                                        <input
                                            type="text"
                                            value={localNotes[order.delivery] ?? order.note}
                                            onChange={(e) => handleNoteChange(order.delivery, e.target.value)}
                                            onBlur={() => handleNoteBlur(order.delivery)}
                                            className="w-full p-1 rounded-md bg-gray-600 border border-gray-500 text-sm"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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