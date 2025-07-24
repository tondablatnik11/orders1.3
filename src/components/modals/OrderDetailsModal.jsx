'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Truck } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Pomocné komponenty pro přehlednost ---

const DetailRow = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-slate-100">
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 font-medium">{value || '-'}</dd>
    </div>
);

const PickingDetails = ({ details }) => {
    if (!details || details.length === 0) return null;
    return (
        <div className="mt-6">
            <h4 className="font-semibold text-lg text-slate-800 mb-2">Detaily Pickování</h4>
            <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Picker</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Materiál</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Množství</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Čas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {details.map((pick, index) => (
                            <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700">{pick.user_name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700">
                                    <div>{pick.material}</div>
                                    <div className="text-xs text-slate-500" title={pick.material_description}>{pick.material_description}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700">{pick.source_actual_qty}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700">{new Date(pick.confirmation_date).toLocaleDateString()} {pick.confirmation_time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Hlavní komponenta ---

const OrderDetailsModal = ({ order, onClose, onShowHistory }) => {
    if (!order) return null;
    
    const { handleSaveNote, fetchOrderComments, addOrderComment } = useData();
    const { user, userProfile } = useAuth();
    const [note, setNote] = useState(order.Note || "");

    useEffect(() => {
        setNote(order.Note || "");
    }, [order]);
    
    // Funkce pro sledování zásilky
    const handleTrackShipment = () => {
        const trackingNumber = order['Bill of lading'];
        const agent = (order['Forwarding agent name'] || '').toLowerCase();

        if (!trackingNumber) {
            toast.error('Sledovací číslo není k dispozici.');
            return;
        }

        let url = '';
        if (agent.includes('ups')) {
            url = `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
        } else if (agent.includes('fedex')) {
            url = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
        } else if (agent.includes('dhl')) {
            url = `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
        } else {
            toast.error(`Sledování pro dopravce "${order['Forwarding agent name']}" není podporováno.`);
            return;
        }

        window.open(url, '_blank');
    };
    
    // Vyfiltrujeme systémové a nepotřebné sloupce
    const orderEntries = Object.entries(order).filter(([key]) => ![
        'picking_details', 'id', 'created_at', 'updated_at', 'Note'
    ].includes(key));

    return (
        <Modal isOpen={!!order} onClose={onClose} title={`Detail zakázky: ${order['Delivery No']}`}>
            <div className="p-6 space-y-6">
                <div>
                    <h4 className="font-semibold text-lg text-slate-800 mb-2">Základní informace</h4>
                    <div className="border-t border-slate-200">
                        <dl>
                            {orderEntries.map(([key, value]) => (
                                 <DetailRow key={key} label={key} value={String(value)} />
                            ))}
                        </dl>
                    </div>
                </div>

                <PickingDetails details={order.picking_details} />

                <div>
                    <h4 className="font-semibold text-lg text-slate-800 mb-2">Poznámka</h4>
                    <textarea 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        rows="3"
                    ></textarea>
                </div>
                
                <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t">
                     <Button onClick={handleTrackShipment} variant="outline" disabled={!order['Bill of lading']}>
                        <Truck className="mr-2 h-4 w-4" />
                        Sledovat zásilku
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={() => onShowHistory(order['Delivery No'])} variant="outline">Historie stavů</Button>
                        <Button onClick={() => handleSaveNote(order['Delivery No'], note)}>Uložit poznámku</Button>
                        <Button onClick={onClose}>Zavřít</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default OrderDetailsModal;