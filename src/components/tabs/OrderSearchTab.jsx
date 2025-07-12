"use client";
import React, { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { exportSearchResultsToXLSX } from '@/lib/exportUtils';
import { Card, CardContent } from '../ui/Card';
import { Search, FileDown } from 'lucide-react';
import OrderListTable from '../shared/OrderListTable';
import { format, parseISO } from 'date-fns';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';
import StatusHistoryModal from '@/components/modals/StatusHistoryModal';

export default function OrderSearchTab() {
    const { t } = useUI();
    const { allOrdersData, setSelectedOrderDetails: setGlobalSelectedOrderDetails, selectedOrderDetails: globalSelectedOrderDetails, handleSaveNote, supabase } = useData();

    const [searchDeliveryNo, setSearchDeliveryNo] = useState("");
    const [searchLoadingDate, setSearchLoadingDate] = useState("");
    const [searchStatus, setSearchStatus] = useState("all");
    const [searchShipToPartyName, setSearchShipToPartyName] = useState("all");
    const [searchForwardingAgentName, setSearchForwardingAgentName] = useState("all");
    const [searchResult, setSearchResult] = useState(null);

    const uniqueStatuses = useMemo(() =>
        Array.from(new Set(allOrdersData.map(row => Number(row.Status)).filter(s => !isNaN(s)))).sort((a, b) => a - b),
        [allOrdersData]
    );

    const uniqueShipToPartyNames = useMemo(() =>
        Array.from(new Set(allOrdersData.map(row => row["Name of ship-to party"]).filter(name => name))).sort(),
        [allOrdersData]
    );

    const uniqueForwardingAgentNames = useMemo(() =>
        Array.from(new Set(allOrdersData.map(row => row["Forwarding agent name"]).filter(name => name))).sort(),
        [allOrdersData]
    );


    const handleSearch = () => {
        const searchDeliveryNos = searchDeliveryNo.split(/[, \n]+/).map(s => s.trim()).filter(Boolean);

        const filtered = allOrdersData.filter((row) => {
            const deliveryIdentifier = (row["Delivery"] || row["Delivery No"] || "").trim();
            const loadingDateStr = row["Loading Date"] ? format(parseISO(row["Loading Date"]), "yyyy-MM-dd") : "";

            // Všechny proměnné match musí být definovány uvnitř callbacku filtru
            const deliveryMatch = searchDeliveryNos.length > 0
                ? searchDeliveryNos.some(num => deliveryIdentifier.toLowerCase().includes(num.toLowerCase()))
                : true;
            const loadingDateMatch = searchLoadingDate ? loadingDateStr === searchLoadingDate : true;
            const statusMatch = searchStatus !== "all" ? String(row.Status) === String(searchStatus) : true;
            
            const partyNameInRow = (row["Name of ship-to party"] || "").toLowerCase();
            const shipToPartyMatch = searchShipToPartyName !== "all"
                ? partyNameInRow.includes(searchShipToPartyName.toLowerCase())
                : true;

            const agentNameInRow = (row["Forwarding agent name"] || "").toLowerCase();
            const forwardingAgentMatch = searchForwardingAgentName !== "all"
                ? agentNameInRow.includes(searchForwardingAgentName.toLowerCase())
                : true;


            return deliveryMatch && loadingDateMatch && statusMatch && shipToPartyMatch && forwardingAgentMatch;
        });

        const mappedResults = filtered.map(order => ({
            "Delivery No": (order["Delivery No"] || order["Delivery"])?.trim(),
            "Status": Number(order.Status),
            "del.type": order["del.type"],
            "Loading Date": order["Loading Date"],
            "Note": order.Note || '',
            "Forwarding agent name": order["Forwarding agent name"] || 'N/A',
            "Name of ship-to party": order["Name of ship-to party"] || 'N/A',
            "Total Weight": order["Total Weight"] || 'N/A',
            "Bill of lading": order["Bill of lading"] || 'N/A',
        }));

        setSearchResult(mappedResults);
    };

    const handleExport = () => {
        if (searchResult) {
            exportSearchResultsToXLSX(searchResult, t);
        }
    };

    const handleSelectOrderForModal = (order) => {
        setGlobalSelectedOrderDetails(order);
    };

    const handleCloseOrderDetailsModal = () => {
        setGlobalSelectedOrderDetails(null);
    };

    const handleShowStatusHistory = async (deliveryNo) => {
        try {
            const { data, error } = await supabase
                .from('delivery_status_log')
                .select('status, timestamp')
                .eq('delivery_no', deliveryNo.trim())
                .order('timestamp', { ascending: true });

            if (error) {
                console.error("Error fetching status history:", error.message);
            } else {
                console.log("Status History for", deliveryNo, data);
            }
        } catch (e) {
            console.error("Caught error fetching status history:", e);
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
                <button onClick={handleSearch} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" /> {t.searchOrders}
                </button>

                {searchResult && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4 text-white">
                            {`${t.orderList} (${searchResult.length})`}
                        </h3>
                        {searchResult.length > 0 
                            ? <OrderListTable orders={searchResult} onSelectOrder={handleSelectOrderForModal} />
                            : <p className="text-red-400 text-center mt-4">{t.noOrdersFound}</p>
                        }
                    </div>
                )}

                {globalSelectedOrderDetails && ( 
                    <OrderDetailsModal
                        order={globalSelectedOrderDetails}
                        onClose={handleCloseOrderDetailsModal}
                        onShowHistory={handleShowStatusHistory} 
                        onSaveNote={handleSaveNote} 
                        t={t}
                    />
                )}
            </CardContent>
        </Card>
    );
}