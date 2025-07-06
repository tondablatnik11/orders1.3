"use client";
import React, { useState, useEffect } from 'react';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import { Modal } from '@/components/ui/Modal';
import { History } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function OrderDetailsModal({ order, onClose, onShowHistory }) {
    const { t } = useUI();
    const { handleSaveNote } = useData();
    const [note, setNote] = useState(order.Note || '');

    useEffect(() => {
        setNote(order.Note || '');
    }, [order.Note]);

    const handleNoteBlur = () => {
        if (note !== order.Note) {
            handleSaveNote(order["Delivery No"], note);
        }
    };

    let formattedLoadingDate = 'N/A';
    if (order["Loading Date"]) {
        try {
            const parsedDate = parseISO(order["Loading Date"]);
            if (!isNaN(parsedDate.getTime())) {
                formattedLoadingDate = format(parsedDate, 'dd/MM/yyyy');
            }
        } catch (e) { /* ignore */ }
    }

    return (
        <Modal title={t.deliveryDetails} onClose={onClose}>
            <div className="space-y-3 text-gray-200">
                <p><strong>{t.deliveryNo}:</strong> {order["Delivery No"]}</p>
                <p><strong>{t.status}:</strong> {order.Status}</p>
                <p><strong>{t.deliveryType}:</strong> {order["del.type"]}</p>
                <p><strong>{t.loadingDate}:</strong> {formattedLoadingDate}</p>
                <p><strong>{t.forwardingAgent}:</strong> {order["Forwarding agent name"] || 'N/A'}</p>
                <p><strong>{t.shipToPartyName}:</strong> {order["Name of ship-to party"] || 'N/A'}</p>
                <div>
                    <strong>{t.note}:</strong>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={handleNoteBlur}
                        className="w-full p-1 rounded-md bg-gray-600 border border-gray-500 text-gray-100 text-sm mt-1"
                        placeholder={t.note}
                    />
                </div>
                {onShowHistory && (
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => onShowHistory(order["Delivery No"])}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
                        >
                            <History className="w-5 h-5" /> {t.statusHistory}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}