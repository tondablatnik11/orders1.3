"use client";
import React from 'react';
import { useUI } from '@/hooks/useUI';
import { format, parseISO } from 'date-fns';

export default function OrderListTable({ orders, onSelectOrder }) {
    const { t } = useUI();

    if (!orders || orders.length === 0) {
        return <p className="text-center text-gray-400">{t.noDataAvailable}</p>;
    }
    
    return (
        <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-gray-700 rounded-lg">
                <thead className="bg-gray-600">
                    <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.deliveryNo}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.status}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.shipToPartyName}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.loadingDate}</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order, index) => {
                        let formattedDate = 'N/A';
                        if (order["Loading Date"]) {
                            try {
                                formattedDate = format(parseISO(order["Loading Date"]), 'dd/MM/yyyy');
                            } catch (e) {/*ignore*/}
                        }
                        return (
                            <tr
                                key={order["Delivery No"] || index}
                                className="border-t border-gray-600 cursor-pointer hover:bg-gray-600"
                                onClick={() => onSelectOrder(order)}
                            >
                                <td className="py-3 px-4">{order["Delivery No"]}</td>
                                <td className="py-3 px-4">{order.Status}</td>
                                <td className="py-3 px-4">{order["Name of ship-to party"] || 'N/A'}</td>
                                <td className="py-3 px-4">{formattedDate}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}