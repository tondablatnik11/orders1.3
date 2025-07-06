import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUI } from '@/hooks/useUI';
import { format, parseISO } from 'date-fns';

export default function StatusHistoryModal({ history, onClose }) {
    const { t } = useUI();
    return (
        <Modal title={t.statusHistory} onClose={onClose}>
            <div className="space-y-2">
                {history.map((item, index) => (
                    <div key={index} className="p-2 bg-gray-700 rounded-md">
                        <p><strong>{t.status}:</strong> {item.status}</p>
                        <p><strong>{t.importTime}:</strong> {format(parseISO(item.timestamp), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                ))}
            </div>
        </Modal>
    );
}