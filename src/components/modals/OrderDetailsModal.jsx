'use client';
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
// Komponentu Button již neimportujeme, abychom předešli chybě
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

// Komponenta pro zobrazení jednoho detailu objednávky
const DetailRow = ({ label, value }) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{value || '-'}</dd>
    </div>
);

// Komponenta pro zobrazení detailů pickování
const PickingDetails = ({ details }) => {
    if (!details || details.length === 0) {
        return (
            <div className="mt-6">
                <h4 className="font-semibold text-lg text-slate-800 mb-2">Detaily Pickování</h4>
                <p className="text-sm text-slate-500 mt-2">Pro tuto zakázku nebyly nalezeny žádné záznamy o pickování.</p>
            </div>
        );
    }
    return (
        <div className="mt-6">
            <h4 className="font-semibold text-lg text-slate-800 mb-2">Detaily Pickování</h4>
            <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Picker</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Materiál</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Množství</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Čas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {details.map((pick, index) => (
                            <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700">{pick.user_name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700">
                                    <div>{pick.material}</div>
                                    <div className="text-xs text-slate-500">{pick.material_description}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700">{pick.source_actual_qty}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700">{new Date(pick.confirmation_date).toLocaleDateString()} {pick.confirmation_time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const OrderDetailsModal = ({ order, onClose, onShowHistory }) => {
    if (!order) return null;
    
    const { handleSaveNote, fetchOrderComments, addOrderComment } = useData();
    const { user, userProfile } = useAuth();
    const [note, setNote] = useState(order.Note || "");
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        setNote(order.Note || "");
        if (order['Delivery No']) {
            fetchOrderComments(order['Delivery No']).then(setComments);
        }
    }, [order, fetchOrderComments]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        
        const newCommentData = await addOrderComment(
            order['Delivery No'], 
            newComment, 
            user.id, 
            userProfile.full_name,
            []
        );

        if (newCommentData) {
            setComments(prev => [...prev, newCommentData]);
            setNewComment("");
        }
    };
    
    const orderEntries = Object.entries(order).filter(([key]) => key !== 'picking_details');

    return (
        <Modal isOpen={!!order} onClose={onClose} title={`Detail zakázky: ${order['Delivery No']}`}>
            <div className="p-6">
                <div className="border-t border-slate-200">
                    <dl>
                        {orderEntries.map(([key, value]) => (
                             <DetailRow key={key} label={key} value={String(value)} />
                        ))}
                    </dl>
                </div>

                <PickingDetails details={order.picking_details} />

                <div className="mt-6">
                    <h4 className="font-semibold text-lg text-slate-800 mb-2">Poznámka</h4>
                    <textarea 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        rows="3"
                    ></textarea>
                </div>
                
                {/* ZDE JE OPRAVA: Používáme standardní HTML tlačítka se styly */}
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={() => onShowHistory(order['Delivery No'])} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground">Zobrazit historii stavů</button>
                    <button onClick={() => handleSaveNote(order['Delivery No'], note)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">Uložit poznámku</button>
                    <button onClick={onClose} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">Zavřít</button>
                </div>
            </div>
        </Modal>
    );
};

export default OrderDetailsModal;