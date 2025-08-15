// src/components/modals/ErrorExportModal.jsx
"use client";
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUI } from '@/hooks/useUI';
import { Button } from '@tremor/react'; // OPRAVA: Použití správné komponenty Button z knihovny Tremor
import toast from 'react-hot-toast';

export default function ErrorExportModal({ allErrors, onExport, onClose }) {
    const { t } = useUI();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleExportClick = () => {
        if (!startDate || !endDate) {
            toast.error(t.dateRangeRequired || "Musíte zadat počáteční i koncové datum.");
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        if (start > end) {
            toast.error(t.startDateAfterEndDate || "Počáteční datum nemůže být po koncovém datu.");
            return;
        }

        const filteredErrors = allErrors.filter(error => {
            const errorDate = new Date(error.timestamp);
            return errorDate >= start && errorDate <= end;
        });

        if (filteredErrors.length === 0) {
            toast.error(t.noErrorsInDateRange || "V zadaném rozsahu nebyly nalezeny žádné chyby.");
            return;
        }

        onExport(filteredErrors, startDate, endDate);
        onClose();
    };

    return (
        <Modal title={t.exportErrors || "Exportovat chyby"} onClose={onClose}>
            <div className="space-y-4">
                <p>{t.exportDateRangePrompt || "Zvolte prosím rozsah datumů pro export."}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t.startDate || "Od data"}:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t.endDate || "Do data"}:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md"
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleExportClick}>{t.export || "Exportovat"}</Button>
                </div>
            </div>
        </Modal>
    );
}