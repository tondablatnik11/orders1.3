"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { User, Shield, Save, Users, Edit } from 'lucide-react';

// Komponenta pro úpravu vlastního profilu
const ProfileEditor = ({ user, userProfile, updateUserProfile, t }) => {
    const [displayName, setDisplayName] = useState('');
    const [userFunction, setUserFunction] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || '');
            setUserFunction(userProfile.function || '');
        }
    }, [userProfile]);

    const handleSave = async () => {
        if (!displayName.trim()) {
            setMessage({ text: "Jméno nemůže být prázdné.", type: 'error' });
            return;
        }
        try {
            await updateUserProfile(user.uid, { displayName, function: userFunction });
            setMessage({ text: t.profileUpdated, type: 'success' });
        } catch (error) {
            setMessage({ text: t.profileError + ` ${error.message}`, type: 'error' });
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><User className="w-5 h-5" />{t.profileTab}</h3>
            {message.text && <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>{message.text}</div>}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email:</label>
                    <input type="email" value={user?.email || ''} readOnly className="w-full p-2 rounded-md bg-gray-900 border-gray-700 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.yourName}:</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-2 rounded-md bg-gray-700 border border-gray-600" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.yourFunction}:</label>
                    <input type="text" value={userFunction} onChange={(e) => setUserFunction(e.target.value)} className="w-full p-2 rounded-md bg-gray-700 border border-gray-600" />
                </div>
                <button onClick={handleSave} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> {t.saveProfile}
                </button>
            </div>
        </div>
    );
};

// Komponenta pro správu uživatelů (pouze pro adminy)
const UserManagementPanel = ({ allUsers, currentUser, updateUserProfile, t }) => {
    
    const handleAdminToggle = async (uid, currentIsAdmin) => {
        if (uid === currentUser.uid) {
            alert("Nemůžete odebrat administrátorská práva sami sobě.");
            return;
        }
        try {
            await updateUserProfile(uid, { isAdmin: !currentIsAdmin });
        } catch (error) {
            console.error("Chyba při změně admin práv:", error);
        }
    };

    return (
        <div className="mt-10 pt-6 border-t border-gray-700">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-400"><Users className="w-5 h-5" />Správa uživatelů</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800 rounded-lg">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-semibold">Jméno</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold">Email</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold">Funkce</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold">Admin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {allUsers.map(user => (
                            <tr key={user.uid}>
                                <td className="py-3 px-4">{user.displayName}</td>
                                <td className="py-3 px-4">{user.email}</td>
                                <td className="py-3 px-4">{user.function || '-'}</td>
                                <td className="py-3 px-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={user.isAdmin}
                                            onChange={() => handleAdminToggle(user.uid, user.isAdmin)}
                                            className="sr-only peer"
                                            disabled={user.uid === currentUser.uid}
                                        />
                                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Komponenta pro administrátorské nástroje
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
    // UPRAVENO: Přidán 'loading' stav z useAuth
    const { user, userProfile, loading, allUsers, updateUserProfile } = useAuth();
    const { t } = useUI();

    // PŘIDÁNO: Zobrazení zprávy o načítání, dokud není profil k dispozici
    if (loading) {
        return (
            <Card>
                <CardContent className="text-center p-8">
                    <p>Načítání profilu...</p>
                </CardContent>
            </Card>
        );
    }
    
    // PŘIDÁNO: Zobrazení zprávy, pokud se profil nepodařilo načíst
    if (!user || !userProfile) {
         return (
            <Card>
                <CardContent className="text-center p-8">
                    <p className="text-red-400">Uživatelský profil se nepodařilo načíst. Zkuste prosím obnovit stránku.</p>
                </CardContent>
            </Card>
        );
    }

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