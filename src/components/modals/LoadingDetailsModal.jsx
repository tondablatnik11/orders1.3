"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Modal } from '@/components/ui/Modal';
import { collection, doc, updateDoc, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import OrderListTable from '@/components/shared/OrderListTable';
import { Send } from 'lucide-react';

export default function LoadingDetailsModal({ loading, orders, onClose }) {
    const { t } = useUI();
    const { db, appId, user, userProfile } = useAuth();
    const [history, setHistory] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        if (!db || !loading) return;
        const historyColRef = collection(db, `artifacts/${appId}/public/data/loading_status_history`);
        const q = query(historyColRef, where("loadingId", "==", loading.id), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHistory(snapshot.docs.map(doc => doc.data()));
        });
        return () => unsubscribe();
    }, [db, loading, appId]);

    useEffect(() => {
        if (!db || !loading) return;
        const commentsColRef = collection(db, `artifacts/${appId}/public/data/announced_loadings/${loading.id}/comments`);
        const q = query(commentsColRef, orderBy("timestamp", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => doc.data()));
        });
        return () => unsubscribe();
    }, [db, loading, appId]);

    const handleStatusChange = async (newStatus) => {
        if (!db || !loading || !user) return;
        const loadingRef = doc(db, `artifacts/${appId}/public/data/announced_loadings`, loading.id);
        await updateDoc(loadingRef, { status: newStatus });
        await addDoc(collection(db, `artifacts/${appId}/public/data/loading_status_history`), {
            loadingId: loading.id,
            newStatus: newStatus,
            changedBy: userProfile?.displayName || user.email,
            timestamp: new Date().toISOString()
        });
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        const commentsColRef = collection(db, `artifacts/${appId}/public/data/announced_loadings/${loading.id}/comments`);
        await addDoc(commentsColRef, {
            text: newComment.trim(),
            authorId: user.uid,
            authorName: userProfile?.displayName || user.email,
            timestamp: new Date().toISOString()
        });
        setNewComment("");
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
                    <select value={loading.status || 'Ohlášeno'} onChange={(e) => handleStatusChange(e.target.value)} className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white">
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
                <div>
                    <h4 className="font-semibold mt-4 mb-2">{t.orderList || 'Seznam zakázek'}</h4>
                    <div className="max-h-64 overflow-y-auto">
                        <OrderListTable orders={orders} onSelectOrder={() => {}} />
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mt-4 mb-2">Komentáře</h4>
                    <div className="flex flex-col h-64 bg-gray-900 rounded-lg p-3">
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                            {comments.map((comment, index) => (
                                <div key={index}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-sm">{comment.authorName}</p>
                                        <p className="text-xs text-gray-400">{format(parseISO(comment.timestamp), 'dd.MM HH:mm')}</p>
                                    </div>
                                    <p className="bg-gray-700 p-2 rounded-lg text-sm">{comment.text}</p>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddComment} className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-grow p-2 rounded-lg bg-gray-700 border border-gray-600"
                                placeholder="Napsat komentář..."
                            />
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Modal>
    );
}