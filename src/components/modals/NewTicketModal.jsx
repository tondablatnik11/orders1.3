// src/components/modals/NewTicketModal.jsx
"use client";
import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Modal } from '@/components/ui/Modal';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewTicketModal({ onClose }) {
    const { t } = useUI();
    const { user, userProfile, allUsers, db, appId, supabase } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [assignee, setAssignee] = useState('');
    const [attachment, setAttachment] = useState(null);
    const fileInputRef = useRef(null);

    const ticketCategories = ["Inbound", "Outbound", "Picking", "Packing", "Admins", "IT/Údržba"];

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        
        if (!title.trim() || !description.trim() || !assignee || !category) {
            toast.error(t.fillAllFields || "Vyplňte všechna povinná pole.");
            return;
        }
        
        let attachmentUrl = null;
        let attachmentName = null;
        const toastId = toast.loading('Vytvářím ticket...');

        if (attachment) {
            const filePath = `${user.uid}/${Date.now()}_${attachment.name}`;
            const { error: uploadError } = await supabase.storage.from('ticket-attachments').upload(filePath, attachment);
            
            if (uploadError) {
                toast.error(`${t.ticketError} ${uploadError.message}`, { id: toastId });
                return;
            }
            
            const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
            attachmentUrl = data.publicUrl;
            attachmentName = attachment.name;
        }

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/tickets`), {
                title: title.trim(),
                description: description.trim(),
                assignedTo: assignee,
                category: category,
                status: 'Vytvořeno',
                createdBy: user.uid,
                createdByName: userProfile?.displayName || user.email,
                createdAt: new Date().toISOString(),
                commentCount: 0,
                attachmentUrl,
                attachmentName,
            });

            toast.success(t.ticketCreatedSuccess, { id: toastId });
            onClose(); // Zavřít modální okno po úspěšném vytvoření
        } catch (error) {
            console.error("Error creating ticket:", error);
            toast.error(`${t.ticketError} ${error.message}`, { id: toastId });
        }
    };

    return (
        <Modal title={t.createTicket} onClose={onClose}>
            <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.ticketTitle}</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.ticketTitlePlaceholder} className="w-full p-2 rounded-md bg-gray-700 border border-gray-600" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.ticketDescription}</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.ticketDescriptionPlaceholder} className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 h-24 resize-y" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Kategorie</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 rounded-md bg-gray-700 border border-gray-600">
                            <option value="">Vyberte kategorii</option>
                            {ticketCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.assignTo}</label>
                        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full p-2 rounded-md bg-gray-700 border border-gray-600">
                            <option value="">{t.selectUserToAssign}</option>
                            {Array.isArray(allUsers) && allUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-400 mb-1">{t.addAttachment}</label>
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900" />
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" /> {t.createTicket}
                    </button>
                </div>
            </form>
        </Modal>
    );
}