"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { exportTicketsToXLSX } from '@/lib/exportUtils';
import { Card, CardContent } from '../ui/Card';
import { Ticket, Send, CheckCircle, Paperclip, FileDown } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import TicketDetailsModal from '@/components/modals/TicketDetailsModal'; // <-- Nový import

export default function TicketsTab() {
    const { t } = useUI();
    const { user, userProfile, allUsers, db, appId, supabase } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [newTicketTitle, setNewTicketTitle] = useState('');
    const [newTicketDescription, setNewTicketDescription] = useState('');
    const [newTicketAssignee, setNewTicketAssignee] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [attachment, setAttachment] = useState(null);
    const fileInputRef = useRef(null);
    const [selectedTicket, setSelectedTicket] = useState(null); // <-- Stav pro vybraný ticket

    useEffect(() => {
        if (!db || !appId) {
            console.warn("Firestore or App ID not available for TicketsTab.");
            return;
        }
        const ticketsColRef = collection(db, `artifacts/${appId}/public/data/tickets`);
        const q = query(ticketsColRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTickets(fetchedTickets);
        });
        return () => unsubscribe();
    }, [db, appId]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!newTicketTitle || !newTicketDescription || !newTicketAssignee || !user) {
            setMessage({ text: t.fillAllFields, type: 'error' });
            return;
        }
        setMessage({ text: '', type: '' });
        let attachmentUrl = null, attachmentName = null;

        if (attachment) {
            const filePath = `${user.uid}/${Date.now()}_${attachment.name}`;
            const { error: uploadError } = await supabase.storage.from('ticket-attachments').upload(filePath, attachment);
            if (uploadError) {
                setMessage({ text: `${t.ticketError} ${uploadError.message}`, type: 'error' });
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
            attachmentUrl = publicUrl;
            attachmentName = attachment.name;
        }

        await addDoc(collection(db, `artifacts/${appId}/public/data/tickets`), {
            title: newTicketTitle,
            description: newTicketDescription,
            assignedTo: newTicketAssignee,
            status: 'Vytvořeno', // Nový výchozí status
            createdBy: user.uid,
            createdByName: userProfile?.displayName || user.email,
            createdAt: new Date().toISOString(),
            attachmentUrl,
            attachmentName,
        });
        setNewTicketTitle('');
        setNewTicketDescription('');
        setNewTicketAssignee('');
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setMessage({ text: t.ticketCreatedSuccess, type: 'success' });
    };
    
    const handleExport = () => {
        exportTicketsToXLSX(tickets, allUsers, t);
    };

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 text-purple-400">
                        <Ticket className="w-6 h-6" /> {t.ticketsTab}
                    </h2>
                    <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                        <FileDown className="w-5 h-5" /> {t.exportToXLSX}
                    </button>
                </div>

                {message.text && <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>{message.text}</div>}

                <form onSubmit={handleCreateTicket} className="space-y-4 mb-8 p-4 border border-gray-700 rounded-lg bg-gray-750">
                    <h3 className="text-xl font-semibold text-blue-300 mb-3">{t.createTicket}</h3>
                    {/* ... (obsah formuláře zůstává stejný) ... */}
                </form>

                <div className="overflow-x-auto">
                    {Array.isArray(tickets) && tickets.length > 0 ? (
                        <table className="min-w-full bg-gray-700 rounded-lg">
                            <thead className="bg-gray-600">
                                <tr>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.ticketTitle}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.assignedTo}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.statusTicket}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.attachment}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket, index) => (
                                    <tr 
                                        key={ticket.id} 
                                        onClick={() => setSelectedTicket(ticket)}
                                        className={`border-t border-gray-600 cursor-pointer hover:bg-gray-600 ${index % 2 === 0 ? "bg-gray-750" : "bg-gray-700"}`}
                                    >
                                        <td className="py-3 px-4">{ticket.title}</td>
                                        <td className="py-3 px-4">{allUsers.find(u => u.uid === ticket.assignedTo)?.displayName || 'N/A'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ticket.status === 'Hotovo' ? 'bg-green-600' : 'bg-red-600'}`}>
                                                {ticket.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {ticket.attachmentUrl && <Paperclip className="w-4 h-4 inline-block mr-1"/>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <p className="text-center text-gray-400">{t.noDataAvailable}</p>
                    )}
                </div>
            </CardContent>

            {selectedTicket && (
                <TicketDetailsModal 
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                />
            )}
        </Card>
    );
}