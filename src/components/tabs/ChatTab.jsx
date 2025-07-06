"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { CardContent } from '../ui/Card';
import { MessageSquare, Send } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';

export default function ChatTab() {
    const { t } = useUI();
    const { user, userProfile, db, appId } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!db || !appId) return;
        const chatColRef = collection(db, `artifacts/${appId}/public/data/chat_messages`);
        const q = query(chatColRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db, appId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;
        
        await addDoc(collection(db, `artifacts/${appId}/public/data/chat_messages`), {
            senderId: user.uid,
            senderName: userProfile?.displayName || user.email,
            messageText: newMessage.trim(),
            timestamp: new Date().toISOString(),
        });
        setNewMessage('');
    };

    return (
        <CardContent className="flex flex-col h-full p-0">
             <div className="flex-grow overflow-y-auto p-4 bg-gray-700 rounded-lg mb-4 space-y-3">
                {messages.length > 0 ? (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-lg ${msg.senderId === user?.uid ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                <p className="font-semibold text-sm mb-1">{msg.senderId === user?.uid ? 'Vy' : msg.senderName}</p>
                                <p>{msg.messageText}</p>
                                <p className="text-xs text-gray-300 mt-1">{msg.timestamp ? format(parseISO(msg.timestamp), 'dd/MM HH:mm') : ''}</p>
                            </div>
                        </div>
                    ))
                ) : <p className="text-center text-gray-400">{t.noMessages}</p>}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 p-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow p-3 rounded-lg bg-gray-700 border border-gray-600"
                    placeholder={t.typeMessage}
                    disabled={!user}
                />
                <button type="submit" className="bg-blue-600 text-white px-5 py-3 rounded-lg shadow hover:bg-blue-700" disabled={!user || !newMessage.trim()}>
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </CardContent>
    );
}