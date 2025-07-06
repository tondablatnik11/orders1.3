"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import OrderListTable from '@/components/shared/OrderListTable';
import { Ship } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';

export default function AnnouncedLoadingsTab() {
    const { t } = useUI();
    const { db, appId, user } = useAuth();
    const { allOrdersData, setSelectedOrderDetails } = useData();
    
    const [loadings, setLoadings] = useState([]);
    const [newLoading, setNewLoading] = useState({ loadingDate: '', carrierName: '', orderNumbers: '', notes: '' });
    const [selectedLoadingDetails, setSelectedLoadingDetails] = useState(null);

    useEffect(() => {
        if (!db || !appId) return;
        const loadingsColRef = collection(db, `artifacts/${appId}/public/data/announced_loadings`);
        const q = query(loadingsColRef, orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLoadings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db, appId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLoading(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveLoading = async (e) => {
        e.preventDefault();
        if (!db || !appId || !user || !newLoading.loadingDate || !newLoading.carrierName) return;
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/announced_loadings`), {
                ...newLoading,
                order_numbers: newLoading.orderNumbers.split(',').map(n => n.trim()).filter(Boolean),
                user_id: user.uid,
                created_at: new Date().toISOString(),
            });
            setNewLoading({ loadingDate: '', carrierName: '', orderNumbers: '', notes: '' });
        } catch (error) {
            console.error("Error saving loading:", error);
        }
    };

    const handleSelectLoading = (loading) => {
        const orders = allOrdersData.filter(order => loading.order_numbers.includes(String(order["Delivery No"])));
        setSelectedLoadingDetails({ ...loading, orders });
    };

    return (
        <Card>
            <CardContent>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-cyan-400">
                    <Ship className="w-6 h-6" /> {t.announcedLoadingsTab}
                </h2>
                <form onSubmit={handleSaveLoading} className="space-y-4 mb-8 p-4 border border-gray-700 rounded-lg bg-gray-750">
                    <h3 className="text-xl font-semibold text-blue-300 mb-3">{t.addLoading}</h3>
                    <div>
                        <label className="block text-sm mb-1">{t.loadingDate}:</label>
                        <input type="date" name="loadingDate" value={newLoading.loadingDate} onChange={handleInputChange} className="w-full p-2 rounded-md bg-gray-600 border-gray-500" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">{t.carrierName}:</label>
                        <input type="text" name="carrierName" value={newLoading.carrierName} onChange={handleInputChange} className="w-full p-2 rounded-md bg-gray-600 border-gray-500" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">{t.orderNumbers}:</label>
                        <input type="text" name="orderNumbers" value={newLoading.orderNumbers} onChange={handleInputChange} className="w-full p-2 rounded-md bg-gray-600 border-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">{t.notes}:</label>
                        <textarea name="notes" value={newLoading.notes} onChange={handleInputChange} className="w-full p-2 rounded-md bg-gray-600 border-gray-500 h-20" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700">{t.saveLoading}</button>
                </form>

                <div className="space-y-3">
                    {loadings.map((loading) => (
                        <div key={loading.id} className="p-4 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700" onClick={() => handleSelectLoading(loading)}>
                            <p><strong>{t.loadingDate}:</strong> {format(parseISO(loading.loadingDate), 'dd/MM/yyyy')}</p>
                            <p><strong>{t.carrierName}:</strong> {loading.carrierName}</p>
                        </div>
                    ))}
                </div>
                {selectedLoadingDetails && (
                    <Modal title={t.loadingDetails} onClose={() => setSelectedLoadingDetails(null)}>
                        <h3 className="text-lg font-bold mb-2">{selectedLoadingDetails.carrierName} - {format(parseISO(selectedLoadingDetails.loadingDate), 'dd/MM/yyyy')}</h3>
                        <p className="mb-4">{selectedLoadingDetails.notes}</p>
                        <OrderListTable orders={selectedLoadingDetails.orders} onSelectOrder={setSelectedOrderDetails} />
                    </Modal>
                )}
            </CardContent>
        </Card>
    );
}