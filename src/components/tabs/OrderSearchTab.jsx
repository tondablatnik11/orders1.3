'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { exportSearchResultsToXLSX } from '@/lib/exportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Search, FileDown, XCircle } from 'lucide-react';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';
import OrderListTable from '../shared/OrderListTable';

export default function OrderSearchTab({ initialQuery, clearInitialQuery }) {
    const { t } = useUI();
    const { allOrdersData, pickingData, setSelectedOrderDetails, selectedOrderDetails } = useData();

    const [searchParams, setSearchParams] = useState({
        deliveryNo: initialQuery || "",
        loadingDate: "",
        status: "all",
        shipToPartyName: "all",
        forwardingAgentName: "all",
    });
    const [searchResult, setSearchResult] = useState(null);

    const uniqueValues = useMemo(() => {
        if (!allOrdersData) return { statuses: [], shipToParties: [], forwardingAgents: [] };
        const statuses = [...new Set(allOrdersData.map(row => Number(row.Status)))].sort((a, b) => a - b);
        const shipToParties = [...new Set(allOrdersData.map(row => row["Name of ship-to party"]))].sort();
        const forwardingAgents = [...new Set(allOrdersData.map(row => row["Forwarding agent name"]))].sort();
        return { statuses, shipToParties, forwardingAgents };
    }, [allOrdersData]);

    const handleSearch = useCallback(() => {
        let results = [...allOrdersData];
        if (searchParams.deliveryNo) {
            results = results.filter(row => String(row["Delivery No"]).includes(searchParams.deliveryNo));
        }
        if (searchParams.status !== "all") {
            results = results.filter(row => String(row.Status) === searchParams.status);
        }
        if (searchParams.shipToPartyName !== "all") {
            results = results.filter(row => row["Name of ship-to party"] === searchParams.shipToPartyName);
        }
        if (searchParams.forwardingAgentName !== "all") {
            results = results.filter(row => row["Forwarding agent name"] === searchParams.forwardingAgentName);
        }
        setSearchResult(results);
    }, [allOrdersData, searchParams]);

    useEffect(() => {
        if (initialQuery) {
            handleSearch();
            clearInitialQuery();
        }
    }, [initialQuery, handleSearch, clearInitialQuery]);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectOrder = useCallback((order) => {
        const deliveryNo = order["Delivery No"];
        const relatedPicking = pickingData.filter(p => String(p.delivery_no) === String(deliveryNo));
        const fullOrderDetails = {
            ...order,
            picking_details: relatedPicking
        };
        setSelectedOrderDetails(fullOrderDetails);
    }, [pickingData, setSelectedOrderDetails]);

    const clearFilters = () => {
        setSearchParams({
            deliveryNo: "",
            loadingDate: "",
            status: "all",
            shipToPartyName: "all",
            forwardingAgentName: "all",
        });
        setSearchResult(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Search />
                    {t.searchOrders}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                    <div className="lg:col-span-3">
                        <label className="text-sm font-medium text-slate-400">Číslo zakázky</label>
                        <input type="text" name="deliveryNo" value={searchParams.deliveryNo} onChange={handleInputChange} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white" placeholder="Zadejte číslo..." />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400">Status</label>
                        <select name="status" value={searchParams.status} onChange={handleInputChange} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                            <option value="all">Všechny</option>
                            {uniqueValues.statuses.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400">Příjemce</label>
                        <select name="shipToPartyName" value={searchParams.shipToPartyName} onChange={handleInputChange} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                            <option value="all">Všichni</option>
                            {uniqueValues.shipToParties.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400">Dopravce</label>
                        <select name="forwardingAgentName" value={searchParams.forwardingAgentName} onChange={handleInputChange} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                            <option value="all">Všichni</option>
                            {uniqueValues.forwardingAgents.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <button onClick={handleSearch} className="w-full bg-sky-600 text-white px-4 py-2 rounded-lg shadow hover:bg-sky-700 flex items-center justify-center gap-2 transition-colors">
                        <Search className="w-5 h-5" /> Hledat
                    </button>
                    <button onClick={clearFilters} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
                        <XCircle className="w-4 h-4" /> Vyčistit filtry
                    </button>
                </div>

                {searchResult && (
                    <div className="mt-8 pt-6 border-t border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-white">
                                Výsledky hledání ({searchResult.length})
                            </h3>
                            <button
                                onClick={() => exportSearchResultsToXLSX(searchResult, t)}
                                className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-600 transition-colors text-sm"
                            >
                                <FileDown className="w-4 h-4" /> Exportovat výsledky
                            </button>
                        </div>
                         <OrderListTable
                            orders={searchResult}
                            onSelectOrder={handleSelectOrder}
                            useStaticIcons={true}
                        />
                    </div>
                )}

                {selectedOrderDetails && ( 
                    <OrderDetailsModal
                        order={selectedOrderDetails}
                        onClose={() => setSelectedOrderDetails(null)}
                    />
                )}
            </CardContent>
        </Card>
    );
}