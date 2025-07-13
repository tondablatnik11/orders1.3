"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Modal } from '@/components/ui/Modal';
import { collection, doc, updateDoc, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import OrderListTable from '@/components/shared/OrderListTable';
import { Send, Check } from 'lucide-react';

// OPRAVA: Přidán chybějící prop `orders`
export default function LoadingDetailsModal({ loading, orders, onClose }) {
    const { t } = useUI();
    const { db, appId, user, userProfile } = useAuth();
    const [history, setHistory] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [selectedStatus, setSelectedStatus] = useState(loading.status || "Ohlášeno");

    useEffect(() => {
        setSelectedStatus(loading.status || "Ohlášeno");
    }, [loading.status]);

    useEffect(() => {
        if (!db || !loading) return;
        
        const historyColRef = collection(db, `artifacts/${appId}/public/data/loading_status_history`);
        const qHistory = query(historyColRef, where("loadingId", "==", loading.id), orderBy("timestamp", "desc"));
        const unsubHistory = onSnapshot(qHistory, (snapshot) => setHistory(snapshot.docs.map(doc => doc.data())));
        
        const commentsColRef = collection(db, `artifacts/${appId}/public/data/announced_loadings/${loading.id}/comments`);
        const qComments = query(commentsColRef, orderBy("timestamp", "asc"));
        const unsubComments = onSnapshot(qComments, (snapshot) => setComments(snapshot.docs.map(doc => doc.data())));

        return () => {
            unsubHistory();
            unsubComments();
        };
    }, [db, loading, appId]);

    const confirmStatusChange = async () => {
        if (!db || !loading || !user || selectedStatus === loading.status) return;
        const loadingRef = doc(db, `artifacts/${appId}/public/data/announced_loadings`, loading.id);
        
        try {
            await updateDoc(loadingRef, { status: selectedStatus });
            await addDoc(collection(db, `artifacts/${appId}/public/data/loading_status_history`), {
                loadingId: loading.id,
                newStatus: selectedStatus,
                changedBy: userProfile?.displayName || user.email,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Chyba při změně statusu: ", error);
        }
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
                <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.status}:</label>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white">
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={confirmStatusChange}
                        disabled={selectedStatus === loading.status}
                        className="bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Check className="w-5 h-5" /> Uložit
                    </button>
                </div>
                
                <div>
                    <h4 className="font-semibold mt-2 mb-2">{t.statusHistory || 'Historie statusů'}</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto p-2 bg-gray-900 rounded-md">
                        {history.length > 0 ? history.map((entry, index) => (
                            <div key={index} className="p-2 bg-gray-700 rounded-md text-sm">
                                <p><strong>{entry.newStatus}</strong> - {entry.changedBy}</p>
                                <p className="text-xs text-gray-400">{format(parseISO(entry.timestamp), 'dd.MM.yyyy HH:mm')}</p>
                            </div>
                        )) : <p className="text-sm text-gray-400">{t.noDataAvailable}</p>}
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mt-2 mb-2">{t.orderList || 'Seznam zakázek'}</h4>
                    <div className="max-h-56 overflow-y-auto">
                        <OrderListTable orders={orders} onSelectOrder={() => {}} size="small" />
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mt-2 mb-2">Komentáře</h4>
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
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Modal>
    );
}