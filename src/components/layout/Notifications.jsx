"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Bell } from 'lucide-react';

export default function Notifications() {
    const { user, db, appId } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        const notifRef = collection(db, `artifacts/${appId}/public/data/notifications`);
        const q = query(notifRef, where("recipient_uid", "==", user.uid), where("read", "==", false));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe();
    }, [user, db, appId]);

    const handleMarkAsRead = async (notifId) => {
        const notifDocRef = doc(db, `artifacts/${appId}/public/data/notifications`, notifId);
        await updateDoc(notifDocRef, { read: true });
    };

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-gray-700">
                <Bell className="w-5 h-5 text-gray-300" />
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-xs text-white items-center justify-center">{notifications.length}</span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
                    <div className="p-3 font-semibold border-b border-gray-700">Upozornění</div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div key={notif.id} className="p-3 border-b border-gray-700 hover:bg-gray-700/50">
                                    <p className="text-sm">{notif.message}</p>
                                    <button onClick={() => handleMarkAsRead(notif.id)} className="text-xs text-blue-400 hover:underline mt-1">
                                        Označit jako přečtené
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-sm text-gray-400">Žádná nová upozornění.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}