"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import { Card, CardContent } from '@/components/ui/Card';
import { Ship, Send } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import LoadingDetailsModal from '@/components/modals/LoadingDetailsModal';

export default function AnnouncedLoadingsTab() {
    const { t } = useUI();
    const { db, appId, user } = useAuth();
    const { allOrdersData } = useData();
    
    const [loadings, setLoadings] = useState([]);
    const [newLoading, setNewLoading] = useState({ loadingDate: '', carrierName: '', orderNumbers: '', notes: '' });
    const [selectedLoading, setSelectedLoading] = useState(null);
    const [selectedLoadingOrders, setSelectedLoadingOrders] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (!db || !appId) return;
        const loadingsColRef = collection(db, `artifacts/${appId}/public/data/announced_loadings`);
        const q = query(loadingsColRef, orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLoadings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db, appId, t]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLoading(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveLoading = async (e) => {
        e.preventDefault();
        if (!user || !newLoading.loadingDate || !newLoading.carrierName) {
            setMessage({ text: t.fillAllFields || "Vyplňte všechna povinná pole.", type: 'error' });
            return;
        }
        setMessage({ text: '', type: '' });

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/announced_loadings`), {
                ...newLoading,
                order_numbers: newLoading.orderNumbers.split(',').map(n => n.trim()).filter(Boolean),
                status: 'Ohlášeno',
                user_id: user.uid,
                created_at: new Date().toISOString(),
            });
            setNewLoading({ loadingDate: '', carrierName: '', orderNumbers: '', notes: '' });
            setMessage({ text: t.loadingAddedSuccess, type: 'success' });
        } catch (error) {
            setMessage({ text: `${t.loadingError} ${error.message}`, type: 'error' });
        }
    };

    const handleSelectLoading = (loading) => {
        const orders = allOrdersData.filter(order => 
            (loading.order_numbers || []).includes(String(order["Delivery No"] || order["Delivery"]))
        );
        setSelectedLoadingOrders(orders);
        setSelectedLoading(loading);
    };

    return (
        <Card>
            <CardContent>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-cyan-400">
                    <Ship className="w-6 h-6" /> {t.announcedLoadingsTab}
                </h2>

                {message.text && <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>{message.text}</div>}

                <form onSubmit={handleSaveLoading} className="space-y-4 mb-8 p-4 border border-gray-700 rounded-lg bg-gray-750">
                    <h3 className="text-xl font-semibold text-blue-300 mb-3">{t.addLoading}</h3>
                    {/* ... (formulář pro novou nakládku) ... */}
                </form>

                <div className="space-y-3">
                    {loadings.map((loading) => (
                        <div key={loading.id} className="p-4 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => handleSelectLoading(loading)}>
                             <div className="flex justify-between items-center">
                                <p><strong>{t.carrierName}:</strong> {loading.carrierName}</p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    loading.status === 'Naloženo' ? 'bg-green-600 text-white' :
                                    loading.status === 'Připraveno' ? 'bg-yellow-500 text-black' :
                                    'bg-blue-600 text-white'
                                }`}>
                                    {loading.status || 'Ohlášeno'}
                                </span>
                            </div>
                            <p><strong>{t.loadingDate}:</strong> {format(parseISO(loading.loadingDate), 'dd/MM/yyyy')}</p>
                            <p className="text-sm text-gray-400 mt-1">{t.notes}: {loading.notes || t.noNotes}</p>
                        </div>
                    ))}
                </div>
                
                {selectedLoading && (
                    <LoadingDetailsModal 
                        loading={selectedLoading} 
                        orders={selectedLoadingOrders}
                        onClose={() => setSelectedLoading(null)} 
                    />
                )}
            </CardContent>
        </Card>
    );
}