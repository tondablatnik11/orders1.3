'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { exportSearchResultsToXLSX } from '@/lib/exportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Search, FileDown, XCircle } from 'lucide-react';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';
import OrderListTable from '../shared/OrderListTable';
import { format } from 'date-fns';

export default function OrderSearchTab({ initialQuery, clearInitialQuery }) {
    const { t } = useUI();
    const { allOrdersData, pickingData, setSelectedOrderDetails, selectedOrderDetails } = useData();

    const [searchParams, setSearchParams] = useState({
        deliveryNo: initialQuery || "",
        loadingDate: "",
        status: "all",
        shipToPartyName: "all",
        forwardingAgentName: "all",
        country: "all",
        deliveryType: "all",
    });
    const [searchResult, setSearchResult] = useState(null);

    const uniqueValues = useMemo(() => {
        if (!allOrdersData) return { statuses: [], shipToParties: [], forwardingAgents: [], countries: [], deliveryTypes: [] };
        const statuses = [...new Set(allOrdersData.map(row => Number(row.Status)))].sort((a, b) => a - b);
        const shipToParties = [...new Set(allOrdersData.map(row => row["Name of ship-to party"]))].sort();
        const forwardingAgents = [...new Set(allOrdersData.map(row => row["Forwarding agent name"]))].sort();
        const countries = [...new Set(allOrdersData.map(row => row["Country ship-to prty"]))].sort();
        const deliveryTypes = [...new Set(allOrdersData.map(row => row["del.type"]))].sort();
        return { statuses, shipToParties, forwardingAgents, countries, deliveryTypes };
    }, [allOrdersData]);

    const handleSearch = useCallback(() => {
        let results = [...allOrdersData];
        if (searchParams.deliveryNo) {
            const deliveryNumbers = searchParams.deliveryNo.split(/[\s,]+/).map(n => n.trim()).filter(Boolean);
            if(deliveryNumbers.length > 0) {
                results = results.filter(row => deliveryNumbers.includes(String(row["Delivery No"])));
            }
        }
        if (searchParams.loadingDate) {
             results = results.filter(row => row["Loading Date"] && format(new Date(row["Loading Date"]), 'yyyy-MM-dd') === searchParams.loadingDate);
        }
        if (searchParams.status !== "all") {
            results = results.filter(row => String(row.Status) === searchParams.status);
        }
        if (searchParams.country !== "all") {
             results = results.filter(row => row["Country ship-to prty"] === searchParams.country);
        }
        if (searchParams.deliveryType !== "all") {
             results = results.filter(row => row["del.type"] === searchParams.deliveryType);
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
        const fullOrderDetails = { ...order, picking_details: relatedPicking };
        setSelectedOrderDetails(fullOrderDetails);
    }, [pickingData, setSelectedOrderDetails]);

    const clearFilters = () => {
        setSearchParams({
            deliveryNo: "", loadingDate: "", status: "all", shipToPartyName: "all",
            forwardingAgentName: "all", country: "all", deliveryType: "all",
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                    <div className="lg:col-span-4">
                        <label className="text-sm font-medium text-slate-400">Číslo zakázky (lze vložit více čísel)</label>
                        <textarea name="deliveryNo" value={searchParams.deliveryNo} onChange={handleInputChange} rows="2" className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white" placeholder="Vložte jedno nebo více čísel (čárka, mezera, nový řádek)..." />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400">Datum nakládky</label>
                        <input type="date" name="loadingDate" value={searchParams.loadingDate} onChange={handleInputChange} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400">Status</label>
                        <select name="status" value={searchParams.status} onChange={handleInputChange} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                            <option value="all">Všechny</option>
                            {uniqueValues.statuses.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400">Země</label>
                        <select name="country" value={searchParams.country} onChange={handleInputChange} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                            <option value="all">Všechny</option>
                            {uniqueValues.countries.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400">Typ dodávky</label>
                        <select name="deliveryType" value={searchParams.deliveryType} onChange={handleInputChange} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                            <option value="all">Všechny</option>
                            {uniqueValues.deliveryTypes.map(name => <option key={name} value={name}>{name === 'P' ? 'Paleta' : 'Karton'}</option>)}
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
                            {searchResult.length > 0 && (
                                <button onClick={() => exportSearchResultsToXLSX(searchResult, t)} className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-600 transition-colors text-sm">
                                    <FileDown className="w-4 h-4" /> Exportovat výsledky
                                </button>
                            )}
                        </div>
                         <OrderListTable
                            orders={searchResult}
                            onSelectOrder={handleSelectOrder}
                            useStaticIcons={true}
                            rowsPerPage={500}
                        />
                    </div>
                )}

                {selectedOrderDetails && ( 
                    <OrderDetailsModal order={selectedOrderDetails} onClose={() => setSelectedOrderDetails(null)} />
                )}
            </CardContent>
        </Card>
    );
}