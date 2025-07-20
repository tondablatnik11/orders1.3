// src/components/modals/OrderDetailsModal.jsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '../ui/Modal';
import { History, Send, Truck, Package, User, Hash, Calendar, Globe, Weight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import AnimatedStatusIcon from '../shared/AnimatedStatusIcon';

// NOVÉ: Pomocná komponenta pro zobrazení detailů
const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-md text-white font-semibold">{value || 'N/A'}</p>
        </div>
    </div>
);

export default function OrderDetailsModal({ order, onClose, onShowHistory }) {
    const { t } = useUI();
    const { fetchOrderComments, addOrderComment } = useData();
    const { user, userProfile, allUsers } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const commentsEndRef = useRef(null);

    useEffect(() => {
        const loadComments = async () => {
            const fetchedComments = await fetchOrderComments(order["Delivery No"]);
            setComments(fetchedComments);
        };
        if (order["Delivery No"]) {
            loadComments();
        }
    }, [order, fetchOrderComments]);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        const mentions = newComment.match(/@(\w+)/g) || [];
        const mentionedUserIds = mentions
            .map(mention => mention.substring(1))
            .map(username => allUsers.find(u => (u.displayName || u.email.split('@')[0]) === username)?.uid)
            .filter(uid => uid && uid !== user.uid);
        const addedComment = await addOrderComment(order["Delivery No"], newComment.trim(), user.uid, userProfile?.displayName || user.email, mentionedUserIds);
        if (addedComment) {
            setComments(prev => [...prev, addedComment]);
            setNewComment("");
        }
    };
    
    const handleTrackShipment = () => {
        const trackingNumber = order["Bill of lading"];
        if (!trackingNumber) {
            alert("Číslo nákladního listu (Bill of Lading) není k dispozici.");
            return;
        }
        let trackingUrl;
        switch (order["Forwarding agent name"]) {
            case "United Parcel Service CZ s. r. o.":
                trackingUrl = `https://www.ups.com/track?loc=cs_CZ&tracknum=${trackingNumber}`;
                break;
            case "FedEx Express Czech Republic s.r.o.":
                trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
                break;
            default:
                trackingUrl = `https://www.google.com/search?q=track+shipment+${trackingNumber}`;
        }
        window.open(trackingUrl, '_blank');
    };

    const formattedLoadingDate = order["Loading Date"] ? format(parseISO(order["Loading Date"]), 'dd.MM.yyyy') : 'N/A';

    return (
        <Modal title={t.deliveryDetails} onClose={onClose}>
            {/* UPRAVENO: Nové rozložení na 3 sloupce */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Levý sloupec s detaily */}
                <div className="md:col-span-2 space-y-4 text-gray-200 border-r border-gray-700 pr-6">
                    <h3 className="text-lg font-bold text-blue-300 border-b border-gray-700 pb-2">Informace o objednávce</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem icon={Hash} label={t.deliveryNo} value={order["Delivery No"]} />
                        <DetailItem icon={Package} label={t.deliveryType} value={order["del.type"] === 'P' ? t.pallets : t.carton} />
                        <DetailItem icon={Calendar} label={t.loadingDate} value={formattedLoadingDate} />
                        <DetailItem icon={Weight} label={t.totalWeight} value={`${order["Total Weight"]} kg`} />
                        <DetailItem icon={Truck} label={t.forwardingAgent} value={order["Forwarding agent name"]} />
                        <DetailItem icon={User} label={t.shipToPartyName} value={order["Name of ship-to party"]} />
                        <DetailItem icon={Globe} label="Země doručení" value={order["Country ship-to prty"]} />
                        <DetailItem icon={Hash} label={t.billOfLading} value={order["Bill of lading"]} />
                    </div>
                </div>

                {/* Pravý sloupec se statusem a komentáři */}
                <div className="md:col-span-1 flex flex-col">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-blue-300 mb-4">{t.status}</h3>
                        <AnimatedStatusIcon status={order.Status} size="large" />
                    </div>

                    <div className="flex flex-col flex-grow h-64 bg-gray-900 rounded-lg p-3">
                         <h4 className="font-semibold mb-2 flex-shrink-0">Komentáře</h4>
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                            {comments.map((comment) => (
                                <div key={comment.id}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-xs">{comment.author_name}</p>
                                        <p className="text-xs text-gray-400">{format(parseISO(comment.created_at), 'dd.MM HH:mm')}</p>
                                    </div>
                                    <p className="bg-gray-700 p-2 rounded-lg text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                                </div>
                            ))}
                            <div ref={commentsEndRef} />
                        </div>
                        <form onSubmit={handleAddComment} className="flex gap-2 mt-2 pt-2 border-t border-gray-700 flex-shrink-0">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-grow p-2 rounded-lg bg-gray-700 border border-gray-600 text-sm"
                                placeholder="Přidat komentář (@zmínka)..."
                            />
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex-shrink-0">
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2 border-t border-gray-700 pt-4">
                {order["Bill of lading"] && (
                    <button
                        onClick={handleTrackShipment}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 flex items-center gap-2"
                    >
                        <Truck className="w-5 h-5" /> Sledovat zásilku
                    </button>
                )}
                {onShowHistory && (
                    <button
                        onClick={() => onShowHistory(order["Delivery No"])}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
                    >
                        <History className="w-5 h-5" /> {t.statusHistory}
                    </button>
                )}
            </div>
        </Modal>
    );
}