"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { Card } from '@/components/ui/Card';
import { Search } from 'lucide-react';

export default function DataFilters() {
    const { filters, setFilters, allOrdersData } = useData();
    const { t } = useUI();
    const [isCollapsed, setIsCollapsed] = React.useState(true);

    const uniqueStatuses = Array.from(new Set(allOrdersData.map(row => Number(row.Status)).filter(s => !isNaN(s)))).sort((a, b) => a - b);
    const uniqueDeliveryTypes = Array.from(new Set(allOrdersData.map(row => row["del.type"]).filter(t => t))).sort();

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            timeRange: 'all', startDate: '', endDate: '',
            deliveryType: 'all', status: 'all',
        });
    };

    return (
        <Card className="bg-gray-800 p-4 rounded-xl shadow-lg">
            <h2 onClick={() => setIsCollapsed(!isCollapsed)} className="text-xl font-semibold mb-3 text-gray-200 flex items-center gap-2 cursor-pointer">
                <Search className="w-5 h-5" /> {t.filters}
                <span className="ml-auto text-sm">{isCollapsed ? '▼' : '▲'}</span>
            </h2>
            {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                        <label htmlFor="timeRange" className="block text-xs font-medium text-gray-400 mb-1">{t.timeRange}:</label>
                        <select name="timeRange" value={filters.timeRange} onChange={handleFilterChange} className="w-full p-1.5 text-sm rounded-md bg-gray-700 border border-gray-600">
                            <option value="all">{t.allTime}</option>
                            <option value="yesterday">{t.yesterday}</option>
                            <option value="today">{t.today}</option>
                            <option value="last7days">{t.last7Days}</option>
                            <option value="thisMonth">{t.thisMonth}</option>
                            <option value="custom">{t.customRange}</option>
                        </select>
                    </div>
                    {filters.timeRange === 'custom' && (
                        <>
                            <div>
                                <label htmlFor="startDate" className="block text-xs font-medium text-gray-400 mb-1">Start Date:</label>
                                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full p-1.5 text-sm rounded-md bg-gray-700 border border-gray-600" />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-xs font-medium text-gray-400 mb-1">End Date:</label>
                                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full p-1.5 text-sm rounded-md bg-gray-700 border border-gray-600" />
                            </div>
                        </>
                    )}
                    <div>
                        <label htmlFor="deliveryType" className="block text-xs font-medium text-gray-400 mb-1">{t.filterByDeliveryType}:</label>
                        <select name="deliveryType" value={filters.deliveryType} onChange={handleFilterChange} className="w-full p-1.5 text-sm rounded-md bg-gray-700 border border-gray-600">
                            <option value="all">{t.all}</option>
                            {uniqueDeliveryTypes.map(type => (
                                <option key={type} value={type}>{type === 'P' ? t.pallets : t.carton}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-xs font-medium text-gray-400 mb-1">{t.filterByStatus}:</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-1.5 text-sm rounded-md bg-gray-700 border border-gray-600">
                            <option value="all">{t.all}</option>
                            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                        <button onClick={clearFilters} className="bg-gray-600 text-white px-3 py-1.5 text-sm rounded-lg shadow hover:bg-gray-700">{t.clearFilters}</button>
                    </div>
                </div>
            )}
        </Card>
    );
}