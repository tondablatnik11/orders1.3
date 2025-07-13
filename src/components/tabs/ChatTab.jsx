"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { Send, MessageSquare } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';

export default function ChatTab() {
    const { user, userProfile, allUsers, db, appId } = useAuth();
    const { t } = useUI();
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    const getConversationId = (uid1, uid2) => {
        return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    };

    useEffect(() => {
        if (!selectedUser || !user) return;

        const conversationId = getConversationId(user.uid, selectedUser.uid);
        const messagesRef = collection(db, `artifacts/${appId}/public/data/conversations/${conversationId}/messages`);
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe();
    }, [selectedUser, user, db, appId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !selectedUser) return;

        const conversationId = getConversationId(user.uid, selectedUser.uid);
        const messagesRef = collection(db, `artifacts/${appId}/public/data/conversations/${conversationId}/messages`);

        await addDoc(messagesRef, {
            text: newMessage.trim(),
            senderId: user.uid,
            senderName: userProfile.displayName,
            timestamp: serverTimestamp(),
        });

        const conversationRef = doc(db, `artifacts/${appId}/public/data/conversations/${conversationId}`);
        await setDoc(conversationRef, {
            participants: [user.uid, selectedUser.uid],
            participantNames: {
                [user.uid]: userProfile.displayName,
                [selectedUser.uid]: selectedUser.displayName,
            },
            lastMessage: newMessage.trim(),
            updatedAt: serverTimestamp(),
        }, { merge: true });

        setNewMessage("");
    };

    const otherUsers = allUsers.filter(u => u.uid !== user?.uid);

    return (
        <Card>
            <CardContent className="flex h-[75vh] p-0">
                <div className="w-1/3 border-r border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="font-semibold text-lg">{t.startConversation}</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {otherUsers.length > 0 ? otherUsers.map(u => (
                            <div key={u.uid} onClick={() => setSelectedUser(u)} className={`p-4 cursor-pointer hover:bg-gray-700/50 ${selectedUser?.uid === u.uid ? 'bg-blue-600/30' : ''}`}>
                                <p className="font-semibold">{u.displayName || u.email}</p>
                            </div>
                        )) : <p className="p-4 text-sm text-gray-400">{t.noUsersFound}</p>}
                    </div>
                </div>

                <div className="w-2/3 flex flex-col">
                    {selectedUser ? (
                         <div className="flex-grow flex flex-col">
                             <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                                 <h3 className="font-semibold">{selectedUser.displayName}</h3>
                             </div>
                             <div className="flex-grow p-4 overflow-y-auto bg-gray-900/50">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex mb-3 ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-lg ${msg.senderId === user.uid ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                            <p className="font-semibold text-sm mb-1">{msg.senderName}</p>
                                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                            <p className="text-xs text-gray-300 mt-1 text-right">
                                                {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                             </div>
                             <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                                 <div className="flex gap-2">
                                     <input 
                                        type="text" 
                                        placeholder="Napsat zprávu..." 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="flex-grow p-2 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                     <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex-shrink-0">
                                        <Send className="w-5 h-5"/>
                                     </button>
                                 </div>
                             </form>
                         </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2" />
                                <p>Vyberte uživatele pro zahájení konverzace.</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}