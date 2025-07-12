"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/Card';
import { ClipboardList, FileDown } from 'lucide-react';

export default function DelayedOrdersTab() {
    const { summary } = useData();
    const { t } = useUI();

    if (!summary || !summary.delayedOrdersList || summary.delayedOrdersList.length === 0) {
        return <Card><CardContent><p className="text-center p-8">{t.noDataAvailable}</p></CardContent></Card>;
    }

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 text-red-400">
                        <ClipboardList className="w-6 h-6" /> {t.delayedOrdersTab} ({summary.delayedOrdersList.length})
                    </h2>
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                        <FileDown className="w-5 h-5" /> {t.exportToXLSX}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-700">
                        <thead className="bg-gray-600">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold">{t.deliveryNo}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">{t.status}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">{t.delay}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.delayedOrdersList.slice(0, 10).map((order) => (
                                <tr key={order["Delivery No"]} className="border-t border-gray-600">
                                    <td className="py-3 px-4">{order["Delivery No"]}</td>
                                    <td className="py-3 px-4">{order.Status}</td>
                                    <td className="py-3 px-4 text-red-400 font-semibold">{order.delayDays}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}