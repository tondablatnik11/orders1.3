// src/components/shared/OrderListTable.jsx

"use client";
import React from 'react';
import { useUI } from '@/hooks/useUI';
import { format, parseISO } from 'date-fns';

export default function OrderListTable({ orders, onSelectOrder, size = 'normal' }) {
    const { t } = useUI();
    const isSmall = size === 'small';

    if (!orders || orders.length === 0) {
        return <p className="text-center text-gray-400">{t.noDataAvailable}</p>;
    }
    
    return (
        <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-gray-700 rounded-lg">
                <thead className="bg-gray-600">
                    <tr>
                        <th className={`${isSmall ? 'py-2 px-2' : 'py-3 px-4'} text-left text-xs font-semibold`}>{t.deliveryNo}</th>
                        <th className={`${isSmall ? 'py-2 px-2' : 'py-3 px-4'} text-left text-xs font-semibold`}>{t.status}</th>
                        <th className={`${isSmall ? 'py-2 px-2' : 'py-3 px-4'} text-left text-xs font-semibold`}>{t.loadingDate}</th>
                        <th className={`${isSmall ? 'py-2 px-2' : 'py-3 px-4'} text-left text-xs font-semibold`}>{t.shipToPartyName}</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order, index) => {
                        let formattedLoadingDate = 'N/A';
                        if (order["Loading Date"]) {
                            try { formattedLoadingDate = format(parseISO(order["Loading Date"]), 'dd/MM/yyyy'); } catch (e) {}
                        }
                        return (
                            <tr
                                key={order["Delivery No"] || index}
                                className="border-t border-gray-600 cursor-pointer hover:bg-gray-600"
                                onClick={() => onSelectOrder(order)}
                            >
                                <td className={`${isSmall ? 'py-1 px-2' : 'py-3 px-4'} text-sm`}>{order["Delivery No"]}</td>
                                <td className={`${isSmall ? 'py-1 px-2' : 'py-3 px-4'} text-sm`}>{order.Status}</td>
                                <td className={`${isSmall ? 'py-1 px-2' : 'py-3 px-4'} text-sm`}>{formattedLoadingDate}</td>
                                <td className={`${isSmall ? 'py-1 px-2' : 'py-3 px-4'} text-sm`}>{order["Name of ship-to party"] || 'N/A'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}