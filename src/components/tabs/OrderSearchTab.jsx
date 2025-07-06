"use client";
import React, { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { exportSearchResultsToXLSX } from '@/lib/exportUtils';
import { Card, CardContent } from '../ui/Card';
import { Search, FileDown } from 'lucide-react';
import OrderListTable from '../shared/OrderListTable';
import { format, parseISO } from 'date-fns';

export default function OrderSearchTab() {
    const { t } = useUI();
    const { allOrdersData, setSelectedOrderDetails } = useData();

    const [searchDeliveryNo, setSearchDeliveryNo] = useState("");
    const [searchLoadingDate, setSearchLoadingDate] = useState("");
    const [searchStatus, setSearchStatus] = useState("all");
    const [searchShipToPartyName, setSearchShipToPartyName] = useState("all");
    const [searchResult, setSearchResult] = useState(null);

    const uniqueStatuses = useMemo(() => 
        Array.from(new Set(allOrdersData.map(row => Number(row.Status)).filter(s => !isNaN(s)))).sort((a, b) => a - b),
        [allOrdersData]
    );

    const handleSearch = () => {
        const searchDeliveryNos = searchDeliveryNo.split(/[, \n]+/).map(s => s.trim()).filter(Boolean);

        const filtered = allOrdersData.filter((row) => {
            const deliveryIdentifier = (row["Delivery"] || row["Delivery No"] || "").trim();
            const loadingDateStr = row["Loading Date"] ? format(parseISO(row["Loading Date"]), "yyyy-MM-dd") : "";

            const deliveryMatch = searchDeliveryNos.length > 0
                ? searchDeliveryNos.some(num => deliveryIdentifier.toLowerCase().includes(num.toLowerCase()))
                : true;
            const loadingDateMatch = searchLoadingDate ? loadingDateStr === searchLoadingDate : true;
            const statusMatch = searchStatus !== "all" ? String(row.Status) === String(searchStatus) : true;
            const partyMatch = searchShipToPartyName !== "all" ? (row["Name of ship-to party"] || "").toLowerCase().includes(searchShipToPartyName.toLowerCase()) : true;

            return deliveryMatch && loadingDateMatch && statusMatch && partyMatch;
        });
        setSearchResult(filtered);
    };

    const handleExport = () => {
        if (searchResult) {
            exportSearchResultsToXLSX(searchResult, t);
        }
    };

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-2xl font-semibold flex items-center gap-2 text-blue-400">
                        <Search className="w-6 h-6" /> {t.orderSearchTab}
                    </h2>
                    {searchResult && searchResult.length > 0 && (
                        <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                            <FileDown className="w-5 h-5" /> {t.exportToXLSX}
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.deliveryNo}:</label>
                        <textarea value={searchDeliveryNo} onChange={(e) => setSearchDeliveryNo(e.target.value)} className="w-full p-2 rounded-md bg-gray-700 h-24" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.loadingDate}:</label>
                        <input type="date" value={searchLoadingDate} onChange={(e) => setSearchLoadingDate(e.target.value)} className="w-full p-2 rounded-md bg-gray-700" />
                        <label className="block text-sm font-medium text-gray-400 mb-1 mt-2">{t.status}:</label>
                        <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)} className="w-full p-2 rounded-md bg-gray-700">
                            <option value="all">{t.all}</option>
                            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <button onClick={handleSearch} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" /> {t.searchOrders}
                </button>

                {searchResult && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                            {`${t.orderList} (${searchResult.length})`}
                        </h3>
                        {searchResult.length > 0 
                            ? <OrderListTable orders={searchResult} onSelectOrder={setSelectedOrderDetails} />
                            : <p className="text-red-400 text-center mt-4">{t.noOrdersFound}</p>
                        }
                    </div>
                )}
            </CardContent>
        </Card>
    );
}