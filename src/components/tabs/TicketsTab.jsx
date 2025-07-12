"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Pro přístup k uživateli, uživatelskému profilu, db a appId
import { useUI } from '@/hooks/useUI'; // Pro překlady
import { exportTicketsToXLSX } from '@/lib/exportUtils'; // Funkce pro export
import { Card, CardContent } from '../ui/Card'; // Komponenty Card
import { Ticket, Send, CheckCircle, Paperclip, FileDown } from 'lucide-react'; // Ikony
import { collection, addDoc, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore'; // Firebase Firestore
import { format, parseISO } from 'date-fns'; // Pro formátování dat

export default function TicketsTab() {
    const { t } = useUI();
    const { user, userProfile, allUsers, db, appId, supabase } = useAuth(); // Z AuthContextu bereme i supabase pro storage

    const [tickets, setTickets] = useState([]);
    const [newTicketTitle, setNewTicketTitle] = useState('');
    const [newTicketDescription, setNewTicketDescription] = useState('');
    const [newTicketAssignee, setNewTicketAssignee] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' }); // Pro zprávy o úspěchu/chybě
    const [attachment, setAttachment] = useState(null); // Pro soubor přílohy
    const fileInputRef = useRef(null); // Reference pro resetování inputu typu file

    useEffect(() => {
        if (!db || !appId) {
            console.warn("Firestore or App ID not available for TicketsTab.");
            return;
        }
        const ticketsColRef = collection(db, `artifacts/${appId}/public/data/tickets`);
        const q = query(ticketsColRef, orderBy('createdAt', 'desc')); // Řadit od nejnovějších
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching tickets:", error);
            setMessage({ text: `${t.ticketError} ${error.message}`, type: 'error' });
        });
        return () => unsubscribe();
    }, [db, appId, t]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        // Kontrola všech povinných polí a přítomnosti uživatele
        if (!newTicketTitle || !newTicketDescription || !newTicketAssignee || !user || !db || !appId) {
            setMessage({ text: t.ticketError + ' ' + t.fillAllFields, type: 'error' }); // Přidán nový překlad
            return;
        }

        setMessage({ text: '', type: '' }); // Vyčistit předchozí zprávy
        let attachmentUrl = null, attachmentName = null;

        if (attachment) {
            // Cesta pro uložení souboru v Supabase Storage (uid uživatele pro oddělení souborů)
            const filePath = `${user.uid}/${Date.now()}_${attachment.name}`;
            const { error: uploadError } = await supabase.storage
                .from('ticket-attachments') // Název vašeho bucketu v Supabase Storage
                .upload(filePath, attachment);

            if (uploadError) {
                setMessage({ text: `${t.ticketError} ${uploadError.message}`, type: 'error' });
                return;
            }
            // Získání veřejné URL k nahranému souboru
            const { data: { publicUrl } } = supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
            attachmentUrl = publicUrl;
            attachmentName = attachment.name;
        }

        try {
            // Přidání dokumentu do Firestore
            await addDoc(collection(db, `artifacts/${appId}/public/data/tickets`), {
                title: newTicketTitle,
                description: newTicketDescription,
                assignedTo: newTicketAssignee, // UID uživatele, kterému je ticket přiřazen
                status: 'Open', // Výchozí status
                createdBy: user.uid,
                createdByName: userProfile?.displayName || user.email, // Jméno tvůrce
                createdAt: new Date().toISOString(), // Čas vytvoření ve formátu ISO string
                attachmentUrl,
                attachmentName,
            });
            // Reset formuláře po úspěšném vytvoření
            setNewTicketTitle('');
            setNewTicketDescription('');
            setNewTicketAssignee('');
            setAttachment(null);
            if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file inputu
            setMessage({ text: t.ticketCreatedSuccess, type: 'success' });
        } catch (error) {
            console.error("Error creating ticket:", error);
            setMessage({ text: `${t.ticketError} ${error.message}`, type: 'error' });
        }
    };

    const handleMarkAsCompleted = async (ticketId) => {
        if (!db || !appId) return;
        try {
            const ticketRef = doc(db, `artifacts/${appId}/public/data/tickets`, ticketId);
            await updateDoc(ticketRef, { status: 'Completed', completedAt: new Date().toISOString() });
            setMessage({ text: t.ticketUpdateSuccess, type: 'success' });
        } catch (error) {
            console.error("Error updating ticket status:", error);
            setMessage({ text: `${t.ticketError} ${error.message}`, type: 'error' });
        }
    };
    
    // Export ticketů do XLSX
    const handleExport = () => {
        // exportTicketsToXLSX potřebuje tickets, allUsers a t
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
                        <input type="text" id="ticket-title" value={newTicketTitle} onChange={(e) => setNewTicketTitle(e.target.value)} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500" placeholder={t.ticketTitlePlaceholder} /> {/* Nový překlad */}
                    </div>
                    <div>
                        <label htmlFor="ticket-description" className="block text-sm font-medium text-gray-300 mb-1">{t.ticketDescription}:</label>
                        <textarea id="ticket-description" value={newTicketDescription} onChange={(e) => setNewTicketDescription(e.target.value)} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500 h-24 resize-y" placeholder={t.ticketDescriptionPlaceholder} /> {/* Nový překlad */}
                    </div>
                    <div>
                        <label htmlFor="ticket-assignee" className="block text-sm font-medium text-gray-300 mb-1">{t.assignTo}:</label>
                        <select id="ticket-assignee" value={newTicketAssignee} onChange={(e) => setNewTicketAssignee(e.target.value)} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500">
                            <option value="">{t.selectUserToAssign}</option> {/* Nový překlad */}
                            {allUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>)}
                        </select>
                        {!allUsers.length && <p className="text-red-400 text-xs mt-1">{t.noUsersFound}</p>}
                    </div>
                    <div>
                        <label htmlFor="ticket-attachment" className="block text-sm font-medium text-gray-300 mb-1">{t.addAttachment}:</label>
                        <input type="file" id="ticket-attachment" ref={fileInputRef} onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {attachment && <p className="text-xs text-gray-400 mt-1">{t.selectedAttachment}: {attachment.name}</p>} {/* Nový překlad */}
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" /> {t.createTicket}
                    </button>
                </form>

                <div className="overflow-x-auto">
                    {tickets.length > 0 ? (
                        <table className="min-w-full bg-gray-700 rounded-lg">
                            <thead className="bg-gray-600">
                                <tr>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.ticketTitle}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.assignedTo}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.statusTicket}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">{t.attachment}</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold">Akce</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket, index) => (
                                    <tr key={ticket.id} className={`border-t border-gray-600 ${index % 2 === 0 ? "bg-gray-750" : "bg-gray-700"}`}>
                                        <td className="py-3 px-4">{ticket.title}</td>
                                        <td className="py-3 px-4">{allUsers.find(u => u.uid === ticket.assignedTo)?.displayName || 'N/A'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ticket.status === 'Open' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                                                {ticket.status === 'Open' ? t.open : t.completed}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {ticket.attachmentUrl && <a href={ticket.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline"><Paperclip className="w-4 h-4 inline-block mr-1"/>{ticket.attachmentName}</a>}
                                        </td>
                                        <td className="py-3 px-4">
                                            {/* Možnost označit jako hotové pouze pokud je status 'Open' a uživatel je přiřazený */}
                                            {ticket.status === 'Open' && user && ticket.assignedTo === user.uid && (
                                                <button onClick={() => handleMarkAsCompleted(ticket.id)} title={t.markAsCompleted} className="bg-green-600 text-white p-2 rounded-md text-sm hover:bg-green-700 flex items-center"><CheckCircle className="w-4 h-4"/></button>
                                            )}
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
        </Card>
    );
}