"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Modal } from '@/components/ui/Modal';
import { collection, doc, updateDoc, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';

export default function LoadingDetailsModal({ loading, onClose }) {
    const { t } = useUI();
    const { db, appId, user, userProfile } = useAuth();
    const [history, setHistory] = useState([]);

    // Načtení historie změn statusu pro tuto konkrétní nakládku
    useEffect(() => {
        if (!db || !loading) return;
        const historyColRef = collection(db, `artifacts/${appId}/public/data/loading_status_history`);
        const q = query(historyColRef, where("loadingId", "==", loading.id), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHistory(snapshot.docs.map(doc => doc.data()));
        });
        return () => unsubscribe();
    }, [db, loading, appId]);

    const handleStatusChange = async (newStatus) => {
        if (!db || !loading || !user) return;
        const loadingRef = doc(db, `artifacts/${appId}/public/data/announced_loadings`, loading.id);
        const historyColRef = collection(db, `artifacts/${appId}/public/data/loading_status_history`);

        try {
            // Aktualizace statusu v hlavním dokumentu nakládky
            await updateDoc(loadingRef, { status: newStatus });

            // Zápis záznamu o změně do historie
            await addDoc(historyColRef, {
                loadingId: loading.id,
                newStatus: newStatus,
                changedBy: userProfile?.displayName || user.email,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Chyba při změně statusu: ", error);
        }
    };

    const statuses = ["Ohlášeno", "Připraveno", "Naloženo"];

    return (
        <Modal title={t.loadingDetails} onClose={onClose}>
            <div className="space-y-4 text-gray-200">
                <p><strong>{t.carrierName}:</strong> {loading.carrierName}</p>
                <p><strong>{t.loadingDate}:</strong> {format(parseISO(loading.loadingDate), 'dd/MM/yyyy')}</p>
                 <p><strong>{t.notes}:</strong> {loading.notes || t.noNotes}</p>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.status}:</label>
                    <select
                        value={loading.status || 'Ohlášeno'}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white"
                    >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <h4 className="font-semibold mt-4 mb-2">{t.statusHistory || 'Historie statusů'}</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-gray-900 rounded-md">
                        {history.length > 0 ? history.map((entry, index) => (
                            <div key={index} className="p-2 bg-gray-700 rounded-md text-sm">
                                <p><strong>{entry.newStatus}</strong> - {entry.changedBy}</p>
                                <p className="text-xs text-gray-400">{format(parseISO(entry.timestamp), 'dd.MM.yyyy HH:mm')}</p>
                            </div>
                        )) : <p className="text-sm text-gray-400">{t.noDataAvailable}</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
}