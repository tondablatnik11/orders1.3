"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Potřebujeme useAuth pro db, appId, user
import { useUI } from '@/hooks/useUI';
import { useData } from '@/hooks/useData'; // Potřebujeme useData pro allOrdersData, setSelectedOrderDetails
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal'; // Modal komponenta
import OrderListTable from '@/components/shared/OrderListTable'; // Tabulka pro seznam zakázek v modalu
import { Ship, Send } from 'lucide-react'; // Přidán Send pro tlačítko Save
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore'; // Firebase Firestore
import { format, parseISO } from 'date-fns'; // Pro práci s daty

export default function AnnouncedLoadingsTab() {
    const { t } = useUI();
    const { db, appId, user } = useAuth(); // Získání Firebase dat z useAuth
    const { allOrdersData, setSelectedOrderDetails } = useData(); // Získání dat zakázek a funkce pro modal z useData
    
    const [loadings, setLoadings] = useState([]);
    const [newLoading, setNewLoading] = useState({ loadingDate: '', carrierName: '', orderNumbers: '', notes: '' });
    const [selectedLoadingDetails, setSelectedLoadingDetails] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' }); // Pro zprávy o úspěchu/chybě

    useEffect(() => {
        if (!db || !appId) {
            console.warn("Firestore or App ID not available for AnnouncedLoadingsTab.");
            return;
        }
        const loadingsColRef = collection(db, `artifacts/${appId}/public/data/announced_loadings`);
        const q = query(loadingsColRef, orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLoadings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching announced loadings:", error);
            setMessage({ text: `${t.loadingError} ${error.message}`, type: 'error' });
        });
        return () => unsubscribe();
    }, [db, appId, t]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLoading(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveLoading = async (e) => {
        e.preventDefault();
        if (!db || !appId || !user || !newLoading.loadingDate || !newLoading.carrierName) {
            setMessage({ text: `${t.loadingError} ${t.fillAllFields}`, type: 'error' }); // Přidán nový překlad
            return;
        }
        setMessage({ text: '', type: '' }); // Vyčistit předchozí zprávy

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/announced_loadings`), {
                ...newLoading,
                order_numbers: newLoading.orderNumbers.split(',').map(n => n.trim()).filter(Boolean),
                user_id: user.uid,
                created_at: new Date().toISOString(),
            });
            setNewLoading({ loadingDate: '', carrierName: '', orderNumbers: '', notes: '' });
            setMessage({ text: t.loadingAddedSuccess, type: 'success' });
        } catch (error) {
            console.error("Error saving loading:", error);
            setMessage({ text: `${t.loadingError} ${error.message}`, type: 'error' });
        }
    };

    const handleSelectLoading = (loading) => {
        // Filtrování zakázek podle čísel v nakládce
        const orders = allOrdersData.filter(order => 
            (loading.order_numbers || []).includes(String(order["Delivery No"] || order["Delivery"]))
        );
        setSelectedLoadingDetails({ ...loading, orders });
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
                    <div>
                        <label htmlFor="loadingDate" className="block text-sm font-medium text-gray-300 mb-1">{t.loadingDate}:</label>
                        <input type="date" name="loadingDate" id="loadingDate" value={newLoading.loadingDate} onChange={handleInputChange} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500" required />
                    </div>
                    <div>
                        <label htmlFor="carrierName" className="block text-sm font-medium text-gray-300 mb-1">{t.carrierName}:</label>
                        <input type="text" name="carrierName" id="carrierName" value={newLoading.carrierName} onChange={handleInputChange} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500" required />
                    </div>
                    <div>
                        <label htmlFor="orderNumbers" className="block text-sm font-medium text-gray-300 mb-1">{t.orderNumbers}:</label>
                        <textarea name="orderNumbers" id="orderNumbers" value={newLoading.orderNumbers} onChange={handleInputChange} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500 h-20 resize-y" placeholder={t.orderNumbersPlaceholder} /> {/* Nový překlad */}
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">{t.notes}:</label>
                        <textarea name="notes" id="notes" value={newLoading.notes} onChange={handleInputChange} className="w-full p-2 rounded-md bg-gray-600 border border-gray-500 h-20 resize-y" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" /> {t.saveLoading}
                    </button>
                </form>

                <div className="space-y-3">
                    {loadings.length > 0 ? (
                        loadings.map((loading) => (
                            <div key={loading.id} className="p-4 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => handleSelectLoading(loading)}>
                                <p><strong>{t.loadingDate}:</strong> {format(parseISO(loading.loadingDate), 'dd/MM/yyyy')}</p>
                                <p><strong>{t.carrierName}:</strong> {loading.carrierName}</p>
                                <p className="text-sm text-gray-400 mt-1">{t.notes}: {loading.notes || t.noNotes}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400">{t.noDataAvailable}</p>
                    )}
                </div>
                {selectedLoadingDetails && (
                    <Modal title={t.loadingDetails} onClose={() => setSelectedLoadingDetails(null)}>
                        <h3 className="text-lg font-bold mb-2 text-white">{selectedLoadingDetails.carrierName} - {format(parseISO(selectedLoadingDetails.loadingDate), 'dd/MM/yyyy')}</h3>
                        <p className="mb-4 text-gray-300">{selectedLoadingDetails.notes || t.noNotes}</p>
                        {/* OrderListTable je nyní univerzální, může přijímat onSelectOrder */}
                        <OrderListTable orders={selectedLoadingDetails.orders} onSelectOrder={setSelectedOrderDetails} />
                    </Modal>
                )}
            </CardContent>
        </Card>
    );
}