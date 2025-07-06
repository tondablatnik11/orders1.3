"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { User, Save } from 'lucide-react';

export default function ProfileSettingsTab() {
    const { t } = useUI();
    const { user, userProfile, updateUserProfile } = useAuth();
    
    const [displayName, setDisplayName] = useState('');
    const [userFunction, setUserFunction] = useState('');
    const [message, setMessage] = useState({ text: '', type: ''});

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || '');
            setUserFunction(userProfile.function || '');
        }
    }, [userProfile]);

    const handleSave = async () => {
        try {
            await updateUserProfile(user.uid, { displayName, function: userFunction });
            setMessage({ text: t.profileUpdated, type: 'success' });
        } catch (error) {
            setMessage({ text: t.profileError + ` ${error.message}`, type: 'error'});
        }
    };

    return (
        <Card>
            <CardContent>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-yellow-400">
                    <User className="w-6 h-6" /> {t.profileTab}
                </h2>
                {message.text && <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-800' : 'bg-red-800'}`}>{message.text}</div>}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Email:</label>
                        <input type="email" value={user?.email || ''} readOnly className="w-full p-2 rounded-md bg-gray-700 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">{t.yourName}:</label>
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-2 rounded-md bg-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">{t.yourFunction}:</label>
                        <input type="text" value={userFunction} onChange={(e) => setUserFunction(e.target.value)} className="w-full p-2 rounded-md bg-gray-600" />
                    </div>
                    <button onClick={handleSave} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" /> {t.saveProfile}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}