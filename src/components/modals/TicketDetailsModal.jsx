"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Modal } from '@/components/ui/Modal';
import { collection, doc, updateDoc, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { Send } from 'lucide-react';

export default function TicketDetailsModal({ ticket, onClose }) {
    const { t } = useUI();
    const { db, appId, user, userProfile, allUsers } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const commentsEndRef = useRef(null);

    const ticketCreator = allUsers.find(u => u.uid === ticket.createdBy)?.displayName || 'Neznámý';

    useEffect(() => {
        if (!db || !ticket) return;
        const commentsColRef = collection(db, `artifacts/${appId}/public/data/tickets/${ticket.id}/comments`);
        const q = query(commentsColRef, orderBy("timestamp", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => doc.data()));
        });
        return () => unsubscribe();
    }, [db, ticket, appId]);
    
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    const handleStatusChange = async (newStatus) => {
        const ticketRef = doc(db, `artifacts/${appId}/public/data/tickets`, ticket.id);
        await updateDoc(ticketRef, { status: newStatus });
    };
    
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        
        const commentsColRef = collection(db, `artifacts/${appId}/public/data/tickets/${ticket.id}/comments`);
        await addDoc(commentsColRef, {
            text: newComment.trim(),
            authorId: user.uid,
            authorName: userProfile?.displayName || user.email,
            timestamp: new Date().toISOString()
        });
        setNewComment("");
    };

    const statuses = ["Vytvořeno", "V řešení", "Hotovo"];

    return (
        <Modal title={`${t.ticketTitle}: ${ticket.title}`} onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4 text-sm">
                    <div>
                        <p className="font-semibold text-gray-400">{t.statusTicket}</p>
                        <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full p-2 mt-1 rounded-md bg-gray-700 border border-gray-600 text-white"
                        >
                           {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <p className="font-semibold text-gray-400">Kategorie</p>
                        <p>{ticket.category || 'N/A'}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-gray-400">{t.assignedTo}</p>
                        <p>{allUsers.find(u => u.uid === ticket.assignedTo)?.displayName || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-400">{t.createdBy}</p>
                        <p>{ticketCreator}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-gray-400">{t.createdAt}</p>
                        <p>{format(parseISO(ticket.createdAt), 'dd.MM.yyyy HH:mm')}</p>
                    </div>
                    {ticket.attachmentUrl && (
                         <div>
                            <p className="font-semibold text-gray-400">{t.attachment}</p>
                            <a href={ticket.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{ticket.attachmentName}</a>
                        </div>
                    )}
                </div>

                <div className="md:col-span-2">
                    <div className="bg-gray-900 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold mb-2">{t.ticketDescription}</h4>
                        <p className="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    <div className="flex flex-col h-96 bg-gray-900 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Komentáře</h4>
                        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                            {comments.map((comment, index) => (
                                <div key={index}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-sm">{comment.authorName}</p>
                                        <p className="text-xs text-gray-400">{format(parseISO(comment.timestamp), 'dd.MM HH:mm')}</p>
                                    </div>
                                    <p className="bg-gray-700 p-3 rounded-lg text-sm">{comment.text}</p>
                                </div>
                            ))}
                            <div ref={commentsEndRef} />
                        </div>
                        <form onSubmit={handleAddComment} className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-grow p-2 rounded-lg bg-gray-700 border border-gray-600"
                                placeholder={t.typeMessage || "Napsat komentář..."}
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