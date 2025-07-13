"use client";
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { Send, MessageSquare } from 'lucide-react';

export default function ChatTab() {
    const { user, allUsers } = useAuth();
    const { t } = useUI();
    const [selectedUser, setSelectedUser] = useState(null);

    // Odfiltrujeme aktuálně přihlášeného uživatele ze seznamu
    const otherUsers = allUsers.filter(u => u.uid !== user?.uid);

    return (
        <Card>
            <CardContent className="flex h-[75vh] p-0">
                {/* Levý panel se seznamem uživatelů */}
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

                {/* Pravý panel s chatem */}
                <div className="w-2/3 flex flex-col">
                    {selectedUser ? (
                         <div className="flex-grow flex flex-col">
                             <div className="p-4 border-b border-gray-700">
                                 <h3 className="font-semibold">{selectedUser.displayName}</h3>
                             </div>
                             <div className="flex-grow p-4 overflow-y-auto">
                                 {/* Zde budou zprávy */}
                                 <p className="text-center text-gray-500">Zatím žádné zprávy.</p>
                             </div>
                             <div className="p-4 border-t border-gray-700">
                                 <div className="flex gap-2">
                                     <input type="text" placeholder="Napsat zprávu..." className="flex-grow p-2 rounded-lg bg-gray-700 border border-gray-600"/>
                                     <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><Send className="w-5 h-5"/></button>
                                 </div>
                             </div>
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