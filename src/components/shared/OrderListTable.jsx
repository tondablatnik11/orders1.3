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
                        {/* Sloupce v požadovaném pořadí */}
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.deliveryNo}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.status}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.deliveryType}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.loadingDate}</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.forwardingAgent}</th> {/* Jméno dopravce */}
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.shipToPartyName}</th> {/* Jméno příjemce */}
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.totalWeight}</th> {/* Celková hmotnost */}
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.billOfLading}</th> {/* Nákladní list */}
                        <th className="py-3 px-4 text-left text-sm font-semibold">{t.note}</th> {/* Poznámka */}
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order, index) => {
                        let formattedLoadingDate = 'N/A';
                        if (order["Loading Date"]) {
                            try {
                                formattedLoadingDate = format(parseISO(order["Loading Date"]), 'dd/MM/yyyy');
                            } catch (e) {/*ignore*/}
                        }
                        return (
                            <tr
                                key={order["Delivery No"] || index}
                                className="border-t border-gray-600 cursor-pointer hover:bg-gray-600"
                                onClick={() => onSelectOrder(order)} // Click handler pro otevření modalu
                            >
                                {/* Data v řádcích odpovídají pořadí sloupců */}
                                <td className="py-3 px-4">{order["Delivery No"]}</td>
                                <td className="py-3 px-4">{order.Status}</td>
                                <td className="py-3 px-4">{order["del.type"]}</td>
                                <td className="py-3 px-4">{formattedLoadingDate}</td>
                                <td className="py-3 px-4">{order["Forwarding agent name"] || 'N/A'}</td>
                                <td className="py-3 px-4">{order["Name of ship-to party"] || 'N/A'}</td>
                                <td className="py-3 px-4">{order["Total Weight"] || 'N/A'}</td>
                                <td className="py-3 px-4">{order["Bill of lading"] || 'N/A'}</td>
                                <td className="py-3 px-4">{order.Note || 'N/A'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}