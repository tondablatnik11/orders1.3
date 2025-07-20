// src/components/tabs/DelayedOrdersTab.jsx
"use client";
import React, { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '@/components/ui/Card';
import { FileDown, ClipboardList } from 'lucide-react';
import { exportDelayedOrdersXLSX } from '@/lib/exportUtils';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';
import OrderListTable from '../shared/OrderListTable'; // Import univerzální tabulky

export default function DelayedOrdersTab() {
    const { summary, setSelectedOrderDetails: setGlobalSelectedOrderDetails, selectedOrderDetails: globalSelectedOrderDetails } = useData();
    const { t } = useUI();
    const [showAll, setShowAll] = useState(false);
    
    // Přemapování dat pro konzistenci se sloupci v OrderListTable
    const delayedOrdersForTable = useMemo(() => {
        if (!summary || !summary.delayedOrdersList) {
            return [];
        }
        
        return summary.delayedOrdersList.map(order => ({
            ...order,
            "Delivery No": order.delivery,
            "del.type": order.delType,
            "Loading Date": order.loadingDate,
        }));
    }, [summary]);

    // Zobrazení "načítání", pokud data ještě nejsou k dispozici
    if (!summary || !summary.delayedOrdersList) {
        return (
            <Card>
                <CardContent>
                    <p className="text-center p-8">{t.noDataAvailable}</p>
                </CardContent>
            </Card>
        );
    }
    
    const displayedOrders = showAll ? delayedOrdersForTable : delayedOrdersForTable.slice(0, 10);

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 text-red-400">
                        <ClipboardList className="w-6 h-6" /> {t.delayed} ({summary.delayedOrdersList.length})
                    </h2>
                    <button
                        onClick={() => exportDelayedOrdersXLSX(summary.delayedOrdersList, t)}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
                    >
                        <FileDown className="w-5 h-5" /> {t.exportToXLSX}
                    </button>
                </div>
                
                <OrderListTable
                    orders={displayedOrders}
                    onSelectOrder={setGlobalSelectedOrderDetails}
                />

                {delayedOrdersForTable.length > 10 && (
                    <div className="text-center mt-4">
                        <button onClick={() => setShowAll(!showAll)} className="text-blue-400 hover:underline">
                            {showAll ? t.showLess : `${t.showMore} (${delayedOrdersForTable.length - 10} ${t.moreItems})`}
                        </button>
                    </div>
                )}

            </CardContent>

            {globalSelectedOrderDetails && (
                <OrderDetailsModal 
                    order={globalSelectedOrderDetails} 
                    onClose={() => setGlobalSelectedOrderDetails(null)} 
                />
            )}
        </Card>
    );
}