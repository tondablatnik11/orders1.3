import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUI } from '@/hooks/useUI';

export default function DeleteConfirmationModal({ onConfirm, onClose }) {
    const { t } = useUI();
    return (
        <Modal title={t.deleteConfirm} onClose={onClose}>
            <p className="text-lg mb-4 text-center">{t.deleteConfirm}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                    {t.yes}
                </button>
                <button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                    {t.no}
                </button>
            </div>
        </Modal>
    );
}