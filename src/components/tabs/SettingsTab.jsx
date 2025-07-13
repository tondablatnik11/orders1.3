"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData'; // PŘIDÁN IMPORT
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { User, Shield, Save, Users, Edit } from 'lucide-react';

// Komponenta pro úpravu vlastního profilu
const ProfileEditor = ({ user, userProfile, updateUserProfile, t }) => {
    // ... kód této komponenty zůstává stejný
};

// Komponenta pro správu uživatelů
const UserManagementPanel = ({ allUsers, currentUser, updateUserProfile, t }) => {
    // ... kód této komponenty zůstává stejný
};

// NOVÁ Komponenta pro administrátorské nástroje
const AdminToolsPanel = ({ t }) => {
    const { handleUpdateStatus } = useData();
    const [deliveryNo, setDeliveryNo] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        if (!deliveryNo || !newStatus) {
            setMessage({ text: "Vyplňte prosím číslo dodávky i nový status.", type: 'error' });
            return;
        }
        setIsLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const result = await handleUpdateStatus(deliveryNo, newStatus);
            if (result.success) {
                setMessage({ text: t.statusUpdateSuccess, type: 'success' });
                setDeliveryNo('');
                setNewStatus('');
            } else {
                setMessage({ text: t.orderNotFound, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: `${t.statusUpdateError} ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-10 pt-6 border-t border-gray-700">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-400"><Shield className="w-5 h-5" />{t.adminTools}</h3>
            <form onSubmit={handleStatusUpdate} className="space-y-4 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                <h4 className="font-semibold text-gray-200">{t.manualStatusChange}</h4>
                {message.text && <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>{message.text}</div>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.deliveryNo}:</label>
                        <input
                            type="text"
                            value={deliveryNo}
                            onChange={(e) => setDeliveryNo(e.target.value)}
                            placeholder={t.enterDeliveryNoForUpdate}
                            className="w-full p-2 rounded-md bg-gray-700 border border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.newStatus}:</label>
                        <input
                            type="number"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            placeholder="např. 50"
                            className="w-full p-2 rounded-md bg-gray-700 border border-gray-600"
                        />
                    </div>
                    <div className="md:self-end">
                         <button type="submit" disabled={isLoading} className="w-full bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 flex items-center justify-center gap-2 disabled:bg-gray-500">
                            <Edit className="w-5 h-5" />
                            {isLoading ? "Aktualizuji..." : t.updateStatus}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};


export default function SettingsTab() {
    const { user, userProfile, allUsers, updateUserProfile } = useAuth();
    const { t } = useUI();

    return (
        <Card>
            <CardContent>
                <div className="max-w-4xl mx-auto">
                    <ProfileEditor user={user} userProfile={userProfile} updateUserProfile={updateUserProfile} t={t} />

                    {userProfile?.isAdmin && (
                        <>
                            <UserManagementPanel allUsers={allUsers} currentUser={user} updateUserProfile={updateUserProfile} t={t} />
                            <AdminToolsPanel t={t} />
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}