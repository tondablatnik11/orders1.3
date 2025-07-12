"use client";
import React, { useState, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
// Následující importy již nejsou pro tento TEST potřeba, ale ponecháme je, aby nedošlo k chybám importu
// import { format, parseISO } from 'date-fns'; 
// import { getDelayColorClass } from '@/lib/utils'; 
import { Card, CardContent } from '@/components/ui/Card';
import { FileDown, ClipboardList } from 'lucide-react';
// import { exportDelayedOrdersXLSX } from '@/lib/exportUtils'; // Není potřeba pro testovací tlačítko

export default function DelayedOrdersTab() {
    // Všechny původní stavy a hooky související s daty a logikou jsou zde DOČASNĚ zakomentovány
    // const { summary, handleSaveNote, supabase } = useData(); 
    const { t } = useUI();
    // const [showAll, setShowAll] = useState(false); 
    // const [localNotes, setLocalNotes] = useState({}); 

    // Tento log je zásadní! Měl by se objevit v konzoli, pokud se komponenta vykreslí.
    useEffect(() => {
        console.log('DelayedOrdersTab: Komponenta se vykresluje - TEST DUMMY TABLE');
    }, []); 

    // Log pro kontrolu, zda se kód dostane až sem
    console.log('DelayedOrdersTab: Příprava na vykreslení DUMMY tabulky');


    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 text-red-400">
                        <ClipboardList className="w-6 h-6" /> {t.delayed} - TEST DUMMY TABLE (DUMMY)
                    </h2>
                    {/* Tlačítko Export je nyní jen placeholder */}
                    <button
                        onClick={() => console.log('Export button clicked - dummy')} 
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
                    >
                        <FileDown className="w-5 h-5" /> {t.exportToXLSX}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {/* ZDE JE HARDCODED DUMMY TABULKA PRO TESTOVÁNÍ */}
                    <table className="min-w-full bg-gray-700">
                        <thead className="bg-gray-600">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold">Dummy Delivery No</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">Dummy Delay</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">Dummy Loading Date</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">Dummy Status</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">Dummy Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Dummy řádek 1 */}
                            <tr className="border-t border-gray-600 hover:bg-gray-600">
                                <td className="py-3 px-4">DELIVERY-DUMMY-001</td>
                                <td className="py-3 px-4 font-semibold text-red-400">5</td>
                                <td className="py-3 px-4">01/01/2025</td>
                                <td className="py-3 px-4">DUMMY_STATUS_40</td>
                                <td className="py-3 px-4">Dummy Note for Order 1</td>
                            </tr>
                            {/* Dummy řádek 2 */}
                            <tr className="border-t border-gray-600 hover:bg-gray-600">
                                <td className="py-3 px-4">DELIVERY-DUMMY-002</td>
                                <td className="py-3 px-4 font-semibold text-orange-400">2</td>
                                <td className="py-3 px-4">02/01/2025</td>
                                <td className="py-3 px-4">DUMMY_STATUS_31</td>
                                <td className="py-3 px-4">Dummy Note for Order 2</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* Původní logika pro "zobrazit více/méně" je dočasně zakomentována */}
            </CardContent>
        </Card>
    );
}