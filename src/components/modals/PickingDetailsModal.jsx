// src/components/modals/PickingDetailsModal.jsx
"use client";
import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUI } from '@/hooks/useUI';
import { format, parseISO } from 'date-fns';
import { Box, User, Hash, Calendar, Clock } from 'lucide-react';

export const PickingDetailsModal = ({ isOpen, onClose, title, operations }) => {
    const { t } = useUI();

    if (!isOpen) return null;

    return (
        <Modal title={title} onClose={onClose}>
            <div className="max-h-[70vh] overflow-y-auto">
                {operations && operations.length > 0 ? (
                    <table className="min-w-full bg-slate-800/50 rounded-lg">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-300 uppercase"><User className="inline w-4 h-4 mr-1" />Picker</th>
                                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-300 uppercase"><Hash className="inline w-4 h-4 mr-1" />Zakázka</th>
                                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-300 uppercase"><Box className="inline w-4 h-4 mr-1" />Materiál</th>
                                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-300 uppercase"><Calendar className="inline w-4 h-4 mr-1" />Datum</th>
                                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-300 uppercase"><Clock className="inline w-4 h-4 mr-1" />Čas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {operations.map((op, index) => (
                                <tr key={op.id || index} className="hover:bg-slate-700/50">
                                    <td className="py-2 px-3 text-sm text-white">{op.user_name}</td>
                                    <td className="py-2 px-3 text-sm text-slate-300">{op.delivery_no}</td>
                                    <td className="py-2 px-3 text-sm text-slate-300">{op.material}</td>
                                    <td className="py-2 px-3 text-sm text-slate-300">{format(parseISO(op.confirmation_date), 'dd.MM.yyyy')}</td>
                                    <td className="py-2 px-3 text-sm text-slate-300">{op.confirmation_time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-400 p-8">{t.noDataAvailable}</p>
                )}
            </div>
        </Modal>
    );
};