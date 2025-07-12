"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { exportTicketsToXLSX } from '@/lib/exportUtils';
import { Card, CardContent } from '../ui/Card';
import { Ticket, Send, Paperclip, FileDown } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import TicketDetailsModal from '@/components/modals/TicketDetailsModal';

export default function TicketsTab() {
    const { t } = useUI();
    const authContext = useAuth(); // Použijeme celý kontextový objekt

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
        if (!authContext.db || !authContext.appId) return;
        const ticketsColRef = collection(authContext.db, `artifacts/${authContext.appId}/public/data/tickets`);
        const q = query(ticketsColRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [authContext.db, authContext.appId]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) setAttachment(e.target.files[0]);
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        
        if (!authContext.user) {
            setMessage({ text: "Pro vytvoření úkolu musíte být přihlášen.", type: 'error' });
            return;
        }
        
        if (!newTicketTitle.trim() || !newTicketDescription.trim() || !newTicketAssignee || !newTicketCategory) {
            setMessage({ text: t.fillAllFields || "Vyplňte všechna povinná pole.", type: 'error' });
            return;
        }
        
        setMessage({ text: '', type: '' });
        let attachmentUrl = null, attachmentName = null;

        if (attachment) {
            const filePath = `${authContext.user.uid}/${Date.now()}_${attachment.name}`;
            const { error: uploadError } = await authContext.supabase.storage.from('ticket-attachments').upload(filePath, attachment);
            if (uploadError) {
                setMessage({ text: `${t.ticketError} ${uploadError.message}`, type: 'error' });
                return;
            }
            const { data: { publicUrl } } = authContext.supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
            attachmentUrl = publicUrl;
            attachmentName = attachment.name;
        }

        try {
            await addDoc(collection(authContext.db, `artifacts/${authContext.appId}/public/data/tickets`), {
                title: newTicketTitle.trim(),
                description: newTicketDescription.trim(),
                assignedTo: newTicketAssignee,
                category: newTicketCategory,
                status: 'Vytvořeno',
                createdBy: authContext.user.uid,
                createdByName: authContext.userProfile?.displayName || authContext.user.email,
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
        if (authContext.allUsers) exportTicketsToXLSX(tickets, authContext.allUsers, t);
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
                    <input type="text" value={newTicketTitle} onChange={(e) => setNewTicketTitle(e.target.value)} placeholder={t.ticketTitle} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500" />
                    <textarea value={newTicketDescription} onChange={(e) => setNewTicketDescription(e.target.value)} placeholder={t.ticketDescription} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500 h-24 resize-y" />
                    <select value={newTicketCategory} onChange={(e) => setNewTicketCategory(e.target.value)} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500">
                        <option value="">Vyberte kategorii</option>
                        {ticketCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select value={newTicketAssignee} onChange={(e) => setNewTicketAssignee(e.target.value)} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500">
                        <option value="">{t.selectUserToAssign}</option>
                        {Array.isArray(authContext.allUsers) && authContext.allUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>)}
                    </select>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" /> {t.createTicket}
                    </button>
                </form>

                <div className="overflow-x-auto">
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
                            {tickets.map((ticket) => (
                                <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="border-t border-gray-600 cursor-pointer hover:bg-gray-600">
                                    <td className="py-3 px-4">{ticket.title}</td>
                                    <td className="py-3 px-4">{authContext.allUsers.find(u => u.uid === ticket.assignedTo)?.displayName || 'N/A'}</td>
                                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${ticket.status === 'Hotovo' ? 'bg-green-600 text-white' : ticket.status === 'V řešení' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'}`}>{ticket.status || 'N/A'}</span></td>
                                    <td className="py-3 px-4">{ticket.attachmentUrl && <Paperclip className="w-4 h-4 inline-block"/>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
            {selectedTicket && <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
        </Card>
    );
}