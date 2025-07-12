"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { exportTicketsToXLSX } from '@/lib/exportUtils';
import { Card, CardContent } from '../ui/Card';
import { Ticket, Send, CheckCircle, Paperclip, FileDown } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import TicketDetailsModal from '@/components/modals/TicketDetailsModal';

export default function TicketsTab() {
    const { t } = useUI();
    const { user, userProfile, allUsers, db, appId, supabase } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [newTicketTitle, setNewTicketTitle] = useState('');
    const [newTicketDescription, setNewTicketDescription] = useState('');
    const [newTicketCategory, setNewTicketCategory] = useState('');
    const [newTicketAssignee, setNewTicketAssignee] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [attachment, setAttachment] = useState(null);
    const fileInputRef = useRef(null);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const ticketCategories = ["Inbound", "Outbound", "Picking", "Packing", "Admins", "IT/Údržba"];

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
        
        if (!newTicketTitle || !newTicketDescription || !newTicketAssignee || !newTicketCategory || !user) {
            setMessage({ text: t.fillAllFields || "Vyplňte všechna povinná pole.", type: 'error' });
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

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/tickets`), {
                title: newTicketTitle,
                description: newTicketDescription,
                assignedTo: newTicketAssignee,
                category: newTicketCategory,
                status: 'Vytvořeno',
                createdBy: user.uid,
                createdByName: userProfile?.displayName || user.email,
                createdAt: new Date().toISOString(),
                attachmentUrl,
                attachmentName,
            });
            setNewTicketTitle('');
            setNewTicketDescription('');
            setNewTicketAssignee('');
            setNewTicketCategory('');
            setAttachment(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setMessage({ text: t.ticketCreatedSuccess, type: 'success' });
        } catch (error) {
            console.error("Error creating ticket:", error);
            setMessage({ text: `${t.ticketError} ${error.message}`, type: 'error' });
        }
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
                    <div>
                        <label htmlFor="ticket-title" className="block text-sm font-medium text-gray-300 mb-1">{t.ticketTitle}:</label>
                        <input type="text" id="ticket-title" value={newTicketTitle} onChange={(e) => setNewTicketTitle(e.target.value)} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500" placeholder={t.ticketTitlePlaceholder} />
                    </div>
                    <div>
                        <label htmlFor="ticket-description" className="block text-sm font-medium text-gray-300 mb-1">{t.ticketDescription}:</label>
                        <textarea id="ticket-description" value={newTicketDescription} onChange={(e) => setNewTicketDescription(e.target.value)} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500 h-24 resize-y" placeholder={t.ticketDescriptionPlaceholder} />
                    </div>
                     <div>
                        <label htmlFor="ticket-category" className="block text-sm font-medium text-gray-300 mb-1">Kategorie:</label>
                        <select id="ticket-category" value={newTicketCategory} onChange={(e) => setNewTicketCategory(e.target.value)} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500">
                            <option value="">Vyberte kategorii</option>
                            {ticketCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="ticket-assignee" className="block text-sm font-medium text-gray-300 mb-1">{t.assignTo}:</label>
                        <select id="ticket-assignee" value={newTicketAssignee} onChange={(e) => setNewTicketAssignee(e.target.value)} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500">
                            <option value="">{t.selectUserToAssign}</option>
                            {Array.isArray(allUsers) && allUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="ticket-attachment" className="block text-sm font-medium text-gray-300 mb-1">{t.addAttachment}:</label>
                        <input type="file" id="ticket-attachment" ref={fileInputRef} onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" /> {t.createTicket}
                    </button>
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
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                ticket.status === 'Hotovo' ? 'bg-green-600 text-white' :
                                                ticket.status === 'V řešení' ? 'bg-yellow-500 text-black' :
                                                'bg-red-600 text-white'
                                            }`}>
                                                {ticket.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {ticket.attachmentUrl && <Paperclip className="w-4 h-4 inline-block"/>}
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