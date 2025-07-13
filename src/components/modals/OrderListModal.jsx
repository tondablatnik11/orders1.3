"use client";
import React from 'react';
import { Modal } from '@/components/ui/Modal';
import OrderListTable from '@/components/shared/OrderListTable';
import { FileDown } from 'lucide-react';
import { exportCustomOrdersToXLSX } from '@/lib/exportUtils';

export const OrderListModal = ({ isOpen, onClose, title, orders, onSelectOrder, t }) => {
    if (!isOpen) return null;

    return (
        <Modal title={title} onClose={onClose}>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => exportCustomOrdersToXLSX(orders, title, t)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
                >
                    <FileDown className="w-5 h-5" /> {t.exportToXLSX}
                </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto">
                <OrderListTable orders={orders} onSelectOrder={onSelectOrder} />
            </div>
        </Modal>
    );
};