// src/components/modals/ErrorDetailModal.jsx
"use client";
import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useData } from '@/hooks/useData';
import { Box, User, Hash, MapPin, Calendar, GitCommitVertical } from 'lucide-react';

const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
        <Icon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
        <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-md text-white font-semibold break-all">{value || 'N/A'}</p>
        </div>
    </div>
);

export default function ErrorDetailModal({ error, onClose }) {
    const { allOrdersData, setSelectedOrderDetails } = useData();

    if (!error) return null;

    const handleOrderClick = (deliveryNo) => {
        const orderDetails = allOrdersData.find(order => String(order['Delivery No']) === String(deliveryNo));
        if (orderDetails) {
            onClose(); // Zavřeme aktuální modál
            setSelectedOrderDetails(orderDetails); // Otevřeme modál s detailem objednávky
        }
    };
    
    return (
        <Modal title={`Detail chyby: ${error.description}`} onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem icon={Calendar} label="Čas" value={new Date(error.timestamp).toLocaleString('cs-CZ')} />
                <DetailItem icon={User} label="Uživatel" value={error.user} />
                <DetailItem icon={MapPin} label="Pozice" value={error.error_location} />
                <DetailItem icon={Box} label="Materiál" value={error.material} />
                <div 
                    className="cursor-pointer"
                    onClick={() => handleOrderClick(error.order_refence)}
                    title="Zobrazit detail zakázky"
                >
                    <DetailItem icon={Hash} label="Zakázka" value={error.order_refence} />
                </div>
                <DetailItem icon={GitCommitVertical} label="Rozdíl v množství" value={error.diff_qty} />
            </div>
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-sky-300 mb-2">Historie (TODO)</h3>
                <div className="p-4 bg-slate-800/50 rounded-lg text-center text-slate-400">
                    <p>Zde bude v budoucnu zobrazena historie chyb pro danou pozici, materiál nebo zakázku.</p>
                </div>
            </div>
        </Modal>
    );
}