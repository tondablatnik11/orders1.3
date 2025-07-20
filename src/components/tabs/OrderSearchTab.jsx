// src/components/tabs/OrderSearchTab.jsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { exportSearchResultsToXLSX } from '@/lib/exportUtils';
import { Card, CardContent } from '../ui/Card';
import { Search, FileDown } from 'lucide-react';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';
import OrderListTable from '../shared/OrderListTable';

export default function OrderSearchTab({ initialQuery, clearInitialQuery }) {
    const { t } = useUI();
    const { allOrdersData, setSelectedOrderDetails: setGlobalSelectedOrderDetails, selectedOrderDetails: globalSelectedOrderDetails } = useData();

    // ... (zbytek logiky pro vyhledávání zůstává stejný)
    const [searchDeliveryNo, setSearchDeliveryNo] = useState(initialQuery || "");
    const [searchLoadingDate, setSearchLoadingDate] = useState("");
    const [searchStatus, setSearchStatus] = useState("all");
    const [searchShipToPartyName, setSearchShipToPartyName] = useState("all");
    const [searchForwardingAgentName, setSearchForwardingAgentName] = useState("all");
    const [searchResult, setSearchResult] = useState(null);

    const uniqueStatuses = useMemo(() => {
        if (!allOrdersData) return [];
        const statusesFromData = allOrdersData.map(row => Number(row.Status)).filter(s => !isNaN(s));
        const allAvailableStatuses = Array.from(new Set([...statusesFromData, 80, 90]));
        return allAvailableStatuses.sort((a, b) => a - b);
    }, [allOrdersData]);

    const uniqueShipToPartyNames = useMemo(() => {
        if (!allOrdersData) return [];
        return Array.from(new Set(allOrdersData.map(row => row["Name of ship-to party"]).filter(name => name))).sort();
    }, [allOrdersData]);

    const uniqueForwardingAgentNames = useMemo(() => {
        if (!allOrdersData) return [];
        return Array.from(new Set(allOrdersData.map(row => row["Forwarding agent name"]).filter(name => name))).sort();
    }, [allOrdersData]);

    const handleSearch = (queryOverride) => {
        if (!allOrdersData) return;
        const queryToUse = typeof queryOverride === 'string' ? queryOverride : searchDeliveryNo;
        const searchDeliveryNos = queryToUse.split(/[, \n]+/).map(s => s.trim()).filter(Boolean);

        const filtered = allOrdersData.filter((row) => {
            const deliveryIdentifier = (row["Delivery"] || row["Delivery No"] || "").trim();
            
            const deliveryMatch = searchDeliveryNos.length > 0
                ? searchDeliveryNos.some(num => deliveryIdentifier.toLowerCase().includes(num.toLowerCase()))
                : true;
            const loadingDateMatch = searchLoadingDate ? (row["Loading Date"] && row["Loading Date"].startsWith(searchLoadingDate)) : true;
            const statusMatch = searchStatus !== "all" ? String(row.Status) === String(searchStatus) : true;
            const shipToPartyMatch = searchShipToPartyName !== "all" ? row["Name of ship-to party"] === searchShipToPartyName : true;
            const forwardingAgentMatch = searchForwardingAgentName !== "all" ? row["Forwarding agent name"] === searchForwardingAgentName : true;

            return deliveryMatch && loadingDateMatch && statusMatch && shipToPartyMatch && forwardingAgentMatch;
        });
        
        setSearchResult(filtered);
    };

    useEffect(() => {
        if (initialQuery) {
            setSearchDeliveryNo(initialQuery);
            setTimeout(() => handleSearch(initialQuery), 100);
            clearInitialQuery();
        }
    }, [initialQuery, clearInitialQuery, handleSearch]);


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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"> 
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.deliveryNo}:</label>
                        <textarea value={searchDeliveryNo} onChange={(e) => setSearchDeliveryNo(e.target.value)} className="w-full p-2 rounded-md bg-gray-700 h-24 resize-y" placeholder={t.enterDeliveryNo} />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.loadingDate}:</label>
                        <input type="date" value={searchLoadingDate} onChange={(e) => setSearchLoadingDate(e.target.value)} className="w-full p-2 rounded-md bg-gray-700" />
                        
                        <label className="block text-sm font-medium text-gray-400 mb-1 mt-3">{t.status}:</label>
                        <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)} className="w-full p-2 rounded-md bg-gray-700">
                            <option value="all">{t.all}</option>
                            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.filterByNameOfShipToParty}:</label>
                        <select value={searchShipToPartyName} onChange={(e) => setSearchShipToPartyName(e.target.value)} className="w-full p-2 rounded-md bg-gray-700">
                            <option value="all">{t.all}</option>
                            {uniqueShipToPartyNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>

                        <label className="block text-sm font-medium text-gray-400 mb-1 mt-3">{t.forwardingAgent}:</label>
                        <select value={searchForwardingAgentName} onChange={(e) => setSearchForwardingAgentName(e.target.value)} className="w-full p-2 rounded-md bg-gray-700">
                            <option value="all">{t.all}</option>
                            {uniqueForwardingAgentNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                </div>
                <button onClick={() => handleSearch(searchDeliveryNo)} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" /> {t.searchOrders}
                </button>

                {searchResult && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                            {`${t.orderList} (${searchResult.length})`}
                        </h3>
                         <OrderListTable
                            orders={searchResult}
                            onSelectOrder={setGlobalSelectedOrderDetails}
                            useStaticIcons={true} // NOVÉ: Použití statických ikon pro výkon
                        />
                    </div>
                )}

                {globalSelectedOrderDetails && ( 
                    <OrderDetailsModal
                        order={globalSelectedOrderDetails}
                        onClose={() => setGlobalSelectedOrderDetails(null)}
                        onShowHistory={() => {}}
                        t={t}
                    />
                )}
            </CardContent>
        </Card>
    );
}