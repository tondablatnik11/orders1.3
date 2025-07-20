// src/components/shared/OrderListTable.jsx
"use client";
import React, { useState, useMemo } from 'react';
import { useUI } from '@/hooks/useUI';
import { format, parseISO } from 'date-fns';
import AnimatedStatusIcon from './AnimatedStatusIcon';
import { ArrowUpDown } from 'lucide-react';

// Hook pro řazení dat
const useSortableData = (items, config = null) => {
    const [sortConfig, setSortConfig] = useState(config);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
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
    }, [items, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
};

export default function OrderListTable({ orders, onSelectOrder }) {
    const { t } = useUI();
    const { items, requestSort, sortConfig } = useSortableData(orders);

    const getSortIndicator = (name) => {
        if (!sortConfig || sortConfig.key !== name) {
            return <ArrowUpDown className="w-3 h-3 ml-2 text-gray-400" />;
        }
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const headers = [
        { key: 'Delivery No', label: t.deliveryNo },
        { key: 'Status', label: t.status },
        { key: 'del.type', label: t.deliveryType },
        { key: 'Loading Date', label: t.loadingDate },
        { key: 'Forwarding agent name', label: t.forwardingAgent },
        { key: 'Name of ship-to party', label: t.shipToPartyName },
        { key: 'Total Weight', label: t.totalWeight },
        { key: 'Bill of lading', label: t.billOfLading },
        { key: 'Country ship-to prty', label: 'Země' },
        { key: 'Note', label: t.note }
    ];

    if (!items || items.length === 0) {
        return <p className="text-center text-gray-400 p-4">{t.noDataAvailable}</p>;
    }
    
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800/50 rounded-lg">
                <thead className="bg-gray-700/50">
                    <tr>
                        {headers.map(header => (
                            <th 
                                key={header.key}
                                className="py-3 px-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-600/50"
                                onClick={() => requestSort(header.key)}
                            >
                                <div className="flex items-center">
                                    {header.label} {getSortIndicator(header.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {items.map((order, index) => (
                        <tr
                            key={order["Delivery No"] || index}
                            className="hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
                            onClick={() => onSelectOrder(order)}
                        >
                            <td className="py-3 px-4 text-sm font-medium text-white">{order["Delivery No"]}</td>
                            <td className="py-3 px-4 text-sm"><AnimatedStatusIcon status={order.Status} /></td>
                            <td className="py-3 px-4 text-sm">{order["del.type"]}</td>
                            <td className="py-3 px-4 text-sm">{order["Loading Date"] ? format(parseISO(order["Loading Date"]), 'dd.MM.yyyy') : 'N/A'}</td>
                            <td className="py-3 px-4 text-sm">{order["Forwarding agent name"] || 'N/A'}</td>
                            <td className="py-3 px-4 text-sm">{order["Name of ship-to party"] || 'N/A'}</td>
                            <td className="py-3 px-4 text-sm">{order["Total Weight"] || 'N/A'}</td>
                            <td className="py-3 px-4 text-sm">{order["Bill of lading"] || 'N/A'}</td>
                            <td className="py-3 px-4 text-sm">{order["Country ship-to prty"] || 'N/A'}</td>
                            <td className="py-3 px-4 text-sm text-gray-300 truncate max-w-xs">{order.Note || ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}